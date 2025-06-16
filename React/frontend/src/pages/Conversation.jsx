import { useState, useRef, useEffect } from "react";
import * as React from "react";
import Button from "@mui/material/Button";
import {
  Send,
  Loader2,
  Upload,
  Copy,
  Star,
  StarOff,
  Edit3,
  History,
  ArrowLeft,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/reusable/Tooltip";
import { COLORS, SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import styled, { keyframes } from "styled-components";
import { CircleUserRound } from "lucide-react";
import {
  useModifyChatLog,
  useVersionChatLogs,
  useDetectIntent,
} from "../hook/useChat";
import { getVersionChatLogs } from "../services/chatServices";
import pdfIcon from '../assets/pdf.png';
// Animation
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.background};
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.lg};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xl};
`;

const InputArea = styled.div`
  padding: ${SPACING.lg};
  background-color: ${({ theme }) => theme.background};
`

const UserMessageContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.lg};
`;

const UserMessageBubble = styled.div`
  background-color: ${({ theme }) => theme.newChat};
  border-radius: 1rem;
  padding: 10px 25px;
  margin-right: 1rem;
  max-width: 44rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const UserMessageContent = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: ${FONTWEIGHT.normal};
  font-size: ${FONTSIZE.sm};
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const BotMessageContainer = styled.div`
  position: relative;
`;

const BotMessageContent = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: ${FONTWEIGHT.normal};
  line-height: 1.625;
  max-width: 64rem;
  word-wrap: break-word;
  white-space: pre-wrap;
`

const LoadingContainer = styled.div`
  color: ${({ theme }) => theme.text};
  line-height: 1.625;
  max-width: 64rem;
`;

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  color: ${({ theme }) => theme.text};
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
  background-color: ${({ $isLoading, theme }) =>
    $isLoading ? theme.background : theme.backgroundMedium};
  border: 1px solid ${({ theme }) => theme.status.tick};
  border-radius: 1rem;
  outline: none;
  color: ${({ theme }) => theme.text};
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};
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
  background-color: transparent;
  color: ${({ theme }) => theme.status.cancel};
  opacity: ${({ $isLoading, $hasValue }) => ($isLoading || !$hasValue ? 0.5 : 1)};
`

const UploadButton = styled(Button)`
  position: relative;
  top: -15px;
  background-color: transparent;
  color: ${({ theme }) => theme.status.cancel};
  font-size: ${FONTSIZE.sm};

  &:hover {
    background-color: ${({ theme }) => theme.hover};
  }
`
const MessageForm = styled.form`
  width: 100%;
`
const TextAreaWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// pdf
const PdfContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING.sm} ${SPACING.md};
  margin-bottom: ${SPACING.md};
  border: 1px solid ${({ theme }) => theme.greys.light};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.primaryLight};
  max-width: 33%;
  margin-left: 4.5rem;

  @media (max-width: 768px) {
    max-width: 90%;
    margin-left: 1rem;
  }
`;

const PdfName = styled.span`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: ${FONTSIZE.sm};
  color: ${({ theme }) => theme.text};
`;

const PdfIcon = styled.img`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.greys.medium};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.status.delete};
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.sm};
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 200ms;

  &:hover {
    opacity: 1;
  }
`;
const ActionButton = styled(Button)`
  min-width: auto;
  padding: ${SPACING.xs};
    background-color: ${({ theme }) => theme.background};
  border: 1px solid ${COLORS.border};
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
`;

const EditTextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #c0dbea;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  resize: vertical;
`;

const VersionHistoryIndicator = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.875rem;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export default function ChatInterface({ chat, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [messageVersions, setMessageVersions] = useState({});
  const [currentVersions, setCurrentVersions] = useState({});
  const [viewingHistory, setViewingHistory] = useState(null);
  const [versionData, setVersionData] = useState({});
  const messagesEndRef = useRef(null);
  const modifyChatLogMutation = useModifyChatLog();
  const [pdfFile, setPdfFile] = useState(null) // ✅ Add this

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isLoading]);

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
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = async (message, editContent) => {
    try {
      console.log(
        "testing",
        message.message_id,
        message.session_id,
        message.role,
        editContent
      );
      await modifyChatLogMutation.mutateAsync({
        message_id: message.message_id,
        session_id: message.session_id,
        role: message.role,
        content: editContent,
        has_been_modified: true,
      });

      setEditingMessageId(null);
      setEditContent("");
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleViewVersion = async (messageId) => {
    try {
      const data = await getVersionChatLogs(messageId);
      setVersionData({ [messageId]: data || [] });
      setViewingHistory(messageId);
    } catch (err) {
      console.error("Error fetching version:", err);
    }
  };

  const handleBackToCurrent = () => {
    setViewingHistory(null);
    setVersionData({});
  };
  const getMessageContent = (message) => {
    if (viewingHistory === message.message_id) {
      const versions = messageVersions[message.message_id] || [];
      if (versions.length > 0) {
        return versions[0].old_content; // Show the first (most recent) version
      }
    }
    return message.content;
  };

  const handleUpload = (content) => {
    // Simulate upload functionality
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <Container>
      <MessagesContainer>
        {viewingHistory && versionData[viewingHistory]
          ? (() => {
            console.log("🧠 Version Viewer Debug Info:");
            console.log("viewingHistory:", viewingHistory);
            console.log("versionData:", versionData);
            console.log(
              "versionData[viewingHistory]:",
              versionData[viewingHistory]
            );
            console.log("Number of response:", versionData.responses);

            return (
              <PreviousVersionViewer
                versions={versionData[viewingHistory]}
                onBack={handleBackToCurrent}
              />
            );
          })()
          : chat.messages.map((message) => (
            <Message
              key={message.message_id}
              message={message}
              isEditing={editingMessageId === message.message_id}
              editContent={editContent}
              setEditContent={setEditContent}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onCopy={copyToClipboard}
              onEdit={handleEditMessage}
              onUpload={handleUpload}
              versions={messageVersions[message.message_id] || []}
              currentVersionIndex={currentVersions[message.message_id]}
              isViewingHistory={viewingHistory === message.message_id}
              onViewVersion={handleViewVersion}
              onBackToCurrent={handleBackToCurrent}
              getMessageContent={getMessageContent}
            />
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
  );
}

function PreviousVersionViewer({ versions, onBack }) {
  return (
    <div>
      {versions.map((logVersion) => (
        <div key={logVersion.version_id}>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Edited at:</strong>{" "}
            {new Date(logVersion.edited_at).toLocaleString()}
            <UserMessageContainer>
              <UserMessageBubble>
                <UserMessageContent>
                  {logVersion.old_content}
                </UserMessageContent>
              </UserMessageBubble>
              <CircleUserRound />
            </UserMessageContainer>

          </div>
          {logVersion.responses.map((response) =>
            response.role === "user" ? (
              <UserMessageContainer>
                <UserMessageBubble>
                  <UserMessageContent>
                    <UserMessageBubble key={response.message_id}>
                      <UserMessageContent>{response.content}</UserMessageContent>
                    </UserMessageBubble>
                  </UserMessageContent>
                </UserMessageBubble>
              </UserMessageContainer>
            ) : (
              <BotMessageContainer key={response.message_id}>
                <BotMessageContent>{response.content}</BotMessageContent>
              </BotMessageContainer>
            )
          )}
          <hr style={{ margin: "1rem 0" }} />
        </div>
      ))}

      <Button onClick={onBack} startIcon={<ArrowLeft size={14} />}>
        Back to current conversation
      </Button>
    </div>
  );
}

function Message({
  message,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  onCopy,
  onEdit,
  onUpload,
  isStarred,
  versions,
  currentVersionIndex,
  isViewingHistory,
  onViewVersion,
  onBackToCurrent,
  getMessageContent,
}) {
  return message.role === "user" ? (
    <UserMessage
      message={message}
      isEditing={isEditing}
      editContent={editContent}
      setEditContent={setEditContent}
      onSaveEdit={onSaveEdit}
      onCancelEdit={onCancelEdit}
      onCopy={onCopy}
      onEdit={onEdit}
      versions={versions}
      currentVersionIndex={currentVersionIndex}
      isViewingHistory={isViewingHistory}
      onViewVersion={onViewVersion}
      onBackToCurrent={onBackToCurrent}
      getMessageContent={getMessageContent}
    />
  ) : (
    <BotMessage
      message={message}
      onCopy={onCopy}
      onUpload={onUpload}
      isStarred={isStarred}
      versions={versions}
      currentVersionIndex={currentVersionIndex}
      isViewingHistory={isViewingHistory}
      onViewVersion={onViewVersion}
      onBackToCurrent={onBackToCurrent}
      getMessageContent={getMessageContent}
    />
  );
}

function UserMessage({
  message,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  onCopy,
  onEdit,
  versions,
  currentVersionIndex,
  isViewingHistory,
  onViewVersion,
  onBackToCurrent,
  getMessageContent,
}) {
  const messageContent = getMessageContent(message);

  return (
    <BotMessageContainer>
      <UserMessageContainer>
        <UserMessageBubble>
          {isEditing ? (
            <div>
              <EditTextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <ActionButtons>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionButton onClick={onCancelEdit}>
                        <X size={16} />
                      </ActionButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionButton
                        onClick={() => onSaveEdit(message, editContent)}
                      >
                        <Check size={16} />
                      </ActionButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ActionButtons>
            </div>
          ) : (
            <>
              <UserMessageContent>{messageContent}</UserMessageContent>

              {isViewingHistory && (
                <VersionHistoryIndicator>
                  <span>Viewing previous version</span>
                  <Button
                    size="small"
                    onClick={() => onBackToCurrent(message.message_id)}
                    startIcon={<ArrowLeft size={14} />}
                  ></Button>
                </VersionHistoryIndicator>
              )}
            </>
          )}
        </UserMessageBubble>
        <CircleUserRound />
      </UserMessageContainer>
      <ActionButtons>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => onCopy(messageContent)}>
                <Copy size={16} />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy message</p>
            </TooltipContent>
          </Tooltip>
          {!isViewingHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  onClick={() => onEdit(message.message_id, message.content)}
                >
                  <Edit3 size={16} />
                </ActionButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit message</p>
              </TooltipContent>
            </Tooltip>
          )}
          {message.has_been_modified && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  onClick={() =>
                    isViewingHistory
                      ? onBackToCurrent(message.message_id)
                      : onViewVersion(message.message_id)
                  }
                >
                  <History size={16} />
                </ActionButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isViewingHistory ? "Back to current" : "View history"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </ActionButtons>
    </BotMessageContainer>
  );
}

function BotMessage({
  message,
  onCopy,
  onStar,
  onUpload,
  isStarred,
  versions,
  currentVersionIndex,
  isViewingHistory,
  onViewVersion,
  onBackToCurrent,
  getMessageContent,
}) {
  const messageContent = getMessageContent(message);

  return (
    <BotMessageContainer>
      <BotMessageContent>{messageContent}</BotMessageContent>

      {isViewingHistory && (
        <VersionHistoryIndicator>
          <span>Viewing previous version</span>
          <Button
            size="small"
            onClick={() => onBackToCurrent(message.message_id)}
            startIcon={<ArrowLeft size={14} />}
          ></Button>
        </VersionHistoryIndicator>
      )}

      <ActionButtons>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => onCopy(messageContent)}>
                <Copy size={16} />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy message</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => onUpload(messageContent)}>
                <Upload size={16} />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save response</p>
            </TooltipContent>
          </Tooltip>

          {versions.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  onClick={() =>
                    isViewingHistory
                      ? onBackToCurrent(message.message_id)
                      : onViewVersion(message.message_id)
                  }
                >
                  <History size={16} />
                </ActionButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>See previous versions ({versions.length})</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </ActionButtons>
    </BotMessageContainer>
  );
}

function LoadingIndicator() {
  return (
    <LoadingContainer>
      <LoadingContent>
        <LoadingIcon />
        <span>Generating response...</span>
      </LoadingContent>
    </LoadingContainer>
  );
}

function MessageInput({ value, onChange, onSubmit, isLoading, pdfFile, setPdfFile }) {
  const textareaRef = useRef(null)
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

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
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <>
      {pdfFile && (
        <PdfContainer>
          <PdfName>
            <PdfIcon src={pdfIcon} alt="PDF icon" />
            {pdfFile.name}
          </PdfName>
          <RemoveButton onClick={() => setPdfFile(null)} aria-label="Remove PDF" type="button">
            <X size={16} />
          </RemoveButton>
        </PdfContainer>
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
