import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  TextField, InputAdornment, Skeleton, Tooltip, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Select,
  MenuItem, FormControl, InputLabel, Avatar,
} from '@mui/material';
import { Add, Search, Edit, Delete, BrandingWatermarkOutlined, Inventory } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api/brands';

const EMPTY = { name: '', is_active: true };

const PALETTE = [
  '#6366f1','#0ea5e9','#8b5cf6','#f97316','#ec4899',
  '#22c55e','#f59e0b','#10b981','#ef4444','#94a3b8',
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ProductBrandsPage() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [meta, setMeta]       = useState({ total: 0 });
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getBrands({ search, page: page + 1 })
      .then(r => { setRows(r.data.data); setMeta({ total: r.data.total }); })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setDialogOpen(true); };
  const openEdit   = (row) => { setEditing(row); setForm({ name: row.name, is_active: row.is_active }); setError(''); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Brand name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) await updateBrand(editing.id, form);
      else         await createBrand(form);
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const row = confirmTarget;
    setConfirmTarget(null);
    setDeleting(row.id);
    setDeleteError('');
    try {
      await deleteBrand(row.id);
      load();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BrandingWatermarkOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="h4" fontWeight={700}>Brands</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>
          Add Brand
        </Button>
      </Box>

      {deleteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError('')}>{deleteError}</Alert>}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search brands..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 280 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : rows.map(row => {
                    const color = avatarColor(row.name);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: color + '20', color, fontSize: 11, fontWeight: 800, border: `1.5px solid ${color}30` }}>
                              {initials(row.name)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${row.product_count ?? 0} product${(row.product_count ?? 0) !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              bgcolor: (row.product_count ?? 0) > 0 ? '#f0fdf4' : 'action.hover',
                              color:   (row.product_count ?? 0) > 0 ? '#15803d' : 'text.disabled',
                              fontWeight: 600, fontSize: 11,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.is_active ? 'Active' : 'Inactive'} size="small"
                            sx={{ bgcolor: row.is_active ? '#f0fdf4' : '#fef2f2', color: row.is_active ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {(row.product_count ?? 0) > 0 && (
                            <Tooltip title="View Products">
                              <IconButton size="small" onClick={() => navigate(`/products?brand=${encodeURIComponent(row.name)}`)}>
                                <Inventory fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title={row.product_count > 0 ? 'Cannot delete — has products' : 'Delete'}>
                            <span>
                              <IconButton size="small" color="error" disabled={deleting === row.id || row.product_count > 0}
                                onClick={() => setConfirmTarget(row)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={50} rowsPerPageOptions={[50]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField fullWidth label="Brand Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={form.is_active ? 'true' : 'false'} label="Status"
              onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Brand'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Brand?</DialogTitle>
        <DialogContent>
          <Typography>Delete brand <strong>{confirmTarget?.name}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
