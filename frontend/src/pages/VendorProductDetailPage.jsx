import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardHeader,
  Grid, Chip, Skeleton, Divider, Avatar, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer,
} from '@mui/material';
import {
  ArrowBack, Inventory2Outlined, StorefrontOutlined,
  ReceiptLongOutlined, TrendingUp,
} from '@mui/icons-material';
import { getVendorProduct } from '../api/vendors';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const STATUS_STYLE = {
  pending:   { bg: '#fff8e1', color: '#b45309' },
  confirmed: { bg: '#e0f2fe', color: '#0369a1' },
  shipped:   { bg: '#ede9fe', color: '#6d28d9' },
  delivered: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  returned:  { bg: '#f3f4f6', color: '#6b7280' },
};

const CONDITION_COLOR = { New: 'success', Pulled: 'warning', Used: 'default' };

export default function VendorProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVendorProduct(id)
      .then(r => setData(r.data))
      .catch(() => navigate('/partner-products'))
      .finally(() => setLoading(false));
  }, [id]);

  const p      = data?.product;
  const orders = data?.orders  ?? [];
  const stats  = data?.stats   ?? {};

  const commission     = p ? (p.resell_price - p.sell_price) : 0;
  const commissionPct  = p?.resell_price > 0 ? ((commission / p.resell_price) * 100).toFixed(2) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/partner-products')} variant="outlined" size="small">
          Back
        </Button>
        {loading ? <Skeleton width={200} height={36} /> : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" fontWeight={700}>{p?.name}</Typography>
            <Chip
              label={p?.condition || 'New'}
              color={CONDITION_COLOR[p?.condition] ?? 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={p?.is_active ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: p?.is_active ? '#dcfce7' : '#fee2e2',
                color:   p?.is_active ? '#15803d' : '#b91c1c',
              }}
            />
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, md: 7 }}>

          {/* Product Info */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Inventory2Outlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Product Info</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} height={24} />)}
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {[
                    { label: 'SKU',       value: p?.sku || '—' },
                    { label: 'Category',  value: p?.category || '—' },
                    { label: 'Brand',     value: p?.brand || '—' },
                    { label: 'Condition', value: p?.condition || '—' },
                    { label: 'Stock',     value: p?.stock ?? 0 },
                  ].map(row => (
                    <Grid size={{ xs: 6 }} key={row.label}>
                      <Typography variant="caption" color="text.secondary" display="block">{row.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Vendor Info */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<StorefrontOutlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Vendor</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton height={60} /> : (
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{p?.vendor?.name || '—'}</Typography>
                  {p?.vendor?.phone && (
                    <Typography variant="body2" color="text.secondary">📞 {p.vendor.phone}</Typography>
                  )}
                  {p?.vendor?.email && (
                    <Typography variant="body2" color="text.secondary">✉️ {p.vendor.email}</Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader
              avatar={<TrendingUp sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Pricing & Commission</Typography>}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton height={80} /> : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Vendor Price (Cost)</Typography>
                    <Typography variant="body1" fontWeight={700}>{fmt(p?.sell_price)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Our Resell Price</Typography>
                    <Typography variant="body1" fontWeight={700}>{fmt(p?.resell_price)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Commission</Typography>
                    <Typography variant="body1" fontWeight={700} color="warning.main">
                      {fmt(commission)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{commissionPct}%</Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN — Stats */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              {[
                { label: 'Total Orders',   value: loading ? null : stats.order_count ?? 0,   color: 'primary.main' },
                { label: 'Units Sold',     value: loading ? null : stats.total_sold ?? 0,    color: 'text.primary' },
                { label: 'Total Revenue',  value: loading ? null : fmt(stats.total_revenue),  color: 'success.main' },
              ].map((s, i) => (
                <Box key={s.label}>
                  {i > 0 && <Divider sx={{ my: 1.5 }} />}
                  <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                  <Typography variant="h5" fontWeight={700} color={s.color}>
                    {s.value === null ? <Skeleton width={80} /> : s.value}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Order History — full width */}
        <Grid size={12}>
          <Card>
            <CardHeader
              avatar={<ReceiptLongOutlined sx={{ color: 'text.secondary' }} />}
              title={<Typography variant="h6" fontWeight={600}>Order History</Typography>}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No orders yet for this product.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o, i) => {
                      const ss = STATUS_STYLE[o.status] ?? STATUS_STYLE.returned;
                      return (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Typography
                              variant="body2" fontWeight={700}
                              component={RouterLink} to={`/orders/${o.order_id}`}
                              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {o.order_number}
                            </Typography>
                          </TableCell>
                          <TableCell><Typography variant="body2">{o.customer || '—'}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {o.order_date ? dayjs(o.order_date).format('DD MMM YYYY') : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={o.status}
                              size="small"
                              sx={{ bgcolor: ss.bg, color: ss.color, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2">{o.quantity}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2">{fmt(o.unit_price)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmt(o.total)}</Typography></TableCell>
                        </TableRow>
                      );
                    })
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
