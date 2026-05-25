import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  TableSortLabel, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Chip, Skeleton, Alert, Tooltip,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Add, Edit, Delete, AttachFile, Receipt, ReceiptLong } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import { getExpenses, createExpense, updateExpense, deleteExpense, getPartners, proofUrl } from '../api/finance';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const QUICK = [
  ['all', 'All time'],
  ['today', 'Today'],
  ['this_week', 'This week'],
  ['this_month', 'This month'],
  ['prev_month', 'Previous month'],
  ['this_year', 'This year'],
  ['prev_year', 'Previous year'],
];

const quickRange = (key) => {
  const now = dayjs();
  switch (key) {
    case 'today': return [now.startOf('day'), now.endOf('day')];
    case 'this_week': return [now.startOf('week'), now.endOf('week')];
    case 'this_month': return [now.startOf('month'), now.endOf('month')];
    case 'prev_month': { const m = now.subtract(1, 'month'); return [m.startOf('month'), m.endOf('month')]; }
    case 'this_year': return [now.startOf('year'), now.endOf('year')];
    case 'prev_year': { const y = now.subtract(1, 'year'); return [y.startOf('year'), y.endOf('year')]; }
    default: return [null, null];
  }
};

const EXPENSE_CATEGORIES = [
  { value: 'operational',     label: 'Operational' },
  { value: 'delivery',        label: 'Delivery' },
  { value: 'advance_shipping',label: 'Advance Shipping' },
  { value: 'technology',      label: 'Technology' },
  { value: 'communication',   label: 'Communication' },
  { value: 'packaging',       label: 'Packaging' },
  { value: 'marketing',       label: 'Marketing' },
  { value: 'equipment',       label: 'Equipment' },
  { value: 'other',           label: 'Other' },
];

export default function ExpensePage() {
  const [quick, setQuick] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  // Filter by expense date (quick range or custom from/to).
  const filtered = useMemo(() => {
    const [qFrom, qTo] = quick === 'custom'
      ? [from ? dayjs(from) : null, to ? dayjs(to) : null]
      : quickRange(quick);
    if (!qFrom && !qTo) return rows;
    return rows.filter((r) => {
      if (!r.expense_date) return false;
      const d = dayjs(r.expense_date);
      if (qFrom && d.isBefore(qFrom, 'day')) return false;
      if (qTo && d.isAfter(qTo, 'day')) return false;
      return true;
    });
  }, [rows, quick, from, to]);

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortBy] ?? '';
    let bv = b[sortBy] ?? '';
    if (sortBy === 'partner') { av = a.partner?.name ?? ''; bv = b.partner?.name ?? ''; }
    if (sortBy === 'amount') { av = parseFloat(av); bv = parseFloat(bv); }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getExpenses({}), getPartners({ is_active: true })])
      .then(([ex, prt]) => { setRows(ex.data.data); setPartners(prt.data.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError('');
    try {
      const base = {
        period: dialog.period || dayjs(dialog.expense_date).format('YYYY-MM'),
        expense_date: dialog.expense_date,
        category: dialog.category,
        description: dialog.description,
        amount: dialog.amount,
        partner_id: dialog.partner_id || '',
        is_reimbursable: dialog.is_reimbursable ? 1 : 0,
      };
      if (dialog.id) {
        await updateExpense(dialog.id, { ...base, partner_id: dialog.partner_id || null });
      } else if (dialog.proofFile) {
        const fd = new FormData();
        Object.entries(base).forEach(([k, v]) => fd.append(k, v ?? ''));
        fd.append('proof', dialog.proofFile);
        await createExpense(fd);
      } else {
        await createExpense({ ...base, partner_id: dialog.partner_id || null });
      }
      setDialog(null);
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteExpense(id);
    load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Receipt sx={{ color: 'text.secondary' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.1}>Expense</Typography>
          <Typography variant="body2" color="text.secondary">Total: <b>{fmt(total)}</b> · {filtered.length} entries</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" sx={primaryBtnSx}
          onClick={() => setDialog({ period: dayjs().format('YYYY-MM'), expense_date: dayjs().format('YYYY-MM-DD'), category: 'operational', description: '', amount: '', partner_id: '', is_reimbursable: false })}>
          Add Expense
        </Button>
      </Box>

      {/* Filters: quick ranges + custom date range */}
      <Card sx={{ mb: 3, p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <ToggleButtonGroup size="small" exclusive value={quick === 'custom' ? null : quick}
          onChange={(_, v) => { if (v) { setQuick(v); setFrom(''); setTo(''); } }}
          sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, borderRadius: '20px !important', border: '1px solid', borderColor: 'divider', m: 0.25 } }}>
          {QUICK.map(([k, label]) => <ToggleButton key={k} value={k}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        <TextField size="small" label="From" type="date" sx={{ width: 160 }} slotProps={{ inputLabel: { shrink: true } }}
          value={from} onChange={(e) => { setFrom(e.target.value); setQuick('custom'); }} />
        <TextField size="small" label="To" type="date" sx={{ width: 160 }} slotProps={{ inputLabel: { shrink: true } }}
          value={to} onChange={(e) => { setTo(e.target.value); setQuick('custom'); }} />
        {quick === 'custom' && (
          <Button size="small" sx={{ textTransform: 'none' }} onClick={() => { setQuick('all'); setFrom(''); setTo(''); }}>Clear</Button>
        )}
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { id: 'expense_date', label: 'Date' },
                  { id: 'category',     label: 'Category' },
                  { id: 'description',  label: 'Description' },
                  { id: 'partner',      label: 'Paid by' },
                ].map((col) => (
                  <TableCell key={col.id}>
                    <TableSortLabel active={sortBy === col.id} direction={sortBy === col.id ? sortDir : 'asc'} onClick={() => handleSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="right">
                  <TableSortLabel active={sortBy === 'amount'} direction={sortBy === 'amount' ? sortDir : 'asc'} onClick={() => handleSort('amount')}>
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>No expenses in the selected date range</TableCell></TableRow>
              ) : sorted.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{dayjs(r.expense_date).format('DD MMM')}</TableCell>
                  <TableCell><Chip size="small" label={EXPENSE_CATEGORIES.find((c) => c.value === r.category)?.label || r.category} /></TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>{r.partner?.name || 'Business'}</TableCell>
                  <TableCell align="right">{fmt(r.amount)}</TableCell>
                  <TableCell align="right">
                    {r.proof_path ? (
                      <Tooltip title="View receipt / proof">
                        <IconButton size="small" color="primary" component="a" href={proofUrl(r.proof_path)} target="_blank" rel="noopener noreferrer">
                          <ReceiptLong fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="No receipt attached">
                        <span>
                          <IconButton size="small" disabled>
                            <ReceiptLong fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <IconButton size="small" onClick={() => setDialog({ id: r.id, period: r.period, expense_date: dayjs(r.expense_date).format('YYYY-MM-DD'), category: r.category, description: r.description, amount: r.amount, partner_id: r.partner_id || '', is_reimbursable: r.is_reimbursable })}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(r.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialog?.id ? 'Edit' : 'Add'} Expense</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth size="small" label="Date" type="date" sx={{ mt: 1, mb: 2 }} slotProps={{ inputLabel: { shrink: true } }}
            value={dialog?.expense_date || ''} onChange={(e) => setDialog({ ...dialog, expense_date: e.target.value })} />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={dialog?.category || 'operational'} onChange={(e) => setDialog({ ...dialog, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth size="small" label="Description" sx={{ mb: 2 }}
            value={dialog?.description || ''} onChange={(e) => setDialog({ ...dialog, description: e.target.value })} />
          <TextField fullWidth size="small" label="Amount" type="number" sx={{ mb: 2 }}
            value={dialog?.amount ?? ''} onChange={(e) => setDialog({ ...dialog, amount: e.target.value })} />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Paid by</InputLabel>
            <Select label="Paid by" value={dialog?.partner_id || ''} onChange={(e) => setDialog({ ...dialog, partner_id: e.target.value })}>
              <MenuItem value="">Business (revenue)</MenuItem>
              {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          {!dialog?.id && (
            <Button component="label" variant="outlined" size="small" startIcon={<AttachFile />} sx={{ mb: 1 }}>
              {dialog?.proofFile ? dialog.proofFile.name : 'Attach proof (optional)'}
              <input hidden type="file" accept="image/*,application/pdf"
                onChange={(e) => setDialog({ ...dialog, proofFile: e.target.files?.[0] || null })} />
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
