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

function App() {
  const [activeChatId, setActiveChatId] = useState(null);

  const { user } = useContext(UserStatusContext); // <-- assuming your `user` object comes from context

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  const safeUserId =
    typeof user?.id === "string" ? user.id : user?.id?.id || "";

  // Hooks
  const { data: chats = [] } = useChats(safeUserId);

  const onSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  return (
    <>
      <Routes>
        <Route
          path="/home"
          element={
            <Home
              chats={chats}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
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
    </>
  );
}

export default App;
