import * as api from '../api/user';


export const getCurrentUser = async () => (await api.fetchCurrentUser()).data;
