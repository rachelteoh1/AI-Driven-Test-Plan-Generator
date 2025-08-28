import * as api from '../api/instrument';

export const scanInstrument = async()=>{
  return (await api.scanInstrument()).data;
}

export const selectInstrument = async(instrument_id, session_id)=>{
  return (await api.selectInstrument(instrument_id, session_id)).data;
}

export const updateSelectedInstrument = async(id,message_id)=>{
  return (await api.updateSelectedInstrument(id,message_id)).data;
}

export const getAllInstrument = async()=>{
  return (await api.getAllInstrument()).data;
}

export const getSessionInstrument = async(session_id)=>{
  return (await api.getSessionInstrument(session_id)).data;
}

export const deleteInstrument = async(instrument_id)=>{
  return (await api.deleteInstrument(instrument_id)).data;
}

export const deleteAllInstrument = async()=>{
  return (await api.deleteAllInstrument()).data;
}
