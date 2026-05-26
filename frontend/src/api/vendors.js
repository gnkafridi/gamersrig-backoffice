import client from './client';

// ── Vendors ──────────────────────────────────────────────
export const getVendors          = (params) => client.get('/vendors', { params });
export const getVendor           = (id)     => client.get(`/vendors/${id}`);
export const createVendor        = (data)   => client.post('/vendors', data);
export const updateVendor        = (id, data) => client.put(`/vendors/${id}`, data);
export const deleteVendor        = (id)     => client.delete(`/vendors/${id}`);
export const getVendorList       = ()       => client.get('/vendors/meta/list');
export const getCommissionReport = ()       => client.get('/vendors/meta/commission-report');

// ── Vendor (partner) products ────────────────────────────
export const getVendorProducts    = (params) => client.get('/vendor-products', { params });
export const getVendorProduct     = (id)     => client.get(`/vendor-products/${id}`);
export const createVendorProduct  = (data)   => client.post('/vendor-products', data);
export const updateVendorProduct  = (id, data) => client.put(`/vendor-products/${id}`, data);
export const deleteVendorProduct  = (id)     => client.delete(`/vendor-products/${id}`);
export const restoreVendorProduct = (id)     => client.post(`/vendor-products/${id}/restore`);
