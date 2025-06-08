import * as api from "../api/sequence";

export const getSequence = async (sequenceId) =>(await api.fetchSequence(sequenceId)).data;
export const addSequence = async (data)=> (await api.createSequence(data)).data;