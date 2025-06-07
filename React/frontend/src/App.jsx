import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

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

function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Create a new chat function (you can reuse this elsewhere too)
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      name: `Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats([newChat]);
    setActiveChatId(newChat.id);
  };

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, [chats]);

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
              setChats={setChats}
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
        <Route path="/interface" element={<Interface />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/resetpw" element={<ResetPwPage />} />
        <Route path="/confirmpw" element={<ConfirmPwPage />} />
        <Route path="/" element={<WelcomePage />} />
      </Routes>
      <ModalView ref={ModalManager.ref} />
    </>
  );
}

export default App;