import client from './client';

export const getOrders      = (params) => client.get('/orders', { params });
export const getOrder       = (id)     => client.get(`/orders/${id}`);
export const createOrder    = (data)   => client.post('/orders', data);
export const updateOrder    = (id, data) => client.put(`/orders/${id}`, data);
export const deleteOrder    = (id)     => client.delete(`/orders/${id}`);
export const restoreOrder   = (id)     => client.post(`/orders/${id}/restore`);
export const downloadOrderPdf = (id)   => client.get(`/orders/${id}/pdf`, { responseType: 'blob' });
export const getOrderTimeline = (id)   => client.get(`/orders/${id}/timeline`);
export const mapOrderItem   = (orderId, itemId, data) => client.patch(`/orders/${orderId}/items/${itemId}/map`, data);
