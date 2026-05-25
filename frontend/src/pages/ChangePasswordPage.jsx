import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Alert, Snackbar, InputAdornment, IconButton,
} from '@mui/material';
import { LockResetOutlined, Visibility, VisibilityOff, Save } from '@mui/icons-material';
import client from '../api/client';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [snack, setSnack]   = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggleShow   = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  const handleSave = async () => {
    setError('');
    if (!form.current_password) { setError('Current password is required.'); return; }
    if (!form.password || form.password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (form.password !== form.password_confirmation) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await client.patch('/profile/password', form);
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setSnack(true);
    } catch (err) {
      const msg = err?.response?.data?.message
        || Object.values(err?.response?.data?.errors || {})[0]?.[0]
        || 'Failed to change password.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const eyeAdornment = (field) => ({
    endAdornment: (
      <InputAdornment position="end">
        <IconButton size="small" onClick={() => toggleShow(field)} edge="end">
          {show[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  });

  return (
    <Box maxWidth={480}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LockResetOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Typography variant="h4" fontWeight={700}>Change Password</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current Password" size="small" fullWidth
              type={show.current ? 'text' : 'password'}
              value={form.current_password} onChange={handleChange('current_password')}
              slotProps={{ input: eyeAdornment('current') }}
            />
            <TextField
              label="New Password" size="small" fullWidth
              type={show.new ? 'text' : 'password'}
              value={form.password} onChange={handleChange('password')}
              slotProps={{ input: eyeAdornment('new') }}
            />
            <TextField
              label="Confirm New Password" size="small" fullWidth
              type={show.confirm ? 'text' : 'password'}
              value={form.password_confirmation} onChange={handleChange('password_confirmation')}
              slotProps={{ input: eyeAdornment('confirm') }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Update Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}
        message="Password changed successfully" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
