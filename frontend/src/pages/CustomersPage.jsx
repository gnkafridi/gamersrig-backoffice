import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Alert, Skeleton, Tooltip, Avatar, Autocomplete,
  Snackbar, Divider,
} from '@mui/material';
import { Add, Search, Edit, Delete } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import dayjs from 'dayjs';
import pakistanCities from '../data/pakistanCities';
import PhoneField from '../components/PhoneField';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, restoreCustomer } from '../api/customers';

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', notes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [undoTarget, setUndoTarget] = useState(null);
  const undoTimer = React.useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    getCustomers({ search, page: page + 1 })
      .then((r) => { setCustomers(r.data.data); setMeta({ total: r.data.total }); setSummary(r.data.summary); })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setError(''); setDialogOpen(true); };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (!form.phone || form.phone.length < 6) { setError('Phone number is required.'); return; }
    if (!form.city.trim()) { setError('City is required.'); return; }
    if (!form.address.trim()) { setError('Address is required.'); return; }
    setSaving(true);
    try {
      if (editing) await updateCustomer(editing.id, form);
      else await createCustomer(form);
      setDialogOpen(false); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const c = confirmTarget;
    setConfirmTarget(null);
    setDeleting(c.id);
    try {
      await deleteCustomer(c.id);
      load();
      clearTimeout(undoTimer.current);
      setUndoTarget({ id: c.id, label: c.name });
      undoTimer.current = setTimeout(() => setUndoTarget(null), 6000);
    } finally { setDeleting(null); }
  };

  const handleUndo = async () => {
    if (!undoTarget) return;
    clearTimeout(undoTimer.current);
    setUndoTarget(null);
    await restoreCustomer(undoTarget.id);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Customers</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>Add Customer</Button>
      </Box>

      {/* Summary Stats Bar */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            { label: 'Total Customers',   value: summary?.total_customers ?? '—',  color: 'text.primary' },
            { label: 'Active',            value: summary?.active_customers ?? '—', color: 'success.main' },
            { label: 'Have Orders',       value: summary?.with_orders ?? '—',      color: 'primary.main' },
            { label: 'No Orders Yet',     value: summary?.no_orders ?? '—',        color: 'warning.main' },
          ].map((s, i) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 3, my: 0.5 }} />}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={s.color} sx={{ lineHeight: 1.3 }}>
                  {loading ? <Skeleton width={32} /> : s.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search customers..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 280 }}
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right">Invoices</TableCell>
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
                    <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : customers.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'primary.dark' }}>
                            {c.name[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{c.email || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{c.phone || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{c.city || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{c.invoices_count}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.creator?.name ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.created_at ? dayjs(c.created_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.updater?.name ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.updated_at ? dayjs(c.updated_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deleting === c.id} onClick={() => setConfirmTarget(c)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={12}><TextField fullWidth label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid size={6}>
              <PhoneField
                value={form.phone}
                onChange={(val) => setForm({ ...form, phone: val })}
                label="Phone" required
              />
            </Grid>
            <Grid size={6}>
              <Autocomplete
                options={pakistanCities}
                groupBy={(o) => o.province}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.city}
                value={pakistanCities.find(c => c.city === form.city) || null}
                onChange={(_, v) => setForm({ ...form, city: v ? v.city : '' })}
                renderInput={(params) => <TextField {...params} label="City" required />}
              />
            </Grid>
            <Grid size={12}><TextField fullWidth required label="Address" multiline rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
            <Grid size={12}><TextField fullWidth label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent>
          <Typography>Delete customer <strong>{confirmTarget?.name}</strong>? This can be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(undoTarget)}
        onClose={(_, reason) => { if (reason !== 'clickaway') { clearTimeout(undoTimer.current); setUndoTarget(null); } }}
        message={`Customer ${undoTarget?.label} deleted`}
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
