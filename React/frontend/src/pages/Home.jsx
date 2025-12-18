// // import { SidebarProvider } from "../components/ui/sidebar";
// // import { AppSidebar } from "../components/app-sidebar";
// // import { Header } from "../components/header";
// // import ChatInterface from "./Conversation";
// // import { useState, useEffect, useContext, useRef } from "react";
// // import styled, { ThemeProvider } from "styled-components";
// // import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
// // import {
// //   useAddChatLog,
// //   useChatLogs,
// //   useDeleteChat,
// //   useNewChat,
// //   useRenameChat,
// //   useDetectIntent,
// // } from "../hook/useChat";
// // import UserStatusContext from "../lib/UserStatusContext";
// // import { useUpdateSelectedInstrument } from "../hook/useInstrument";

// // // Styled components
// // const PageContainer = styled.div`
// //   display: flex;
// //   width: 100%;
// //   height: 100vh;
// //   overflow: hidden;
// // `;

// // const MainContent = styled.main`
// //   margin-left: 8rem;
// //   background-color: ${({ theme }) => theme.background};
// //   height: 100vh;
// //   overflow: hidden;
// //   display: flex;
// //   flex-direction: column;
// //   justify-content: center;
// // `;

// // const ContentContainer = styled.div`
// //   display: flex;
// //   flex-direction: column;
// //   flex: 1;
// //   padding: ${SPACING.L};
// //   overflow-y: auto;
// //   background-color: ${({ theme }) => theme.background};
// //   height: calc(100vh - ${SPACING.xl} - 64px);
// //   margin-top: 80px;
// //   margin-bottom: 0px;
// //   margin-left: 0rem;
// // `;

// // const CenterContainer = styled.div`
// //   margin-top: 1rem;
// //   display: flex;
// //   flex-direction: column;
// //   justify-content: center;
// //   align-items: center;
// //   flex: 1;
// //   width: 100%;
// //   text-align: center;
// // `;

// // const ChatWrapper = styled.div`
// //   bottom: 0;
// //   width: 50rem;
// //   max-width: calc(100vw - 2rem);
// //   background-color: ${({ theme }) => theme.card};
// //   z-index: 10;
// //   overflow-y: auto;
// //   /* Hide scrollbar for Chrome, Safari */
// //   ::-webkit-scrollbar {
// //     display: none;
// //   }
// // `;

// // const TextContainer = styled.div`
// //   text-align: center;
// // `;

// // const Title = styled.h1`
// //   font-size: ${FONTSIZE.XL};
// //   font-weight: ${FONTWEIGHT.bold};
// //   color: ${({ theme }) => theme.text};
// //   margin-bottom: ${SPACING.md};
// // `;
// // const HeaderWrapper = styled.div`
// //   position: fixed;
// //   top: 0;
// //   left: 16rem; /* width of the sidebar */
// //   right: 0;
// //   height: ${SPACING.xl};
// //   background-color: ${({ theme }) => theme.card};
// //   z-index: 20;
// //   border-bottom: 1px solid ${({ theme }) => theme.greys?.light ?? "#e5e7eb"};
// // `;
// // const ExamplesGrid = styled.div`
// //   display: flex;
// //   flex-direction: column;
// //   gap: ${SPACING.sm};
// //   margin-top: ${SPACING.md};
// // `;

// // const ExampleButton = styled.button`
// //   width: 100%;
// //   text-align: left;
// //   padding: ${SPACING.md};
// //   border: none;
// //   border-radius: 0.5rem;
// //   background-color: ${({ theme }) => theme.primaryLight};
// //   color: ${({ theme }) => theme.text};

// //   cursor: pointer;
// //   transition: background-color 0.2s;

// //   &:hover {
// //     background-color: ${({ theme }) => theme.hover};
// //   }
// // `;

// // export const Home = ({
// //   chats,
// //   activeChatId,
// //   setActiveChatId,
// //   isChatsLoading,
// // }) => {
// //   const { user, isLoading } = useContext(UserStatusContext);
// //   const { data: activeChatLogs = [] } = useChatLogs(activeChatId);
// //   const newChatMutation = useNewChat();
// //   const renameChatMutation = useRenameChat();
// //   const deleteChatMutation = useDeleteChat();
// //   const addChatLogMutation = useAddChatLog();
// //   const detectIntentMutation = useDetectIntent();
// //   const hasCreatedChatRef = useRef(false); //prevent duplicate call
// //   const [refreshTrigger, setRefreshTrigger] = useState(0);
// //   const updateMessageIdInstrumentMutation = useUpdateSelectedInstrument();
// //   const handlePdfUploadSuccess = () => {
// //     setRefreshTrigger((prev) => prev + 1);
// //   };
// //   const [selectedInstrument, setSelectedInstrument] = useState(null);
// //   const [sidebarOpen, setSidebarOpen] = useState(true);

// //   useEffect(() => {
// //     if (
// //       !isChatsLoading &&
// //       !isLoading &&
// //       user &&
// //       chats.length === 0 &&
// //       !hasCreatedChatRef.current
// //     ) {
// //       console.log(isChatsLoading);
// //       hasCreatedChatRef.current = true;
// //       handleNewChat();
// //     }
// //   }, [isChatsLoading, isLoading, user, chats]);

// //   const handleNewChat = async () => {
// //     try {
// //       const loginSessionId = localStorage.getItem("login_session_id");
// //       const newSession = await newChatMutation.mutateAsync({
// //         id: user.id,
// //         title: `Chat ${chats.length + 1}`,
// //         login_session_id: loginSessionId,
// //       });
// //       setActiveChatId(newSession.session_id);
// //     } catch (err) {
// //       console.error("Failed to create chat:", err);
// //     }
// //   };

// //   const handleSelectChat = (id) => {
// //     setActiveChatId(id);
// //   };

// //   const handleRenameChat = async (session_id, newName) => {
// //     try {
// //       await renameChatMutation.mutateAsync({
// //         session_id: session_id,
// //         new_title: newName,
// //       });
// //       return true;
// //     } catch (err) {
// //       console.error("Rename failed", err);
// //       return false;
// //     }
// //   };

// //   const handleDeleteChat = async (session_id) => {
// //     try {
// //       await deleteChatMutation.mutateAsync(session_id);
// //       if (activeChatId === session_id) {
// //         const remainingChats = chats.filter(
// //           (chat) => chat.session_id !== session_id
// //         );
// //         setActiveChatId(remainingChats[0]?.session_id ?? null);
// //       }
// //       return true;
// //     } catch (err) {
// //       console.error("Delete failed", err);
// //       return false;
// //     }
// //   };
// //   const [isReplyLoading, setIsReplyLoading] = useState(false);

// //   const handleSendMessage = async (message, selectedInstrumentId) => {
// //     console.log("handleSendMessage called with:", { message });
// //     setIsReplyLoading(true);
// //     try {
// //       let response = null;
// //       if (message) {
// //         // Handle text message
// //         await addChatLogMutation.mutateAsync({
// //           session_id: activeChatId,
// //           role: "user",
// //           content: message,
// //         });

// //         console.log("Sending LLM response via detectIntent...");
// //         response = await detectIntentMutation.mutateAsync({
// //           session_id: activeChatId,
// //           role: "user",
// //           content: message,
// //         });

// //         console.log("Detect intent response:", response);

// //         // 3. Update selected instrument with new message_id
// //         if (selectedInstrumentId && response?.message_id) {
// //           updateMessageIdInstrumentMutation.mutate({
// //             id: selectedInstrumentId,
// //             message_id: response.message_id,
// //           });
// //         }
// //       }

     
// //     } catch (err) {
// //       console.error("Message submission failed:", err);
// //     } finally {
// //       setIsReplyLoading(false);
// //     }
// //   };

// //   const activeChat = chats.find((chat) => chat.session_id === activeChatId);
// //   const hasConversation = activeChatLogs.length > 0;

// //   const examples = [
// //     "Generate test case to measure the voltage on channel 1.",
// //     "Enable output :OUTP ON, set voltage to 12 V on channel 6 for fan test.",
// //     "Explain ROUT:SCAN (@101:110)",
// //   ];

// //   return (
// //     <SidebarProvider defaultOpen={true}>
// //       <PageContainer>
// //         <div className="flex min-h-screen w-full">
// //           <AppSidebar
// //             chats={chats}
// //             activeChat={activeChat}
// //             onNewChat={handleNewChat}
// //             onSelectChat={handleSelectChat}
// //             onRenameChat={handleRenameChat}
// //             onDeleteChat={handleDeleteChat}
// //             isChatsLoading={isChatsLoading}
// //             onPdfUploadSuccess={handlePdfUploadSuccess}
// //             selectedInstrument={selectedInstrument}
// //           />
// //           <MainContent>
// //             <HeaderWrapper>
// //               <Header />
// //             </HeaderWrapper>
// //             <ContentContainer>
// //               {!hasConversation && (
// //                 <CenterContainer>
// //                   <TextContainer>
// //                     <Title>Welcome to KeysightGPT</Title>
// //                   </TextContainer>
// //                   <div>Examples</div>
// //                   <ExamplesGrid>
// //                     {examples.map((example, index) => (
// //                       <ExampleButton
// //                         key={index}
// //                         onClick={() => handleSendMessage(example)}
// //                       >
// //                         "{example}"
// //                       </ExampleButton>
// //                     ))}
// //                   </ExamplesGrid>
// //                 </CenterContainer>
// //               )}
// //             </ContentContainer>
// //             <ChatWrapper>
// //               <ChatInterface
// //                 key={refreshTrigger}
// //                 chat={{
// //                   ...activeChat,
// //                   messages: activeChatLogs,
// //                 }}
// //                 onSendMessage={handleSendMessage}
// //                 isLoading={isReplyLoading}
// //                 onInstrumentChange={setSelectedInstrument}
// //               />
// //             </ChatWrapper>
// //           </MainContent>
// //         </div>
// //       </PageContainer>
// //     </SidebarProvider>
// //   );
// // };
// // import { SidebarProvider } from "../components/ui/sidebar";
// // import { AppSidebar } from "../components/app-sidebar";
// // import { Header } from "../components/header";
// // import ChatInterface from "./Conversation";
// // import { useState, useEffect, useContext, useRef } from "react";
// // import styled from "styled-components";
// // import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
// // import logo from "../assets/keysight.png"
// // import {
// //   useAddChatLog,
// //   useChatLogs,
// //   useDeleteChat,
// //   useNewChat,
// //   useRenameChat,
// //   useDetectIntent,
// // } from "../hook/useChat";
// // import UserStatusContext from "../lib/UserStatusContext";
// // import { useUpdateSelectedInstrument } from "../hook/useInstrument";

// // const PageContainer = styled.div`
// //   display: flex;
// //   width: 100%;
// //   height: 100vh;
// //   overflow: hidden;
// //   background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
// // `;

// // const MainContent = styled.main`
// //   margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '4rem' : '18rem')};
// //   transition: margin-left 0.3s ease;
// //   background: transparent;
// //   height: 100vh;
// //   overflow: hidden;
// //   display: flex;
// //   flex-direction: column;
// //   width: 100%;
// // `;

// // const ContentContainer = styled.div`
// //   display: flex;
// //   flex-direction: column;
// //   flex: 1;
// //   padding: ${SPACING.L};
// //   overflow-y: auto;
// //   height: calc(100vh - 80px);
// //   margin-top: 60px;
// //   padding-bottom: 0;
// // `;



// // const CenterContainer = styled.div`
// //   display: flex;
// //   flex-direction: column;
// //   justify-content: center;
// //   align-items: center;
// //   flex: 1;
// //   width: 100%;
// //   text-align: center;
// //   padding: 2rem;
// // `;

// // const ChatWrapper = styled.div`
// //   width: 100%;
// //   max-width: 100%;
// //   background: transparent;
// //   z-index: 10;
// //   overflow-y: auto;
// //   display: flex;
// //   flex-direction: column;
// //   align-items: center;
// // `;
// // const HeaderWrapper = styled.div`
// //   position: fixed;
// //   top: 0;
// //   left: 16rem; /* width of the sidebar */
// //   right: 0;
// //   height: ${SPACING.xl};
// //   background-color: ${({ theme }) => theme.card};
// //   z-index: 20;
// //   border-bottom: 1px solid ${({ theme }) => theme.greys?.light ?? "#e5e7eb"};
// // `;

// // const WelcomeSection = styled.div`
// //   text-align: center;
// //   margin-bottom: 3rem;
// // `;

// // const LogoContainer = styled.div`
// //   width: 120px;
// //   height: 120px;
// //   margin: 0 auto 2rem;
// //   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //   border-radius: 50%;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
// //   position: relative;
  
// //   &::before {
// //     content: '';
// //     position: absolute;
// //     inset: -10px;
// //     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //     border-radius: 50%;
// //     opacity: 0.2;
// //     filter: blur(20px);
// //   }
// // `;

// // const LogoIcon = styled.div`
// //   font-size: 3rem;
// //   color: white;
// //   position: relative;
// //   z-index: 1;
// // `;

// // const Title = styled.h1`
// //   font-size: 2.5rem;
// //   font-weight: ${FONTWEIGHT.bold};
// //   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //   -webkit-background-clip: text;
// //   -webkit-text-fill-color: transparent;
// //   background-clip: text;
// //   margin-bottom: 0.5rem;
// // `;

// // const Subtitle = styled.p`
// //   font-size: 1.25rem;
// //   color: #6b7280;
// //   font-weight: ${FONTWEIGHT.normal};
// // `;

// // const ExamplesSection = styled.div`
// //   margin-top: 2rem;
// //   width: 100%;
// //   max-width: 900px;
// // `;

// // const ExamplesLabel = styled.div`
// //   font-size: 0.875rem;
// //   color: #6b7280;
// //   margin-bottom: 1rem;
// //   font-weight: ${FONTWEIGHT.medium};
// // `;

// // const ExamplesGrid = styled.div`
// //   display: grid;
// //   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
// //   gap: 1rem;
// //   width: 100%;
// // `;

// // const ExampleCard = styled.button`
// //   text-align: left;
// //   padding: 1.25rem;
// //   border: 2px solid #e5e7eb;
// //   border-radius: 1rem;
// //   background: white;
// //   color: #374151;
// //   cursor: pointer;
// //   transition: all 0.2s ease;
// //   font-size: 0.875rem;
// //   line-height: 1.5;
// //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

// //   &:hover {
// //     border-color: #667eea;
// //     box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
// //     transform: translateY(-2px);
// //   }

// //   &::before {
// //     content: '💡';
// //     display: block;
// //     font-size: 1.5rem;
// //     margin-bottom: 0.5rem;
// //   }
// // `;



// // export const Home = ({
// //   chats,
// //   activeChatId,
// //   setActiveChatId,
// //   isChatsLoading,
// // }) => {
// //   const { user, isLoading } = useContext(UserStatusContext);
// //   const { data: activeChatLogs = [] } = useChatLogs(activeChatId);
// //   const newChatMutation = useNewChat();
// //   const renameChatMutation = useRenameChat();
// //   const deleteChatMutation = useDeleteChat();
// //   const addChatLogMutation = useAddChatLog();
// //   const detectIntentMutation = useDetectIntent();
// //   const hasCreatedChatRef = useRef(false);
// //   const [refreshTrigger, setRefreshTrigger] = useState(0);
// //   const updateMessageIdInstrumentMutation = useUpdateSelectedInstrument();
// //   const [selectedInstrument, setSelectedInstrument] = useState(null);
// //   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// //   const handlePdfUploadSuccess = () => {
// //     setRefreshTrigger((prev) => prev + 1);
// //   };

// //   useEffect(() => {
// //     if (
// //       !isChatsLoading &&
// //       !isLoading &&
// //       user &&
// //       chats.length === 0 &&
// //       !hasCreatedChatRef.current
// //     ) {
// //       hasCreatedChatRef.current = true;
// //       handleNewChat();
// //     }
// //   }, [isChatsLoading, isLoading, user, chats]);

// //   const handleNewChat = async () => {
// //     try {
// //       const loginSessionId = localStorage.getItem("login_session_id");
// //       const newSession = await newChatMutation.mutateAsync({
// //         id: user.id,
// //         title: `Chat ${chats.length + 1}`,
// //         login_session_id: loginSessionId,
// //       });
// //       setActiveChatId(newSession.session_id);
// //     } catch (err) {
// //       console.error("Failed to create chat:", err);
// //     }
// //   };

// //   const handleSelectChat = (id) => {
// //     setActiveChatId(id);
// //   };

// //   const handleRenameChat = async (session_id, newName) => {
// //     try {
// //       await renameChatMutation.mutateAsync({
// //         session_id: session_id,
// //         new_title: newName,
// //       });
// //       return true;
// //     } catch (err) {
// //       console.error("Rename failed", err);
// //       return false;
// //     }
// //   };

// //   const handleDeleteChat = async (session_id) => {
// //     try {
// //       await deleteChatMutation.mutateAsync(session_id);
// //       if (activeChatId === session_id) {
// //         const remainingChats = chats.filter(
// //           (chat) => chat.session_id !== session_id
// //         );
// //         setActiveChatId(remainingChats[0]?.session_id ?? null);
// //       }
// //       return true;
// //     } catch (err) {
// //       console.error("Delete failed", err);
// //       return false;
// //     }
// //   };

// //   const [isReplyLoading, setIsReplyLoading] = useState(false);

// //   const handleSendMessage = async (message, selectedInstrumentId) => {
// //     setIsReplyLoading(true);
// //     try {
// //       let response = null;
// //       if (message) {
// //         await addChatLogMutation.mutateAsync({
// //           session_id: activeChatId,
// //           role: "user",
// //           content: message,
// //         });

// //         response = await detectIntentMutation.mutateAsync({
// //           session_id: activeChatId,
// //           role: "user",
// //           content: message,
// //         });

// //         if (selectedInstrumentId && response?.message_id) {
// //           updateMessageIdInstrumentMutation.mutate({
// //             id: selectedInstrumentId,
// //             message_id: response.message_id,
// //           });
// //         }
// //       }
// //     } catch (err) {
// //       console.error("Message submission failed:", err);
// //     } finally {
// //       setIsReplyLoading(false);
// //     }
// //   };

// //   const activeChat = chats.find((chat) => chat.session_id === activeChatId);
// //   const hasConversation = activeChatLogs.length > 0;

// //   const examples = [
// //     "Generate test case to measure the voltage on channel 1.",
// //     "Enable output :OUTP ON, set voltage to 12 V on channel 6 for fan test.",
// //     "Explain ROUT:SCAN (@101:110)",
// //   ];

// //   return (
// //     <SidebarProvider defaultOpen={true}>
// //       <PageContainer>
// //         <div className="flex min-h-screen w-full">
// //           <AppSidebar
// //             chats={chats}
// //             activeChat={activeChat}
// //             onNewChat={handleNewChat}
// //             onSelectChat={handleSelectChat}
// //             onRenameChat={handleRenameChat}
// //             onDeleteChat={handleDeleteChat}
// //             isChatsLoading={isChatsLoading}
// //             onPdfUploadSuccess={handlePdfUploadSuccess}
// //             selectedInstrument={selectedInstrument}
// //             collapsed={sidebarCollapsed}
// //             onCollapsedChange={setSidebarCollapsed}
// //           />
// //            <HeaderWrapper>
// //                <Header />
// //             </HeaderWrapper>
// //           <MainContent $sidebarCollapsed={sidebarCollapsed}>
            
// //             <ContentContainer>
// //               {!hasConversation && (
// //                 <CenterContainer>
// //                   <WelcomeSection>
// //                     <LogoContainer>
// //                       <LogoIcon src={logo}>  </LogoIcon>
// //                     </LogoContainer>
// //                     <Title>Hi there, {user?.name || 'User'}</Title>
// //                     <Subtitle>How can I help you today?</Subtitle>
// //                   </WelcomeSection>
// //                   <ExamplesSection>
// //                     <ExamplesLabel>Try these examples</ExamplesLabel>
// //                     <ExamplesGrid>
// //                       {examples.map((example, index) => (
// //                         <ExampleCard
// //                           key={index}
// //                           onClick={() => handleSendMessage(example)}
// //                         >
// //                           {example}
// //                         </ExampleCard>
// //                       ))}
// //                     </ExamplesGrid>
// //                   </ExamplesSection>
// //                 </CenterContainer>
// //               )}
// //             </ContentContainer>
// //             <ChatWrapper>
// //               <ChatInterface
// //                 key={refreshTrigger}
// //                 chat={{
// //                   ...activeChat,
// //                   messages: activeChatLogs,
// //                 }}
// //                 onSendMessage={handleSendMessage}
// //                 isLoading={isReplyLoading}
// //                 onInstrumentChange={setSelectedInstrument}
// //               />
// //             </ChatWrapper>
// //           </MainContent>
// //         </div>
// //       </PageContainer>
// //     </SidebarProvider>
// //   );
// // };

// import { SidebarProvider } from "../components/ui/sidebar";
// import { AppSidebar } from "../components/app-sidebar";
// import { Header } from "../components/header";
// import ChatInterface from "./Conversation";
// import { useState, useEffect, useContext, useRef } from "react";
// import styled from "styled-components";
// import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
// import logo from "../assets/keysight.png";
// import {
//   useAddChatLog,
//   useChatLogs,
//   useDeleteChat,
//   useNewChat,
//   useRenameChat,
//   useDetectIntent,
// } from "../hook/useChat";
// import UserStatusContext from "../lib/UserStatusContext";
// import { useUpdateSelectedInstrument } from "../hook/useInstrument";

// const PageContainer = styled.div`
//   display: flex;
//   width: 100%;
//   height: 100vh;
//   overflow: hidden;
//   background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
// `;

// const MainContent = styled.main`
//   margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '4rem' : '18rem')};
//   transition: margin-left 0.3s ease;
//   background: transparent;
//   height: 100vh;
//   overflow: hidden;
//   display: flex;
//   flex-direction: column;
//   width: 100%;
// `;

// const ContentContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   flex: 1;
//   padding: ${SPACING.L};
//   overflow-y: auto;
//   height: calc(100vh - 80px);
//   margin-top: 0;
//   padding-bottom: 0;
// `;

// const CenterContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   flex: 1;
//   width: 100%;
//   text-align: center;
//   padding: 2rem;
// `;

// const ChatWrapper = styled.div`
//   width: 100%;
//   max-width: 100%;
//   background: transparent;
//   z-index: 10;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// `;

// const WelcomeSection = styled.div`
//   text-align: center;
//   margin-bottom: 3rem;
// `;

// const LogoContainer = styled.div`
//   width: 120px;
//   height: 120px;
//   margin: 0 auto 2rem;
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   border-radius: 50%;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
//   position: relative;
//   animation: ${({ $animate }) =>
//   ($animate ? 'logoToHeader 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none')};

  
//   &::before {
//     content: '';
//     position: absolute;
//     inset: -10px;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     border-radius: 50%;
//     opacity: 0.2;
//     filter: blur(20px);
//   }

//   @keyframes logoToHeader {
//     0% {
//       transform: scale(1) translateY(0);
//       opacity: 1;
//     }
//     50% {
//       transform: scale(0.5) translateY(-200px);
//       opacity: 0.5;
//     }
//     100% {
//       transform: scale(0) translateY(-400px);
//       opacity: 0;
//     }
//   }
// `;

// const LogoIcon = styled.img`
//   width: 3rem;
//   height: 3rem;
//   object-fit: contain;
//   position: relative;
//   z-index: 1;
// `;

// const Title = styled.h1`
//   font-size: 2.5rem;
//   font-weight: ${FONTWEIGHT.bold};
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   background-clip: text;
//   margin-bottom: 0.5rem;
// `;

// const Subtitle = styled.p`
//   font-size: 1.25rem;
//   color: #6b7280;
//   font-weight: ${FONTWEIGHT.normal};
// `;

// const ExamplesSection = styled.div`
//   margin-top: 2rem;
//   width: 100%;
//   max-width: 900px;
// `;

// const ExamplesLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   margin-bottom: 1rem;
//   font-weight: ${FONTWEIGHT.medium};
// `;

// const ExamplesGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 1rem;
//   width: 100%;
// `;

// const ExampleCard = styled.button`
//   text-align: left;
//   padding: 1.25rem;
//   border: 2px solid #e5e7eb;
//   border-radius: 1rem;
//   background: white;
//   color: #374151;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   font-size: 0.875rem;
//   line-height: 1.5;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

//   &:hover {
//     border-color: #667eea;
//     box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
//     transform: translateY(-2px);
//   }

//   &::before {
//     content: '💡';
//     display: block;
//     font-size: 1.5rem;
//     margin-bottom: 0.5rem;
//   }
// `;

// export const Home = ({
//   chats,
//   activeChatId,
//   setActiveChatId,
//   isChatsLoading,
// }) => {
//   const { user, isLoading } = useContext(UserStatusContext);
//   const { data: activeChatLogs = [] } = useChatLogs(activeChatId);
//   const newChatMutation = useNewChat();
//   const renameChatMutation = useRenameChat();
//   const deleteChatMutation = useDeleteChat();
//   const addChatLogMutation = useAddChatLog();
//   const detectIntentMutation = useDetectIntent();
//   const hasCreatedChatRef = useRef(false);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const updateMessageIdInstrumentMutation = useUpdateSelectedInstrument();
//   const [selectedInstrument, setSelectedInstrument] = useState(null);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [showHeader, setShowHeader] = useState(false);
//   const [showLogoAnimation, setShowLogoAnimation] = useState(false);
//   const [isReplyLoading, setIsReplyLoading] = useState(false);
  
//   // Track if this is a fresh chat (no messages yet)
//   const previousChatIdRef = useRef(activeChatId);
//   const hadNoMessagesRef = useRef(activeChatLogs.length === 0);
//   const [showLogo, setShowLogo] = useState(true);


//   const handlePdfUploadSuccess = () => {
//     setRefreshTrigger((prev) => prev + 1);
//   };

//   useEffect(() => {
//     if (
//       !isChatsLoading &&
//       !isLoading &&
//       user &&
//       chats.length === 0 &&
//       !hasCreatedChatRef.current
//     ) {
//       hasCreatedChatRef.current = true;
//       handleNewChat();
//     }
//   }, [isChatsLoading, isLoading, user, chats]);

//   // Handle header visibility and animation logic
//   useEffect(() => {
//   const hasConversation = activeChatLogs.length > 0;
//   const chatChanged = previousChatIdRef.current !== activeChatId;
//   const wasEmpty = hadNoMessagesRef.current;

//   if (!hasConversation) {
//     // New / empty chat
//     setShowLogo(true);
//     setShowLogoAnimation(false);
//     setShowHeader(false);
//     return;
//   }

//   // Has conversation
//   if (chatChanged) {
//     // Switching chats → no animation
//     setShowLogo(false);
//     setShowLogoAnimation(false);
//     setShowHeader(true);
//   } else if (wasEmpty) {
//     // First message in THIS chat → animate
//     setShowLogo(true);
//     setShowLogoAnimation(true);

//     setTimeout(() => {
//       setShowLogo(false);
//       setShowHeader(true);
//     }, 650); // MUST >= animation duration
//   } else {
//     // Already had messages
//     setShowLogo(false);
//     setShowHeader(true);
//   }

//   previousChatIdRef.current = activeChatId;
//   hadNoMessagesRef.current = !hasConversation;
// }, [activeChatLogs.length, activeChatId]);

  

//   const handleNewChat = async () => {
//     try {
//       const loginSessionId = localStorage.getItem("login_session_id");
//       const newSession = await newChatMutation.mutateAsync({
//         id: user.id,
//         title: `Chat ${chats.length + 1}`,
//         login_session_id: loginSessionId,
//       });
//       setActiveChatId(newSession.session_id);
//       // Reset animation state for new chat
//       setShowLogoAnimation(false);
//       setShowHeader(false);
//     } catch (err) {
//       console.error("Failed to create chat:", err);
//     }
//   };

//   const handleSelectChat = (id) => {
//     setActiveChatId(id);
//   };

//   const handleRenameChat = async (session_id, newName) => {
//     try {
//       await renameChatMutation.mutateAsync({
//         session_id: session_id,
//         new_title: newName,
//       });
//       return true;
//     } catch (err) {
//       console.error("Rename failed", err);
//       return false;
//     }
//   };

//   const handleDeleteChat = async (session_id) => {
//     try {
//       await deleteChatMutation.mutateAsync(session_id);
//       if (activeChatId === session_id) {
//         const remainingChats = chats.filter(
//           (chat) => chat.session_id !== session_id
//         );
//         setActiveChatId(remainingChats[0]?.session_id ?? null);
//       }
//       return true;
//     } catch (err) {
//       console.error("Delete failed", err);
//       return false;
//     }
//   };

//   const handleSendMessage = async (message, selectedInstrumentId) => {
//     // Only send message if there's actual content
//     if (!message || !message.trim()) {
//       return;
//     }

//     setIsReplyLoading(true);
//     try {
//       await addChatLogMutation.mutateAsync({
//         session_id: activeChatId,
//         role: "user",
//         content: message,
//       });

//       const response = await detectIntentMutation.mutateAsync({
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
//     } catch (err) {
//       console.error("Message submission failed:", err);
//     } finally {
//       setIsReplyLoading(false);
//     }
//   };

//   const activeChat = chats.find((chat) => chat.session_id === activeChatId);
//   const hasConversation = activeChatLogs.length > 0;

//   const examples = [
//     "Generate test case to measure the voltage on channel 1.",
//     "Enable output :OUTP ON, set voltage to 12 V on channel 6 for fan test.",
//     "Explain ROUT:SCAN (@101:110)",
//   ];

//   return (
//     <SidebarProvider defaultOpen={true}>
//       <PageContainer>
//         <div className="flex min-h-screen w-full">
//           <AppSidebar
//             chats={chats}
//             activeChat={activeChat}
//             onNewChat={handleNewChat}
//             onSelectChat={handleSelectChat}
//             onRenameChat={handleRenameChat}
//             onDeleteChat={handleDeleteChat}
//             isChatsLoading={isChatsLoading}
//             onPdfUploadSuccess={handlePdfUploadSuccess}
//             selectedInstrument={selectedInstrument}
//             collapsed={sidebarCollapsed}
//             onCollapsedChange={setSidebarCollapsed}
//           />
//           <MainContent $sidebarCollapsed={sidebarCollapsed}>
//             {showHeader && <Header />}
//             <ContentContainer>
//               {!hasConversation && (
//                 <CenterContainer>
//                   <WelcomeSection>
//                     <LogoContainer $animate={showLogoAnimation}>
//                       <LogoIcon src={logo} alt="KeysightGPT Logo" />
//                     </LogoContainer>
//                     <Title>Hi there, {user?.name || 'User'}</Title>
//                     <Subtitle>How can I help you today?</Subtitle>
//                   </WelcomeSection>
//                   <ExamplesSection>
//                     <ExamplesLabel>Try these examples</ExamplesLabel>
//                     <ExamplesGrid>
//                       {examples.map((example, index) => (
//                         <ExampleCard
//                           key={index}
//                           onClick={() => handleSendMessage(example)}
//                         >
//                           {example}
//                         </ExampleCard>
//                       ))}
//                     </ExamplesGrid>
//                   </ExamplesSection>
//                 </CenterContainer>
//               )}
//             </ContentContainer>
//             <ChatWrapper>
//               <ChatInterface
//                 key={refreshTrigger}
//                 chat={{
//                   ...activeChat,
//                   messages: activeChatLogs,
//                 }}
//                 onSendMessage={handleSendMessage}
//                 isLoading={isReplyLoading}
//                 onInstrumentChange={setSelectedInstrument}
//               />
//             </ChatWrapper>
//           </MainContent>
//         </div>
//       </PageContainer>
//     </SidebarProvider>
//   );
// };

import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Header } from "../components/header";
import ChatInterface from "./Conversation";
import { useState, useEffect, useContext, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
import logo from "../assets/keysight.png";


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
  z-index: 10;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
  position: relative;
  animation: ${({ $animate }) =>
  ($animate ? 'logoToHeader 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none')};

  
  &::before {
    content: '';
    position: absolute;
    inset: -10px;
    background: ${({ theme }) => theme.home.logoGradient};
    border-radius: 50%;
    opacity: 0.2;
    filter: blur(20px);
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
  const [showLogoAnimation, setShowLogoAnimation] = useState(false);

  const handleSendMessage = async (message, selectedInstrumentId) => {
    // Trigger logo animation on first message
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
                isLoading={isReplyLoading}
                onInstrumentChange={setSelectedInstrument}
              />
            </ChatWrapper>
          </MainContent>
        </div>
      </PageContainer>
    </SidebarProvider>
  );
};