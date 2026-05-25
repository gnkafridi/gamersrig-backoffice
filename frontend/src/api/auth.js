import client from './client';
export const login = (data) => client.post('/login', data);
export const logout = () => client.post('/logout');
export const me = () => client.get('/me');
export const updatePreferences = (data) => client.patch('/user/preferences', data);
