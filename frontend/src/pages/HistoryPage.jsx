import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Skeleton, Snackbar, Alert,
} from '@mui/material';
import { HistoryOutlined, Search } from '@mui/icons-material';
import { getAuditLogs } from '../api/auditLogs';
import dayjs from 'dayjs';

// Dot + label badge
const Badge = ({ bg, color, dot, label }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.6,
    px: 1.1, py: 0.35, borderRadius: 1,
    bgcolor: bg, color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  }}>
    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
    {label}
  </Box>
);

const EVENT_STYLE = {
  created:  { bg: '#dcfce7', color: '#15803d', dot: '#22c55e',  label: 'Created' },
  updated:  { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9',  label: 'Updated' },
  deleted:  { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444',  label: 'Deleted' },
  restored: { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af',  label: 'Restored' },
  login:    { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6',  label: 'Login' },
  logout:   { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6',  label: 'Logout' },
  viewed:   { bg: '#fff8e1', color: '#b45309', dot: '#f59e0b',  label: 'Viewed' },
};

// Map auditable_type (short) to route prefix
const MODEL_ROUTE = {
  'App\\Models\\Order':  '/orders',
  'App\\Models\\Product':  '/products',
  'App\\Models\\Customer': '/customers',
};

function ModelLink({ log, navigate }) {
  if (!log.auditable_type || !log.auditable_id) return <Typography variant="caption" color="text.disabled">—</Typography>;

  const shortName = log.auditable_type.split('\\').pop();
  const route = MODEL_ROUTE[log.auditable_type];

  if (route) {
    return (
      <Box
        component="span"
        onClick={() => navigate(`${route}/${log.auditable_id}`)}
        sx={{ cursor: 'pointer', color: 'primary.main', fontSize: 12, '&:hover': { textDecoration: 'underline' } }}
      >
        {shortName} #{log.auditable_id}
      </Box>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {shortName} #{log.auditable_id}
    </Typography>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [event, setEvent] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userOptions, setUserOptions] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'error' });

  // All known events from first load
  const [eventOptions] = useState(['created', 'updated', 'deleted', 'restored', 'login', 'logout', 'viewed']);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page: page + 1 };
    if (search)  params.search   = search;
    if (userId)  params.user_id  = userId;
    if (event)   params.event    = event;
    if (from)    params.from     = from;
    if (to)      params.to       = to;

    getAuditLogs(params)
      .then((r) => {
        setLogs(r.data.data);
        setMeta({ total: r.data.total });
        // Build user options from loaded data (accumulate unique users)
        if (r.data.data) {
          setUserOptions((prev) => {
            const map = new Map(prev.map((u) => [u.id, u]));
            r.data.data.forEach((log) => {
              if (log.user) map.set(log.user.id, log.user);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => setSnack({ open: true, msg: 'Failed to load activity', severity: 'error' }))
      .finally(() => setLoading(false));
  }, [search, userId, event, from, to, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <HistoryOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Typography variant="h4" fontWeight={700}>Activity History</Typography>
      </Box>

      <Card>
        {/* Filter bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search description..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>User</InputLabel>
            <Select value={userId} label="User" onChange={(e) => { setUserId(e.target.value); setPage(0); }}>
              <MenuItem value="">All Users</MenuItem>
              {userOptions.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Event</InputLabel>
            <Select value={event} label="Event" onChange={(e) => { setEvent(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {eventOptions.map((ev) => (
                <MenuItem key={ev} value={ev} sx={{ textTransform: 'capitalize' }}>{ev}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small" label="From" type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />
          <TextField
            size="small" label="To" type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 150 }}>Timestamp</TableCell>
                <TableCell sx={{ minWidth: 160 }}>User</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Event</TableCell>
                <TableCell>Description</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Model</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : logs.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No activity found
                      </TableCell>
                    </TableRow>
                  )
                  : logs.map((log) => {
                      const evStyle = EVENT_STYLE[log.event] ?? EVENT_STYLE.viewed;
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                              {dayjs(log.created_at).format('DD MMM YYYY HH:mm')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{log.user.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{log.user.email}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">System</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge bg={evStyle.bg} color={evStyle.color} dot={evStyle.dot} label={evStyle.label} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.description}</Typography>
                          </TableCell>
                          <TableCell>
                            <ModelLink log={log} navigate={navigate} />
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
          rowsPerPage={50}
          rowsPerPageOptions={[50]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Card>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
