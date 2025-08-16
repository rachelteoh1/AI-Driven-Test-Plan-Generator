import api from "./api";

export const uploadPdf = (formData) => {
  return api.post(`/pdf/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export const getAllInstruments = () => {
  return api.get(`/pdf/instruments`);
}