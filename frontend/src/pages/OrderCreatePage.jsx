import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Stack,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Divider, Alert, Autocomplete, ToggleButton, ToggleButtonGroup,
  InputAdornment, Chip, Tooltip,
} from '@mui/material';
import {
  Add, Delete, ArrowBack, Save, PersonSearch, PersonAdd,
  PersonOutlined, ReceiptLong, Inventory, Calculate,
  EmailOutlined, HomeOutlined,
} from '@mui/icons-material';
import { createOrder } from '../api/orders';
import { getCustomers, createCustomer } from '../api/customers';
import { getProducts } from '../api/products';
import { getVendorProducts } from '../api/vendors';
import pakistanCities from '../data/pakistanCities';
import PhoneField from '../components/PhoneField';
import dayjs from 'dayjs';

const GREEN = '#27B81D';
const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
const EMPTY_ITEM = { product_id: null, vendor_product_id: null, product_name: '', serial_number: '', category: '', sell_price: '', discount_price: '', cost_price: '', quantity: 1, discount: 0, discount_type: 'flat' };
const EMPTY_CUSTOMER = { name: '', phone: '', email: '', address: '', city: '' };
const effectivePrice = (it) => {
  const disc = parseFloat(it.discount_price);
  return disc > 0 ? disc : (parseFloat(it.sell_price) || 0);
};
const itemTotal = (it) => {
  const base = effectivePrice(it) * (parseInt(it.quantity) || 0);
  const disc = it.discount_type === 'pct'
    ? base * (parseFloat(it.discount) || 0) / 100
    : parseFloat(it.discount) || 0;
  return Math.max(0, base - disc);
};

function SectionHeader({ icon, title, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 2, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(39,184,29,0.12)', color: GREEN,
      }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>{title}</Typography>
      {action}
    </Box>
  );
}

const cardSx = { borderRadius: 3, mb: 2.5 };

export default function OrderCreatePage() {
  const navigate = useNavigate();
  const [productOptions, setProductOptions] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [customerMode, setCustomerMode] = useState('new'); // 'existing' | 'new'
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ ...EMPTY_CUSTOMER });
  const [form, setForm] = useState({
    order_date: dayjs().format('YYYY-MM-DD'),
    status: 'pending',
    payment_method: '',
    delivery_option: '',
    notes: '',
    discount: 0,
    tax: 0,
    delivery_fee: 0,
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setProductLoading(true);
      Promise.all([
        getProducts({ search: productSearch, page: 1 }),
        getVendorProducts({ search: productSearch, page: 1 }),
      ])
        .then(([cat, ven]) => {
          const catalog = (cat.data.data || []).map((p) => ({ ...p, _kind: 'catalog', _key: `c${p.id}` }));
          const vendors = (ven.data.data || []).map((p) => ({ ...p, _kind: 'vendor', _key: `v${p.id}`, _vendorName: p.vendor?.name }));
          setProductOptions([...catalog, ...vendors]);
        })
        .finally(() => setProductLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Debounced customer search
  useEffect(() => {
    const t = setTimeout(() => {
      if (customerMode !== 'existing') return;
      setCustomerLoading(true);
      getCustomers({ search: customerSearch, page: 1 })
        .then((r) => setCustomerOptions(r.data.data))
        .finally(() => setCustomerLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch, customerMode]);

  // Auto-populate delivery fee from customer city (Karachi: 500, elsewhere: 700) — still editable
  const customerCity = customerMode === 'existing' ? (selectedCustomer?.city || '') : newCustomer.city;
  useEffect(() => {
    if (!customerCity) return;
    const fee = customerCity.trim().toLowerCase() === 'karachi' ? 500 : 700;
    setForm((f) => ({ ...f, delivery_fee: fee }));
  }, [customerCity]);

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };
  const selectProduct = (i, product) => {
    const updated = [...items];
    if (!product) {
      updated[i] = { ...updated[i], product_id: null, vendor_product_id: null, product_name: '', sell_price: '', discount_price: '', cost_price: '', category: '' };
    } else if (product._kind === 'vendor') {
      // Third-party vendor product: sell at sell_price, cost = resell_price (what we pay the vendor)
      updated[i] = {
        ...updated[i],
        product_id: null, vendor_product_id: product.id,
        product_name: product.name,
        sell_price: product.sell_price, discount_price: '',
        cost_price: product.resell_price ?? 0,
        category: product.category || '',
      };
    } else {
      const disc = parseFloat(product.discount_price) > 0 ? product.discount_price : '';
      updated[i] = { ...updated[i], product_id: product.id, vendor_product_id: null, product_name: product.name, sell_price: product.sell_price, discount_price: disc, cost_price: product.cost_price, category: product.category || '' };
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, it) => s + itemTotal(it), 0);
  const total = subtotal - parseFloat(form.discount || 0) + parseFloat(form.tax || 0) + parseFloat(form.delivery_fee || 0);
  const costTotal = items.reduce((s, it) => s + (parseFloat(it.cost_price) || 0) * (parseInt(it.quantity) || 0), 0);
  const netRevenue = subtotal - parseFloat(form.discount || 0);
  const profit = netRevenue - costTotal;
  const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      let customerId;

      if (customerMode === 'existing') {
        if (!selectedCustomer) { setError('Please select a customer.'); setSaving(false); return; }
        customerId = selectedCustomer.id;
      } else {
        if (!newCustomer.name.trim()) { setError('Customer name is required.'); setSaving(false); return; }
        if (!newCustomer.phone || newCustomer.phone.length < 6) { setError('Customer phone number is required.'); setSaving(false); return; }
        if (!newCustomer.city.trim()) { setError('Customer city is required.'); setSaving(false); return; }
        if (!newCustomer.address.trim()) { setError('Customer address is required.'); setSaving(false); return; }
        const res = await createCustomer(newCustomer);
        customerId = res.data.id;
      }

      const payload = {
        customer_id: customerId,
        ...form,
        items: items.map((it) => ({
          product_id: it.product_id || null,
          vendor_product_id: it.vendor_product_id || null,
          product_name: it.product_name,
          serial_number: it.serial_number || null,
          category: it.category || null,
          unit_price: effectivePrice(it),
          cost_price: parseFloat(it.cost_price) || 0,
          quantity: parseInt(it.quantity) || 1,
          discount: parseFloat(it.discount) || 0,
          discount_type: it.discount_type,
        })),
      };
      const res = await createOrder(payload);
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs)[0][0] : err.response?.data?.message || 'Failed to create order');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2.5, borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(39,184,29,0.14) 0%, rgba(39,184,29,0) 60%)',
        border: '1px solid', borderColor: 'divider',
      }}>
        <IconButton onClick={() => navigate('/orders')} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>Create Order</Typography>
          <Typography variant="body2" color="text.secondary">Build a new order for your customer</Typography>
        </Box>
        <Chip
          icon={<Calculate sx={{ fontSize: 18 }} />}
          label={fmt(total)}
          sx={{ height: 40, px: 1, fontSize: 16, fontWeight: 800, bgcolor: GREEN, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>

          {/* Customer */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<PersonOutlined />}
                title="Customer"
                action={
                  <ToggleButtonGroup
                    value={customerMode} exclusive
                    onChange={(_, v) => v && setCustomerMode(v)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': { px: 1.5, py: 0.6, border: '1px solid', borderColor: 'divider' },
                      '& .Mui-selected': { bgcolor: 'rgba(39,184,29,0.15) !important', color: `${GREEN} !important` },
                    }}
                  >
                    <ToggleButton value="existing"><PersonSearch sx={{ mr: 0.5, fontSize: 16 }} />Existing</ToggleButton>
                    <ToggleButton value="new"><PersonAdd sx={{ mr: 0.5, fontSize: 16 }} />New</ToggleButton>
                  </ToggleButtonGroup>
                }
              />

              {customerMode === 'existing' ? (
                <Autocomplete
                  options={customerOptions}
                  getOptionLabel={(o) => o.name}
                  loading={customerLoading}
                  value={selectedCustomer}
                  onChange={(_, v) => setSelectedCustomer(v)}
                  onInputChange={(_, v) => setCustomerSearch(v)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderOption={(props, o) => (
                    <li {...props} key={o.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{o.name}</Typography>
                        {o.phone && <Typography variant="caption" color="text.secondary">{o.phone}</Typography>}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Search customer by name" />
                  )}
                />
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Full Name" value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      autoComplete="new-password"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <PhoneField
                      value={newCustomer.phone}
                      onChange={(val) => setNewCustomer({ ...newCustomer, phone: val })}
                      label="Phone" required
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth label="Email" type="email" value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      autoComplete="new-password"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={pakistanCities}
                      groupBy={(o) => o.province}
                      getOptionLabel={(o) => typeof o === 'string' ? o : o.city}
                      value={pakistanCities.find(c => c.city === newCustomer.city) || null}
                      onChange={(_, v) => setNewCustomer({ ...newCustomer, city: v ? v.city : '' })}
                      renderInput={(params) => (
                        <TextField {...params} label="City" required />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Address" value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      autoComplete="new-password"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><HomeOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<ReceiptLong />} title="Order Details" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Order Date" type="date" value={form.order_date}
                    onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select value={form.payment_method} label="Payment Method" onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                      <MenuItem value="">— None —</MenuItem>
                      <MenuItem value="COD">COD (Cash on Delivery)</MenuItem>
                      <MenuItem value="Online">Online</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Delivery Option</InputLabel>
                    <Select value={form.delivery_option} label="Delivery Option" onChange={(e) => setForm({ ...form, delivery_option: e.target.value })}>
                      <MenuItem value="">— None —</MenuItem>
                      <MenuItem value="TCS">TCS</MenuItem>
                      <MenuItem value="Leopard">Leopard</MenuItem>
                      <MenuItem value="Bykea">Bykea</MenuItem>
                      <MenuItem value="Pickup Order">Pickup Order</MenuItem>
                      <MenuItem value="Self">Self</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="shipped">Shipped</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="Delivery Fee" type="number" value={form.delivery_fee}
                    onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                    helperText="Auto from city — editable"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="Notes" multiline rows={2} value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<Inventory />}
                title="Line Items"
                action={
                  <Button variant="contained" startIcon={<Add />} size="small" onClick={addItem} disableElevation>
                    Add Item
                  </Button>
                }
              />

              <Stack spacing={2}>
                {items.map((item, i) => (
                  <Box key={i} sx={{
                    position: 'relative', p: 2, pt: 2.5, borderRadius: 2.5,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    transition: 'border-color .2s',
                    '&:hover': { borderColor: 'rgba(39,184,29,0.5)' },
                  }}>
                    {/* Row 1: index + product + delete */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box sx={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(39,184,29,0.15)', color: GREEN, fontSize: 13, fontWeight: 700,
                      }}>{i + 1}</Box>
                      <Autocomplete
                        sx={{ flexGrow: 1 }}
                        options={productOptions}
                        getOptionLabel={(o) => o._kind === 'vendor' ? `${o.name} — ${o._vendorName || 'Vendor'} (vendor)` : o.name}
                        loading={productLoading}
                        value={productOptions.find(p => (item.vendor_product_id ? (p._kind === 'vendor' && p.id === item.vendor_product_id) : (p._kind === 'catalog' && p.id === item.product_id))) || null}
                        onChange={(_, v) => selectProduct(i, v)}
                        onInputChange={(_, v) => setProductSearch(v)}
                        isOptionEqualToValue={(o, v) => o._key === v._key}
                        renderInput={(params) => (
                          <TextField {...params} size="small" placeholder="Search catalog or vendor product..." />
                        )}
                      />
                      <Tooltip title="Remove item">
                        <span>
                          <IconButton size="small" color="error" onClick={() => removeItem(i)} disabled={items.length === 1}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>

                    {/* Row 2: details */}
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                        <TextField size="small" fullWidth label="Serial No." value={item.serial_number}
                          onChange={(e) => updateItem(i, 'serial_number', e.target.value)} placeholder="SN / IMEI" />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                        <TextField size="small" fullWidth label="Category" value={item.category}
                          disabled placeholder="Auto" slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 2 }}>
                        <TextField size="small" fullWidth label="Sale Price" type="number" value={item.sell_price}
                          disabled
                          slotProps={{ htmlInput: { style: { textAlign: 'right' } }, inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 2 }}>
                        <TextField size="small" fullWidth label="Discount Price" type="number" value={item.discount_price}
                          disabled placeholder="—"
                          slotProps={{ htmlInput: { style: { textAlign: 'right' } }, inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 4, md: 2 }}>
                        <TextField size="small" fullWidth label="Qty" type="number" value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 1 } }} />
                      </Grid>
                    </Grid>

                    {/* Row 3: discount + line total */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Discount</Typography>
                      <TextField
                        size="small" type="number" value={item.discount}
                        onChange={(e) => updateItem(i, 'discount', e.target.value)}
                        sx={{ width: 90 }}
                        slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0 } }}
                      />
                      <ToggleButtonGroup
                        value={item.discount_type} exclusive size="small"
                        onChange={(_, v) => v && updateItem(i, 'discount_type', v)}
                        sx={{ '& .Mui-selected': { bgcolor: 'rgba(39,184,29,0.15) !important', color: `${GREEN} !important` } }}
                      >
                        <ToggleButton value="flat" sx={{ px: 1.2, py: 0.4, fontSize: 11 }}>PKR</ToggleButton>
                        <ToggleButton value="pct" sx={{ px: 1.2, py: 0.4, fontSize: 11 }}>%</ToggleButton>
                      </ToggleButtonGroup>

                      <Box sx={{ flexGrow: 1 }} />

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Line Total</Typography>
                        <Typography variant="h6" fontWeight={800} color="primary.main">{fmt(itemTotal(item))}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, position: 'sticky', top: 80, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<Calculate />} title="Summary" />

              <Stack spacing={1.25} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Items ({items.length})</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmt(subtotal)}</Typography>
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                <Typography variant="body2" fontWeight={600}>{fmt(form.delivery_fee)}</Typography>
              </Box>
              <TextField fullWidth size="small" label="Discount" type="number" value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })} sx={{ mb: 1.5 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField fullWidth size="small" label="Tax" type="number" value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })} sx={{ mb: 2 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />

              {/* Gradient total box */}
              <Box sx={{
                p: 2, borderRadius: 2.5, mb: 2, color: '#fff',
                background: `linear-gradient(135deg, ${GREEN} 0%, #1a8014 100%)`,
                boxShadow: '0 8px 24px rgba(39,184,29,0.35)',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Due</Typography>
                  <Typography variant="h4" fontWeight={800}>{fmt(total)}</Typography>
                </Box>
                <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.25)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Est. Profit</Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={700}>{fmt(profit)}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>{margin.toFixed(1)}% margin</Typography>
                  </Box>
                </Box>
              </Box>

              <Button fullWidth variant="contained" size="large" startIcon={<Save />}
                onClick={handleSubmit} disabled={saving} disableElevation
                sx={{ mb: 1, py: 1.25, fontSize: 16, fontWeight: 700 }}>
                {saving ? 'Creating...' : 'Create Order'}
              </Button>
              <Button fullWidth variant="text" onClick={() => navigate('/orders')} disabled={saving} color="inherit">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
