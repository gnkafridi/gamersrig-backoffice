import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Box, Typography, Card, CardContent, CardHeader, Grid, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  ToggleButton, ToggleButtonGroup, Chip, Tooltip, TextField,
} from '@mui/material';
import {
  TrendingUp, AttachMoney, Receipt, Inventory,
  BarChart as BarChartIcon, QueryStats, BrandingWatermarkOutlined,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import {
  getSalesReport, getSalesByCategory, getProductPerformance,
  getSalesTrend, getSalesByPayment, getSalesByBrand,
} from '../api/analytics';
import CATEGORY_ICONS from '../utils/categoryIcons';

const fmt  = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
const fmtK = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(Math.round(n));

/* ── Period presets ───────────────────────────────────────────────── */
const PRESETS = [
  { label: 'This Month', from: () => dayjs().startOf('month'),                 to: () => dayjs() },
  { label: 'Last Month', from: () => dayjs().subtract(1, 'month').startOf('month'), to: () => dayjs().subtract(1, 'month').endOf('month') },
  { label: 'This Year',  from: () => dayjs().startOf('year'),                  to: () => dayjs() },
  { label: 'Last Year',  from: () => dayjs().subtract(1, 'year').startOf('year'), to: () => dayjs().subtract(1, 'year').endOf('year') },
  { label: 'All Time',   from: () => dayjs('2020-01-01'),                      to: () => dayjs() },
];

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
const PAYMENT_COLORS = { COD: '#f59e0b', Online: '#0ea5e9', Unknown: '#94a3b8' };
const marginColor = (m) => m >= 30 ? '#15803d' : m >= 15 ? '#0369a1' : '#b45309';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">{p.name}</Typography>
          <Typography variant="caption" fontWeight={700}>{fmt(p.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default function SalesAnalyticsPage() {
  const [preset,     setPreset]     = useState(0); // 0..4 or 'custom'
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customTo,   setCustomTo]   = useState(dayjs().format('YYYY-MM-DD'));

  const [report,     setReport]     = useState(null);
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [trend,      setTrend]      = useState([]);
  const [payment,    setPayment]    = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [prodSort,   setProdSort]   = useState('revenue');
  const [loading,    setLoading]    = useState(true);

  const isCustom = preset === 'custom';
  const from = isCustom ? customFrom : PRESETS[preset].from().format('YYYY-MM-DD');
  const to   = isCustom ? customTo   : PRESETS[preset].to().format('YYYY-MM-DD');

  const load = useCallback(() => {
    if (!from || !to) return;
    setLoading(true);
    const params = { from, to };
    Promise.all([
      getSalesReport(params),
      getSalesByCategory(params),
      getProductPerformance({ ...params, sort: prodSort, order: 'desc' }),
      getSalesTrend(params),
      getSalesByPayment(params),
      getSalesByBrand(params),
    ]).then(([r, c, p, t, pm, b]) => {
      setReport(r.data);
      setCategories(c.data);
      setProducts(p.data);
      setTrend(t.data.series ?? []);
      setPayment(pm.data);
      setBrands(b.data);
    }).finally(() => setLoading(false));
  }, [from, to, prodSort]);

  useEffect(() => { load(); }, [load]);

  const topIds    = products.slice(0, 3).map((p) => p.product_id ?? p.product_name);
  const bottomIds = products.slice(-3).map((p) => p.product_id ?? p.product_name);

  const totalPaymentRevenue = payment.reduce((s, p) => s + p.revenue, 0);

  return (
    <Box>
      {/* Heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <QueryStats sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Typography variant="h4" fontWeight={700}>Sales Analytics</Typography>
      </Box>

      {/* Period selector */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Period
          </Typography>
          <ToggleButtonGroup
            value={preset}
            exclusive
            onChange={(_, v) => { if (v !== null) setPreset(v); }}
            size="small"
          >
            {PRESETS.map((p, i) => (
              <ToggleButton key={i} value={i} sx={{ px: 2, fontSize: 12, textTransform: 'none' }}>{p.label}</ToggleButton>
            ))}
            <ToggleButton value="custom" sx={{ px: 2, fontSize: 12, textTransform: 'none' }}>Custom</ToggleButton>
          </ToggleButtonGroup>

          {isCustom ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              <TextField
                size="small" type="date" label="From" value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 165 }}
              />
              <Typography variant="caption" color="text.disabled">—</Typography>
              <TextField
                size="small" type="date" label="To" value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 165 }}
              />
            </Box>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
              {dayjs(from).format('DD MMM YYYY')} — {dayjs(to).format('DD MMM YYYY')}
            </Typography>
          )}
        </Box>
      </Card>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Revenue',   value: fmt(report?.revenue),         color: '#16a34a', icon: <AttachMoney /> },
          { title: 'Profit',    value: fmt(report?.profit),          color: '#6366f1', icon: <TrendingUp /> },
          { title: 'Orders',    value: report?.orders ?? '—',        color: '#f59e0b', icon: <Receipt /> },
          { title: 'Avg Order', value: fmt(report?.avg_order_value), color: '#0ea5e9', icon: <Inventory /> },
          { title: 'Margin',    value: report ? `${report.margin}%` : '—', color: report ? marginColor(report.margin) : '#6b7280', icon: <BarChartIcon /> },
        ].map((s) => (
          <Grid key={s.title} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <StatCard title={s.title} value={s.value} icon={s.icon} color={s.color} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Revenue & Profit trend */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title={<Typography variant="h6" fontWeight={600}>Revenue &amp; Profit Trend</Typography>} />
        <CardContent sx={{ pt: 0 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : trend.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No sales data for this period</Typography></Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <RechartTooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRev)" />
                <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#16a34a" strokeWidth={2} fill="url(#gradProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category chart + Payment split */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="h6" fontWeight={600}>Revenue by Category</Typography>} />
            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={320} />
              ) : categories.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No sales data for this period</Typography></Box>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(280, categories.length * 42)}>
                  <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} width={110} />
                    <RechartTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {categories.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="h6" fontWeight={600}>Payment Split</Typography>} subheader={<Typography variant="caption" color="text.secondary">COD vs Online</Typography>} />
            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : payment.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No data</Typography></Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={payment} dataKey="revenue" nameKey="payment_method" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {payment.map((p) => <Cell key={p.payment_method} fill={PAYMENT_COLORS[p.payment_method] || '#94a3b8'} />)}
                      </Pie>
                      <RechartTooltip formatter={(v, n) => [fmt(v), n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 1 }}>
                    {payment.map((p) => (
                      <Box key={p.payment_method} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PAYMENT_COLORS[p.payment_method] || '#94a3b8' }} />
                          <Typography variant="caption" fontWeight={600}>{p.payment_method}</Typography>
                          <Typography variant="caption" color="text.disabled">({p.orders} orders)</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" fontWeight={700}>{fmt(p.revenue)}</Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ ml: 0.75 }}>
                            {totalPaymentRevenue > 0 ? Math.round((p.revenue / totalPaymentRevenue) * 100) : 0}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category breakdown + Brand performance */}
      <Grid container spacing={2} mb={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={<Typography variant="h6" fontWeight={600}>Category Breakdown</Typography>} />
            <CardContent sx={{ pt: 0, px: 0 }}>
              {loading ? (
                <Box sx={{ px: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
              ) : categories.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No data</Typography></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Units</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Margin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((cat, i) => {
                        const IconComp = CATEGORY_ICONS[cat.category];
                        return (
                          <TableRow key={cat.category} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }} />
                                {IconComp && <IconComp sx={{ fontSize: 14, color: 'text.disabled' }} />}
                                <Typography variant="caption" fontWeight={600}>{cat.category}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right"><Typography variant="caption">{cat.units_sold}</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption" fontWeight={700}>{fmt(cat.revenue)}</Typography></TableCell>
                            <TableCell align="right"><Typography variant="caption" fontWeight={600} sx={{ color: marginColor(cat.margin) }}>{cat.margin}%</Typography></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={<BrandingWatermarkOutlined sx={{ fontSize: 20, color: 'text.disabled' }} />}
              title={<Typography variant="h6" fontWeight={600}>Brand Performance</Typography>}
            />
            <CardContent sx={{ pt: 0, px: 0 }}>
              {loading ? (
                <Box sx={{ px: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
              ) : brands.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No data</Typography></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Brand</TableCell>
                        <TableCell align="right">Units</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Margin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {brands.map((b, i) => (
                        <TableRow key={b.brand} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }} />
                              <Typography variant="caption" fontWeight={600}>{b.brand}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right"><Typography variant="caption">{b.units_sold}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="caption" fontWeight={700}>{fmt(b.revenue)}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="caption" fontWeight={600} sx={{ color: marginColor(b.margin) }}>{b.margin}%</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product performance */}
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Product Performance</Typography>}
          subheader={
            <Typography variant="caption" color="text.secondary">
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#bbf7d0', display: 'inline-block' }} /> Top 3 &nbsp;
                <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#fee2e2', display: 'inline-block' }} /> Bottom 3
              </Box>
            </Typography>
          }
          action={
            <ToggleButtonGroup value={prodSort} exclusive onChange={(_, v) => { if (v) setProdSort(v); }} size="small">
              {['revenue', 'units_sold', 'profit', 'margin'].map((s) => (
                <ToggleButton key={s} value={s} sx={{ fontSize: 11, px: 1.5, textTransform: 'none' }}>
                  {s === 'units_sold' ? 'Units' : s.charAt(0).toUpperCase() + s.slice(1)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          }
        />
        <CardContent sx={{ pt: 0, px: 0 }}>
          {loading ? (
            <Box sx={{ px: 2 }}><Skeleton variant="rectangular" height={300} /></Box>
          ) : products.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Typography variant="body2">No sales data for this period</Typography></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2 }}>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p, i) => {
                    const key   = p.product_id ?? p.product_name;
                    const isTop = topIds.includes(key);
                    const isBot = !isTop && bottomIds.includes(key);
                    return (
                      <TableRow key={i} sx={{ bgcolor: isTop ? 'rgba(187,247,208,0.25)' : isBot ? 'rgba(254,226,226,0.25)' : 'inherit', '&:hover': { opacity: 0.9 } }}>
                        <TableCell sx={{ pl: 2 }}><Typography variant="caption" color="text.disabled" fontWeight={600}>{i + 1}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {isTop && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />}
                            {isBot && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444', flexShrink: 0 }} />}
                            <Tooltip title={p.product_name} placement="top">
                              <Typography variant="body2" fontWeight={isTop ? 700 : 400} noWrap sx={{ maxWidth: 220 }}>{p.product_name}</Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {p.category ? <Chip label={p.category} size="small" sx={{ fontSize: 10 }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell align="right"><Typography variant="caption">{p.order_count}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={prodSort === 'units_sold' ? 700 : 400}>{p.units_sold}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" fontWeight={prodSort === 'revenue' ? 700 : 400} color={prodSort === 'revenue' ? 'primary.main' : 'text.primary'}>{fmt(p.revenue)}</Typography>
                        </TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={prodSort === 'profit' ? 700 : 400}>{fmt(p.profit)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={700} sx={{ color: marginColor(p.margin) }}>{p.margin}%</Typography></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
