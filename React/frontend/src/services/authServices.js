import * as api from "../api/auth";

export const registerUser = async(data)=>(await api.createUser(data)).data;

export const loginUserforToken = async (data) => {
  const res = await api.login(data);
  const token = res.data.access_token;
  localStorage.setItem("access_token", token);
  return token;
};