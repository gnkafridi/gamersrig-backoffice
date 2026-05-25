// Shared primary action button style (e.g. "Create Order", "Add User", "Add Product")
export const primaryBtnSx = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: '6px',
  bgcolor: '#fff',
  color: '#1e293b',
  border: '1.5px solid #e2e8f0',
  borderLeft: '3px solid #16a34a',
  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  '&:hover': {
    bgcolor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderLeft: '3px solid #16a34a',
  },
};
