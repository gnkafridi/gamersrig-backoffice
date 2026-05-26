import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Chip, Skeleton, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  AccountBalanceWallet, TrendingUp, Receipt, Add, Edit, Delete, CheckCircle,
  LocalShipping, Payments, PictureAsPdf, TableChart,
  SwapHoriz, AttachFile, Visibility, Warning, Inventory2,
} from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import StatCard from '../components/StatCard';
import dayjs from 'dayjs';
import {
  getPartners, createPartner, updatePartner, deletePartner,
  getCod, createCod, markCodReceived, deleteCod,
  getFinanceOverview, getRevenue,
  getQuarterly, finalizeQuarterly, downloadFinancePdf, downloadFinanceCsv,
  getLedger, createReimbursement, proofUrl,
  downloadLedgerCsv, downloadLedgerPdf,
} from '../api/finance';
import { Link as RouterLink } from 'react-router-dom';
import { getOrders } from '../api/orders';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

export default function FinanceDashboardPage() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState(''); // '' = All
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const loadOverview = useCallback(() => {
    setLoadingOverview(true);
    getFinanceOverview({ period })
      .then((r) => setOverview(r.data))
      .finally(() => setLoadingOverview(false));
  }, [period]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Finance</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={period === '' ? 'all' : 'month'}
            onChange={(_, v) => { if (v === 'all') setPeriod(''); }}
          >
            <ToggleButton value="all" sx={{ px: 2, textTransform: 'none', fontWeight: period === '' ? 700 : 400 }}>
              All
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            type="month"
            label="Month"
            size="small"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 165 }}
          />
          <Button variant="outlined" size="small" component={RouterLink} to="/stock-spent" startIcon={<Inventory2 />}>
            Stock Spent
          </Button>
        </Box>
      </Box>

      {/* Overview cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Investment" value={fmt(overview?.total_investment)} icon={<AccountBalanceWallet />} loading={loadingOverview} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Expenses" value={fmt(overview?.total_expenses)} icon={<Receipt />} loading={loadingOverview} color="error.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Advance Reimbursable" value={fmt(overview?.advance_reimbursable)} icon={<TrendingUp />} loading={loadingOverview} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Net Position" value={fmt(overview?.net_position)} icon={<AccountBalanceWallet />} loading={loadingOverview} color="success.main" />
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab label="Ledger" />
          <Tab label="Revenue" />
          <Tab label="Settlement" />
          <Tab label="Reports" />
          <Tab label="Partners" />
        </Tabs>
        <CardContent>
          {tab === 0 && <LedgerTab period={period} onChanged={loadOverview} />}
          {tab === 1 && <RevenueTab period={period} onChanged={loadOverview} />}
          {tab === 2 && <SettlementTab period={period} onChanged={loadOverview} />}
          {tab === 3 && <ReportsTab period={period} />}
          {tab === 4 && <PartnersTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ── Ledger Tab (Partner Dues) ───────────────────────── */
const TX_STYLE = {
  stock:         { label: 'Stock',         color: '#2563eb', bg: '#eff6ff' },
  expense:       { label: 'Expense',       color: '#c2410c', bg: '#fff7ed' },
  reimbursement: { label: 'Reimbursement', color: '#15803d', bg: '#f0fdf4' },
};

function LedgerTab({ period, onChanged }) {
  const [data, setData] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [fPartner, setFPartner] = useState('');   // filter: partner id
  const [fType, setFType] = useState('');          // filter: transaction type

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getLedger(period ? { period } : {}), getPartners({ is_active: true })])
      .then(([l, p]) => { setData(l.data); setPartners(p.data.data); })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const saveReimb = async () => {
    setError('');
    try {
      const fd = new FormData();
      fd.append('from_partner_id', dialog.from_partner_id);
      fd.append('to_partner_id', dialog.to_partner_id);
      fd.append('amount', dialog.amount);
      fd.append('paid_at', dialog.paid_at);
      if (dialog.period) fd.append('period', dialog.period);
      if (dialog.notes) fd.append('notes', dialog.notes);
      if (dialog.proofFile) fd.append('proof', dialog.proofFile);
      await createReimbursement(fd);
      setDialog(null);
      load();
      onChanged?.();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
  };

  const exportLedger = async (fn, ext) => {
    const res = await fn(period ? { period } : {});
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `partner-ledger${period ? '-' + period : ''}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />;

  const owe = data?.who_owes_whom;
  const summary = data?.summary;
  const overdue = data?.overdue || [];
  const refName = data?.ref_partner?.name;
  const refId = data?.ref_partner?.id;
  const otherName = (summary?.partners || []).find((p) => p.partner_id !== refId)?.partner_name;

  const txns = (data?.transactions || []).filter((t) =>
    (!fPartner || t.paid_by_id === Number(fPartner) || t.to_id === Number(fPartner)) &&
    (!fType || t.type === fType)
  );

  return (
    <Box>
      {/* Headline: who owes whom */}
      <Card variant="outlined" sx={{ mb: 2, bgcolor: owe?.settled ? '#f0fdf4' : '#fffbeb', borderColor: owe?.settled ? '#bbf7d0' : '#fde68a' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SwapHoriz sx={{ color: owe?.settled ? '#15803d' : '#b45309' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {period ? `Balance for ${dayjs(period + '-01').format('MMM YYYY')}` : 'Current balance (all time)'}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: owe?.settled ? '#15803d' : '#b45309' }}>
                {owe?.settled ? 'All settled — nobody owes anyone' : `${owe?.text} ${fmt(owe?.amount)}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Combined dues: stock + spillover + expenses (50/50). {summary ? `Spillover incl.: ${fmt(summary.spillover_total)}` : ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {overdue.length > 0 && <Chip icon={<Warning />} color="error" size="small" label={`${overdue.length} overdue`} />}
            <Button size="small" variant="outlined" startIcon={<PictureAsPdf />} onClick={() => exportLedger(downloadLedgerPdf, 'pdf')}>PDF</Button>
            <Button size="small" variant="outlined" startIcon={<TableChart />} onClick={() => exportLedger(downloadLedgerCsv, 'csv')}>CSV</Button>
            <Button startIcon={<Add />} variant="outlined" size="small" sx={primaryBtnSx}
              onClick={() => setDialog({ from_partner_id: '', to_partner_id: '', amount: '', paid_at: dayjs().format('YYYY-MM-DD'), period: '', notes: '' })}>
              Add Reimbursement
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Per-partner summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(summary?.partners || []).map((p) => (
          <Grid size={{ xs: 12, md: 6 }} key={p.partner_id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{p.partner_name}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Total Paid</Typography><Typography fontWeight={600}>{fmt(p.total_paid)}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Total Owed</Typography><Typography fontWeight={600}>{fmt(p.total_owed)}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Reimbursed (p/r)</Typography><Typography fontWeight={600}>{fmt(p.reimbursed_paid)} / {fmt(p.reimbursed_received)}</Typography></Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Outstanding</Typography>
                    <Typography fontWeight={700} sx={{ color: p.balance < 0 ? 'error.main' : p.balance > 0 ? 'success.main' : 'text.secondary' }}>
                      {p.balance < 0 ? `owes ${fmt(-p.balance)}` : p.balance > 0 ? `owed ${fmt(p.balance)}` : 'settled'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Overdue */}
      {overdue.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'error.main' }}>Overdue dues</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Partner</TableCell><TableCell>Period</TableCell>
                <TableCell align="right">Amount</TableCell><TableCell align="right">Age</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overdue.map((o, i) => (
                <TableRow key={i} sx={{ bgcolor: '#fef2f2' }}>
                  <TableCell>{o.partner_name}</TableCell>
                  <TableCell>{dayjs(o.period + '-01').format('MMM YYYY')}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{fmt(o.amount)}</TableCell>
                  <TableCell align="right"><Chip size="small" color="error" variant="outlined" label={`${o.months_old} mo`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* Filters + chronological ledger */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>Ledger</Typography>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Partner</InputLabel>
          <Select label="Partner" value={fPartner} onChange={(e) => setFPartner(e.target.value)}>
            <MenuItem value="">All partners</MenuItem>
            {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={fType} onChange={(e) => setFType(e.target.value)}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="stock">Stock</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="reimbursement">Reimbursement</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Module</TableCell>
            <TableCell>Paid By / Who</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Settles</TableCell>
            <TableCell align="center">Proof</TableCell>
            <TableCell align="right">Balance After</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {txns.length === 0 ? (
            <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>No transactions</TableCell></TableRow>
          ) : txns.map((t) => {
            const st = TX_STYLE[t.type] || {};
            const bal = Number(t.balance_after);
            return (
              <TableRow key={t.id || `${t.type}-${t.date}-${t.amount}-${t.who}`}>
                <TableCell>{t.date ? dayjs(t.date).format('DD MMM YY') : '—'}</TableCell>
                <TableCell><Chip size="small" label={st.label || t.type} sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600 }} /></TableCell>
                <TableCell>{t.module}</TableCell>
                <TableCell>{t.who}</TableCell>
                <TableCell align="right">{fmt(t.amount)}</TableCell>
                <TableCell>{t.settles_month ? dayjs(t.settles_month + '-01').format('MMM YY') : '—'}</TableCell>
                <TableCell align="center">
                  {t.proof_path
                    ? <IconButton size="small" title="View proof" component="a" href={proofUrl(t.proof_path)} target="_blank" rel="noopener noreferrer"><Visibility fontSize="small" /></IconButton>
                    : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: bal < 0 ? 'error.main' : bal > 0 ? 'success.main' : 'text.secondary' }}>
                  {bal < 0 ? `${refName} owes ${fmt(-bal)}` : bal > 0 ? `${otherName} owes ${fmt(bal)}` : 'settled'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Add Reimbursement dialog */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Add Reimbursement</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel>From (payer)</InputLabel>
            <Select label="From (payer)" value={dialog?.from_partner_id || ''} onChange={(e) => setDialog({ ...dialog, from_partner_id: e.target.value })}>
              {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>To (receiver)</InputLabel>
            <Select label="To (receiver)" value={dialog?.to_partner_id || ''} onChange={(e) => setDialog({ ...dialog, to_partner_id: e.target.value })}>
              {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth size="small" label="Amount" type="number" sx={{ mb: 2 }}
            value={dialog?.amount ?? ''} onChange={(e) => setDialog({ ...dialog, amount: e.target.value })} />
          <TextField fullWidth size="small" label="Paid on" type="date" sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }}
            value={dialog?.paid_at || ''} onChange={(e) => setDialog({ ...dialog, paid_at: e.target.value })} />
          <TextField fullWidth size="small" label="Settles month (optional)" type="month" sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }}
            value={dialog?.period || ''} onChange={(e) => setDialog({ ...dialog, period: e.target.value })} />
          <TextField fullWidth size="small" label="Notes (optional)" sx={{ mb: 2 }}
            value={dialog?.notes || ''} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} />
          <Button component="label" variant="outlined" size="small" startIcon={<AttachFile />}>
            {dialog?.proofFile ? dialog.proofFile.name : 'Attach proof (optional)'}
            <input hidden type="file" accept="image/*,application/pdf"
              onChange={(e) => setDialog({ ...dialog, proofFile: e.target.files?.[0] || null })} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveReimb}
            disabled={!dialog?.from_partner_id || !dialog?.to_partner_id || !dialog?.amount || dialog?.from_partner_id === dialog?.to_partner_id}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ── Revenue Tab ─────────────────────────────────────── */
function RevenueTab({ period, onChanged }) {
  const [rev, setRev] = useState(null);
  const [cod, setCod] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // add COD dialog
  const [orders, setInvoices] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getRevenue({ period }), getCod({})])
      .then(([r, c]) => {
        setRev(r.data);
        setCod(c.data.data);
      })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const openAdd = async () => {
    setError('');
    // Load COD orders that don't yet have a record
    const r = await getOrders({ status: '' });
    setInvoices(r.data.data || []);
    setDialog({ invoice_id: '', shipping_deduction: 0, courier_reference: '' });
  };

  const save = async () => {
    setError('');
    try {
      await createCod(dialog);
      setDialog(null);
      load();
      onChanged?.();
    } catch (e) { setError(e.response?.data?.message || 'Failed to add COD record'); }
  };

  const receive = async (id) => {
    await markCodReceived(id, {});
    load();
    onChanged?.();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this COD record?')) return;
    await deleteCod(id);
    load();
    onChanged?.();
  };

  const chartData = rev ? [
    { name: 'Advance', value: Number(rev.advance_collected) },
    { name: 'COD Received', value: Number(rev.cod_received) },
    { name: 'COD Pending', value: Number(rev.cod_pending) },
  ] : [];
  const COLORS = ['#27B81D', '#1a8014', '#ffb300'];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Revenue" value={fmt(rev?.total_revenue)} icon={<Payments />} loading={loading} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Advance Collected" value={fmt(rev?.advance_collected)} icon={<TrendingUp />} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="COD Received" value={fmt(rev?.cod_received)} icon={<CheckCircle />} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="COD Pending" value={fmt(rev?.cod_pending)} icon={<LocalShipping />} loading={loading} color="warning.main" />
        </Grid>
      </Grid>

      {!loading && chartData.some((d) => d.value > 0) && (
        <Box sx={{ height: 240, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">COD Orders</Typography>
        <Button startIcon={<Add />} variant="outlined" size="small" sx={primaryBtnSx} onClick={openAdd}>Add COD Record</Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell align="right">Order Amount</TableCell>
            <TableCell align="right">Shipping Deduction</TableCell>
            <TableCell align="right">Net Revenue</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>
          ) : cod.length === 0 ? (
            <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No COD records</TableCell></TableRow>
          ) : cod.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.order?.order_number || `#${c.invoice_id}`}</TableCell>
              <TableCell>{c.order?.customer?.name || '—'}</TableCell>
              <TableCell align="right">{fmt(c.order_amount)}</TableCell>
              <TableCell align="right">{fmt(c.shipping_deduction)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(c.net_revenue)}</TableCell>
              <TableCell>
                <Chip size="small" label={c.status}
                  color={c.status === 'received' ? 'success' : c.status === 'returned' ? 'default' : 'warning'}
                  sx={{ textTransform: 'capitalize' }} />
              </TableCell>
              <TableCell align="right">
                {c.status === 'pending' && (
                  <Button size="small" startIcon={<CheckCircle />} onClick={() => receive(c.id)}>Mark Received</Button>
                )}
                <IconButton size="small" color="error" onClick={() => remove(c.id)}><Delete fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Add COD Record</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Order</InputLabel>
            <Select label="Order" value={dialog?.invoice_id || ''} onChange={(e) => setDialog({ ...dialog, invoice_id: e.target.value })}>
              {orders.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.order_number} — {inv.customer?.name} ({fmt(inv.total)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth size="small" label="Shipping Deduction" type="number" sx={{ mb: 2 }}
            value={dialog?.shipping_deduction ?? 0} onChange={(e) => setDialog({ ...dialog, shipping_deduction: e.target.value })} />
          <TextField fullWidth size="small" label="Courier Reference" value={dialog?.courier_reference || ''}
            onChange={(e) => setDialog({ ...dialog, courier_reference: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!dialog?.invoice_id}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ── Settlement Tab (quarterly revenue share) ─────────── */
function SettlementTab({ period, onChanged }) {
  const now = dayjs();
  const [year, setYear] = useState(period ? Number(period.split('-')[0]) : now.year());
  const [quarter, setQuarter] = useState(period ? Math.ceil(Number(period.split('-')[1]) / 3) : Math.ceil((now.month() + 1) / 3));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getQuarterly({ year, quarter })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [year, quarter]);

  useEffect(() => { load(); }, [load]);

  const finalize = async () => {
    if (!window.confirm(`Finalize Q${quarter} ${year} settlement? This snapshots each partner's revenue share.`)) return;
    setFinalizing(true);
    try {
      await finalizeQuarterly({ year, quarter });
      load();
      onChanged?.();
    } finally { setFinalizing(false); }
  };

  const rows = data?.rows || [];
  const years = [...new Set([now.year() - 1, now.year(), now.year() + 1])];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Quarterly settlement: total the quarter's revenue and divide equally so each partner gets their share.
        (Contribution balances — who fronted what — live in the <b>Ledger</b> tab.)
      </Alert>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ width: 110 }}>
          <InputLabel>Year</InputLabel>
          <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 110 }}>
          <InputLabel>Quarter</InputLabel>
          <Select label="Quarter" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
            {[1, 2, 3, 4].map((q) => <MenuItem key={q} value={q}>Q{q}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<CheckCircle />} variant="contained" size="small" color="success" disabled={finalizing || rows.length === 0} onClick={finalize}>
          Finalize Q{quarter} {year}
        </Button>
      </Box>

      {loading ? <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1 }} /> : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: 1, minWidth: 180 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Quarter Revenue</Typography>
                <Typography variant="h6" fontWeight={700}>{fmt(data?.total_revenue)}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, minWidth: 180 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Share / Partner</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">{fmt(data?.share_amount)}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Partner</TableCell>
                <TableCell align="right">Quarter Revenue</TableCell>
                <TableCell align="right">Partners</TableCell>
                <TableCell align="right">Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No active partners</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.partner_id}>
                  <TableCell>{r.partner_name}</TableCell>
                  <TableCell align="right">{fmt(r.total_revenue)}</TableCell>
                  <TableCell align="right">{r.partner_count}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(r.share_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
}

/* ── Reports Tab ─────────────────────────────────────── */
function ReportsTab({ period }) {
  const [quarterly, setQuarterly] = useState(null);
  const [loading, setLoading] = useState(true);
  const parts = period ? period.split('-') : [];
  const year = parts[0] ? Number(parts[0]) : 0;
  const quarter = parts[1] ? Math.ceil(Number(parts[1]) / 3) : 0;

  if (!period) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Please select a month to view settlement and quarterly reports.
      </Alert>
    );
  }

  const load = useCallback(() => {
    setLoading(true);
    getQuarterly({ year, quarter })
      .then((q) => setQuarterly(q.data))
      .finally(() => setLoading(false));
  }, [year, quarter]);

  useEffect(() => { load(); }, [load]);

  const download = async (fn, type, params, ext) => {
    const res = await fn(type, params);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${type === 'quarterly' ? `${year}-Q${quarter}` : period}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finalizeQ = async () => {
    if (!window.confirm(`Finalize quarterly share for ${year} Q${quarter}? This freezes the revenue split snapshot.`)) return;
    await finalizeQuarterly({ year, quarter });
    load();
  };

  const ExportButtons = ({ type, params }) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button size="small" variant="outlined" startIcon={<PictureAsPdf />} onClick={() => download(downloadFinancePdf, type, params, 'pdf')}>PDF</Button>
      <Button size="small" variant="outlined" startIcon={<TableChart />} onClick={() => download(downloadFinanceCsv, type, params, 'csv')}>CSV</Button>
    </Box>
  );

  if (loading) return <Skeleton height={200} />;

  return (
    <Box>
      {/* Quarterly report */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>Quarterly Share — {year} Q{quarter}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={finalizeQ}>Finalize</Button>
          <ExportButtons type="quarterly" params={{ year, quarter }} />
        </Box>
      </Box>
      <Box sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}>
        Total Revenue: <strong>{fmt(quarterly?.total_revenue)}</strong> &nbsp;|&nbsp;
        Share each: <strong>{fmt(quarterly?.share_amount)}</strong>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Partner</TableCell>
            <TableCell align="right">Total Revenue</TableCell>
            <TableCell align="right">Partners</TableCell>
            <TableCell align="right">Share Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(quarterly?.rows || []).map((r) => (
            <TableRow key={r.partner_id}>
              <TableCell>{r.partner_name}</TableCell>
              <TableCell align="right">{fmt(r.total_revenue)}</TableCell>
              <TableCell align="right">{r.partner_count}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(r.share_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/* ── Partners Tab ────────────────────────────────────── */
function PartnersTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getPartners()
      .then((r) => setRows(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError('');
    try {
      if (dialog.id) await updatePartner(dialog.id, dialog);
      else await createPartner(dialog);
      setDialog(null);
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this partner? Their investments and settlements will also be removed.')) return;
    await deletePartner(id);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<Add />} variant="outlined" size="small" sx={primaryBtnSx}
          onClick={() => setDialog({ name: '', email: '', phone: '', share_percentage: 0, is_active: true, notes: '' })}>
          Add Partner
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell align="right">Share %</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>No partners yet</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.email || '—'}</TableCell>
              <TableCell>{r.phone || '—'}</TableCell>
              <TableCell align="right">{Number(r.share_percentage)}%</TableCell>
              <TableCell><Chip size="small" label={r.is_active ? 'Active' : 'Inactive'} color={r.is_active ? 'success' : 'default'} /></TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => setDialog({ id: r.id, name: r.name, email: r.email || '', phone: r.phone || '', share_percentage: r.share_percentage, is_active: r.is_active, notes: r.notes || '' })}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => remove(r.id)}><Delete fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.id ? 'Edit' : 'Add'} Partner</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth size="small" label="Name" sx={{ mt: 1, mb: 2 }}
            value={dialog?.name || ''} onChange={(e) => setDialog({ ...dialog, name: e.target.value })} />
          <TextField fullWidth size="small" label="Email" sx={{ mb: 2 }}
            value={dialog?.email || ''} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} />
          <TextField fullWidth size="small" label="Phone" sx={{ mb: 2 }}
            value={dialog?.phone || ''} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} />
          <TextField fullWidth size="small" label="Share %" type="number" sx={{ mb: 2 }}
            value={dialog?.share_percentage ?? 0} onChange={(e) => setDialog({ ...dialog, share_percentage: e.target.value })} />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={dialog?.is_active ? 1 : 0} onChange={(e) => setDialog({ ...dialog, is_active: !!e.target.value })}>
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
