import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Divider,
  Avatar, Tooltip, InputBase, Paper, CircularProgress, Switch, Popover,
  Collapse,
} from '@mui/material';
import {
  GridViewOutlined as DashboardIcon,
  ShoppingCart as OrdersIcon,
  StorefrontOutlined as SaleIcon,
  QueryStats as AnalyticsIcon,
  Inventory as ProductIcon,
  PeopleAltOutlined as CustomerIcon,
  AccountBalanceOutlined as FinanceIcon,
  AccountBalanceWalletOutlined as InvestmentIcon,
  ReceiptLongOutlined as ExpenseIcon,
  ManageAccountsOutlined,
  HistoryOutlined,
  SportsEsports as ControllerIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SearchOutlined as SearchIcon,
  Close as CloseIcon,
  ShoppingCart as OrderResultIcon,
  Inventory as ProductResultIcon,
  PeopleAltOutlined as CustomerResultIcon,
  AccountCircleOutlined as ProfileIcon,
  LockResetOutlined as ChangePasswordIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  StickyNote2Outlined as StickyNote2OutlinedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewListOutlined as AllProductsIcon,
  CategoryOutlined as CategoryIcon,
  BrandingWatermarkOutlined as BrandIcon,
  HandshakeOutlined as VendorIcon,
} from '@mui/icons-material';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import MemoDialog from './MemoDialog';

const DRAWER_WIDTH = 228;
const COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    label: 'Sales', icon: <SaleIcon />, path: '/sale',
    children: [
      { label: 'Analytics', icon: <AnalyticsIcon />, path: '/sales/analytics' },
      { label: 'Orders',    icon: <OrdersIcon />,   path: '/orders' },
    ],
  },
  {
    label: 'Products', icon: <ProductIcon />, path: '/products',
    children: [
      { label: 'All Products', icon: <AllProductsIcon />, path: '/products' },
      { label: 'Categories',   icon: <CategoryIcon />,    path: '/products/categories' },
      { label: 'Brands',       icon: <BrandIcon />,       path: '/products/brands' },
    ],
  },
  { label: 'Vendors',   icon: <VendorIcon />,             path: '/partner-products' },
  { label: 'Customers', icon: <CustomerIcon />,           path: '/customers' },
  {
    label: 'Finance', icon: <FinanceIcon />, path: '/finance',
    children: [
      { label: 'Dashboard',   icon: <FinanceIcon />,        path: '/finance' },
      { label: 'Investment',  icon: <InvestmentIcon />,     path: '/finance/investment' },
      { label: 'Expense',     icon: <ExpenseIcon />,        path: '/finance/expense' },
      { label: 'Stock Spent', icon: <AllProductsIcon />,    path: '/stock-spent' },
    ],
  },
  { label: 'Users',     icon: <ManageAccountsOutlined />, path: '/users',    roles: ['super_admin', 'admin'] },
  { label: 'History',   icon: <HistoryOutlined />,        path: '/history',  roles: ['super_admin', 'admin'] },
];

const SIDEBAR_TEXT = '#94a3b8';
const ACTIVE_BG    = 'rgba(255,255,255,0.08)';
const ACTIVE_TEXT  = '#ffffff';
const HOVER_BG     = 'rgba(255,255,255,0.05)';

function ResultSection({ icon, label, items, renderSub, onClick }) {
  return (
    <Box>
      <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'action.hover' }}>
        <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
      </Box>
      {items.map((r) => (
        <Box
          key={r.id}
          onClick={() => onClick(r.url)}
          sx={{
            px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{r.label}</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{renderSub(r)}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, themeMode, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which parent items are open; auto-open if a child is active
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    navItems.forEach(item => {
      if (item.children) {
        const anyActive = item.children.some(c => location.pathname === c.path || (c.path !== '/products' && location.pathname.startsWith(c.path)));
        init[item.path] = anyActive;
      }
    });
    return init;
  });
  const toggleGroup = (path) => setOpenGroups(prev => ({ ...prev, [path]: !prev[path] }));

  const SIDEBAR_BG = themeMode === 'dark' ? '#09090b' : '#0f172a';

  // Fullscreen
  const [memoOpen, setMemoOpen] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  // Global search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const doSearch = useCallback((q) => {
    if (q.length < 2) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    client.get('/search', { params: { q } })
      .then((r) => setSearchResults(r.data))
      .finally(() => setSearchLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (searchQ.length < 2) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(() => doSearch(searchQ), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleResultClick = (url) => {
    setSearchOpen(false); setSearchQ(''); setSearchResults(null);
    navigate(url);
  };

  const totalResults = searchResults
    ? (searchResults.orders?.length + searchResults.customers?.length + searchResults.products?.length)
    : 0;

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            transition: 'width 0.2s ease',
            overflow: 'hidden',
            bgcolor: SIDEBAR_BG,
            border: 'none',
            boxShadow: '1px 0 0 rgba(255,255,255,0.06)',
          },
        }}
      >
        {/* Brand */}
        <Box sx={{
          height: 72, px: collapsed ? 0 : 2, display: 'flex',
          alignItems: 'center', gap: 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <ControllerIcon sx={{ fontSize: collapsed ? 28 : 32, color: '#4ade80', flexShrink: 0 }} />
          {!collapsed && (
            <Box>
              <Typography sx={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, letterSpacing: 0.4, lineHeight: 1.15 }}>
                GamersRig
              </Typography>
              <Typography sx={{
                color: '#4ade80', fontSize: 10, fontWeight: 900,
                letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1,
                fontFamily: '"Inter", "Roboto", sans-serif',
              }}>
                Back Office
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mx: 2, height: '1px', bgcolor: 'rgba(255,255,255,0.07)', mb: 1 }} />

        {/* Nav */}
        <List sx={{ flex: 1, px: 1, pt: 0.5 }}>
          {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map((item) => {
            const isGroup   = Boolean(item.children);
            const groupOpen = openGroups[item.path];
            // A group's parent row is "active" if any child is active
            const active = isGroup
              ? item.children.some(c => location.pathname === c.path || (c.path !== '/products' && location.pathname.startsWith(c.path)))
              : location.pathname.startsWith(item.path);

            const parentBtn = (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  component={isGroup ? 'div' : Link}
                  to={isGroup ? undefined : item.path}
                  onClick={isGroup ? () => {
                    if (collapsed) { setCollapsed(false); setOpenGroups(prev => ({ ...prev, [item.path]: true })); }
                    else toggleGroup(item.path);
                  } : undefined}
                  sx={{
                    borderRadius: '8px',
                    px: collapsed ? 0 : 1.5,
                    py: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    bgcolor: active ? ACTIVE_BG : 'transparent',
                    '&:hover': { bgcolor: active ? ACTIVE_BG : HOVER_BG },
                    position: 'relative',
                    '&::before': active ? {
                      content: '""', position: 'absolute',
                      left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      bgcolor: '#4ade80',
                    } : {},
                  }}
                >
                  <ListItemIcon sx={{
                    color: active ? ACTIVE_TEXT : SIDEBAR_TEXT,
                    minWidth: collapsed ? 0 : 36,
                    '& svg': { fontSize: 20 },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              fontSize: 13.5, fontWeight: active ? 600 : 400,
                              color: active ? ACTIVE_TEXT : SIDEBAR_TEXT,
                              letterSpacing: 0.1,
                            }
                          }
                        }}
                      />
                      {isGroup && (
                        groupOpen
                          ? <ExpandLessIcon sx={{ fontSize: 16, color: SIDEBAR_TEXT }} />
                          : <ExpandMoreIcon sx={{ fontSize: 16, color: SIDEBAR_TEXT }} />
                      )}
                    </>
                  )}
                </ListItemButton>
              </ListItem>
            );

            const wrappedParent = collapsed
              ? <Tooltip key={item.path} title={item.label} placement="right">{parentBtn}</Tooltip>
              : parentBtn;

            if (!isGroup) return wrappedParent;

            return (
              <Box key={item.path}>
                {wrappedParent}
                {!collapsed && (
                  <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 1.5, mb: 0.5 }}>
                      {item.children.map(child => {
                        const childActive = location.pathname === child.path;
                        return (
                          <ListItem key={child.path} disablePadding sx={{ mb: 0.15 }}>
                            <ListItemButton
                              component={Link}
                              to={child.path}
                              sx={{
                                borderRadius: '8px',
                                px: 1.25, py: 0.75,
                                bgcolor: childActive ? ACTIVE_BG : 'transparent',
                                '&:hover': { bgcolor: childActive ? ACTIVE_BG : HOVER_BG },
                                position: 'relative',
                                '&::before': childActive ? {
                                  content: '""', position: 'absolute',
                                  left: 0, top: '20%', bottom: '20%',
                                  width: 2.5, borderRadius: '0 3px 3px 0',
                                  bgcolor: '#4ade80',
                                } : {},
                              }}
                            >
                              <ListItemIcon sx={{
                                color: childActive ? ACTIVE_TEXT : SIDEBAR_TEXT,
                                minWidth: 30,
                                '& svg': { fontSize: 17 },
                              }}>
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.label}
                                slotProps={{
                                  primary: {
                                    sx: {
                                      fontSize: 13, fontWeight: childActive ? 600 : 400,
                                      color: childActive ? ACTIVE_TEXT : SIDEBAR_TEXT,
                                      letterSpacing: 0.1,
                                    }
                                  }
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>

        {/* Collapse toggle */}
        <Box sx={{ mx: 2, height: '1px', bgcolor: 'rgba(255,255,255,0.07)', mt: 1 }} />
        <Box sx={{ p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              size="small"
              sx={{ color: '#475569', '&:hover': { color: '#94a3b8', bgcolor: HOVER_BG } }}
            >
              {collapsed ? <ExpandIcon fontSize="small" /> : <CollapseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <AppBar position="static" elevation={0} sx={{
          zIndex: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Toolbar sx={{ minHeight: '56px !important', px: 3, gap: 2, justifyContent: 'space-between' }}>
            {/* Global Search */}
            <Box ref={searchRef} sx={{ flex: 1, maxWidth: 440, position: 'relative' }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                border: '1.5px solid', borderColor: searchOpen ? 'primary.main' : 'divider',
                borderRadius: '8px', px: 1.5, py: 0.6,
                bgcolor: 'background.default', transition: 'border-color 0.15s',
              }}>
                <SearchIcon sx={{ fontSize: 17, color: 'text.disabled', flexShrink: 0 }} />
                <InputBase
                  placeholder="Search orders, customers, products…"
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  sx={{ flex: 1, fontSize: 13 }}
                />
                {searchLoading && <CircularProgress size={14} sx={{ flexShrink: 0 }} />}
                {searchQ && !searchLoading && (
                  <IconButton size="small" sx={{ p: 0.25 }} onClick={() => { setSearchQ(''); setSearchResults(null); }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>

              {/* Dropdown */}
              {searchOpen && searchQ.length >= 2 && (
                <Paper elevation={8} sx={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  zIndex: 1400, borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid', borderColor: 'divider', maxHeight: 420, overflowY: 'auto',
                }}>
                  {searchLoading && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                  {!searchLoading && searchResults && totalResults === 0 && (
                    <Box sx={{ p: 2.5, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                      No results for "{searchQ}"
                    </Box>
                  )}
                  {!searchLoading && searchResults && (
                    <>
                      {searchResults.orders?.length > 0 && (
                        <ResultSection icon={<OrderResultIcon sx={{ fontSize: 14 }} />} label="Orders"
                          items={searchResults.orders}
                          renderSub={(r) => r.sub}
                          onClick={handleResultClick}
                        />
                      )}
                      {searchResults.customers?.length > 0 && (
                        <ResultSection icon={<CustomerResultIcon sx={{ fontSize: 14 }} />} label="Customers"
                          items={searchResults.customers}
                          renderSub={(r) => r.sub}
                          onClick={handleResultClick}
                        />
                      )}
                      {searchResults.products?.length > 0 && (
                        <ResultSection icon={<ProductResultIcon sx={{ fontSize: 14 }} />} label="Products"
                          items={searchResults.products}
                          renderSub={(r) => r.sub}
                          onClick={handleResultClick}
                        />
                      )}
                    </>
                  )}
                </Paper>
              )}
            </Box>

            {/* Right — memo + fullscreen + avatar */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="My Memo">
              <IconButton size="small" onClick={() => setMemoOpen(true)} sx={{ color: 'text.secondary' }}>
                <StickyNote2OutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'text.secondary' }}>
                {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', px: 1, py: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
            </Box>
            </Box>

            {/* User Popover */}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              slotProps={{ paper: { sx: { width: 260, borderRadius: '12px', mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider' } } }}
            >
              {/* User info header */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42, fontSize: 16, fontWeight: 700 }}>
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary', lineHeight: 1.2 }} noWrap>
                    {user?.name ?? 'Admin'}
                  </Typography>
                  {user?.title && (
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.3 }} noWrap>
                      {user.title}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }} noWrap>
                    {user?.email}
                  </Typography>
                  {user?.role && (
                    <Box sx={{
                      mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      px: 0.9, py: 0.2, borderRadius: 0.75, fontSize: 10.5, fontWeight: 600,
                      bgcolor: user.role === 'super_admin' ? '#ede9fe' : user.role === 'admin' ? '#e0f2fe' : '#f3f4f6',
                      color: user.role === 'super_admin' ? '#6d28d9' : user.role === 'admin' ? '#0369a1' : '#6b7280',
                    }}>
                      {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Staff'}
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Dark mode toggle */}
              <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13.5, color: 'text.primary' }}>Dark Mode</Typography>
                </Box>
                <Switch size="small" checked={themeMode === 'dark'} onChange={toggleTheme} />
              </Box>

              {/* My Profile */}
              <Box
                onClick={() => { setAnchorEl(null); navigate('/profile'); }}
                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ProfileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 13.5, color: 'text.primary' }}>My Profile</Typography>
              </Box>

              {/* Change Password */}
              <Box
                onClick={() => { setAnchorEl(null); navigate('/change-password'); }}
                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ChangePasswordIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 13.5, color: 'text.primary' }}>Change Password</Typography>
              </Box>

              <Divider />

              {/* Logout */}
              <Box
                onClick={handleLogout}
                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', '&:hover': { bgcolor: '#fff5f5' } }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
                <Typography sx={{ fontSize: 13.5, color: 'error.main', fontWeight: 500 }}>Logout</Typography>
              </Box>

              {/* Version footer */}
              <Box sx={{ px: 2, py: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>GamersRig v1.0.0</Typography>
              </Box>
            </Popover>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      <MemoDialog open={memoOpen} onClose={() => setMemoOpen(false)} />
    </Box>
  );
}
