import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCard({ title, value, subtitle, icon, trend, loading, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={40} />
            ) : (
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, color }}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
            {trend !== undefined && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                {trend >= 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                  {Math.abs(trend).toFixed(1)}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}22`, color, display: 'flex' }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
