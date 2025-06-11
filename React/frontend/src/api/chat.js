import api from "./api";

//chat session
export const fetchChats = (userId) => {
  console.log("fetchChats received userId:", userId, "Type:", typeof userId); // Debug log
  if (!userId || typeof userId !== 'string') {
    throw new Error(`Invalid userId: ${userId}`);
  }
  return api.get(`/chatSession/user/${encodeURIComponent(userId)}`);
};
export const createChat = (data) => api.post(`/chatSession/`, data);
export const renameChat = (data) => api.put(`/chatSession/rename`,data);
export const deleteChat = (sessionId) => api.delete(`/chatSession/${sessionId}`)

//chat log
export const fetchChatLogs = (sessionId) => api.get(`/chatLog/${sessionId}`);
export const createChatLog = (data) => api.post(`/chatLog/`, data);
export const deleteChatLog = ( sessionId ) => api.delete(`/chatLog/${sessionId}`);



