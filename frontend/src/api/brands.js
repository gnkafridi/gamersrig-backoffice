import client from './client';
export const getBrands    = (params)    => client.get('/brands', { params });
export const createBrand  = (data)      => client.post('/brands', data);
export const updateBrand  = (id, data)  => client.put(`/brands/${id}`, data);
export const deleteBrand  = (id)        => client.delete(`/brands/${id}`);
