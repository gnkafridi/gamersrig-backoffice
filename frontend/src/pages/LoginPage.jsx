import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Chip,
} from '@mui/material';
import {
  Visibility, VisibilityOff, LockOutlined, EmailOutlined,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green radial glow at top */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse 80% 45% at 50% -5%, rgba(39,184,29,0.22) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Subtle grid overlay */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(39,184,29,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(39,184,29,0.045) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
        pointerEvents: 'none',
      }} />

      {/* Corner glow dots */}
      <Box sx={{
        position: 'absolute', top: '18%', left: '12%',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(39,184,29,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(39,184,29,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <Card
        elevation={0}
        sx={{
          width: 420,
          bgcolor: 'rgba(12,12,12,0.96)',
          border: '1px solid rgba(39,184,29,0.22)',
          boxShadow: '0 0 0 1px rgba(39,184,29,0.06), 0 24px 64px rgba(0,0,0,0.7), 0 0 80px rgba(39,184,29,0.07)',
          backdropFilter: 'blur(24px)',
          borderRadius: '16px',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <Box sx={{
          height: 3,
          background:
            'linear-gradient(90deg, transparent 0%, #1a8014 20%, #27B81D 45%, #52d147 55%, #27B81D 80%, transparent 100%)',
        }} />

        <CardContent sx={{ p: '36px 40px 32px' }}>

          {/* Logo + Badge */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(39,184,29,0.12) 0%, rgba(39,184,29,0.04) 60%, transparent 100%)',
              border: '1px solid rgba(39,184,29,0.18)',
              mb: 1.5,
            }}>
              <img
                src="/logo.png"
                alt="GamersRig"
                style={{ height: 54, objectFit: 'contain' }}
              />
            </Box>

            {/* Divider + Badge row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08))' }} />
              <Chip
                icon={<AdminPanelSettings sx={{ fontSize: '13px !important', color: '#27B81D !important' }} />}
                label="BACK OFFICE"
                size="small"
                sx={{
                  bgcolor: 'rgba(39,184,29,0.1)',
                  border: '1px solid rgba(39,184,29,0.28)',
                  color: '#27B81D',
                  fontWeight: 700,
                  fontSize: '0.62rem',
                  letterSpacing: '1.8px',
                  height: 22,
                  '& .MuiChip-icon': { ml: '6px' },
                }}
              />
              <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.08))' }} />
            </Box>

            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.3)', letterSpacing: 0.6, fontSize: '0.72rem' }}
            >
              Internal Operations Portal
            </Typography>
          </Box>

          {/* Error alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: 'rgba(255,23,68,0.08)',
                border: '1px solid rgba(255,23,68,0.28)',
                color: '#ff6b6b',
                '& .MuiAlert-icon': { color: '#ff1744' },
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <Typography variant="caption" sx={{
              display: 'block', mb: 0.75,
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 600, fontSize: '0.68rem',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Email Address
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gamersrig.com"
              required
              autoFocus
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(39,184,29,0.45)' },
                  '&.Mui-focused fieldset': {
                    borderColor: '#27B81D',
                    boxShadow: '0 0 0 3px rgba(39,184,29,0.1)',
                  },
                },
                '& input': { py: 1.4, fontSize: '0.9rem' },
              '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                WebkitBoxShadow: '0 0 0 100px #0e0e0e inset',
                WebkitTextFillColor: '#ffffff',
                caretColor: '#ffffff',
              },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Password */}
            <Typography variant="caption" sx={{
              display: 'block', mb: 0.75,
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 600, fontSize: '0.68rem',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>
              Password
            </Typography>
            <TextField
              fullWidth
              value={password}
              type={showPass ? 'text' : 'password'}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              sx={{
                mb: 3.5,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(39,184,29,0.45)' },
                  '&.Mui-focused fieldset': {
                    borderColor: '#27B81D',
                    boxShadow: '0 0 0 3px rgba(39,184,29,0.1)',
                  },
                },
                '& input': { py: 1.4, fontSize: '0.9rem' },
              '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                WebkitBoxShadow: '0 0 0 100px #0e0e0e inset',
                WebkitTextFillColor: '#ffffff',
                caretColor: '#ffffff',
              },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass(!showPass)}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.3)', mr: 0.25, '&:hover': { color: 'rgba(255,255,255,0.6)' } }}
                      >
                        {showPass
                          ? <VisibilityOff sx={{ fontSize: 18 }} />
                          : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Submit */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.55,
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.8px',
                background: 'linear-gradient(135deg, #1e9616 0%, #27B81D 40%, #3dcc32 70%, #27B81D 100%)',
                boxShadow: '0 4px 24px rgba(39,184,29,0.38)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #27B81D 0%, #3dcc32 50%, #52d147 100%)',
                  boxShadow: '0 6px 32px rgba(39,184,29,0.55)',
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': { opacity: 0.6 },
              }}
            >
              {loading
                ? <CircularProgress size={21} thickness={5} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.65rem', letterSpacing: '0.6px' }}>
              © {new Date().getFullYear()} GamersRig &nbsp;·&nbsp; Back Office v1.0
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
