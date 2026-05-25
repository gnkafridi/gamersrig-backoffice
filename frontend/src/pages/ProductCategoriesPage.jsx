import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  TextField, InputAdornment, Skeleton, Tooltip, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add, Search, Edit, Delete, CategoryOutlined, Inventory } from '@mui/icons-material';
import { primaryBtnSx } from '../utils/styles';
import { getCategories, getCategoryParents, createCategory, updateCategory, deleteCategory } from '../api/categories';
import CategoryIcon from '../components/CategoryIcon';
import CATEGORY_ICONS from '../utils/categoryIcons';

const EMPTY = { name: '', parent_id: '', sort_order: 0, is_active: true };

export default function ProductCategoriesPage() {
  const navigate = useNavigate();
  const [rows, setRows]         = useState([]);
  const [meta, setMeta]         = useState({ total: 0 });
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [parents, setParents]   = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getCategories({ search, page: page + 1 })
      .then(r => { setRows(r.data.data); setMeta({ total: r.data.total }); })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getCategoryParents().then(r => setParents(r.data));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setDialogOpen(true); };
  const openEdit   = (row) => {
    setEditing(row);
    setForm({ name: row.name, parent_id: row.parent_id ?? '', sort_order: row.sort_order ?? 0, is_active: row.is_active });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, parent_id: form.parent_id || null };
      if (editing) await updateCategory(editing.id, payload);
      else         await createCategory(payload);
      setDialogOpen(false);
      load();
      getCategoryParents().then(r => setParents(r.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const row = confirmTarget;
    setConfirmTarget(null);
    setDeleting(row.id);
    setDeleteError('');
    try {
      await deleteCategory(row.id);
      load();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="h4" fontWeight={700}>Categories</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>
          Add Category
        </Button>
      </Box>

      {deleteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError('')}>{deleteError}</Alert>}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search categories..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 280 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Parent Category</TableCell>
                <TableCell align="center">Sub-categories</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Sort</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : rows.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        {(() => {
                          const IconComp = CATEGORY_ICONS[row.name];
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: row.parent_id ? 3 : 0 }}>
                              {IconComp
                                ? <IconComp sx={{ fontSize: row.parent_id ? 16 : 20, color: 'text.secondary', opacity: row.parent_id ? 0.6 : 0.8, flexShrink: 0 }} />
                                : row.parent_id
                                  ? null
                                  : <CategoryOutlined sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />
                              }
                              <Typography variant="body2" fontWeight={row.parent_id ? 400 : 700} color={row.parent_id ? 'text.secondary' : 'text.primary'}>
                                {row.name}
                              </Typography>
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {row.parent
                          ? <Chip label={row.parent.name} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                          : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={row.children_count} size="small"
                          sx={{ bgcolor: row.children_count > 0 ? '#eef2ff' : 'action.hover', color: row.children_count > 0 ? '#4f46e5' : 'text.disabled', fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={row.product_count ?? 0} size="small"
                          sx={{ bgcolor: (row.product_count ?? 0) > 0 ? '#f0fdf4' : 'action.hover', color: (row.product_count ?? 0) > 0 ? '#15803d' : 'text.disabled', fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.is_active ? 'Active' : 'Inactive'} size="small"
                          sx={{ bgcolor: row.is_active ? '#f0fdf4' : '#fef2f2', color: row.is_active ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" color="text.secondary">{row.sort_order}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(row.product_count ?? 0) > 0 && (
                          <Tooltip title="View Products">
                            <IconButton size="small" onClick={() => navigate(`/products?category=${encodeURIComponent(row.name)}`)}>
                              <Inventory fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" disabled={deleting === row.id} onClick={() => setConfirmTarget(row)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={50} rowsPerPageOptions={[50]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField fullWidth label="Category Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <FormControl fullWidth size="small">
            <InputLabel>Parent Category (optional)</InputLabel>
            <Select value={form.parent_id} label="Parent Category (optional)"
              onChange={e => setForm({ ...form, parent_id: e.target.value })}>
              <MenuItem value="">— None (top-level) —</MenuItem>
              {parents.filter(p => !editing || p.id !== editing.id).map(p => (
                <MenuItem key={p.id} value={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon name={p.name} size={16} color="currentColor" style={{ opacity: 0.7, flexShrink: 0 }} />
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Sort Order" type="number" size="small"
            value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
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
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{confirmTarget?.name}</strong>?
            {confirmTarget?.children_count > 0 && ' This category has sub-categories and cannot be deleted.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}
            disabled={confirmTarget?.children_count > 0}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
