import client from './client';
export const getInvoices = (params) => client.get('/invoices', { params });
export const getInvoice = (id) => client.get(`/invoices/${id}`);
export const createInvoice = (data) => client.post('/invoices', data);
export const updateInvoice = (id, data) => client.put(`/invoices/${id}`, data);
export const deleteInvoice = (id) => client.delete(`/invoices/${id}`);
export const downloadInvoicePdf = (id) =>
  client.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
