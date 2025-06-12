import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Home } from "./pages/Home";
import Interface from "./pages/Conversation";
import { Profile } from "./pages/Profile";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import WelcomePage from "./pages/SignIn&UpOption";
import ResetPwPage from "./pages/ResetPw";
import ConfirmPwPage from "./pages/ConfirmPw";
import ModalView from "./modal/internal/ModalView";
import ModalManager from "./modal/internal/ModalManager";
import UserStatusContext from "./lib/UserStatusContext";
import { useChats } from "./hook/useChat";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import { lightTheme, darkTheme } from "./lib/styles";
import { useUserProfile } from "./hook/useProfile";


const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    transition: background-color 0.3s ease, color 0.3s ease;
  }
`;

function App() {
  const [activeChatId, setActiveChatId] = useState(null);
  const { user } = useContext(UserStatusContext); // <-- assuming your `user` object comes from context
  const isLoggedIn = !!user;

  const safeUserId =
    typeof user?.id === "string" ? user.id : user?.id?.id || "";

  // Hooks
  const { data: chats = [], isLoading: isChatsLoading, } = useChats(safeUserId);

  const onSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  // check user dark mode
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(isLoggedIn);
  const isDarkMode = isLoggedIn && userProfile?.pref_darkmode;
  console.log("Dark mode status:", isDarkMode);

  return (
    <>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <GlobalStyle />
        <Routes>
          <Route
            path="/home"
            element={
              <Home
                chats={chats}
                activeChatId={activeChatId}
                setActiveChatId={setActiveChatId}
                isChatsLoading={isChatsLoading}
                isDarkMode={isDarkMode}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                chats={chats}
                onSelectChat={(chatId) => {
                  onSelectChat(chatId);
                }}
              />
            }
          />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/interface" element={<Interface />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/resetpw" element={<ResetPwPage />} />
          <Route path="/confirmpw" element={<ConfirmPwPage />} />
        </Routes>
        <ModalView ref={ModalManager.ref} />
      </ThemeProvider>
    </>
  );
}

export default App;
