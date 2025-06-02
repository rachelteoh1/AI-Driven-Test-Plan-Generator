import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { Header } from "../components/header"
import ChatInterface from "./Conversation"
import { useState } from "react"
import styled from "styled-components"
import { FONTSIZE,FONTWEIGHT,SPACING,COLORS } from "../lib/styles"





// Styled components
const PageContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`

const MainContent = styled.main`
  margin-left: 12rem;
  background-color: ${COLORS.background.light};
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
`
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
  margin-left:0rem;
`

const CenterContainer = styled.div`
margin-top:10rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1; /* take all available space */
  width: 100%;
  text-align: center;
`
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
`

const TextContainer = styled.div`
  text-align: center;
`

const Title = styled.h1`
  font-size: ${FONTSIZE.XL};
  font-weight: ${FONTWEIGHT.bold};
  color: ${COLORS.black};
  margin-bottom: ${SPACING.md};
`
const HeaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 16rem; /* width of the sidebar */
  right: 0;
  height: ${SPACING.xl};
  background-color: ${COLORS.white};
  z-index: 20;
  border-bottom: 1px solid #e5e7eb;
`
const ExamplesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
  margin-top: ${SPACING.md};
`

const ExampleButton = styled.button`
  width: 100%;
  text-align: left;
  padding: ${SPACING.md};
  border: 1px ;
  border-radius: 0.5rem;
  background-color: ${COLORS.background.light};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.background.medium};
  }
`

export function Home() {
  const [chat, setChat] = useState({ messages: [] })
  const [isLoading, setIsLoading] = useState(false)
   const hasConversation = chat.messages.length > 0

  const handleSendMessage = async (message) => {
    const userMessage = { id: Date.now(), role: 'user', content: message }
    setChat((prev) => ({ messages: [...prev.messages, userMessage] }))
    setIsLoading(true)

    // Simulate async AI reply
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `You said: "${message}"`
      }
      setChat((prev) => ({ messages: [...prev.messages, botMessage] }))
      setIsLoading(false)
    }, 1000)
  }
  // const[examples, onSelectExample]= useState([
  //   "Generate test case to measure the voltage on channel 1.",
  //   "Test case to perform a diode forward voltage check.",
  //   "Explain ROUT:SCAN (@101:110).",
  // ])
  

  const examples = [  // direct array declaration
    "Generate test case to measure the voltage on channel 1.",
    "Test case to perform a diode forward voltage check.",
    "Explain ROUT:SCAN (@101:110).",
  ]
  
  return (
    <SidebarProvider defaultOpen={true}>
      <PageContainer>
        <AppSidebar />
        <MainContent>
          <HeaderWrapper>
          <Header /></HeaderWrapper>
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
              chat={chat}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </ChatWrapper>
        </MainContent>
      </PageContainer>
    </SidebarProvider>
  )
}