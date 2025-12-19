

import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Header } from "../components/header";
import ChatInterface from "./Conversation";
import { useState, useEffect, useContext, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
import logo from "../assets/keysight.png";
import React from "react";
import CrossedModal from "../modal/CrossedModal";
import useModal from "../modal/useModal";

import {
  useAddChatLog,
  useChatLogs,
  useDeleteChat,
  useNewChat,
  useRenameChat,
  useDetectIntent,
} from "../hook/useChat";
import UserStatusContext from "../lib/UserStatusContext";
import { useUpdateSelectedInstrument } from "../hook/useInstrument";

const PageContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.home.pageGradient};
`;

const MainContent = styled.main`
  margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '4rem' : '18rem')};
  transition: margin-left 0.3s ease;
  background: transparent;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${SPACING.L};
  overflow-y: auto;
  height: calc(100vh - 80px);
  margin-top: 0;
  padding-bottom: 0;
`;

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
  text-align: center;
`;

const ChatWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  background: transparent;
  z-index: 100;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;
const logoToHeader = keyframes`
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(0.5) translateY(-200px);
    opacity: 0.5;
  }
  100% {
    transform: scale(0) translateY(-400px);
    opacity: 0;
  }
`;




const LogoContainer = styled.div`
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  background: ${({ theme }) => theme.home.logoGradient};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  /* 2. Multiple Box Shadows for Depth and Curvature */
  box-shadow: 
    /* Primary soft drop shadow (lifting the element) */
    0 10px 30px #D4E1F7,
    /* A second, more defined shadow */
    0 5px 15px #8EACEB,
    /* **Inset shadow for 3D sphere curvature** */
    inset 0 0 50px #D4E1F7, /* Top/light reflection */
    inset 0 -10px 20px #8EACEB; /* Bottom/dark shading */

  /* --- 3D / SPHERICAL STYLES END --- */

  animation: ${({ $animate }) =>
    ($animate ? 'logoToHeader 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none')};

  &::before {
    content: '';
    position: absolute;
    inset: -10px;
    background: ${({ theme }) => theme.home.logoGradient};
    border-radius: 50%;
    opacity: 0.2;
    filter: blur(25px); /* Increased blur for a softer glow */
  }

  ${({ $animate }) =>
    $animate &&
    css`
      animation: ${logoToHeader} 1s ease-out forwards;
    `}
`;

const LogoIcon = styled.img`
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: ${FONTWEIGHT.bold};
  background: ${({ theme }) => theme.home.titleGradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.home.subtitle};
  font-weight: ${FONTWEIGHT.normal};
`;

const ExamplesSection = styled.div`
  margin-top: 1rem;
  width: 100%;
  max-width: 900px;
`;

const ExamplesLabel = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.home.subtitle};
  margin-bottom: 1rem;
  font-weight: ${FONTWEIGHT.medium};
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
`;

const ExampleCard = styled.button`
  text-align: left;
  padding: 1.25rem;
  border: 2px solid ${({ theme }) => theme.home.cardBorder};
  border-radius: 1rem;
  background: ${({ theme }) => theme.home.cardBg};
  color: ${({ theme }) => theme.home.cardText};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: ${({ theme }) => theme.home.cardHoverBorder};
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
  }

  &::before {
    content: '💡';
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

export const Home = ({
  chats,
  activeChatId,
  setActiveChatId,
  isChatsLoading,
}) => {
  const { user, isLoading } = useContext(UserStatusContext);
  const { data: activeChatLogs = [] , isLoading: isChatLogsLoading } = useChatLogs(activeChatId);
  const newChatMutation = useNewChat();
  const renameChatMutation = useRenameChat();
  const deleteChatMutation = useDeleteChat();
  const addChatLogMutation = useAddChatLog();
  const detectIntentMutation = useDetectIntent();
  const hasCreatedChatRef = useRef(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const updateMessageIdInstrumentMutation = useUpdateSelectedInstrument();
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const { showModal, hideModal } = useModal();
  // Track if this is a fresh chat (no messages yet)
  const previousChatIdRef = useRef(activeChatId);
  const hadNoMessagesRef = useRef(activeChatLogs.length === 0);
  const [showLogo, setShowLogo] = useState(true);

  const handlePdfUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (
      !isChatsLoading &&
      !isLoading &&
      user &&
      chats.length === 0 &&
      !hasCreatedChatRef.current
    ) {
      hasCreatedChatRef.current = true;
      handleNewChat();
    }
  }, [isChatsLoading, isLoading, user, chats]);



  // const handleNewChat = async () => {
  //   try {
  //     const loginSessionId = localStorage.getItem("login_session_id");
  //     const newSession = await newChatMutation.mutateAsync({
  //       id: user.id,
  //       title: `Chat ${chats.length + 1}`,
  //       login_session_id: loginSessionId,
  //     });
  //     setActiveChatId(newSession.session_id);
  //   } catch (err) {
  //     console.error("Failed to create chat:", err);
  //   }
  // };
  const handleNewChat = async () => {
  try {
    const loginSessionId = localStorage.getItem("login_session_id");
    const newSession = await newChatMutation.mutateAsync({
      id: user.id,
      title: `Chat ${chats.length + 1}`,
      login_session_id: loginSessionId,
    });
    setActiveChatId(newSession.session_id);
  } catch (err) {
    console.error("Failed to create chat:", err);
    showModal({
      modal: (
        <CrossedModal
          title="Failed to create new chat"
          description="Please try again later"
          hideModal={hideModal}
        />
      ),
    });
  }
};


  const handleSelectChat = (id) => {
    setActiveChatId(id);
  };

  const handleRenameChat = async (session_id, newName) => {
    try {
      await renameChatMutation.mutateAsync({
        session_id: session_id,
        new_title: newName,
      });
      return true;
    } catch (err) {
      console.error("Rename failed", err);
      return false;
    }
  };

  const handleDeleteChat = async (session_id) => {
    try {
      await deleteChatMutation.mutateAsync(session_id);
      if (activeChatId === session_id) {
        const remainingChats = chats.filter(
          (chat) => chat.session_id !== session_id
        );
        setActiveChatId(remainingChats[0]?.session_id ?? null);
      }
      return true;
    } catch (err) {
      console.error("Delete failed", err);
      return false;
    }
  };

  const [loadingSessions, setLoadingSessions] = useState({});
  const [showLogoAnimation, setShowLogoAnimation] = useState(false);

  // const handleSendMessage = async (message, selectedInstrumentId) => {
  //   // Trigger logo animation on first message
  //   if (activeChatLogs.length === 0 && !showLogoAnimation) {
  //     setShowLogoAnimation(true);
  //   }

  //   setIsReplyLoading(true);
  //   try {
  //     let response = null;
  //     if (message) {
  //       await addChatLogMutation.mutateAsync({
  //         session_id: activeChatId,
  //         role: "user",
  //         content: message,
  //       });

  //       response = await detectIntentMutation.mutateAsync({
  //         session_id: activeChatId,
  //         role: "user",
  //         content: message,
  //       });

  //       if (selectedInstrumentId && response?.message_id) {
  //         updateMessageIdInstrumentMutation.mutate({
  //           id: selectedInstrumentId,
  //           message_id: response.message_id,
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Message submission failed:", err);
  //   } finally {
  //     setIsReplyLoading(false);
  //   }
  // };

  const handleSendMessage = async (message, selectedInstrumentId) => {
  if (activeChatLogs.length === 0 && !showLogoAnimation) {
    setShowLogoAnimation(true);
  }
  setIsReplyLoading(true);
  try {
    let response = null;
    if (message) {
      await addChatLogMutation.mutateAsync({
        session_id: activeChatId,
        role: "user",
        content: message,
      });
      response = await detectIntentMutation.mutateAsync({
        session_id: activeChatId,
        role: "user",
        content: message,
      });
      if (selectedInstrumentId && response?.message_id) {
        updateMessageIdInstrumentMutation.mutate({
          id: selectedInstrumentId,
          message_id: response.message_id,
        });
      }
    }
  } catch (err) {
    console.error("Message submission failed:", err);
    showModal({
      modal: (
        <CrossedModal
          title="Failed to send message"
          description="Please check your connection and try again"
          hideModal={hideModal}
        />
      ),
    });
  } finally {
    setIsReplyLoading(false);
  }
};

  const activeChat = chats.find((chat) => chat.session_id === activeChatId);
  const hasConversation = activeChatLogs.length > 0;

  const examples = [
    "Generate test case to measure the voltage on channel 1.",
    "Enable output :OUTP ON, set voltage to 12 V on channel 6 for fan test.",
    "Explain ROUT:SCAN (@101:110)",
  ];
  
//     useEffect(() => {
//   if (hasConversation) {
//     const t = setTimeout(() => setShowHeader(true), 100);
//     return () => clearTimeout(t);
//   } else {
//     setShowHeader(false);
//   }
// }, [hasConversation]);



  // Handle header visibility and animation logic
  useEffect(() => {
  const hasConversation = activeChatLogs.length > 0;
  const chatChanged = previousChatIdRef.current !== activeChatId;
  const wasEmpty = hadNoMessagesRef.current;

  if (!hasConversation) {
    // New / empty chat
    setShowLogo(true);
    setShowLogoAnimation(false);
    setShowHeader(false);
    return;
  }

  // Has conversation
  if (chatChanged) {
    // Switching chats → no animation
    setShowLogo(false);
    setShowLogoAnimation(false);
    setShowHeader(true);
  } else if (wasEmpty) {
    // First message in THIS chat → animate
    setShowLogo(true);
    setShowLogoAnimation(true);

    setTimeout(() => {
      setShowLogo(false);
      setShowHeader(true);
    }, 1000); // MUST >= animation duration
  } else {
    // Already had messages
    setShowLogo(false);
    setShowHeader(true);
  }

  previousChatIdRef.current = activeChatId;
  hadNoMessagesRef.current = !hasConversation;
}, [activeChatLogs.length, activeChatId]);
 const shouldShowWelcome = !isChatLogsLoading && !hasConversation;

  return (
    <SidebarProvider defaultOpen={true}>
      <PageContainer>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            chats={chats}
            activeChat={activeChat}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
            isChatsLoading={isChatsLoading}
            onPdfUploadSuccess={handlePdfUploadSuccess}
            selectedInstrument={selectedInstrument}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
          <MainContent $sidebarCollapsed={sidebarCollapsed}>
             {showHeader && <Header />}
             <ContentContainer>
              {shouldShowWelcome && (
                <CenterContainer>
                  <WelcomeSection>
                    <LogoContainer $animate={showLogoAnimation}>
                      <LogoIcon src={logo} alt="KeysightGPT Logo" />
                    </LogoContainer>
                    <Title>Hi there, {user?.name || 'User'}</Title>
                    <Subtitle>How can I help you today?</Subtitle>
                  </WelcomeSection>
                  <ExamplesSection>
                    <ExamplesLabel>Try these examples</ExamplesLabel>
                    <ExamplesGrid>
                      {examples.map((example, index) => (
                        <ExampleCard
                          key={index}
                          onClick={() => handleSendMessage(example)}
                        >
                          {example}
                        </ExampleCard>
                      ))}
                    </ExamplesGrid>
                  </ExamplesSection>
                </CenterContainer>
              )}
            </ContentContainer>
            <ChatWrapper>
              <ChatInterface
                key={refreshTrigger}
                chat={{
                  ...activeChat,
                  messages: activeChatLogs,
                }}
                onSendMessage={handleSendMessage}
                isLoading={loadingSessions[activeChat?.session_id] || false}
                onInstrumentChange={setSelectedInstrument}
              />
            </ChatWrapper>
          </MainContent>
        </div>
      </PageContainer>
    </SidebarProvider>
  );
};