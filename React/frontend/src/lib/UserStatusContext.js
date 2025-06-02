import { createContext } from 'react';

const UserStatusContext = createContext({
    isLogin: false,
    setUserStatus: () => {},
});

export default UserStatusContext;
