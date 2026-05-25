import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import createAppTheme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderCreatePage from './pages/OrderCreatePage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductCategoriesPage from './pages/ProductCategoriesPage';
import ProductBrandsPage from './pages/ProductBrandsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import FinanceDashboardPage from './pages/FinanceDashboardPage';
import InvestmentPage from './pages/InvestmentPage';
import ExpensePage from './pages/ExpensePage';
import StockSpentPage from './pages/StockSpentPage';
import StockSpentFormPage from './pages/StockSpentFormPage';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import PartnerProductsPage from './pages/PartnerProductsPage';
import UsersPage from './pages/UsersPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/create" element={<OrderCreatePage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="sales/analytics" element={<SalesAnalyticsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/categories" element={<ProductCategoriesPage />} />
          <Route path="products/brands" element={<ProductBrandsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="finance" element={<FinanceDashboardPage />} />
          <Route path="finance/investment" element={<InvestmentPage />} />
          <Route path="finance/expense" element={<ExpensePage />} />
          <Route path="stock-spent" element={<StockSpentPage />} />
          <Route path="stock-spent/new" element={<StockSpentFormPage />} />
          <Route path="stock-spent/:id/edit" element={<StockSpentFormPage />} />
          <Route path="partner-products" element={<PartnerProductsPage />} />
          <Route path="users"    element={<RoleRoute roles={['super_admin','admin']}><UsersPage /></RoleRoute>} />
          <Route path="history"  element={<RoleRoute roles={['super_admin','admin']}><HistoryPage /></RoleRoute>} />
          <Route path="profile"         element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.theme_mode || 'dark';
    } catch { return 'dark'; }
  });

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider onThemeChange={setThemeMode}>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
