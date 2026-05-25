import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Skeleton, Chip, Avatar, Tooltip, ToggleButton, ToggleButtonGroup, TextField,
} from '@mui/material';
import { Add, Edit, Delete, AttachFile, Inventory2 } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import { getStockPurchases, deleteStockPurchase, proofUrl } from '../api/finance';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

// Distinct accent per payer so each purchase group is visually scannable.
const PAYER_PALETTE = [
  { main: '#2563eb', soft: '#eff6ff' }, // blue
  { main: '#0d9488', soft: '#f0fdfa' }, // teal
  { main: '#d97706', soft: '#fffbeb' }, // amber
  { main: '#7c3aed', soft: '#f5f3ff' }, // violet
];
const payerColor = (id) => (id ? PAYER_PALETTE[(Number(id) - 1) % PAYER_PALETTE.length] : { main: '#6b7280', soft: '#f3f4f6' });
const initials = (name) => (name || 'B').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

const QUICK = [
  ['all', 'All time'],
  ['today', 'Today'],
  ['this_week', 'This week'],
  ['this_month', 'This month'],
  ['prev_month', 'Previous month'],
  ['this_year', 'This year'],
  ['prev_year', 'Previous year'],
];

// Resolve a quick filter key into a [from, to] dayjs range (null = open-ended).
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

export default function StockSpentPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getStockPurchases({})
      .then((sp) => setRows(sp.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this stock line? Product stock & cost will be recomputed.')) return;
    await deleteStockPurchase(id);
    load();
  };

  // Filter rows by purchase date (quick range or custom from/to).
  const filtered = useMemo(() => {
    const [qFrom, qTo] = quick === 'custom'
      ? [from ? dayjs(from) : null, to ? dayjs(to) : null]
      : quickRange(quick);
    if (!qFrom && !qTo) return rows;
    return rows.filter((r) => {
      if (!r.purchased_at) return false;
      const d = dayjs(r.purchased_at);
      if (qFrom && d.isBefore(qFrom, 'day')) return false;
      if (qTo && d.isAfter(qTo, 'day')) return false;
      return true;
    });
  }, [rows, quick, from, to]);

  // group by the accounting month it's "for" (desc)
  const groups = {};
  filtered.forEach((r) => {
    const m = r.for_period || (r.purchased_at ? dayjs(r.purchased_at).format('YYYY-MM') : 'undated');
    (groups[m] = groups[m] || []).push(r);
  });
  const months = Object.keys(groups).sort().reverse();
  const grandTotal = filtered.reduce((s, r) => s + Number(r.total_cost), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Inventory2 sx={{ color: 'text.secondary' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.1}>Stock Spent</Typography>
          <Typography variant="body2" color="text.secondary">Total: <b>{fmt(grandTotal)}</b> · {filtered.length} products</Typography>
        </Box>
        <Button variant="contained" sx={primaryBtnSx} startIcon={<Add />} onClick={() => navigate('/stock-spent/new')}>
          Add purchase
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

      {/* Lines grouped by month */}
      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      ) : rows.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Inventory2 sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" gutterBottom>No stock spends yet.</Typography>
          <Button variant="contained" sx={primaryBtnSx} startIcon={<Add />} onClick={() => navigate('/stock-spent/new')}>
            Add your first purchase
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No purchases in the selected date range.</Typography>
        </Card>
      ) : months.map((m) => {
        const list = groups[m];
        const monthTotal = list.reduce((s, r) => s + Number(r.total_cost), 0);

        // Sub-group each month's lines by the shared purchase (same date + proof + payer).
        // One purchase = one proof shown once at the group header.
        const purchases = {};
        list.forEach((r) => {
          const key = `${r.purchased_at || ''}|${r.proof_path || ''}|${r.paid_by_partner_id || ''}`;
          (purchases[key] = purchases[key] || []).push(r);
        });
        const purchaseKeys = Object.keys(purchases).sort((a, b) =>
          (purchases[b][0].purchased_at || '').localeCompare(purchases[a][0].purchased_at || ''));

        return (
          <Card key={m} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5,
              background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', color: '#fff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography fontWeight={800} variant="subtitle1">
                  {m === 'undated' ? 'Undated' : dayjs(m + '-01').format('MMMM YYYY')}
                </Typography>
                <Chip size="small" label={`${list.length} ${list.length === 1 ? 'product' : 'products'}`}
                  sx={{ height: 22, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }} />
              </Box>
              <Typography fontWeight={800}>{fmt(monthTotal)}</Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              {purchaseKeys.map((pk) => {
                const lines = purchases[pk];
                const first = lines[0];
                const pTotal = lines.reduce((s, r) => s + Number(r.total_cost), 0);
                const c = payerColor(first.paid_by_partner_id);
                const d = first.purchased_at ? dayjs(first.purchased_at) : null;
                return (
                  <Box key={pk} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                    borderLeft: `4px solid ${c.main}`, overflow: 'hidden', '&:last-child': { mb: 0 } }}>
                    {/* Purchase header — date badge, payer, for-month, proof, total */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: c.soft, flexWrap: 'wrap' }}>
                      <Tooltip title={
                        `${lines.length} ${lines.length === 1 ? 'Product' : 'Products'} purchase on `
                        + `${d ? `${ordinal(d.date())} ${d.format('MMMM YYYY')}` : 'an unknown date'} by ${first.payer?.name || 'Business'}`
                        + (first.for_period ? ` for the month of ${dayjs(first.for_period + '-01').format('MMMM YYYY')}.` : '.')
                      }>
                        <Box sx={{ textAlign: 'center', minWidth: 46, px: 1, py: 0.5, borderRadius: 1.5, bgcolor: '#fff',
                          border: '1px solid', borderColor: 'divider', cursor: 'default' }}>
                          <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: c.main }}>
                            {d ? d.format('DD') : '—'}
                          </Typography>
                          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'text.secondary', textTransform: 'uppercase' }}>
                            {d ? d.format('MMM') : ''}
                          </Typography>
                        </Box>
                      </Tooltip>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 12, fontWeight: 700, bgcolor: c.main }}>
                          {initials(first.payer?.name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{first.payer?.name || 'Business'}</Typography>
                      </Box>

                      {first.for_period && (
                        <Chip size="small" variant="outlined" label={`for ${dayjs(first.for_period + '-01').format('MMM YYYY')}`}
                          sx={{ height: 22, borderColor: c.main, color: c.main, fontWeight: 600 }} />
                      )}

                      <Box sx={{ flexGrow: 1 }} />

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          {lines.length} {lines.length === 1 ? 'product' : 'products'}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: c.main, lineHeight: 1 }}>{fmt(pTotal)}</Typography>
                      </Box>

                      {first.proof_path ? (
                        <Tooltip title="View shared proof">
                          <IconButton size="small" component="a" href={proofUrl(first.proof_path)} target="_blank" rel="noopener noreferrer"
                            sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: c.soft } }}>
                            <AttachFile fontSize="small" sx={{ color: c.main }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="No proof attached">
                          <Box sx={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%', border: '1px dashed', borderColor: 'divider', color: 'text.disabled' }}>
                            <AttachFile fontSize="small" />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 700, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', borderBottom: '1px solid', borderColor: 'divider' } }}>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Single Cost</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Bulk Cost</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lines.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>
                              {r.product_id ? (
                                <Typography variant="body2" component={RouterLink} to={`/products/${r.product_id}`}
                                  sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                                  {r.product?.name || `#${r.product_id}`}
                                </Typography>
                              ) : (r.product?.name || '—')}
                            </TableCell>
                            <TableCell align="right">{fmt(r.unit_cost)}</TableCell>
                            <TableCell align="right">
                              <Chip size="small" label={`×${r.quantity}`} sx={{ height: 20, fontWeight: 600, bgcolor: 'action.hover' }} />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(r.total_cost)}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => navigate(`/stock-spent/${r.id}/edit`, { state: { row: r } })}><Edit fontSize="small" /></IconButton>
                              <IconButton size="small" color="error" onClick={() => remove(r.id)}><Delete fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                );
              })}
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}
