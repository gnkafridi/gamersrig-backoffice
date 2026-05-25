import client from './client';
export const getProducts = (params) => client.get('/products', { params });
export const getProduct = (id) => client.get(`/products/${id}`);
export const createProduct = (data) => client.post('/products', data);
export const updateProduct = (id, data) => client.put(`/products/${id}`, data);
export const deleteProduct = (id) => client.delete(`/products/${id}`);
export const getCategories = () => client.get('/products/meta/categories');
export const getBrands = () => client.get('/products/meta/brands');
export const getCategoryStats = () => client.get('/products/meta/category-stats');
export const getBrandStats = () => client.get('/products/meta/brand-stats');
export const restoreProduct = (id) => client.post(`/products/${id}/restore`);
export const restockProduct = (id, data) => client.post(`/products/${id}/restock`, data,
  data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined);
export const getProductPurchases = (id) => client.get(`/products/${id}/purchases`);
export const markProductReceived = (id) => client.patch(`/products/${id}/receive`);
