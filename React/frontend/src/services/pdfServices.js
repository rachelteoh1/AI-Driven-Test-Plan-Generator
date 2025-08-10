import * as api from '../api/pdf';

export const uploadPdf = async (formData) => {
  return (await api.uploadPdf(formData)).data;
};