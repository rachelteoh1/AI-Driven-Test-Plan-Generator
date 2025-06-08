import api from "./api";



export const createUser = (data) => api.post('/auth/',data);//JSON body
export const loginForToken = (data) =>  api.post("/auth/token", new URLSearchParams(data)); //formdata






