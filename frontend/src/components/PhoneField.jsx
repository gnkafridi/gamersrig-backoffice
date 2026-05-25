import React from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PhoneField({ value, onChange, label = 'Phone', required = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const border = `1px solid ${isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'}`;
  const hoverBorder = `1px solid ${isDark ? '#fff' : '#000'}`;
  const focusBorder = `2px solid ${theme.palette.primary.main}`;
  const bg = 'transparent';
  const color = theme.palette.text.primary;
  const dropdownBg = isDark ? '#1e1e1e' : '#fff';
  const dropdownHover = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography
        component="label"
        sx={{
          position: 'absolute', top: -9, left: 10, zIndex: 1,
          fontSize: '0.75rem', px: 0.5, lineHeight: 1,
          color: 'text.secondary',
          bgcolor: 'background.paper',
        }}
      >
        {label}{required && ' *'}
      </Typography>
      <PhoneInput
        defaultCountry="pk"
        disableCountryGuess
        value={value}
        onChange={onChange}
        style={{ width: '100%' }}
        inputStyle={{
          width: '100%',
          height: 56,
          fontSize: 16,
          background: bg,
          color,
          border,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          outline: 'none',
          fontFamily: 'Roboto, sans-serif',
          padding: '0 14px',
        }}
        countrySelectorStyleProps={{
          buttonProps: { disabled: true, tabIndex: -1 },
          dropdownArrowStyle: { display: 'none' },
          buttonStyle: {
            height: 56,
            background: bg,
            border,
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '0 8px',
            cursor: 'default',
            opacity: 1,
            pointerEvents: 'none',
          },
          dropdownStyleProps: {
            style: {
              background: dropdownBg,
              color,
              borderRadius: 8,
              border: `1px solid ${isDark ? '#333' : '#ddd'}`,
              zIndex: 9999,
            },
            listItemStyle: { color },
          },
        }}
      />
    </Box>
  );
}
