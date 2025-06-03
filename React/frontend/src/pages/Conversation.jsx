import { useState, useRef, useEffect } from "react"
import * as React from 'react'
import Button from '@mui/material/Button'
import { Send, Loader2, Upload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/reusable/Tooltip"
import { COLORS, SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles"
import styled, { keyframes } from "styled-components"
import { CircleUserRound } from "lucide-react"


// Animation
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${COLORS.background.light};
  
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.lg};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xl};
`

const InputArea = styled.div`
  padding: ${SPACING.lg};

  background-color: ${COLORS.background.light};
`

const UserMessageContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.lg};

`
const UserMessageBubble = styled.div`
  background-color: ${COLORS.greyblue};
  border-radius: 1rem;
  padding: 10px 25px 10px 25px;
  margin-right:1rem;
  max-width: 44rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`

const UserMessageContent = styled.div`
  color: ${COLORS.black};
  font-weight: ${FONTWEIGHT.medium};
  word-wrap: break-word;
  white-space: pre-wrap;
`

const BotMessageContainer = styled.div`
  position: relative;
`
const BotMessageContent = styled.div`
  color: ${COLORS.black};
  line-height: 1.625;
  max-width: 64rem;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-family: sans-serif;
`

const LoadingContainer = styled.div`
  color: ${COLORS.black};
  line-height: 1.625;
  max-width: 64rem;
`

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  color: ${COLORS.black};
`

const LoadingIcon = styled(Loader2)`
  height: ${FONTSIZE.lg};
  width: ${FONTSIZE.lg};
  animation: ${spin} 1s linear infinite;
`



const MessageTextArea = styled.textarea`
  width: 100%;
  min-height: 2.5rem;
  max-height: 12rem;
  padding: ${SPACING.md};
  padding-right: 3rem; // <- Leave space for icon
  background-color: ${props => props.$isLoading ? COLORS.background.light : COLORS.background.medium};
  border: 1px solid ${COLORS.lightblue};
  border-radius: 1rem;
  outline: none;
  color: ${COLORS.black};
  opacity: ${props => props.$isLoading ? 0.5 : 1};
  resize: none;
  line-height: 1.5;
  font-family: inherit;
  font-size: ${FONTSIZE.base};
  overflow-y: auto;
  box-sizing: border-box;
`
const SubmitButton = styled(Button)`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: transparent;
  color: ${COLORS.grey};
  opacity: ${props => (props.$isLoading || !props.$hasValue) ? 0.5 : 1};
  border: none;
  height: 2rem;
  width: 2rem;
  min-width: unset;
  padding: 0;
  z-index: 2;
`

const CopyButton = styled(Button)`
  position: absolute;
  right: ${SPACING.md};
  top: 50%;
  transform: translateY(-50%);
  background-color: ${COLORS.blue};
  border: 1px solid ${COLORS.border};
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  opacity: 0;
  transition: opacity 200ms;

  &:hover {
    opacity: 1;
  }
`
const MessageForm = styled.form`
  position: relative;
  width: 100%;
`

// Main Export Component
export default function ChatInterface({ chat = { messages: [] }, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages, isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue)
      setInputValue("")
    }
  }

  return (
    <Container>
      <MessagesContainer>
        {chat.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputArea>
        <MessageInput 
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </InputArea>
    </Container>
  )
}

// Sub-components
function Message({ message }) {
  return message.role === "user" ? (
    <UserMessage message={message} />
  ) : (
    <BotMessage message={message} />
  )
}

function UserMessage({ message }) {
  return (
    
    <UserMessageContainer>
      <UserMessageBubble>
      <UserMessageContent>
        {message.content}
      </UserMessageContent>
      </UserMessageBubble>
      
      <CircleUserRound />
       
    </UserMessageContainer>
   
  )
}

function BotMessage({ message }) {
  return (
    <BotMessageContainer>
      <BotMessageContent>
        {message.content}
      </BotMessageContent>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CopyButton variant="ghost" size="icon">
              <Upload size={16} style={{ color: COLORS.black }} />
            </CopyButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load this test sequence into PTEM</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </BotMessageContainer>
  )
}

function LoadingIndicator() {
  return (
    <LoadingContainer>
      <LoadingContent>
        <LoadingIcon />
        <span>Generating response...</span>
      </LoadingContent>
    </LoadingContainer>
  )
}

function MessageInput({ value, onChange, onSubmit, isLoading }) {
  const textareaRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <MessageForm onSubmit={onSubmit}>
      <MessageTextArea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type message (Shift+Enter for newline)"
        rows={1}
        $isLoading={isLoading}
        disabled={isLoading}
      />
      <SubmitButton
        type="submit"
        size="icon"
        $isLoading={isLoading}
        $hasValue={!!value.trim()}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? <LoadingIcon /> : <Send size={16} />}
      </SubmitButton>
    </MessageForm>
  )

}