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
export const deleteChatsForLoginSession = (userId, loginSessionId) => api.delete(`/chatSession/user/${encodeURIComponent(userId)}/session/${encodeURIComponent(loginSessionId)}`);
//chat log
export const fetchChatLogs = (sessionId) => api.get(`/chatLog/${sessionId}`);
export const createChatLog = (data) => api.post(`/chatLog/`, data);
export const deleteChatLog = ( sessionId ) => api.delete(`/chatLog/${sessionId}`);
export const detectIntent = (data)=> api.post(`/chatLog/detect-intent`,data);
export const modifyChatLog = (data)=> api.put(`/chatLog/modify`,data);
export const getVersionChatLog = (messageId)=> api.get(`/chatLog/versions/${messageId}`);
export const uploadPdf = (formData) => {
  return api.post(`/chatLog/upload-pdf`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};



