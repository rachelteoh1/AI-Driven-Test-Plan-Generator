import React, { createContext } from "react";
import { useUser } from "../hook/useAuth"; // your existing hook

const UserStatusContext = createContext({
  user: null,
  isLogin: false,
  isLoading:true,
  error: null,
});

export const UserStatusProvider = ({ children }) => {
  const {data: user ,isLoading, error} = useUser();

  const isLogin = !!user;

  return (
    <UserStatusContext.Provider value={{ user, isLogin,isLoading, error }}>
      {children}
    </UserStatusContext.Provider>
  );
};

export default UserStatusContext;
