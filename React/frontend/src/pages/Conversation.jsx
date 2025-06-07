import { useState, useRef, useEffect } from "react"
import * as React from 'react'
import Button from '@mui/material/Button'
import { Send, Loader2, Upload, X, FileText } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/reusable/Tooltip"
import { COLORS, SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles"
import styled, { keyframes } from "styled-components"
import { CircleUserRound } from "lucide-react"
import pdfIcon from '../assets/pdf.png';



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
  padding: 12px 40px 12px 16px;
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
  left: 600px;
  bottom: 43px; 
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${COLORS.grey};
  opacity: ${props => (props.$isLoading || !props.$hasValue) ? 0.5 : 1};
`

const UploadButton = styled(Button)`
  position: relative;
  top: -15px; /* 👈 move it higher */
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: ${COLORS.grey};
  font-size: ${FONTSIZE.sm};

  &:hover {
    background-color: ${COLORS.darkblue};
  }
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
  width: 100%;
`
const TextAreaWrapper = styled.div`
  position: relative;
  width: 100%;
`;


// Main Export Component
export default function ChatInterface({ chat = { messages: [] }, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState("")
  const [pdfFile, setPdfFile] = useState(null) // ✅ Add this

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages, isLoading])

const handleSubmit = (e) => {
  e.preventDefault()
  if (!isLoading) {
    if (inputValue.trim()) {
      // If there is text input, send it along with PDF file if any
      onSendMessage(inputValue, pdfFile)
    } else if (pdfFile) {
      // If no text but PDF uploaded, send the PDF file name only
      onSendMessage(null, pdfFile)
    }
    setInputValue("")
    setPdfFile(null)
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
          pdfFile={pdfFile}             // ✅ pass the file
          setPdfFile={setPdfFile}       // ✅ pass the setter
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

function MessageInput({ value, onChange, onSubmit, isLoading, pdfFile, setPdfFile }) {
  const textareaRef = useRef(null)
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setPdfFile(file);
      } else {
        alert("Only PDF files are allowed.");
      }
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = null;
  };


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <>
      {pdfFile && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          marginBottom: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          maxWidth: "33%",
          marginLeft: "4.5rem",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: '0.9rem' }}>
            <img
              src={pdfIcon}
              alt="PDF icon"
              style={{ width: 18, height: 18 }}
            />
            {pdfFile.name}
          </span>
          <button
            onClick={() => setPdfFile(null)}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Remove PDF"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}


      <MessageForm onSubmit={onSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadButton component="label">
            <Upload size={16} style={{ marginRight: 4 }} />
            <input
              key={pdfFile ? pdfFile.name : "empty"} // force remount input on file change
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </UploadButton>

          <TextAreaWrapper style={{ flex: 1, position: 'relative' }}>
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
              disabled={isLoading || (!value.trim() && !pdfFile)}
              $isLoading={isLoading}
              $hasValue={!!value.trim() || !!pdfFile}
            >
              {isLoading ? <LoadingIcon /> : <Send size={16} />}
            </SubmitButton>

          </TextAreaWrapper>
        </div>
      </MessageForm>
    </>
  );
}