import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Skeleton, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Add, Edit, AccountBalanceWallet } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import { getLedger, getMonthlyInvestments, upsertMonthlyInvestment } from '../api/finance';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const QUICK = [
  ['all', 'All time'],
  ['this_month', 'This month'],
  ['prev_month', 'Previous month'],
  ['this_year', 'This year'],
  ['prev_year', 'Previous year'],
];

// Resolve a quick key into an inclusive [from, to] month range (YYYY-MM strings; null = open).
const monthRange = (key) => {
  const now = dayjs();
  switch (key) {
    case 'this_month': return [now.format('YYYY-MM'), now.format('YYYY-MM')];
    case 'prev_month': { const m = now.subtract(1, 'month'); return [m.format('YYYY-MM'), m.format('YYYY-MM')]; }
    case 'this_year': { const y = now.format('YYYY'); return [`${y}-01`, `${y}-12`]; }
    case 'prev_year': { const y = now.subtract(1, 'year').format('YYYY'); return [`${y}-01`, `${y}-12`]; }
    default: return [null, null];
  }
};

export default function InvestmentPage() {
  const [quick, setQuick] = useState('all');
  const [rows, setRows] = useState([]);
  const [agreedMap, setAgreedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getLedger({}), getMonthlyInvestments({})])
      .then(([led, mi]) => {
        setRows(led.data.monthly || []);
        const map = {};
        (mi.data || []).forEach((m) => { map[m.period] = m; });
        setAgreedMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter month rows by the selected quick range (inclusive YYYY-MM compare).
  const filtered = useMemo(() => {
    const [from, to] = monthRange(quick);
    if (!from && !to) return rows;
    return rows.filter((r) => (!from || r.period >= from) && (!to || r.period <= to));
  }, [rows, quick]);

  const save = async () => {
    setError('');
    try {
      await upsertMonthlyInvestment({ period: dialog.period, amount: Number(dialog.amount) || 0, notes: dialog.notes || null });
      setDialog(null);
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <AccountBalanceWallet sx={{ color: 'text.secondary' }} />
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Investment</Typography>
        <Button startIcon={<Add />} variant="contained" sx={primaryBtnSx}
          onClick={() => setDialog({ period: dayjs().format('YYYY-MM'), amount: 50000, notes: '' })}>
          Set Monthly Investment
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Set each month's <b>agreed investment</b> (shared budget). <b>Stock Spent</b> comes from the Stock Spent module;
        <b> Spillover</b> = stock above the agreed budget. Each partner's <b>due</b> = (stock + expenses) ÷ 2 —
        see the <b>Finance → Ledger</b> for who-paid &amp; balances.
      </Alert>

      {/* Quick filters */}
      <Card sx={{ mb: 3, p: 1.5, borderRadius: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={quick}
          onChange={(_, v) => { if (v) setQuick(v); }}
          sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, borderRadius: '20px !important', border: '1px solid', borderColor: 'divider', m: 0.25 } }}>
          {QUICK.map(([k, label]) => <ToggleButton key={k} value={k}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell align="right">Agreed Investment</TableCell>
                <TableCell align="right">Stock Spent</TableCell>
                <TableCell align="right">Spillover</TableCell>
                <TableCell align="right">Due / Partner</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>{rows.length === 0 ? 'No months yet — set a monthly investment to begin.' : 'No months in the selected range.'}</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.period} hover>
                  <TableCell>{dayjs(r.period + '-01').format('MMM YYYY')}</TableCell>
                  <TableCell align="right">{fmt(r.agreed)}</TableCell>
                  <TableCell align="right">{fmt(r.stock)}</TableCell>
                  <TableCell align="right" sx={{ color: r.spillover > 0 ? 'warning.main' : 'text.secondary', fontWeight: r.spillover > 0 ? 600 : 400 }}>{fmt(r.spillover)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(r.due_each)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" title="Edit agreed investment"
                      onClick={() => setDialog({ period: r.period, amount: agreedMap[r.period]?.amount ?? r.agreed, notes: agreedMap[r.period]?.notes || '' })}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Agreed Investment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth size="small" label="Month" type="month" sx={{ mt: 1, mb: 2 }} slotProps={{ inputLabel: { shrink: true } }}
            value={dialog?.period || ''} onChange={(e) => setDialog({ ...dialog, period: e.target.value })} />
          <TextField fullWidth size="small" label="Agreed Investment (PKR)" type="number" sx={{ mb: 2 }}
            value={dialog?.amount ?? ''} onChange={(e) => setDialog({ ...dialog, amount: e.target.value })}
            helperText="Shared monthly budget (set 0 for revenue-funded months)." />
          <TextField fullWidth size="small" label="Notes" multiline rows={2}
            value={dialog?.notes || ''} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={!dialog?.period}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
