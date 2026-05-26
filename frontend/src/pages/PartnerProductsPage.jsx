import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, IconButton,
  Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControlLabel, Switch, Alert, Skeleton,
  Tooltip, Snackbar, Divider, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Avatar, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, HandshakeOutlined, Inventory,
  StorefrontOutlined, AssessmentOutlined, Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import CATEGORY_ICONS from '../utils/categoryIcons';
import { primaryBtnSx } from '../utils/styles';
import {
  getVendorProducts, createVendorProduct, updateVendorProduct, deleteVendorProduct, restoreVendorProduct,
  getVendors, createVendor, updateVendor, deleteVendor, getVendorList, getCommissionReport,
} from '../api/vendors';
import { getAllCategories } from '../api/categories';
import { getBrands } from '../api/brands';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const CONDITIONS = ['New', 'Used', 'Pulled'];
const CONDITION_STYLE = {
  New:    { bg: '#f0fdf4', color: '#15803d' },
  Used:   { bg: '#fffbeb', color: '#b45309' },
  Pulled: { bg: '#eff6ff', color: '#0369a1' },
};

const BAR_PALETTE = ['#6366f1', '#0ea5e9', '#22c55e', '#f97316', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

const EMPTY_PRODUCT = {
  vendor_id: '', name: '', sku: '', category: '', brand: '', condition: 'New',
  sell_price: '', resell_price: '', stock: 1, notes: '', is_active: true,
};
const EMPTY_VENDOR = { name: '', email: '', phone: '', notes: '', is_active: true };

function commissionColor(pct) {
  const m = parseFloat(pct);
  if (m >= 10) return '#15803d';
  if (m >= 5)  return '#0369a1';
  return '#b45309';
}

export default function PartnerProductsPage() {
  const [tab, setTab] = useState(0);
  const [vendorList, setVendorList] = useState([]); // {id,name} for dropdowns/filters

  const loadVendorList = useCallback(() => {
    getVendorList().then((r) => setVendorList(r.data));
  }, []);
  useEffect(() => { loadVendorList(); }, [loadVendorList]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HandshakeOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Typography variant="h4" fontWeight={700}>Vendors</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab icon={<Inventory sx={{ fontSize: 18 }} />} iconPosition="start" label="Partner Products" sx={{ textTransform: 'none', minHeight: 56 }} />
          <Tab icon={<StorefrontOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Manage Vendors" sx={{ textTransform: 'none', minHeight: 56 }} />
          <Tab icon={<AssessmentOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Commission Report" sx={{ textTransform: 'none', minHeight: 56 }} />
        </Tabs>
      </Card>

      {tab === 0 && <ProductsTab vendorList={vendorList} />}
      {tab === 1 && <VendorsTab onChanged={loadVendorList} />}
      {tab === 2 && <CommissionTab />}
    </Box>
  );
}

/* ─────────────────────────── Tab 1: Partner Products ─────────────────────────── */
function ProductsTab({ vendorList }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filterVendor, setFilterVendor] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Master-data options for the dialog dropdowns
  const [catOptions, setCatOptions]     = useState([]); // {id, name, parent_id}
  const [brandOptions, setBrandOptions] = useState([]); // {id, name}
  useEffect(() => {
    getAllCategories().then((r) => setCatOptions(r.data));
    getBrands({ page: 1 }).then((r) => setBrandOptions(r.data.data));
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [undoTarget, setUndoTarget] = useState(null);
  const undoTimer = React.useRef(null);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
    setPage(0);
  };

  const load = useCallback(() => {
    setLoading(true);
    getVendorProducts({
      search, page: page + 1, sort_by: sortBy, sort_dir: sortDir,
      ...(filterVendor ? { vendor_id: filterVendor } : {}),
      ...(filterCondition ? { condition: filterCondition } : {}),
    })
      .then((r) => {
        setProducts(r.data.data);
        setMeta({ total: r.data.total });
        setSummary(r.data.summary);
      })
      .finally(() => setLoading(false));
  }, [search, page, sortBy, sortDir, filterVendor, filterCondition]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PRODUCT); setError(''); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      vendor_id: p.vendor_id, name: p.name, sku: p.sku ?? '', category: p.category ?? '',
      brand: p.brand ?? '', condition: p.condition, sell_price: p.sell_price, resell_price: p.resell_price,
      stock: p.stock, notes: p.notes ?? '', is_active: p.is_active,
    });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await updateVendorProduct(editing.id, form);
      else         await createVendorProduct(form);
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const p = confirmTarget;
    setConfirmTarget(null);
    setDeleting(p.id);
    try {
      await deleteVendorProduct(p.id);
      load();
      clearTimeout(undoTimer.current);
      setUndoTarget({ id: p.id, label: p.name });
      undoTimer.current = setTimeout(() => setUndoTarget(null), 6000);
    } finally { setDeleting(null); }
  };

  const handleUndo = async () => {
    if (!undoTarget) return;
    clearTimeout(undoTimer.current);
    setUndoTarget(null);
    await restoreVendorProduct(undoTarget.id);
    load();
  };

  const liveCommission = (Number(form.resell_price) || 0) - (Number(form.sell_price) || 0);
  const activeFilters = (filterVendor ? 1 : 0) + (filterCondition ? 1 : 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>Add Product</Button>
      </Box>

      {/* Summary stats bar */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            { label: 'Total Products', value: summary?.total_products ?? '—', color: 'text.primary' },
            { label: 'Total Payable',  value: summary ? fmt(summary.total_payable) : '—', color: 'text.secondary' },
            { label: 'Resell Value',   value: summary ? fmt(summary.total_resell) : '—', color: 'primary.main' },
            { label: 'Commission',     value: summary ? fmt(summary.total_commission) : '—', color: 'success.main' },
          ].map((s, i) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 3, my: 0.5 }} />}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={s.color} sx={{ lineHeight: 1.3 }}>
                  {loading ? <Skeleton width={48} /> : s.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      <Card>
        {/* Filter bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search products..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Vendor</InputLabel>
            <Select value={filterVendor} label="Vendor" onChange={(e) => { setFilterVendor(e.target.value); setPage(0); }}>
              <MenuItem value=""><em>All vendors</em></MenuItem>
              {vendorList.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            size="small" exclusive value={filterCondition}
            onChange={(_, v) => { setFilterCondition(v ?? ''); setPage(0); }}
          >
            {CONDITIONS.map((c) => <ToggleButton key={c} value={c} sx={{ textTransform: 'none', px: 1.5 }}>{c}</ToggleButton>)}
          </ToggleButtonGroup>
          {activeFilters > 0 && (
            <Button size="small" variant="text" color="inherit"
              onClick={() => { setFilterVendor(''); setFilterCondition(''); setPage(0); }}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: 12 }}>
              Clear filters ({activeFilters})
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>Product</TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">
                  <TableSortLabel active={sortBy === 'sell_price'} direction={sortBy === 'sell_price' ? sortDir : 'asc'} onClick={() => handleSort('sell_price')}>Sell Price</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={sortBy === 'resell_price'} direction={sortBy === 'resell_price' ? sortDir : 'asc'} onClick={() => handleSort('resell_price')}>Resell Price</TableSortLabel>
                </TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : products.length === 0
                  ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No partner products found.</TableCell></TableRow>
                  : products.map((p) => {
                    const cs = CONDITION_STYLE[p.condition] || CONDITION_STYLE.New;
                    const IconComp = CATEGORY_ICONS[p.category] || Inventory;
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComp sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{p.category || '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={p.condition} size="small" sx={{ bgcolor: cs.bg, color: cs.color, fontWeight: 600, fontSize: 11 }} />
                        </TableCell>
                        <TableCell><Typography variant="body2">{p.vendor?.name ?? '—'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">{fmt(p.sell_price)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600} color="primary.main">{fmt(p.resell_price)}</Typography></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color: commissionColor(p.commission_pct) }}>{fmt(p.commission)}</Typography>
                            <Typography variant="caption" sx={{ color: commissionColor(p.commission_pct), lineHeight: 1.2 }}>{p.commission_pct}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 600,
                            bgcolor: p.is_active ? '#f0fdf4' : '#fef2f2', color: p.is_active ? '#15803d' : '#dc2626',
                          }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: p.is_active ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details"><IconButton size="small" onClick={() => navigate(`/partner-products/${p.id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deleting === p.id} onClick={() => setConfirmTarget(p)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Partner Product' : 'Add Partner Product'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField fullWidth label="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor *</InputLabel>
                <Select value={form.vendor_id || ''} label="Vendor *" onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
                  {vendorList.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Condition *</InputLabel>
                <Select value={form.condition} label="Condition *" onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  {CONDITIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category || ''}
                  label="Category"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                >
                  <MenuItem value=""><em>— None —</em></MenuItem>
                  {catOptions.map((c) =>
                    c.parent_id ? (
                      <MenuItem key={c.id} value={c.name} sx={{ pl: 4, fontSize: 13, color: 'text.secondary' }}>↳ {c.name}</MenuItem>
                    ) : (
                      <MenuItem key={c.id} value={c.name} sx={{ fontWeight: 700, fontSize: 13 }}>{c.name}</MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={form.brand || ''}
                  label="Brand"
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                >
                  <MenuItem value=""><em>— None —</em></MenuItem>
                  {brandOptions.map((b) => <MenuItem key={b.id} value={b.name} sx={{ fontSize: 13 }}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Grid>

            <Grid size={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Pricing</Typography>
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Sell Price (PKR) *" type="number" value={form.sell_price}
                onChange={(e) => setForm({ ...form, sell_price: e.target.value })} helperText="Vendor's price (your cost)" />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Resell Price (PKR) *" type="number" value={form.resell_price}
                onChange={(e) => setForm({ ...form, resell_price: e.target.value })}
                helperText={
                  form.sell_price && form.resell_price
                    ? <span style={{ color: liveCommission >= 0 ? '#15803d' : '#dc2626', fontWeight: 600 }}>Commission: {fmt(liveCommission)}</span>
                    : 'Your listing price'
                }
              />
            </Grid>

            <Grid size={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{confirmTarget?.name}</strong>? This can be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(undoTarget)}
        onClose={(_, reason) => { if (reason !== 'clickaway') { clearTimeout(undoTimer.current); setUndoTarget(null); } }}
        message={`Product ${undoTarget?.label} deleted`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={<Button color="warning" size="small" onClick={handleUndo}>UNDO</Button>}
      />
    </Box>
  );
}

/* ─────────────────────────── Tab 2: Manage Vendors ─────────────────────────── */
function VendorsTab({ onChanged }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getVendors({ search, page: page + 1 })
      .then((r) => { setRows(r.data.data); setMeta({ total: r.data.total }); })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_VENDOR); setError(''); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, email: row.email ?? '', phone: row.phone ?? '', notes: row.notes ?? '', is_active: row.is_active });
    setError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vendor name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) await updateVendor(editing.id, form);
      else         await createVendor(form);
      setDialogOpen(false);
      load(); onChanged?.();
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
      await deleteVendor(row.id);
      load(); onChanged?.();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed.');
    } finally { setDeleting(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>Add Vendor</Button>
      </Box>

      {deleteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError('')}>{deleteError}</Alert>}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search vendors..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 280 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
                            {row.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.email || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.phone || ''}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${row.products_count ?? 0}`} size="small"
                          sx={{ bgcolor: (row.products_count ?? 0) > 0 ? '#f0fdf4' : 'action.hover', color: (row.products_count ?? 0) > 0 ? '#15803d' : 'text.disabled', fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={row.is_active ? 'Active' : 'Inactive'} size="small"
                          sx={{ bgcolor: row.is_active ? '#f0fdf4' : '#fef2f2', color: row.is_active ? '#15803d' : '#dc2626', fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={(row.products_count ?? 0) > 0 ? 'Cannot delete — has products' : 'Delete'}>
                          <span>
                            <IconButton size="small" color="error" disabled={deleting === row.id || (row.products_count ?? 0) > 0} onClick={() => setConfirmTarget(row)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={meta.total} page={page} rowsPerPage={50} rowsPerPageOptions={[50]} onPageChange={(_, p) => setPage(p)} />
      </Card>

      {/* Add / Edit Vendor Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField fullWidth label="Vendor Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={form.is_active ? 'true' : 'false'} label="Status" onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Vendor'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Vendor?</DialogTitle>
        <DialogContent>
          <Typography>Delete vendor <strong>{confirmTarget?.name}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ─────────────────────────── Tab 3: Commission Report ─────────────────────────── */
function CommissionTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCommissionReport().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const vendors = data?.vendors ?? [];
  const totals = data?.totals ?? {};
  const chartData = vendors.map((v) => ({ name: v.vendor, commission: v.total_commission }));

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Catalog-level (potential) commission across all listed partner products — the markup you'd earn if every item sells at its resell price.
      </Alert>

      {/* Totals bar */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            { label: 'Vendors',       value: vendors.length },
            { label: 'Products',      value: totals.product_count ?? '—' },
            { label: 'Total Payable', value: totals.total_payable != null ? fmt(totals.total_payable) : '—', color: 'text.secondary' },
            { label: 'Resell Value',  value: totals.total_resell != null ? fmt(totals.total_resell) : '—', color: 'primary.main' },
            { label: 'Commission',    value: totals.total_commission != null ? fmt(totals.total_commission) : '—', color: 'success.main' },
          ].map((s, i) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 3, my: 0.5 }} />}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={s.color || 'text.primary'} sx={{ lineHeight: 1.3 }}>
                  {loading ? <Skeleton width={48} /> : s.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      <Grid container spacing={2}>
        {/* Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Commission by Vendor</Typography>
            {loading ? <Skeleton variant="rectangular" height={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} style={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} style={{ fontSize: 11 }} />
                  <RechartTooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="commission" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Table */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell align="center">Products</TableCell>
                    <TableCell align="right">Payable</TableCell>
                    <TableCell align="right">Resell</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">Avg %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                      ))
                    : vendors.map((v) => (
                        <TableRow key={v.id} hover>
                          <TableCell><Typography variant="body2" fontWeight={600}>{v.vendor}</Typography></TableCell>
                          <TableCell align="center">{v.product_count}</TableCell>
                          <TableCell align="right"><Typography variant="body2" color="text.secondary">{fmt(v.total_payable)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" color="primary.main">{fmt(v.total_resell)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={700} color="success.main">{fmt(v.total_commission)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" sx={{ color: commissionColor(v.avg_commission_pct) }}>{v.avg_commission_pct}%</Typography></TableCell>
                        </TableRow>
                      ))}
                  {!loading && vendors.length > 0 && (
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell><Typography variant="body2" fontWeight={800}>Total</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight={800}>{totals.product_count}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={800}>{fmt(totals.total_payable)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={800}>{fmt(totals.total_resell)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={800} color="success.main">{fmt(totals.total_commission)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={800}>{totals.avg_commission_pct}%</Typography></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
