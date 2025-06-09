import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Header } from "../components/header";
import ChatInterface from "./Conversation";
import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { FONTSIZE, FONTWEIGHT, SPACING, COLORS } from "../lib/styles";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useAddChatLog,
  useChatLogs,
  useDeleteChat,
  useNewChat,
  useChats,
  useRenameChat,
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
  margin-left: 18rem;
  background-color: ${COLORS.background.light};
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
  background-color: ${COLORS.background.light};
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
  background-color: ${COLORS.white};
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
  color: ${COLORS.black};
  margin-bottom: ${SPACING.md};
`;
const HeaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 16rem; /* width of the sidebar */
  right: 0;
  height: ${SPACING.xl};
  background-color: ${COLORS.white};
  z-index: 20;
  border-bottom: 1px solid #e5e7eb;
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
  border: 1px;
  border-radius: 0.5rem;
  background-color: ${COLORS.background.light};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.background.medium};
  }
`;
export const Home = () => {
  const { user } = useContext(UserStatusContext); // <-- assuming your `user` object comes from context
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeChatId, setActiveChatId] = useState(null);
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
 
  console.log("userid:", user.id);
  const { data: activeChatLogs = [] } = useChatLogs(activeChatId);
  const newChatMutation = useNewChat();
  const renameChatMutation = useRenameChat();
  const deleteChatMutation = useDeleteChat();
  const addChatLogMutation = useAddChatLog();

  const isLoading = newChatMutation.isLoading || addChatLogMutation.isLoading;

  useEffect(() => {
    if (searchParams.get("newchat") === "true") {
      handleNewChat();
      searchParams.delete("newchat");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

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

  const handleSendMessage = async (message) => {
    try {
      await addChatLogMutation.mutateAsync({
        session_id: activeChatId,
        role: "user",
        content: message,
      });

      // Optional: simulate assistant response
      setTimeout(() => {
        addChatLogMutation.mutateAsync({
          session_id: activeChatId,
          role: "llm_response",
          content: `You said: "${message}"`,
        });
      }, 1000);
    } catch (err) {
      console.error("Message send failed:", err);
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
        <AppSidebar
          chats={chats}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
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
              isLoading={isLoading}
            />
          </ChatWrapper>
        </MainContent>
      </PageContainer>
    </SidebarProvider>
  );
};
// export const Home = (chats,setChats, activeChatId, setActiveChatId) => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const { user } = useContext(UserStatusContext);
//   const newChatMutation = useNewChat();
//   const renameChatMutation = useRenameChat();
//   const deleteChatMutation = useDeleteChat();
//   const useAddChatLogMutation = useAddChatLog();
//   const navigate = useNavigate();
//   // const { data: chatLogs = [], isLoading: logsLoading } = useChatLogs(activeChatId);
//   const [chatLogs, setChatLogs] = useState([]);

//   const fetchChats = useChats(user ? user.id : null);
//    useEffect(() => {
//     if (!user) {
//       navigate("/signin");
//     }
//   }, [user, navigate]);

// // console.log(user.id);
//   useEffect(() => {
//     if (user && fetchChats?.data && Array.isArray(fetchChats.data)) {
//       setChats(fetchChats.data);
//     }
//   }, [user, fetchChats.data]);

//   // get chatlogs if available
//   const fetchChatLogs = useChatLogs(activeChatId);
//   useEffect(() => {
//     if (fetchChatLogs?.data && Array.isArray(fetchChatLogs.data)) {
//       setChatLogs(fetchChatLogs.data);
//     }
//   }, [user, fetchChatLogs.data]);

//   const handleNewChat = () => {
//     newChatMutation.mutate(
//       { id: user.id, title: `Chat ${chats.length + 1}` },
//       {
//         onSuccess: (newChat) => {
//           setChats((prev) => [newChat, ...prev]);
//           setActiveChatId(newChat.session_id);
//         },
//       }
//     );
//   };

//   useEffect(() => {
//     if (searchParams.get("newchat") === "true") {
//       handleNewChat();
//       // remove query param after using it
//       searchParams.delete("newchat");
//       setSearchParams(searchParams);
//     }
//   }, [searchParams]);

//   const [isLoading, setIsLoading] = useState(false);
//   const activeChat = chats.find((chat) => chat.session_id === activeChatId);
//   const hasConversation = chatLogs.length > 0;

//   const handleSelectChat = (id) => {
//     setActiveChatId(id);
//   };

//   const handleRenameChat = async (id, newName) => {
//     console.log("Attempting rename:", id, newName);

//     renameChatMutation.mutate(
//       { session_id: id, title: newName },
//       {
//         onSuccess: () => {
//           return true;
//         },
//         onError: (err) => {
//           console.error("Rename failed:", err);
//           return false;
//         },
//       }
//     );
//   };

//   const handleDeleteChat = async (id) => {
//     deleteChatMutation.mutate(
//       { session_id: id },
//       {
//         onSuccess: () => {
//           setChats((prev) => {
//             const updatedChats = prev.filter((chat) => chat.session_id !== id);
//             const deletedIndex = prev.findIndex(
//               (chat) => chat.session_id === id
//             );
//             const nextChat =
//               updatedChats[deletedIndex] ||
//               updatedChats[deletedIndex - 1] ||
//               null;
//             setActiveChatId(nextChat ? nextChat.session_id : null);
//             return updatedChats;
//           });
//           return true;
//         },
//         onError: (err) => {
//           console.error("Deletion failed", err);
//           return false;
//         },
//       }
//     );
//   };

//   const handleSendMessage = async (message) => {
//     const userMessage = { role: "user", content: message };

//     const botMessage = {
//       role: "assistant",
//       content: `You said: "${message}"`,
//     };

//     // Step 1: Immediately add the user message
//     setChatLogs((prevChatLogs) =>
//       prevChatLogs.map((chatLogs) =>
//         chatLogs.session_id === activeChatId
//           ? {
//               ...chatLogs,
//               messages: [...chatLogs.messages, userMessage],
//             }
//           : chatLogs
//       )
//     );

//     setIsLoading(true);

//     // Step 2: Add bot response after delay
//     setTimeout(() => {
//       setChatLogs((prevChats) =>
//         prevChats.map((chatLogs) =>
//           chatLogs.session_id === activeChatId
//             ? {
//                 ...chatLogs,
//                 messages: [...chatLogs.messages, botMessage],
//               }
//             : chatLogs
//         )
//       );
//       setIsLoading(false);
//     }, 1000);
//     //store to database
//     useAddChatLogMutation.mutate({
//       session_id: activeChatId,
//       user_input: userMessage.content,
//       llm_response: botMessage.content,
//     });
//   };

//   // const[examples, onSelectExample]= useState([
//   //   "Generate test case to measure the voltage on channel 1.",
//   //   "Test case to perform a diode forward voltage check.",
//   //   "Explain ROUT:SCAN (@101:110).",
//   // ])

//   const examples = [
//     // direct array declaration
//     "Generate test case to measure the voltage on channel 1.",
//     "Test case to perform a diode forward voltage check.",
//     "Explain ROUT:SCAN (@101:110).",
//   ];

//   return (
//     <SidebarProvider defaultOpen={true}>
//       <PageContainer>
//         <AppSidebar
//           chats={chats}
//           activeChat={activeChat}
//           onNewChat={handleNewChat}
//           onSelectChat={handleSelectChat}
//           onRenameChat={handleRenameChat}
//           onDeleteChat={handleDeleteChat}
//           onSetChat={setChats}
//         />
//         <MainContent>
//           <HeaderWrapper>
//             <Header />
//           </HeaderWrapper>
//           <ContentContainer>
//             {!hasConversation && (
//               <CenterContainer>
//                 <TextContainer>
//                   <Title>Welcome to KeysightGPT</Title>
//                 </TextContainer>
//                 <div>Examples</div>
//                 <ExamplesGrid>
//                   {examples.map((example, index) => (
//                     <ExampleButton
//                       key={index}
//                       onClick={() => handleSendMessage(example)}
//                     >
//                       "{example}"
//                     </ExampleButton>
//                   ))}
//                 </ExamplesGrid>
//               </CenterContainer>
//             )}
//           </ContentContainer>
//           <ChatWrapper>
//             <ChatInterface
//               chat={chatLogs.flatMap((m) => [
//                 {
//                   message_id: m.message_id,
//                   content: m.user_input,
//                   role: "user",
//                 },
//                 {
//                   message_id: m.message_id,
//                   content: m.llm_response,
//                   role: "bot",
//                 },
//               ])}
//               onSendMessage={handleSendMessage}
//               isLoading={isLoading}
//             />
//           </ChatWrapper>
//         </MainContent>
//       </PageContainer>
//     </SidebarProvider>
//   );
// };
