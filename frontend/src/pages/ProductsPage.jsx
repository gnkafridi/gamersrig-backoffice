import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, IconButton,
  Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControlLabel, Switch, Alert, Skeleton,
  Tooltip, Snackbar, Divider, Select, MenuItem, ListSubheader, FormControl, InputLabel,
  Autocomplete, Checkbox,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Inventory, Inventory2,
  CheckBox as CheckBoxIcon, CheckBoxOutlineBlank,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import CATEGORY_ICONS from '../utils/categoryIcons';
import { primaryBtnSx } from '../utils/styles';
import { getProducts, createProduct, updateProduct, deleteProduct, restoreProduct, getCategoryStats, restockProduct, getProductPurchases, markProductReceived } from '../api/products';
import { getAllCategories } from '../api/categories';
import { getBrands } from '../api/brands';
import { getPartners } from '../api/finance';

import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const EMPTY = { name: '', sku: '', category: '', brand: '', description: '', cost_price: '', sell_price: '', discount_price: '', stock: 0, purchased_at: '', is_active: true, stock_status: 'in_stock' };

const EMPTY_RESTOCK = { quantity: '', unit_cost: '', purchased_at: dayjs().format('YYYY-MM-DD'), stock_status: 'in_stock', notes: '', paid_by_partner_id: '', proofFile: null };

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock',        bg: '#f0fdf4', color: '#15803d' },
  { value: 'shipped',  label: 'Shipped / Onway', bg: '#eff6ff', color: '#2563eb' },
  { value: 'pre_order',label: 'Pre Order',       bg: '#fff7ed', color: '#c2410c' },
];

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state — initialise from URL params (coming from Categories/Brands pages)
  const urlCategory = searchParams.get('category') || '';
  const urlBrand    = searchParams.get('brand')    || '';
  const [filterCategories, setFilterCategories] = useState(urlCategory ? [urlCategory] : []);
  const [filterBrands,     setFilterBrands]     = useState(urlBrand    ? [urlBrand]    : []);

  // Sort state
  const [sortBy,  setSortBy]  = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
    setPage(0);
  };

  // Options for Autocomplete dropdowns
  const [catOptions,    setCatOptions]    = useState([]); // { id, name, parent_id }
  const [brandOptions,  setBrandOptions]  = useState([]); // { id, name }
  const [categoryStats, setCategoryStats] = useState([]); // { category, product_count, … }

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [undoTarget, setUndoTarget] = useState(null);
  const undoTimer = React.useRef(null);

  // Restock dialog state
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockForm, setRestockForm] = useState(EMPTY_RESTOCK);
  const [restockSaving, setRestockSaving] = useState(false);
  const [restockError, setRestockError] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [partners, setPartners] = useState([]);

  // ── Load filter options + category stats once on mount ──────────────────
  useEffect(() => {
    getAllCategories().then((r) => setCatOptions(r.data));
    getBrands({ page: 1 }).then((r) => setBrandOptions(r.data.data));
    getCategoryStats().then((r) => setCategoryStats(r.data.filter((c) => c.product_count > 0)));
    getPartners({ is_active: true }).then((r) => setPartners(r.data.data)).catch(() => {});
  }, []);

  // ── Fetch products ───────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    getProducts({
      search,
      page: page + 1,
      sort_by: sortBy,
      sort_dir: sortDir,
      ...(filterCategories.length ? { categories: filterCategories } : {}),
      ...(filterBrands.length     ? { brands: filterBrands }         : {}),
    })
      .then((r) => {
        setProducts(r.data.data);
        setMeta({ total: r.data.total, current_page: r.data.current_page, last_page: r.data.last_page });
        setSummary(r.data.summary);
      })
      .finally(() => setLoading(false));
  }, [search, page, sortBy, sortDir, filterCategories, filterBrands]);

  useEffect(() => { load(); }, [load]);

  // ── Dialog helpers ───────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setDialogOpen(true); };
  const openEdit   = (p) => { setEditing(p); setForm({ ...p, stock_status: p.stock_status || 'in_stock' }); setError(''); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await updateProduct(editing.id, form);
      else         await createProduct(form);
      setDialogOpen(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Save failed';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const p = confirmTarget;
    setConfirmTarget(null);
    setDeleting(p.id);
    try {
      await deleteProduct(p.id);
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
    await restoreProduct(undoTarget.id);
    load();
  };

  // ── Restock helpers ─────────────────────────────────────────────────────
  const openRestock = (p) => {
    setRestockTarget(p);
    setRestockForm(EMPTY_RESTOCK);
    setRestockError('');
    setPurchases([]);
    getProductPurchases(p.id).then((r) => setPurchases(r.data)).catch(() => {});
  };

  const handleRestock = async () => {
    if (!restockForm.quantity || Number(restockForm.quantity) < 1) { setRestockError('Quantity must be at least 1.'); return; }
    if (restockForm.unit_cost === '' || Number(restockForm.unit_cost) < 0) { setRestockError('Enter a valid unit cost.'); return; }
    setRestockSaving(true); setRestockError('');
    try {
      let payload;
      if (restockForm.proofFile) {
        payload = new FormData();
        payload.append('quantity', Number(restockForm.quantity));
        payload.append('unit_cost', Number(restockForm.unit_cost));
        if (restockForm.purchased_at) payload.append('purchased_at', restockForm.purchased_at);
        payload.append('stock_status', restockForm.stock_status || 'in_stock');
        if (restockForm.notes) payload.append('notes', restockForm.notes);
        if (restockForm.paid_by_partner_id) payload.append('paid_by_partner_id', restockForm.paid_by_partner_id);
        payload.append('proof', restockForm.proofFile);
      } else {
        payload = {
          quantity: Number(restockForm.quantity),
          unit_cost: Number(restockForm.unit_cost),
          purchased_at: restockForm.purchased_at || null,
          stock_status: restockForm.stock_status || 'in_stock',
          notes: restockForm.notes || null,
          paid_by_partner_id: restockForm.paid_by_partner_id || null,
        };
      }
      await restockProduct(restockTarget.id, payload);
      setRestockTarget(null);
      load();
    } catch (err) {
      setRestockError(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Restock failed');
    } finally { setRestockSaving(false); }
  };

  // Live weighted-average preview for the restock dialog
  const restockPreview = (() => {
    if (!restockTarget) return null;
    const qty = Number(restockForm.quantity) || 0;
    const unit = Number(restockForm.unit_cost) || 0;
    const oldStock = Number(restockTarget.stock) || 0;
    const oldCost = Number(restockTarget.cost_price) || 0;
    const newStock = oldStock + qty;
    const newCost = newStock > 0 ? (oldStock * oldCost + qty * unit) / newStock : unit;
    return { newStock, newCost };
  })();

  const margin = (p) =>
    p.sell_price > 0 ? (((p.sell_price - p.cost_price) / p.sell_price) * 100).toFixed(1) : '0.0';

  // Active filter count badge
  const activeFilters = filterBrands.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="h4" fontWeight={700}>Products</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={openCreate} sx={primaryBtnSx}>Add Product</Button>
      </Box>

      {/* Summary Stats Bar */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            { label: 'Total Products', value: summary?.total_products ?? '—',  color: 'text.primary' },
            { label: 'Total Stock',    value: summary?.total_stock    ?? '—',  color: 'primary.main' },
            { label: 'Out of Stock',   value: summary?.out_of_stock   ?? '—',  color: 'error.main' },
            { label: 'Inventory Value', value: summary ? ('PKR ' + Number(summary.total_cost_value).toLocaleString('en-PK', { maximumFractionDigits: 0 })) : '—', color: 'text.secondary' },
            { label: 'Stock Value',     value: summary ? ('PKR ' + Number(summary.total_sell_value).toLocaleString('en-PK', { maximumFractionDigits: 0 })) : '—', color: 'success.main' },
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

      {/* ── Category quick-filter strip ── */}
      {categoryStats.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categoryStats.map((cat) => {
            const isActive = filterCategories.includes(cat.category);
            const IconComp = CATEGORY_ICONS[cat.category];
            return (
              <Tooltip key={cat.category} title={cat.category} placement="top" arrow>
                <Box
                  onClick={() => {
                    setFilterCategories(isActive
                      ? filterCategories.filter((c) => c !== cat.category)
                      : [...filterCategories, cat.category]
                    );
                    setPage(0);
                  }}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    px: 1.25, py: 0.6, borderRadius: 2, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isActive ? 'primary.main' : 'divider',
                    bgcolor: isActive ? 'primary.main' : 'background.paper',
                    color: isActive ? '#fff' : 'text.secondary',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      color: isActive ? '#fff' : 'primary.main',
                    },
                  }}
                >
                  {IconComp && <IconComp sx={{ fontSize: 16 }} />}
                  <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                    {cat.product_count}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}

      <Card>
        {/* ── Filter bar ── */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <TextField
            size="small" placeholder="Search products..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 260 }}
          />

          {/* Brand multi-select */}
          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={brandOptions}
            value={brandOptions.filter((o) => filterBrands.includes(o.name))}
            onChange={(_, selected) => { setFilterBrands(selected.map((o) => o.name)); setPage(0); }}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox
                  icon={<CheckBoxOutlineBlank fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  checked={selected}
                  sx={{ mr: 0.5, p: 0.5 }}
                />
                <Typography variant="body2">{option.name}</Typography>
              </li>
            )}
            renderTags={(values, getTagProps) =>
              values.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{ fontSize: 11 }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Brand"
                placeholder={filterBrands.length === 0 ? 'All brands' : ''}
              />
            )}
            sx={{ minWidth: 200, maxWidth: 300 }}
            limitTags={2}
            noOptionsText="No brands found"
          />

          {/* Clear filters */}
          {activeFilters > 0 && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => { setFilterCategories([]); setFilterBrands([]); setPage(0); }}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: 12 }}
            >
              Clear filters ({activeFilters})
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { id: 'name',       label: 'Product', align: 'left'  },
                  { id: 'cost_price', label: 'Cost',    align: 'right' },
                  { id: 'sell_price', label: 'Price', align: 'right' },
                ].map((col) => (
                  <TableCell key={col.id} align={col.align}>
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortDir : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                {/* Margin: computed column, not sortable */}
                <TableCell align="right">Margin</TableCell>
                {/* Stock: sortable */}
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'stock'}
                    direction={sortBy === 'stock' ? sortDir : 'asc'}
                    onClick={() => handleSort('stock')}
                  >
                    Stock
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortDir : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'updated_at'}
                    direction={sortBy === 'updated_at' ? sortDir : 'asc'}
                    onClick={() => handleSort('updated_at')}
                  >
                    <Typography variant="caption" color="text.secondary">Updated</Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                : products.map((p) => {
                    const hasSale = p.discount_price && Number(p.discount_price) > 0;
                    const IconComp = CATEGORY_ICONS[p.category] || Inventory;
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComp sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography
                              variant="body2" fontWeight={600}
                              component={RouterLink}
                              to={`/products/${p.id}`}
                              sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }}
                            >{p.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{fmt(p.cost_price)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {hasSale ? (
                            <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography variant="body2" fontWeight={700} color="error.main">{fmt(p.discount_price)}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through', lineHeight: 1.2 }}>{fmt(p.sell_price)}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" fontWeight={600} color="primary.main">{fmt(p.sell_price)}</Typography>
                          )}
                        </TableCell>
                        {/* Margin */}
                        <TableCell align="right">
                          {(() => {
                            const m = parseFloat(margin(p));
                            const color = m >= 30 ? '#15803d' : m >= 15 ? '#0369a1' : '#b45309';
                            return (
                              <Typography variant="body2" fontWeight={600} sx={{ color }}>
                                {margin(p)}%
                              </Typography>
                            );
                          })()}
                        </TableCell>
                        {/* Stock */}
                        <TableCell align="right">
                          <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4 }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={p.stock === 0 ? 'error.main' : p.stock <= 5 ? 'warning.main' : 'text.primary'}
                            >
                              {p.stock}
                            </Typography>
                            {(() => {
                              const st = p.stock === 0 ? null : STOCK_STATUS_OPTIONS.find(o => o.value === p.stock_status);
                              const isClickable = st && (st.value === 'shipped' || st.value === 'pre_order');
                              const chip = (
                                <Box
                                  onClick={isClickable ? async (e) => { e.stopPropagation(); await markProductReceived(p.id); load(); } : undefined}
                                  sx={{
                                    display: 'inline-flex', alignItems: 'center',
                                    px: 0.75, py: 0.2, borderRadius: 1, fontSize: 10, fontWeight: 700,
                                    bgcolor: p.stock === 0 ? '#fef2f2' : (st?.bg ?? '#f0fdf4'),
                                    color:  p.stock === 0 ? '#dc2626'  : (st?.color ?? '#15803d'),
                                    cursor: isClickable ? 'pointer' : 'default',
                                    ...(isClickable && { '&:hover': { opacity: 0.8 } }),
                                  }}
                                >
                                  {p.stock === 0 ? 'Out of Stock' : (st?.label ?? 'In Stock')}
                                </Box>
                              );
                              return isClickable
                                ? <Tooltip title="Click to mark as received" placement="top" arrow>{chip}</Tooltip>
                                : chip;
                            })()}
                          </Box>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.6,
                            px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 600,
                            bgcolor: p.is_active ? '#f0fdf4' : '#fef2f2',
                            color: p.is_active ? '#15803d' : '#dc2626',
                          }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: p.is_active ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{p.creator?.name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.created_at ? dayjs(p.created_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{p.updater?.name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.updated_at ? dayjs(p.updated_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Restock"><IconButton size="small" color="primary" onClick={() => openRestock(p)}><Inventory2 fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" disabled={deleting === p.id} onClick={() => setConfirmTarget(p)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={meta.total}
          page={page}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Card>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField fullWidth label="Product Name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="SKU" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} />
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
                      <MenuItem key={c.id} value={c.name} sx={{ pl: 4, fontSize: 13, color: 'text.secondary' }}>
                        ↳ {c.name}
                      </MenuItem>
                    ) : (
                      <MenuItem key={c.id} value={c.name} sx={{ fontWeight: 700, fontSize: 13 }}>
                        {c.name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={form.brand || ''}
                  label="Brand"
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                >
                  <MenuItem value=""><em>— None —</em></MenuItem>
                  {brandOptions.map((b) => (
                    <MenuItem key={b.id} value={b.name} sx={{ fontSize: 13 }}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <TextField fullWidth label="Stock" type="number" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth
                label="Purchased On"
                type="date"
                value={form.purchased_at || ''}
                onChange={(e) => setForm({ ...form, purchased_at: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Date product was purchased"
              />
            </Grid>

            {/* Pricing — 3 columns */}
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Pricing
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Cost Price (PKR) *" type="number" value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                helperText={editing ? 'Corrections only — use Restock to add stock' : 'What you paid'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Regular Price (PKR) *" type="number" value={form.sell_price}
                onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                helperText="Normal selling price" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Sale Price (PKR)" type="number" value={form.discount_price}
                onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                helperText={
                  form.discount_price && form.sell_price && Number(form.discount_price) > 0
                    ? <span>
                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: 4 }}>{fmt(form.sell_price)}</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>→ {fmt(form.discount_price)}</span>
                      </span>
                    : 'Leave blank if no sale'
                }
              />
            </Grid>

            <Grid size={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
                label="Active"
              />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select value={form.stock_status || 'in_stock'} label="Stock Status"
                  onChange={(e) => setForm({ ...form, stock_status: e.target.value })}>
                  {STOCK_STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: o.color }} />
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Restock Dialog ── */}
      <Dialog open={Boolean(restockTarget)} onClose={() => setRestockTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Restock — {restockTarget?.name}</DialogTitle>
        <DialogContent>
          {restockError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{restockError}</Alert>}

          {/* Current state */}
          <Box sx={{ display: 'flex', gap: 0, mb: 2, mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 2, py: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Current Stock</Typography>
              <Typography variant="h6" fontWeight={700}>{restockTarget?.stock ?? 0}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Avg Cost</Typography>
              <Typography variant="h6" fontWeight={700}>{fmt(restockTarget?.cost_price)}</Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField fullWidth autoFocus label="Quantity to add *" type="number" value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Unit Cost (PKR) *" type="number" value={restockForm.unit_cost}
                onChange={(e) => setRestockForm({ ...restockForm, unit_cost: e.target.value })}
                helperText="What you paid per unit this time" />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Purchase Date" type="date" value={restockForm.purchased_at}
                onChange={(e) => setRestockForm({ ...restockForm, purchased_at: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select value={restockForm.stock_status || 'in_stock'} label="Stock Status"
                  onChange={(e) => setRestockForm({ ...restockForm, stock_status: e.target.value })}>
                  {STOCK_STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: o.color }} />
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Paid by</InputLabel>
                <Select value={restockForm.paid_by_partner_id || ''} label="Paid by"
                  onChange={(e) => setRestockForm({ ...restockForm, paid_by_partner_id: e.target.value })}>
                  <MenuItem value="">Business (revenue)</MenuItem>
                  {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <Button component="label" variant="outlined" fullWidth sx={{ height: '100%', textTransform: 'none' }}>
                {restockForm.proofFile ? restockForm.proofFile.name : 'Attach proof (optional)'}
                <input hidden type="file" accept="image/*,application/pdf"
                  onChange={(e) => setRestockForm({ ...restockForm, proofFile: e.target.files?.[0] || null })} />
              </Button>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Notes" value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })} />
            </Grid>
          </Grid>

          {/* Live preview */}
          {restockPreview && Number(restockForm.quantity) > 0 && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">After restock:</Typography>
              <Typography variant="body2" fontWeight={700}>Stock {restockPreview.newStock}</Typography>
              <Typography variant="body2" color="text.disabled">•</Typography>
              <Typography variant="body2" fontWeight={700}>New avg cost {fmt(restockPreview.newCost)}</Typography>
            </Box>
          )}

          {/* Purchase history */}
          {purchases.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Purchase History
              </Typography>
              <TableContainer sx={{ mt: 0.5, maxHeight: 220 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Cost</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((pu) => (
                      <TableRow key={pu.id}>
                        <TableCell><Typography variant="caption">{dayjs(pu.purchased_at).format('DD MMM YY')}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption">{pu.quantity}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption">{fmt(pu.unit_cost)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={600}>{fmt(pu.total_cost)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestockTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRestock} disabled={restockSaving}>{restockSaving ? 'Saving...' : 'Add Stock'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>Delete product <strong>{confirmTarget?.name}</strong>? This can be undone.</Typography>
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
        action={
          <Button color="warning" size="small" onClick={handleUndo}>UNDO</Button>
        }
      />
    </Box>
  );
}
