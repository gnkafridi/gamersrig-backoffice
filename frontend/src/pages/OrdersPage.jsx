import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, IconButton,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Skeleton, Tooltip, Grid, Divider, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Search, Visibility, Delete, ShoppingCart } from '@mui/icons-material';
import { getInvoices, deleteInvoice, restoreInvoice } from '../api/orders';
import { primaryBtnSx } from '../utils/styles';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
};
const STATUS_STYLE = {
  pending:   { bg: '#fff8e1', color: '#b45309', dot: '#f59e0b' },
  confirmed: { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9' },
  shipped:   { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  delivered: { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  returned:  { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
};

const Badge = ({ bg, color, dot, label }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.6,
    px: 1.1, py: 0.35, borderRadius: 1,
    bgcolor: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  }}>
    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
    {label}
  </Box>
);

export default function OrdersPage() {
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // inv object to confirm
  const [undoTarget, setUndoTarget] = useState(null);
  const undoTimer = React.useRef(null);
  const [sortBy, setSortBy] = useState('invoice_date');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
    setPage(0);
  };

  const load = useCallback(() => {
    setLoading(true);
    getInvoices({ search, status, page: page + 1, sort_by: sortBy, sort_dir: sortDir })
      .then((r) => {
        setInvoices(r.data.data);
        setMeta({ total: r.data.total });
        setSummary(r.data.summary);
      })
      .finally(() => setLoading(false));
  }, [search, status, page, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    const inv = confirmTarget;
    setConfirmTarget(null);
    setDeleting(inv.id);
    try {
      await deleteInvoice(inv.id);
      load();
      clearTimeout(undoTimer.current);
      setUndoTarget({ id: inv.id, label: inv.invoice_number });
      undoTimer.current = setTimeout(() => setUndoTarget(null), 6000);
    } finally { setDeleting(null); }
  };

  const handleUndo = async () => {
    if (!undoTarget) return;
    clearTimeout(undoTimer.current);
    setUndoTarget(null);
    await restoreInvoice(undoTarget.id);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="h4" fontWeight={700}>Orders</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={() => navigate('/orders/create')} sx={primaryBtnSx}>
          Create Order
        </Button>
      </Box>

      {/* Summary Stats Bar */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Orders',   value: summary?.total_orders ?? '—',             sub: fmt(summary?.total_amount),       color: 'text.primary' },
            { label: 'Online Orders',  value: summary?.online_orders ?? '—',            sub: fmt(summary?.online_amount),      color: 'success.main' },
            { label: 'COD Orders',     value: summary?.cod_orders ?? '—',               sub: fmt(summary?.cod_amount),         color: 'warning.main' },
          ].map((s, i) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 3, my: 0.5 }} />}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} color={s.color} sx={{ lineHeight: 1.2 }}>
                    {loading ? <Skeleton width={24} /> : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {loading ? <Skeleton width={60} /> : s.sub}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search order # or customer..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { id: 'invoice_number', label: 'Order #' },
                  { id: 'customer',       label: 'Customer', noSort: true },
                  { id: 'invoice_date',   label: 'Order Date' },
                  { id: 'status',         label: 'Status' },
                  { id: 'payment_method', label: 'Payment', noSort: true },
                ].map((col) => (
                  <TableCell key={col.id}>
                    {col.noSort ? col.label : (
                      <TableSortLabel
                        active={sortBy === col.id}
                        direction={sortBy === col.id ? sortDir : 'asc'}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <TableSortLabel active={sortBy === 'total'} direction={sortBy === 'total' ? sortDir : 'asc'} onClick={() => handleSort('total')}>
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">Updated</Typography>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : invoices.map((inv) => {
                    return (
                      <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }}
                        onClick={(e) => { if (e.ctrlKey || e.metaKey) window.open(`/orders/${inv.id}`, '_blank'); else navigate(`/orders/${inv.id}`); }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="primary.main"
                            component={RouterLink} to={`/orders/${inv.id}`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            {inv.invoice_number}
                          </Typography>
                        </TableCell>
                        <TableCell onClick={(e) => { e.stopPropagation(); navigate(`/customers/${inv.customer_id}`); }}>
                          <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                            {inv.customer?.name}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography variant="caption">{dayjs(inv.invoice_date).format('DD MMM YYYY')}</Typography></TableCell>
                        <TableCell>
                          {(() => { const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.returned; return <Badge bg={s.bg} color={s.color} dot={s.dot} label={STATUS_LABELS[inv.status] ?? inv.status} />; })()}
                        </TableCell>
                        <TableCell>
                          {inv.payment_method?.toUpperCase() === 'COD'
                            ? <Badge bg="#e0f2fe" color="#0369a1" dot="#38bdf8" label="COD" />
                            : <Badge bg="#dcfce7" color="#15803d" dot="#22c55e" label="Online" />}
                        </TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmt(inv.total)}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2">{inv.creator?.name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{inv.created_at ? dayjs(inv.created_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{inv.updater?.name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{inv.updated_at ? dayjs(inv.updated_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View (right-click / Ctrl+click to open in new tab)"><IconButton size="small" component={RouterLink} to={`/orders/${inv.id}`}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deleting === inv.id} onClick={() => setConfirmTarget(inv)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Order?</DialogTitle>
        <DialogContent>
          <Typography>Delete order <strong>{confirmTarget?.invoice_number}</strong>? This can be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(undoTarget)}
        onClose={(_, reason) => { if (reason !== 'clickaway') { clearTimeout(undoTimer.current); setUndoTarget(null); } }}
        message={`Order ${undoTarget?.label} deleted`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button color="warning" size="small" fontWeight={700} onClick={handleUndo}>
            UNDO
          </Button>
        }
      />
    </Box>
  );
}
