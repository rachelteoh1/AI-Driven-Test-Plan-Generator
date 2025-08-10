import * as api from '../api/chat';

//chat session
export const getChats = async (userId) => (await api.fetchChats(userId)).data;
export const newChat = async (data) => (await api.createChat(data)).data;
export const renameChat = async (data)=>(await api.renameChat(data)).data;
export const deleteChat = async (sessionId) =>(await api.deleteChat(sessionId)).data
export const deleteChatsForLoginSession = async (userId, loginSessionId) => (await api.deleteChatsForLoginSession(userId, loginSessionId)).data;
//chat log
export const getChatLogs = async (sessionId) => (await api.fetchChatLogs(sessionId)).data;
export const addChatLog = async (data) => (await api.createChatLog(data)).data;
export const deleteChatLog = async (sessionId)=> (await api.deleteChatLog(sessionId)).data;
export const detectChatIntent = async (data)=> (await api.detectIntent(data)).data;
export const modifyChatLog = async (data)=> (await api.modifyChatLog(data)).data;
export const getVersionChatLogs = async (messageId) => {
  return (await api.getVersionChatLog(messageId)).data;
};


