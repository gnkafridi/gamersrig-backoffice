import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, IconButton, Tooltip,
  Avatar, Skeleton, Button, Divider,
} from '@mui/material';
import {
  ArrowBack, Phone, Email, LocationOn, CalendarToday,
  ShoppingCart, Visibility,
} from '@mui/icons-material';
import { getCustomer } from '../api/customers';
import dayjs from 'dayjs';

const fmt = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });

const STATUS_COLORS = { paid: 'success', draft: 'default', sent: 'warning', overdue: 'error', cancelled: 'default' };
const STATUS_LABELS = { paid: 'Paid', draft: 'Draft', sent: 'Due', overdue: 'Overdue', cancelled: 'Cancelled' };

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomer(id)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box>
      <Skeleton height={40} width={200} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={300} />
    </Box>
  );

  if (!data) return <Typography color="error">Customer not found.</Typography>;

  const { customer, stats, orders } = data;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/customers')} size="small">
          Customers
        </Button>
        <Typography variant="h5" fontWeight={700}>{customer.name}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Customer Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.dark', fontSize: 22 }}>
                  {customer.name[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700}>{customer.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{customer.city || 'No city'}</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {customer.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                )}
                {customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                )}
                {customer.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{customer.address}</Typography>
                  </Box>
                )}
                {customer.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {customer.notes}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {[
              { label: 'Total Orders', value: stats.total_orders, icon: <ShoppingCart />, color: 'primary.main' },
              { label: 'Total Spent', value: fmt(stats.total_spent), icon: <ShoppingCart />, color: 'success.main' },
              { label: 'Avg Order Value', value: fmt(stats.avg_order), icon: <ShoppingCart />, color: 'warning.main' },
              {
                label: 'Last Order',
                value: stats.last_order_at ? dayjs(stats.last_order_at).format('DD MMM YYYY') : '—',
                icon: <CalendarToday />,
                color: 'text.secondary',
              },
            ].map((s) => (
              <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color={s.color}>
                      {s.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Order History */}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Order History
          </Typography>
        </CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {order.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{dayjs(order.invoice_date).format('DD MMM YYYY')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.notes || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.payment_method?.toUpperCase() === 'COD' ? 'COD' : 'Online'}
                      size="small"
                      variant="outlined"
                      color={order.payment_method?.toUpperCase() === 'COD' ? 'warning' : 'success'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[order.status] ?? order.status}
                      size="small"
                      color={STATUS_COLORS[order.status]}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>{fmt(order.total)}</Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Order">
                      <IconButton size="small" onClick={() => navigate(`/orders/${order.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
