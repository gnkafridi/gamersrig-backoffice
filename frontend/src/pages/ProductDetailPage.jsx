import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardHeader,
  Grid, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Divider, Skeleton, Alert, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, Inventory2,
  CalendarToday, PersonOutlined, AttachMoneyOutlined,
} from '@mui/icons-material';
import {
  getProduct, updateProduct, deleteProduct,
  getProductPurchases, markProductReceived,
} from '../api/products';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock',  label: 'In Stock',        bg: '#f0fdf4', color: '#15803d' },
  { value: 'shipped',   label: 'Shipped / Onway', bg: '#eff6ff', color: '#2563eb' },
  { value: 'pre_order', label: 'Pre Order',       bg: '#fff7ed', color: '#c2410c' },
];

function InfoRow({ label, value, valueColor }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500} color={valueColor || 'text.primary'}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct]               = useState(null);
  const [purchases, setPurchases]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [notFound, setNotFound]             = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen]     = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '' });
  const showSnack = (msg) => setSnack({ open: true, msg });

  const load = () => {
    setLoading(true);
    getProduct(id)
      .then(r => setProduct(r.data))
      .catch(e => { if (e?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));

    setPurchasesLoading(true);
    getProductPurchases(id)
      .then(r => setPurchases(r.data))
      .catch(() => {})
      .finally(() => setPurchasesLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const openEdit = () => {
    setEditForm({
      name:           product.name           || '',
      sku:            product.sku            || '',
      category:       product.category       || '',
      brand:          product.brand          || '',
      description:    product.description    || '',
      cost_price:     product.cost_price     || '',
      sell_price:     product.sell_price     || '',
      discount_price: product.discount_price || '',
      stock:          product.stock          ?? 0,
      purchased_at:   product.purchased_at   || '',
      is_active:      product.is_active      ?? true,
      stock_status:   product.stock_status   || 'in_stock',
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    setEditSaving(true);
    updateProduct(id, editForm)
      .then(r => { setProduct(r.data); setEditOpen(false); showSnack('Product updated'); })
      .catch(() => showSnack('Failed to update product'))
      .finally(() => setEditSaving(false));
  };

  const handleDelete = () => {
    setDeleting(true);
    deleteProduct(id)
      .then(() => navigate('/products'))
      .catch(() => { showSnack('Failed to delete product'); setDeleting(false); });
  };

  const handleMarkReceived = () => {
    markProductReceived(id)
      .then(() => { showSnack('Marked as received'); load(); })
      .catch(() => showSnack('Failed to update status'));
  };

  // ── Loading ──
  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rectangular" height={180} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rectangular" height={160} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 1 }} />
        </Grid>
      </Grid>
    </Box>
  );

  // ── Not found ──
  if (notFound || !product) return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/products')} sx={{ mb: 2 }}>
        Back to Products
      </Button>
      <Alert severity="error">Product not found.</Alert>
    </Box>
  );

  const statusOpt = STOCK_STATUS_OPTIONS.find(o => o.value === product.stock_status)
    || STOCK_STATUS_OPTIONS[0];

  const margin = product.sell_price > 0
    ? ((product.sell_price - product.cost_price) / product.sell_price * 100).toFixed(1)
    : null;

  return (
    <Box sx={{ p: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <IconButton
          onClick={() => navigate('/products')}
          size="small"
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>

        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          {product.name}
        </Typography>

        {product.sku && (
          <Chip
            label={product.sku}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        )}

        {/* Stock status badge */}
        {product.stock === 0 ? (
          <Chip
            label="Out of Stock"
            size="small"
            sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 600 }}
          />
        ) : product.stock_status === 'shipped' || product.stock_status === 'pre_order' ? (
          <Tooltip title="Click to mark as received">
            <Chip
              label={statusOpt.label}
              size="small"
              onClick={handleMarkReceived}
              sx={{ bgcolor: statusOpt.bg, color: statusOpt.color, fontWeight: 600, cursor: 'pointer' }}
            />
          </Tooltip>
        ) : (
          <Chip
            label="In Stock"
            size="small"
            sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600 }}
          />
        )}

        <Button variant="outlined" size="small" startIcon={<Edit />} onClick={openEdit}>
          Edit
        </Button>

        <Tooltip title="Delete product">
          <IconButton size="small" color="error" onClick={() => setDeleteOpen(true)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Body ── */}
      <Grid container spacing={2}>

        {/* ── Left column ── */}
        <Grid size={{ xs: 12, md: 8 }}>

          {/* Product Info card */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Inventory2 sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Product Info</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={0}>
                <Grid size={6}>
                  <InfoRow label="Category"   value={product.category} />
                  <InfoRow label="Brand"      value={product.brand}    />
                  <InfoRow
                    label="Active"
                    value={product.is_active ? 'Yes' : 'No'}
                    valueColor={product.is_active ? '#15803d' : '#dc2626'}
                  />
                </Grid>
                <Grid size={6}>
                  <InfoRow
                    label="Last Purchased"
                    value={product.purchased_at
                      ? dayjs(product.purchased_at).format('MMM D, YYYY') : null}
                  />
                  <InfoRow
                    label="Created"
                    value={product.created_at
                      ? dayjs(product.created_at).format('MMM D, YYYY') : null}
                  />
                  <InfoRow
                    label="Updated"
                    value={product.updated_at
                      ? dayjs(product.updated_at).format('MMM D, YYYY') : null}
                  />
                </Grid>
              </Grid>

              {product.description && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Description
                  </Typography>
                  <Typography variant="body2">{product.description}</Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Purchase History card */}
          <Card>
            <CardHeader
              avatar={<CalendarToday sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Purchase History</Typography>}
            />
            <CardContent sx={{ pt: 0, px: 0 }}>
              {purchasesLoading ? (
                <Box sx={{ px: 2 }}>
                  {[1,2,3].map(i => <Skeleton key={i} height={44} />)}
                </Box>
              ) : purchases.length === 0 ? (
                <Typography
                  variant="body2" color="text.secondary"
                  sx={{ textAlign: 'center', py: 3 }}
                >
                  No purchase history recorded.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Cost</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Who Paid</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchases.map(p => (
                        <TableRow key={p.id} hover>
                          <TableCell>
                            {p.purchased_at ? dayjs(p.purchased_at).format('MMM D, YYYY') : '—'}
                          </TableCell>
                          <TableCell align="right">{p.quantity}</TableCell>
                          <TableCell align="right">{fmt(p.unit_cost)}</TableCell>
                          <TableCell align="right">{fmt(p.total_cost)}</TableCell>
                          <TableCell>{p.payer?.name || 'Business'}</TableCell>
                          <TableCell>
                            {p.notes ? (
                              <Chip
                                label={p.notes}
                                size="small"
                                sx={{ fontSize: 11, bgcolor: '#eff6ff', color: '#2563eb' }}
                              />
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Sidebar ── */}
        <Grid size={{ xs: 12, md: 4 }}>

          {/* Pricing */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<AttachMoneyOutlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Pricing</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <InfoRow label="Cost Price"  value={fmt(product.cost_price)}  />
              <InfoRow label="Sell Price"  value={fmt(product.sell_price)}  />
              <InfoRow
                label="Discount Price"
                value={product.discount_price > 0 ? fmt(product.discount_price) : '—'}
              />
              {margin !== null && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <InfoRow
                    label="Margin"
                    value={`${margin}%`}
                    valueColor={
                      parseFloat(margin) > 20 ? '#15803d' :
                      parseFloat(margin) > 10 ? '#d97706' : '#dc2626'
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Inventory2 sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Stock</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography
                  variant="h2" fontWeight={700}
                  color={product.stock === 0 ? 'error.main' : 'success.main'}
                >
                  {product.stock}
                </Typography>
                <Typography variant="caption" color="text.secondary">units on hand</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <InfoRow
                label="Inventory Value"
                value={fmt(product.stock * (product.discount_price > 0
                  ? product.discount_price : product.sell_price))}
              />
              <InfoRow label="Cost Value" value={fmt(product.stock * product.cost_price)} />
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader
              avatar={<PersonOutlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Created By</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <InfoRow label="Created By"     value={product.creator?.name} />
              <InfoRow label="Last Edited By" value={product.updater?.name} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={8}>
              <TextField
                fullWidth label="Name" size="small"
                value={editForm.name || ''}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="SKU" size="small"
                value={editForm.sku || ''}
                onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth label="Category" size="small"
                value={editForm.category || ''}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth label="Brand" size="small"
                value={editForm.brand || ''}
                onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Cost Price" size="small" type="number"
                value={editForm.cost_price || ''}
                onChange={e => setEditForm(f => ({ ...f, cost_price: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Sell Price" size="small" type="number"
                value={editForm.sell_price || ''}
                onChange={e => setEditForm(f => ({ ...f, sell_price: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Discount Price" size="small" type="number"
                value={editForm.discount_price || ''}
                onChange={e => setEditForm(f => ({ ...f, discount_price: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Stock" size="small" type="number"
                value={editForm.stock ?? ''}
                onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Purchased At" size="small" type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={editForm.purchased_at || ''}
                onChange={e => setEditForm(f => ({ ...f, purchased_at: e.target.value }))}
              />
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  label="Stock Status"
                  value={editForm.stock_status || 'in_stock'}
                  onChange={e => setEditForm(f => ({ ...f, stock_status: e.target.value }))}
                >
                  {STOCK_STATUS_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth label="Description" size="small" multiline rows={3}
                value={editForm.description || ''}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!editForm.is_active}
                    onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={editSaving}>
            {editSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{product.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
