import * as api from '../api/pdf';

export const uploadPdf = async (formData) => {
  return (await api.uploadPdf(formData)).data;
};

export const getAllInstruments = async () => {
  return (await api.getAllInstruments()).data;
}

export const scanInstrument = async()=>{
  return (await api.scanInstrument()).data;
}

