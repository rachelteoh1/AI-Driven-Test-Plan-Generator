import api from "./api";

export const fetchSequence = (sequenceId)=> api.get(`/sequences/${sequenceId}`);
export const createSequence = (data)=> api.post('/sequences/',data);




