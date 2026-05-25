import client from './client';
export const getInvoices = (params) => client.get('/orders', { params });
export const getInvoice = (id) => client.get(`/orders/${id}`);
export const createInvoice = (data) => client.post('/orders', data);
export const updateInvoice = (id, data) => client.put(`/orders/${id}`, data);
export const deleteInvoice = (id) => client.delete(`/orders/${id}`);
export const restoreInvoice = (id) => client.post(`/orders/${id}/restore`);
export const downloadInvoicePdf = (id) =>
  client.get(`/orders/${id}/pdf`, { responseType: 'blob' });
export const getOrderTimeline = (id) => client.get(`/orders/${id}/timeline`);
export const mapOrderItem = (invoiceId, itemId, data) => client.patch(`/orders/${invoiceId}/items/${itemId}/map`, data);
