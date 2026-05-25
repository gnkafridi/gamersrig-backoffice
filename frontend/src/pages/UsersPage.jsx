import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Skeleton, Tooltip, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Search, Edit, Delete, Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { PeopleAltOutlined } from '@mui/icons-material';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { primaryBtnSx } from '../utils/styles';
import dayjs from 'dayjs';

// Shared Badge component (dot + label style)
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

const ROLE_STYLE = {
  super_admin: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6', label: 'Super Admin' },
  admin:       { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9', label: 'Admin' },
  staff:       { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: 'Staff' },
};

const EMPTY_FORM = { name: '', title: '', email: '', password: '', role: 'staff' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirm dialog
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const load = useCallback(() => {
    setLoading(true);
    getUsers({ search, role, page: page + 1 })
      .then((r) => {
        setUsers(r.data.data);
        setMeta({ total: r.data.total });
      })
      .catch(() => showSnack('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);

  // Open add dialog
  const handleAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowPassword(false);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, title: u.title || '', email: u.email, password: '', role: u.role });
    setFormErrors({});
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleFormChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const handleSave = async () => {
    // Basic client-side validation
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!editTarget && !form.password) errors.password = 'Password is required';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      const payload = { name: form.name, title: form.title, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      if (editTarget) {
        await updateUser(editTarget.id, payload);
        showSnack(`User "${form.name}" updated`);
      } else {
        payload.password = form.password;
        await createUser(payload);
        showSnack(`User "${form.name}" created`);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
        setFormErrors(mapped);
      } else {
        showSnack(err?.response?.data?.message || 'An error occurred', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await deleteUser(confirmTarget.id);
      showSnack(`User "${confirmTarget.name}" deleted`);
      setConfirmTarget(null);
      load();
    } catch (err) {
      showSnack(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleAltOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="h4" fontWeight={700}>Users</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAdd} sx={primaryBtnSx}>
          Add User
        </Button>
      </Box>

      <Card>
        {/* Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small" placeholder="Search name or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={(e) => { setRole(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" display="block">Updated</Typography>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : users.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  )
                  : users.map((u) => {
                      const roleStyle = ROLE_STYLE[u.role] ?? ROLE_STYLE.staff;
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <TableRow key={u.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{u.title || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Badge bg={roleStyle.bg} color={roleStyle.color} dot={roleStyle.dot} label={roleStyle.label} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{u.creator?.name ?? '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.created_at ? dayjs(u.created_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{u.updater?.name ?? '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.updated_at ? dayjs(u.updated_at).format('DD MMM YY HH:mm') : '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {u.role === 'super_admin' ? (
                              <Tooltip title="Protected — cannot be modified">
                                <LockOutlined sx={{ fontSize: 16, color: 'text.disabled', mx: 1 }} />
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => handleEdit(u)}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={isSelf ? 'Cannot delete your own account' : 'Delete'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={isSelf}
                                      onClick={() => !isSelf && setConfirmTarget(u)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )}
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
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
        />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            size="small"
            fullWidth
            value={form.name}
            onChange={handleFormChange('name')}
            error={Boolean(formErrors.name)}
            helperText={formErrors.name}
          />
          <TextField
            label="Title"
            size="small"
            fullWidth
            placeholder="e.g. Operations Manager, Sales Lead"
            value={form.title}
            onChange={handleFormChange('title')}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            type="email"
            value={form.email}
            onChange={handleFormChange('email')}
            error={Boolean(formErrors.email)}
            helperText={formErrors.email}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Password"
            size="small"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleFormChange('password')}
            placeholder={editTarget ? 'Leave blank to keep current' : ''}
            error={Boolean(formErrors.password)}
            helperText={formErrors.password}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(confirmTarget)} onClose={() => !deleting && setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete user <strong>{confirmTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
