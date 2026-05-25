import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardHeader,
  Grid, Table, TableBody, TableCell, TableHead, TableRow,
  Divider, Skeleton, Select, MenuItem, FormControl, Alert,
  IconButton, Tooltip, Snackbar, Avatar, Chip,
  ToggleButton, ToggleButtonGroup, TextField, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack, Delete, FileDownload,
  Phone, LocationOn, CalendarToday, Payment, LocalShipping,
  LocalOffer, Inventory, ReceiptLong, PersonOutlined, StickyNote2,
  HourglassEmpty, CheckCircleOutlined, LocalShippingOutlined, DoneAll,
  Cancel, AssignmentReturn, AddCircleOutlined, EditOutlined,
  DeleteOutlined, RestoreFromTrash, Timeline as TimelineIcon, Person, AddLink,
} from '@mui/icons-material';
import { getInvoice, updateInvoice, deleteInvoice, getOrderTimeline, mapOrderItem } from '../api/orders';
import { getProducts } from '../api/products';
import { getVendorProducts } from '../api/vendors';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const DELIVERY_OPTIONS = ['TCS', 'Leopard', 'Bykea', 'Pickup Order', 'Self'];

// ── Timeline config ────────────────────────────────────────────
const TIMELINE_CONFIG = {
  created:      { icon: AddCircleOutlined,      color: '#6366f1', bg: '#eef2ff', label: 'Created'   },
  pending:      { icon: HourglassEmpty,          color: '#d97706', bg: '#fffbeb', label: 'Pending'   },
  confirmed:    { icon: CheckCircleOutlined,     color: '#0ea5e9', bg: '#f0f9ff', label: 'Confirmed' },
  shipped:      { icon: LocalShippingOutlined,   color: '#8b5cf6', bg: '#f5f3ff', label: 'Shipped'   },
  delivered:    { icon: DoneAll,                 color: '#16a34a', bg: '#f0fdf4', label: 'Delivered' },
  cancelled:    { icon: Cancel,                  color: '#dc2626', bg: '#fef2f2', label: 'Cancelled' },
  returned:     { icon: AssignmentReturn,         color: '#6b7280', bg: '#f9fafb', label: 'Returned'  },
  updated:      { icon: EditOutlined,             color: '#0891b2', bg: '#ecfeff', label: 'Updated'   },
  deleted:      { icon: DeleteOutlined,           color: '#ef4444', bg: '#fef2f2', label: 'Deleted'   },
  restored:     { icon: RestoreFromTrash,         color: '#10b981', bg: '#ecfdf5', label: 'Restored'  },
  status_change:{ icon: EditOutlined,             color: '#0891b2', bg: '#ecfeff', label: 'Updated'   },
};

function getTimelineCfg(entry) {
  if (entry.event === 'created') return TIMELINE_CONFIG.created;
  if (entry.event === 'deleted')  return TIMELINE_CONFIG.deleted;
  if (entry.event === 'restored') return TIMELINE_CONFIG.restored;
  if (entry.event === 'updated' && !entry.status) return TIMELINE_CONFIG.updated;
  return TIMELINE_CONFIG[entry.status] || TIMELINE_CONFIG.updated;
}

function TimelineCard({ invoiceId }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    getOrderTimeline(invoiceId)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        avatar={<TimelineIcon sx={{ color: 'text.secondary' }} />}
        title={<Typography variant="h6" fontWeight={600}>Order Timeline</Typography>}
      />
      <CardContent sx={{ pt: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No timeline events recorded yet.
          </Typography>
        ) : (
          <Box sx={{ position: 'relative', pl: 0 }}>
            {entries.map((entry, idx) => {
              const cfg  = getTimelineCfg(entry);
              const Icon = cfg.icon;
              const isLast = idx === entries.length - 1;
              return (
                <Box key={idx} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                  {/* vertical connector line */}
                  {!isLast && (
                    <Box sx={{
                      position: 'absolute',
                      left: 19, top: 40, bottom: 0,
                      width: 2,
                      bgcolor: 'divider',
                      zIndex: 0,
                    }} />
                  )}
                  {/* icon bubble */}
                  <Box sx={{
                    width: 40, height: 40,
                    borderRadius: '50%',
                    bgcolor: cfg.bg,
                    border: `2px solid ${cfg.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, zIndex: 1,
                    mt: 0.5,
                  }}>
                    <Icon sx={{ fontSize: 18, color: cfg.color }} />
                  </Box>

                  {/* content */}
                  <Box sx={{
                    flex: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    px: 2, py: 1.25,
                    mb: isLast ? 0 : 1.5,
                    borderLeft: `3px solid ${cfg.color}`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: cfg.color }}>
                        {entry.label}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                        {dayjs(entry.created_at).format('DD MMM YYYY, h:mm A')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <Person sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {entry.user || 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ mx: 0.5 }}>·</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {dayjs(entry.created_at).fromNow()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

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

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.returned;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6,
      px: 1.25, py: 0.4, borderRadius: 1,
      bgcolor: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status] ?? status}
    </Box>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setNotFound(false);
    getInvoice(id)
      .then((r) => setInvoice(r.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    setStatusSaving(true);
    try {
      const res = await updateInvoice(id, { status });
      setInvoice(res.data);
    } catch { setError('Failed to update status'); }
    finally { setStatusSaving(false); }
  };

  const handlePaymentChange = async (method) => {
    if (!method || method === invoice.payment_method) return;
    try {
      const res = await updateInvoice(id, { payment_method: method });
      setInvoice(res.data);
    } catch { setError('Failed to update payment method'); }
  };

  const [editingDate, setEditingDate] = useState(false);
  const handleDateChange = async (value) => {
    setEditingDate(false);
    if (!value || value === dayjs(invoice.invoice_date).format('YYYY-MM-DD')) return;
    try {
      const res = await updateInvoice(id, { invoice_date: value });
      setInvoice(res.data);
    } catch { setError('Failed to update order date'); }
  };

  const handleDeliveryChange = async (value) => {
    if (value === (invoice.delivery_option || '')) return;
    try {
      const res = await updateInvoice(id, { delivery_option: value || null });
      setInvoice(res.data);
    } catch { setError('Failed to update delivery option'); }
  };

  // Link an unmapped order item to a catalog/vendor product
  const [linkItem, setLinkItem] = useState(null);     // the item being linked
  const [linkOptions, setLinkOptions] = useState([]);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  useEffect(() => {
    if (!linkItem) return;
    const t = setTimeout(() => {
      setLinkLoading(true);
      Promise.all([getProducts({ search: linkSearch }), getVendorProducts({ search: linkSearch })])
        .then(([cat, ven]) => {
          const c = (cat.data.data || []).map((p) => ({ ...p, _kind: 'catalog', _key: `c${p.id}` }));
          const v = (ven.data.data || []).map((p) => ({ ...p, _kind: 'vendor', _key: `v${p.id}`, _vendorName: p.vendor?.name }));
          setLinkOptions([...c, ...v]);
        })
        .finally(() => setLinkLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [linkItem, linkSearch]);

  const handleMapItem = async (opt) => {
    if (!opt) return;
    try {
      const body = opt._kind === 'vendor' ? { vendor_product_id: opt.id } : { product_id: opt.id };
      const res = await mapOrderItem(id, linkItem.id, body);
      setInvoice(res.data);
      setLinkItem(null); setLinkSearch(''); setLinkOptions([]);
    } catch { setError('Failed to link product'); }
  };

  const handleDelete = async () => {
    await deleteInvoice(id);
    navigate('/orders');
  };

  const [copied, setCopied] = useState(false);
  const shareOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  const shareUrl = invoice?.share_token ? `${shareOrigin}/invoice/${invoice.share_token}` : null;

  const handleView = async () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank', 'noopener');
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); } catch { /* clipboard may be blocked */ }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={400} /></Box>;
  }

  if (notFound || !invoice) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 2 }}>
        <Typography variant="h6" color="text.secondary">Order not found</Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/orders')}>Back to Orders</Button>
      </Box>
    );
  }

  const isCod = invoice.payment_method?.toUpperCase() === 'COD';



  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} variant="outlined" size="small">
            Back
          </Button>
          <Typography variant="h5" fontWeight={700}>{invoice.invoice_number}</Typography>
          <StatusBadge status={invoice.status} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="View & download invoice">
            <span>
              <IconButton color="primary" onClick={handleView} disabled={!shareUrl}
                sx={{ border: '1px solid', borderColor: 'divider' }}>
                <FileDownload />
              </IconButton>
            </span>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 130 }} disabled={statusSaving}>
            <Select value={invoice.status} onChange={(e) => handleStatusChange(e.target.value)}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>
            Delete
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<PersonOutlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Customer</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography
                variant="h6" fontWeight={700} sx={{ mb: 1.5, cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                onClick={() => invoice.customer_id && navigate(`/customers/${invoice.customer_id}`)}
              >
                {invoice.customer?.name ?? '—'}
              </Typography>
              {invoice.customer?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main', flexShrink: 0 }}><Phone sx={{ fontSize: 13 }} /></Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.2 }}>Phone</Typography>
                    <Typography variant="body2" fontWeight={500}>{invoice.customer.phone}</Typography>
                  </Box>
                </Box>
              )}
              {(invoice.customer?.address || invoice.customer?.city) && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main', mt: 0.2 }}><LocationOn sx={{ fontSize: 13 }} /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.2 }}>Customer Billing Address</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {[invoice.customer.address, invoice.customer.city].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              avatar={<Inventory sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Items</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Serial No.</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, i) => (
                    <TableRow key={item.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        {item.product ? (
                          <Typography variant="body2" fontWeight={600}
                            component={RouterLink} to={`/products/${item.product.id}`}
                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            {item.product_name}
                          </Typography>
                        ) : item.vendor_product ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600}
                              component={RouterLink} to="/partner-products"
                              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                              {item.product_name}
                            </Typography>
                            <Chip size="small" label={item.vendor_product.vendor?.name ? `Vendor: ${item.vendor_product.vendor.name}` : 'Vendor'}
                              sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: '#fff7ed', color: '#c2410c' }} />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{item.product_name}</Typography>
                            <Tooltip title="Link to a catalog / vendor product">
                              <IconButton size="small" onClick={() => { setLinkItem(item); setLinkSearch(''); }}>
                                <AddLink sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{item.serial_number || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{item.category || '—'}</Typography></TableCell>
                      <TableCell align="right">{fmt(item.unit_price)}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmt(item.total)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {invoice.notes && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', gap: 1 }}>
                  <StickyNote2 sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Notes</Typography>
                    <Typography variant="body2">{invoice.notes}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<CalendarToday sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Order Info</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.secondary">Order Date</Typography>
                </Box>
                {editingDate ? (
                  <TextField
                    type="date"
                    size="small"
                    autoFocus
                    defaultValue={dayjs(invoice.invoice_date).format('YYYY-MM-DD')}
                    onChange={(e) => handleDateChange(e.target.value)}
                    onBlur={() => setEditingDate(false)}
                    sx={{ width: 160 }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>{dayjs(invoice.invoice_date).format('DD MMM YYYY')}</Typography>
                    <Tooltip title="Edit order date">
                      <IconButton size="small" onClick={() => setEditingDate(true)}>
                        <EditOutlined sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {isCod
                    ? <LocalShipping sx={{ fontSize: 14, color: 'text.disabled' }} />
                    : <Payment sx={{ fontSize: 14, color: 'text.disabled' }} />}
                  <Typography variant="body2" color="text.secondary">Payment</Typography>
                </Box>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={isCod ? 'COD' : 'Online'}
                  onChange={(_, v) => handlePaymentChange(v)}
                  sx={{ '& .MuiToggleButton-root': { px: 1.25, py: 0.25, fontSize: 12, fontWeight: 600, textTransform: 'none' } }}
                >
                  <ToggleButton value="COD">COD</ToggleButton>
                  <ToggleButton value="Online">Online</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LocalShippingOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.secondary">Delivery</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    displayEmpty
                    value={invoice.delivery_option || ''}
                    onChange={(e) => handleDeliveryChange(e.target.value)}
                    sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.5 } }}
                  >
                    <MenuItem value=""><em>Not set</em></MenuItem>
                    {DELIVERY_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              avatar={<ReceiptLong sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Totals</Typography>}
            />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">{fmt(invoice.subtotal)}</Typography>
              </Box>
              {parseFloat(invoice.discount) > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <LocalOffer sx={{ fontSize: 14, color: 'error.main' }} />
                    <Typography variant="body2" color="error.main">Discount</Typography>
                  </Box>
                  <Typography variant="body2" color="error.main">- {fmt(invoice.discount)}</Typography>
                </Box>
              )}
              {parseFloat(invoice.tax) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Tax</Typography>
                  <Typography variant="body2">{fmt(invoice.tax)}</Typography>
                </Box>
              )}
              {parseFloat(invoice.delivery_fee) > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <LocalShipping sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                  </Box>
                  <Typography variant="body2">{fmt(invoice.delivery_fee)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={700} fontSize={16}>Total</Typography>
                <Typography fontWeight={700} fontSize={16} color="primary.main">{fmt(invoice.total)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TimelineCard invoiceId={id} />

      {/* Link an unmapped item to a catalog / vendor product */}
      <Dialog open={!!linkItem} onClose={() => setLinkItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>Link "{linkItem?.product_name}" to a product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search your catalog or vendor inventory and select the matching product to make this item trackable.
          </Typography>
          <Autocomplete
            options={linkOptions}
            loading={linkLoading}
            getOptionLabel={(o) => o._kind === 'vendor' ? `${o.name} — ${o._vendorName || 'Vendor'} (vendor)` : o.name}
            isOptionEqualToValue={(o, v) => o._key === v._key}
            onChange={(_, v) => handleMapItem(v)}
            onInputChange={(_, v) => setLinkSearch(v)}
            renderInput={(params) => <TextField {...params} autoFocus size="small" placeholder="Search catalog or vendor product..." />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkItem(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Shareable link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
