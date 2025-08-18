import api from "./api";

export const scanInstrument = ()=>{ return api.get(`/instruments/scan`);}

export const selectInstrument = (instrument_id, session_id)=>{return api.post(`/instruments/select/${instrument_id}/${session_id}`)};


export const updateSelectedInstrument = (id,message_id)=>{return api.post(`/instruments/update/${id}/${message_id}`)};

export const getAllInstrument = ()=>{return api.get(`/instruments/all_instrument`)};

export const getSessionInstrument = (session_id)=>{return api.get(`/instruments/selected_instrument/${session_id}`)};

export const deleteInstrument = (instrument_id)=>{return api.delete(`instruments/delete/${instrument_id}`)};

export const deleteAllInstrument = ()=>{return api.delete(`instruments/deleteAll`)};



