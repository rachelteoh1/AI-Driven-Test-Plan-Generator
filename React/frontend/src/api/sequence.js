import api from "./api";

export const fetchSequence = (messageId)=> api.get(`/optimized-sequences/${messageId}`);
export const createSequence = (data)=> api.post('/optimized-sequences/',data);
export const deleteSequence = (messageId) => api.delete(`/optimized-sequences/${messageId}`);



