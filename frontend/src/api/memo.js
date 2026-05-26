import client from './client';

export const getMemo    = ()        => client.get('/memo');
export const updateMemo = (content) => client.put('/memo', { content });
