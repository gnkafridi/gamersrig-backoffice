import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Avatar, Divider, Alert, Snackbar, Grid,
} from '@mui/material';
import { AccountCircleOutlined, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name:  user?.name  || '',
    title: user?.title || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [snack, setSnack]   = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await client.patch('/profile', { name: form.name, title: form.title, email: form.email });
      if (setUser) setUser(res.data);
      // Also update localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data }));
      } catch {}
      setSnack(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', staff: 'Staff' };
  const ROLE_STYLE = {
    super_admin: { bg: '#ede9fe', color: '#6d28d9' },
    admin:       { bg: '#e0f2fe', color: '#0369a1' },
    staff:       { bg: '#f3f4f6', color: '#6b7280' },
  };
  const rs = ROLE_STYLE[user?.role] ?? ROLE_STYLE.staff;

  return (
    <Box maxWidth={560}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountCircleOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Typography variant="h4" fontWeight={700}>My Profile</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Avatar + role */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: 22, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={16}>{user?.name}</Typography>
              {user?.title && <Typography fontSize={13} color="text.secondary">{user.title}</Typography>}
              <Box sx={{ mt: 0.5, display: 'inline-flex', px: 1, py: 0.25, borderRadius: 1, fontSize: 11, fontWeight: 600, bgcolor: rs.bg, color: rs.color }}>
                {ROLE_LABEL[user?.role] ?? user?.role}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Full Name" size="small" fullWidth value={form.name} onChange={handleChange('name')} />
            <TextField label="Title" size="small" fullWidth value={form.title} onChange={handleChange('title')} placeholder="e.g. Co-Founder & CTO" />
            <TextField label="Email" size="small" fullWidth type="email" value={form.email} onChange={handleChange('email')} />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}
        message="Profile updated successfully" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
