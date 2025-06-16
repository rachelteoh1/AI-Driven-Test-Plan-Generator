import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Header } from "../components/header";
import ChatInterface from "./Conversation";
import { useState, useEffect, useContext } from "react";
import styled, { ThemeProvider } from "styled-components";
import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
import {
  useAddChatLog,
  useChatLogs,
  useDeleteChat,
  useNewChat,
  useRenameChat,
  useDetectIntent,
} from "../hook/useChat";
import UserStatusContext from "../lib/UserStatusContext";

// Styled components
const PageContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  margin-left: 8rem;
  background-color: ${({ theme }) => theme.background};
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${SPACING.L};
  overflow-y: auto;
  background-color: ${({ theme }) => theme.background};
  height: calc(100vh - ${SPACING.xl} - 64px); /* still needed */
  margin-top: ${SPACING.xl};
  margin-bottom: 64px;
  margin-left: 0rem;
`;

const CenterContainer = styled.div`
  margin-top: 10rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1; /* take all available space */
  width: 100%;
  text-align: center;
`;

const ChatWrapper = styled.div`
  bottom: 0;
  width: 50rem;
  max-width: calc(100vw - 2rem);
  background-color: ${({ theme }) => theme.card};
  z-index: 10;
  overflow-y: auto;
  /* Hide scrollbar for Chrome, Safari */
  ::-webkit-scrollbar {
    display: none;
  }
`;

const TextContainer = styled.div`
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${FONTSIZE.XL};
  font-weight: ${FONTWEIGHT.bold};
  color: ${({ theme }) => theme.text};
  margin-bottom: ${SPACING.md};
`;
const HeaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 16rem; /* width of the sidebar */
  right: 0;
  height: ${SPACING.xl};
  background-color: ${({ theme }) => theme.card};
  z-index: 20;
  border-bottom: 1px solid ${({ theme }) => theme.greys?.light ?? "#e5e7eb"};
`;
const ExamplesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
  margin-top: ${SPACING.md};
`;

const ExampleButton = styled.button`
  width: 100%;
  text-align: left;
  padding: ${SPACING.md};
  border: none;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.primaryLight};
  color: ${({ theme }) => theme.text};

  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.hover};
  }
`;

export const Home = ({chats, activeChatId, setActiveChatId, isChatsLoading}) => {
  const { user, isLoading} = useContext(UserStatusContext); 
  const { data: activeChatLogs = [] } = useChatLogs(activeChatId);
  const newChatMutation = useNewChat();
  const renameChatMutation = useRenameChat();
  const deleteChatMutation = useDeleteChat();
  const addChatLogMutation = useAddChatLog();
  const detectIntentMutation  = useDetectIntent();

  useEffect(() => {
    if (!isChatsLoading && !isLoading && user && chats.length === 0) {
      console.log(isChatsLoading);
      handleNewChat();
    }
  }, [isChatsLoading, isLoading, user, chats]);

  const handleNewChat = async () => {
    try {
      const newSession = await newChatMutation.mutateAsync({
        id: user.id,
        title: `Chat ${chats.length + 1}`,
      });
      setActiveChatId(newSession.session_id);
    } catch (err) {
      console.error("Failed to create chat:", err);
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
  const [isReplyLoading, setIsReplyLoading] = useState(false);
  const handleSendMessage = async (message) => {
    setIsReplyLoading(true);
    try {
      await addChatLogMutation.mutateAsync({
        session_id: activeChatId,
        role: "user",
        content: message,
      });

      console.log("Sending LLM response via detectIntent...");
      console.log("detect intent tetsing" ,activeChatId, message);
      await detectIntentMutation.mutateAsync({
        session_id: activeChatId,
        role: "user",
        content: message,
      },{onError:(error)=>{
        const content = error.response?.data?.detail;
        return content;
      } });
      setIsReplyLoading(false);
    } catch (err) {
      console.error("Message send failed:", err);
    } finally {
      setIsReplyLoading(false);
    }
  };

  const activeChat = chats.find((chat) => chat.session_id === activeChatId);
  const hasConversation = activeChatLogs.length > 0;

  const examples = [
    "Generate test case to measure the voltage on channel 1.",
    "Test case to perform a diode forward voltage check.",
    "Explain ROUT:SCAN (@101:110).",
  ];

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
          />
          <MainContent>
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <ContentContainer>
              {!hasConversation && (
                <CenterContainer>
                  <TextContainer>
                    <Title>Welcome to KeysightGPT</Title>
                  </TextContainer>
                  <div>Examples</div>
                  <ExamplesGrid>
                    {examples.map((example, index) => (
                      <ExampleButton
                        key={index}
                        onClick={() => handleSendMessage(example)}
                      >
                        "{example}"
                      </ExampleButton>
                    ))}
                  </ExamplesGrid>
                </CenterContainer>
              )}
            </ContentContainer>
            <ChatWrapper>
              <ChatInterface
                chat={{
                  ...activeChat,
                  messages: activeChatLogs,
                }}
                onSendMessage={handleSendMessage}
                isLoading={isReplyLoading}
              />
            </ChatWrapper>
          </MainContent>
        </div>
      </PageContainer>
    </SidebarProvider>
  );
};
