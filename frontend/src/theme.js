import { createTheme } from '@mui/material/styles';

export default function createAppTheme(mode = 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#27B81D', light: '#52d147', dark: '#1a8014' },
      secondary: { main: '#52d147', light: '#2ab87f', dark: '#1a8014' },
      background: {
        default: isDark ? '#0a0a0a' : '#f0f2f5',
        paper:   isDark ? '#111111' : '#ffffff',
      },
      success: { main: '#27B81D' },
      warning: { main: '#ffea00' },
      error:   { main: '#ff1744' },
      text: {
        primary:   isDark ? '#ffffff' : '#111111',
        secondary: isDark ? '#9e9e9e' : '#555555',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#2a2a2a' : '#e8f5e9',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderRight: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#111111' : '#ffffff',
            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e0e0e0'}`,
            color: isDark ? '#ffffff' : '#111111',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  });
}
