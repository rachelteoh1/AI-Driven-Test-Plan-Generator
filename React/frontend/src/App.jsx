import React from "react"
import { Routes, Route } from "react-router-dom"  // Correct import
import {Home} from "./pages/Home"
import Interface from "./pages/Conversation"
import {Profile} from "./pages/Profile"
import SignInPage from "./pages/SignIn"
import SignUpPage from "./pages/SignUp"
import WelcomePage from "./pages/SignIn&UpOption"
import ModalView from "./modal/internal/ModalView"
import ModalManager from "./modal/internal/ModalManager"

function App() {
  return (
    <>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/interface" element={<Interface />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/" element={<WelcomePage />} />
      </Routes>
      <ModalView ref={ModalManager.ref} />
    </>
  );
}

export default App