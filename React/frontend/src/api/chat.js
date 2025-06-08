import api from "./api";

//chat session
export const fetchChats = (userId) => api.get(`/chatSession/user/${userId}`);
export const createChat = (data) => api.post('/chatSession/', data);
export const renameChat = (data) => api.put(`/chatSession/rename`,data);
export const deleteChat = (sessionId) => api.delete(`/chatSession/${sessionId}`)

//chat log
export const fetchChatLogs = (sessionId) => api.get(`/chatLog/${sessionId}`);
export const createChatLog = (data) => api.post('/chatLog/', data);
export const deleteChatLog = (sessionId)=>api.delete(`/chatLog/${sessionId}`);



