import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, TextField, Autocomplete,
  FormControl, InputLabel, Select, MenuItem, Alert, Chip, Divider, Avatar, Button, Skeleton,
} from '@mui/material';
import { Add, Edit, Close, AttachFile, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { primaryBtnSx } from '../utils/styles';
import {
  getStockPurchases, createStockBatch, updateStockPurchase, getPartners,
} from '../api/finance';
import { getProducts } from '../api/products';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
const blankItem = () => ({ product: null, quantity: '', unit_cost: '' });
const blankHeader = () => ({ paid_by_partner_id: '', purchased_at: dayjs().format('YYYY-MM-DD'), for_period: dayjs().format('YYYY-MM'), proofFile: null });

export default function StockSpentFormPage() {
  const { id } = useParams();
  const editId = id || null;
  const navigate = useNavigate();
  const location = useLocation();

  const [partners, setPartners] = useState([]);
  const [productOpts, setProductOpts] = useState([]);
  const [header, setHeader] = useState(blankHeader());
  const [items, setItems] = useState([blankItem()]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getPartners({ is_active: true }).then((r) => setPartners(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { getProducts({}).then((r) => setProductOpts(r.data.data || [])).catch(() => {}); }, []);
  const searchProducts = (q) => getProducts(q ? { search: q } : {}).then((r) => setProductOpts(r.data.data || [])).catch(() => {});

  const fill = (r) => {
    setHeader({
      paid_by_partner_id: r.paid_by_partner_id || '',
      purchased_at: r.purchased_at ? dayjs(r.purchased_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      for_period: r.for_period || (r.purchased_at ? dayjs(r.purchased_at).format('YYYY-MM') : dayjs().format('YYYY-MM')),
      proofFile: null,
    });
    setItems([{
      product: r.product ? { id: r.product.id, name: r.product.name, sku: r.product.sku } : null,
      quantity: r.quantity,
      unit_cost: r.unit_cost,
    }]);
  };

  // Edit: prefer row passed via navigation state; otherwise fetch and find by id.
  useEffect(() => {
    if (!editId) return;
    if (location.state?.row) { fill(location.state.row); setLoading(false); return; }
    setLoading(true);
    getStockPurchases({})
      .then((r) => { const row = (r.data || []).find((x) => String(x.id) === String(editId)); if (row) fill(row); })
      .finally(() => setLoading(false));
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setItem = (i, patch) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((arr) => [...arr, blankItem()]);
  const removeItem = (i) => setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));
  const formTotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0), 0);

  const save = async () => {
    setError('');
    if (!header.purchased_at) { setError('Pick a date.'); return; }
    const valid = items.filter((it) => it.product && Number(it.quantity) >= 1 && it.unit_cost !== '');
    if (valid.length === 0) { setError('Add at least one product with qty and cost.'); return; }
    setSaving(true);
    try {
      if (editId) {
        const it = valid[0];
        const base = {
          product_id: it.product.id,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
          purchased_at: header.purchased_at,
          for_period: header.for_period || dayjs(header.purchased_at).format('YYYY-MM'),
          paid_by_partner_id: header.paid_by_partner_id || '',
        };
        let payload = base;
        if (header.proofFile) {
          payload = new FormData();
          Object.entries(base).forEach(([k, v]) => payload.append(k, v ?? ''));
          payload.append('proof', header.proofFile);
        } else {
          payload = { ...base, paid_by_partner_id: header.paid_by_partner_id || null };
        }
        await updateStockPurchase(editId, payload);
      } else {
        const fd = new FormData();
        fd.append('purchased_at', header.purchased_at);
        fd.append('for_period', header.for_period || dayjs(header.purchased_at).format('YYYY-MM'));
        if (header.paid_by_partner_id) fd.append('paid_by_partner_id', header.paid_by_partner_id);
        if (header.proofFile) fd.append('proof', header.proofFile);
        valid.forEach((it, i) => {
          fd.append(`items[${i}][product_id]`, it.product.id);
          fd.append(`items[${i}][quantity]`, Number(it.quantity));
          fd.append(`items[${i}][unit_cost]`, Number(it.unit_cost));
        });
        await createStockBatch(fd);
      }
      navigate('/stock-spent');
    } catch (e) {
      setError(e.response?.data?.message || Object.values(e.response?.data?.errors || {})[0]?.[0] || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 980, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/stock-spent')} sx={{ textTransform: 'none', mb: 1.5 }}>
        Back to Stock Spent
      </Button>

      <Card sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {/* Header band */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2,
          background: editId ? 'linear-gradient(90deg,#92400e,#b45309)' : 'linear-gradient(90deg,#065f46,#0d9488)', color: '#fff' }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.2)' }}>
            {editId ? <Edit /> : <Add />}
          </Avatar>
          <Box>
            <Typography fontWeight={800} variant="h6" lineHeight={1.1}>
              {editId ? 'Edit stock line' : 'Add purchase'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {editId ? 'Update this product line' : 'One payment can cover several products & share one proof'}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1 }} />
          ) : (
            <>
              {/* Section: purchase details */}
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Purchase details</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.5, mb: 3, alignItems: 'flex-start' }}>
                <TextField size="small" label="Purchase Date" type="date" sx={{ width: 170 }} slotProps={{ inputLabel: { shrink: true } }}
                  value={header.purchased_at} onChange={(e) => setHeader((h) => ({ ...h, purchased_at: e.target.value }))} />
                <TextField size="small" label="For (month)" type="month" sx={{ width: 160 }}
                  slotProps={{ inputLabel: { shrink: true }, formHelperText: { sx: { mx: 0, fontSize: 10 } } }}
                  helperText="Counts toward this month"
                  value={header.for_period} onChange={(e) => setHeader((h) => ({ ...h, for_period: e.target.value }))} />
                <FormControl size="small" sx={{ width: 210 }}>
                  <InputLabel>Who Paid</InputLabel>
                  <Select label="Who Paid" value={header.paid_by_partner_id || ''} onChange={(e) => setHeader((h) => ({ ...h, paid_by_partner_id: e.target.value }))}>
                    <MenuItem value="">Business (revenue)</MenuItem>
                    {partners.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button component="label" variant={header.proofFile ? 'contained' : 'outlined'}
                  color={header.proofFile ? 'success' : 'inherit'}
                  startIcon={<AttachFile />} sx={{ height: 40, textTransform: 'none', maxWidth: 260, borderColor: 'divider' }}>
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {header.proofFile ? header.proofFile.name : (editId ? 'Replace proof' : 'Attach proof (shared)')}
                  </Box>
                  <input hidden type="file" accept="image/*,application/pdf"
                    onChange={(e) => setHeader((h) => ({ ...h, proofFile: e.target.files?.[0] || null }))} />
                </Button>
              </Box>

              {/* Section: products */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  {editId ? 'Product' : 'Products'}
                </Typography>
                <Chip size="small" label={fmt(formTotal)} sx={{ fontWeight: 700, bgcolor: '#ecfdf5', color: '#065f46' }} />
              </Box>

              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, px: 0.5, mb: 0.5 }}>
                <Typography variant="caption" color="text.disabled" sx={{ flexGrow: 1, minWidth: 240 }}>Product</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ width: 80, textAlign: 'right' }}>Qty</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ width: 120, textAlign: 'right' }}>Single Cost</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ width: 120, textAlign: 'right' }}>Bulk</Typography>
                {!editId && <Box sx={{ width: 34 }} />}
              </Box>

              {items.map((it, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 1,
                  p: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                  <Autocomplete
                    sx={{ minWidth: 240, flexGrow: 1 }}
                    size="small"
                    options={productOpts}
                    value={it.product}
                    getOptionLabel={(o) => o?.name || ''}
                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                    onChange={(_, v) => setItem(i, { product: v })}
                    onInputChange={(_, q, reason) => { if (reason === 'input') searchProducts(q); }}
                    renderInput={(params) => <TextField {...params} placeholder="Search product…" label={items.length > 1 ? `Product ${i + 1}` : 'Product'} sx={{ bgcolor: 'background.paper', borderRadius: 1 }} />}
                  />
                  <TextField size="small" label="Qty" type="number" sx={{ width: 80, bgcolor: 'background.paper', borderRadius: 1 }}
                    value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
                  <TextField size="small" label="Single Cost" type="number" sx={{ width: 120, bgcolor: 'background.paper', borderRadius: 1 }}
                    value={it.unit_cost} onChange={(e) => setItem(i, { unit_cost: e.target.value })} />
                  <TextField size="small" label="Bulk" sx={{ width: 120 }} slotProps={{ input: { readOnly: true, sx: { fontWeight: 700 } } }}
                    value={fmt((Number(it.quantity) || 0) * (Number(it.unit_cost) || 0))} />
                  {!editId && (
                    <IconButton size="small" color="error" disabled={items.length === 1} onClick={() => removeItem(i)} title="Remove row">
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}

              {!editId && (
                <Button size="small" startIcon={<Add />} onClick={addItem} sx={{ textTransform: 'none', mt: 0.5 }}>
                  Add another product
                </Button>
              )}

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Purchase total</Typography>
                  <Typography variant="h5" fontWeight={800} color="success.dark" lineHeight={1}>{fmt(formTotal)}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={() => navigate('/stock-spent')} startIcon={<Close />} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" sx={{ ...primaryBtnSx, px: 3 }} startIcon={editId ? <Edit /> : <Add />} disabled={saving} onClick={save}>
                  {saving ? 'Saving…' : (editId ? 'Update' : 'Save purchase')}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
