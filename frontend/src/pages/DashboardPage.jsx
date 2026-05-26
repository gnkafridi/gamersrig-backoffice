import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, CardHeader,
  ToggleButton, ToggleButtonGroup, Skeleton, Chip, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  TrendingUp, Receipt, Inventory, People, AttachMoney,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import { getDashboard, getMonthlyRevenue, getTopProducts } from '../api/analytics';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 1, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption">{p.name}: {fmt(p.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productPeriod, setProductPeriod] = useState('all');
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getMonthlyRevenue(chartYear), getTopProducts(productPeriod)])
      .then(([d, m, t]) => {
        setStats(d.data);
        setMonthly(m.data.months);
        setTopProducts(t.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getMonthlyRevenue(chartYear).then((r) => setMonthly(r.data.months));
  }, [chartYear]);

  useEffect(() => {
    getTopProducts(productPeriod).then((r) => setTopProducts(r.data));
  }, [productPeriod]);

  const revTrend = stats
    ? stats.last_month.revenue > 0
      ? ((stats.this_month.revenue - stats.last_month.revenue) / stats.last_month.revenue) * 100
      : null
    : null;

  const profitTrend = stats
    ? stats.last_month.profit > 0
      ? ((stats.this_month.profit - stats.last_month.profit) / stats.last_month.profit) * 100
      : null
    : null;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Month Revenue"
            value={fmt(stats?.this_month.revenue)}
            subtitle={`${stats?.this_month.invoice_count || 0} orders`}
            trend={revTrend}
            icon={<AttachMoney />}
            loading={loading}
            color="#27B81D"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Month Profit"
            value={fmt(stats?.this_month.profit)}
            trend={profitTrend}
            icon={<TrendingUp />}
            loading={loading}
            color="#52d147"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Year Revenue"
            value={fmt(stats?.this_year.revenue)}
            subtitle={`${stats?.this_year.invoice_count || 0} orders`}
            icon={<Receipt />}
            loading={loading}
            color="#ff6f00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="All Time Revenue"
            value={fmt(stats?.all_time.revenue)}
            subtitle={`Profit: ${fmt(stats?.all_time.profit)}`}
            icon={<AttachMoney />}
            loading={loading}
            color="#7e57c2"
          />
        </Grid>
      </Grid>

      {/* Second row */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Receipt sx={{ color: 'warning.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>{loading ? '—' : stats?.pending_invoices}</Typography>
              <Typography variant="caption" color="text.secondary">Pending Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <People sx={{ color: 'info.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>{loading ? '—' : stats?.total_customers}</Typography>
              <Typography variant="caption" color="text.secondary">Total Customers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Inventory sx={{ color: 'secondary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>{loading ? '—' : stats?.total_products}</Typography>
              <Typography variant="caption" color="text.secondary">Active Products</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUp sx={{ color: 'success.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                {loading ? '—' : stats?.this_month.revenue > 0
                  ? `${(((stats.this_month.revenue - (stats.this_month.revenue - stats.this_month.profit)) / stats.this_month.revenue) * 100).toFixed(1)}%`
                  : '0%'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Margin This Month</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        {/* Monthly Revenue Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={600}>Monthly Revenue & Profit</Typography>}
              action={
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select value={chartYear} onChange={(e) => setChartYear(e.target.value)} sx={{ fontSize: 13 }}>
                    {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27B81D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#27B81D" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52d147" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#52d147" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="month_name" tick={{ fill: '#9e9e9e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9e9e9e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#27B81D" fill="url(#colorRev)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#52d147" fill="url(#colorProfit)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={600}>Top Products</Typography>}
              action={
                <ToggleButtonGroup
                  value={productPeriod}
                  exclusive
                  onChange={(_, v) => v && setProductPeriod(v)}
                  size="small"
                >
                  <ToggleButton value="this_month" sx={{ fontSize: 10, py: 0.3 }}>Month</ToggleButton>
                  <ToggleButton value="this_year" sx={{ fontSize: 10, py: 0.3 }}>Year</ToggleButton>
                  <ToggleButton value="all" sx={{ fontSize: 10, py: 0.3 }}>All</ToggleButton>
                </ToggleButtonGroup>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : topProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No sales data yet
                </Typography>
              ) : (
                <Box>
                  {topProducts.slice(0, 6).map((p, i) => (
                    <Box key={i} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 160 }}>{p.product_name}</Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.main">{fmt(p.total_revenue)}</Typography>
                      </Box>
                      <Box sx={{ height: 4, bgcolor: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: 'primary.main',
                            width: `${(p.total_revenue / topProducts[0].total_revenue) * 100}%`,
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
