import * as api from '../api/user';

export const getCurrentUser = async () => (await api.fetchCurrentUser()).data;

export const sendResetPassword = async (data) => 
  (await api.requestResetPassword(data)).data;

export const confirmResetPw = async (data) => 
  (await api.confirmResetPassword(data)).data;
