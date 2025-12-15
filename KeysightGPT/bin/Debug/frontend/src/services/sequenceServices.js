import * as api from "../api/sequence";

export const getSequence = async (messageId) =>(await api.fetchSequence(messageId)).data;
export const addSequence = async (data)=> (await api.createSequence(data)).data;
export const deleteSequence = async (messageId) => (await api.deleteSequence(messageId)).data;
