import { useState, useRef, useEffect } from "react";
import * as React from "react";
import Button from "@mui/material/Button";
import ScanInstrumentModal from "../modal/ScanInstrumentModal";
import { useAllInstruments, useScanInstrument, useSelectInstrument, useDeleteInstrument, useDeleteAllInstrument } from "../hook/useInstrument";
import useModal from "../modal/useModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Badge } from "@mui/icons-material"
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
  ChevronDown,
  Radar,
  Trash2,
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
import { useGetAllInstruments } from "../hook/usePdf";
import ScanResultsModal from "../modal/ScantResultModal";
import CrossedModal from "../modal/CrossedModal";
import InstrumentNotFoundModal from "../modal/InstrumentNotFoundModal";

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
`;

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
`;

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
  font-size: ${FONTSIZE.sm};
  line-height: 1.625;
  max-width: 64rem;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

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
`;

const LoadingIcon = styled(Loader2)`
  height: ${FONTSIZE.lg};
  width: ${FONTSIZE.lg};
  animation: ${spin} 1s linear infinite;
`;

const MessageTextArea = styled.textarea`
  width: 100%;
  min-height: 2.5rem;
  max-height: 12rem;
  max-width: 38rem;
  padding: 12px 16px;
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
  font-weight: ${FONTWEIGHT.normal};
  overflow-y: auto;
  box-sizing: border-box;
  z-index: 1;
`;

const GhostText = styled.span`
  position: absolute;
  top: 30%;
  left: 16.55px;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.greys.medium};
  pointer-events: none;
  font-size: ${FONTSIZE.base};
  font-weight: ${FONTWEIGHT.normal};
  line-height: 1.5;
  font-family: inherit;
  white-space: nowrap;
  opacity: 0.5;
  z-index: 0;
`;
const SubmitButton = styled(Button)`
  left: 590px;
  bottom: 43px;
  background-color: transparent;
  color: ${({ theme }) => theme.status.cancel};
  opacity: ${({ $isLoading, $hasValue }) =>
    $isLoading || !$hasValue ? 0.5 : 1};
`;

const ScanInstrumentButton = styled(Button)`
  bottom: 15px;
  background-color: transparent;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.status.cancel};

  img {
    display: block;
  }
`;
const MessageForm = styled.form`
  width: 100%;
`;

const TextAreaWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.sm};
  justify-content: flex-end;
`;
const ActionButtonsHover = styled.div`
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
  background-color: ${COLORS.background.light};
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

export default function ChatInterface({ chat, onSendMessage, isLoading, onInstrumentChange }) {
  const [inputValue, setInputValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [messageVersions, setMessageVersions] = useState({});
  const [currentVersions, setCurrentVersions] = useState({});
  const [viewingHistory, setViewingHistory] = useState(null);
  const [versionData, setVersionData] = useState({});
  const messagesEndRef = useRef(null);
  const modifyChatLogMutation = useModifyChatLog();
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [scpiSuggestions, setScpiSuggestions] = useState([]);
  const [ghostText, setGhostText] = useState("");
  const { showModal, hideModal } = useModal();
  const [isScanning, setIsScanning] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState(null);


  const {
    data: instrumentsData,
    isLoading: instrumentsLoading,
    error: instrumentsError,
  } = useGetAllInstruments();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isLoading]);


  useEffect(() => {
    console.log("useEffect triggered", { instrumentsData, instrumentsLoading, selectedInstrument });
    if (!selectedInstrument) return;

    // If selectedInstrument has a json_url_manual, fetch it directly
    if (selectedInstrument.json_url_manual) {
      fetch(selectedInstrument.json_url_manual)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("Fetched SCPI JSON data:", data);
          setScpiSuggestions(data);
        })
        .catch((err) => {
          console.error("Error fetching SCPI JSON:", err);
        });
    } else {
      setScpiSuggestions([]);
      showModal({
        modal: <InstrumentNotFoundModal hideModal={hideModal} />
      });
      console.warn("Instrument not found. Upload a PDF to get started.");
    }
  }, [instrumentsData, instrumentsLoading, selectedInstrument]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && inputValue.trim()) {
      onSendMessage(inputValue, selectedInstrument?.id);
      setInputValue("");
    }
  };


  const { data: instrumentData = [], isLoading:isGettingAllInstrument } = useAllInstruments();

  const scanMutation = useScanInstrument();
  const selectMutation = useSelectInstrument();
  const deleteInstrumentMutation = useDeleteInstrument();
  const deleteAllInstrumentMutation = useDeleteAllInstrument();

  console.log("Session_ID:", chat.session_id);


  const handleScanInstrument = () => {
    scanMutation.mutate(undefined, {
      onSuccess: (scannedInstruments) => {
        if (scannedInstruments.length > 0) {
          showModal({
            modal: (
              <ScanResultsModal
                hideModal={hideModal}
                detectedInstruments={scannedInstruments}
                onSelectInstrument={(instrument) => {
                  console.log("Instrument passed to onSelectInstrument:", instrument);
                  selectMutation.mutate({
                    instrument_id: instrument.id,
                    session_id: chat.session_id,
                  }, {
                    onSuccess: (response) => {
                      setSelectedInstrument(response);
                      if (onInstrumentChange) {
                        onInstrumentChange(response);
                      }
                      hideModal();
                    }
                  });
                }}
                selectedInstrument={selectedInstrument}
              />
            ),
          });
        } else {
          showModal({
            modal: (
              <CrossedModal
                title="No instruments detected"
                description="Make sure instrument is connected."
                hideModal={hideModal}
              />
            ),
          });
        }
      },
    });
  };

  // const handleSubmitInstrument = (e) => {
  //   e.preventDefault()
  //   if (inputValue.trim()) {
  //     console.log("Submitting:", inputValue, "with instrument:", selectedInstrument)
  //     setInputValue("")
  //   }
  // }


  // const handleSelectInstrument = async (instrument) => {
  //   try {
  //     const response = await selectMutation.mutateAsync({
  //       instrument_id: instrument.id,
  //       session_id: chat.session_id,
  //     });
  //     console.log("API select response:", response);
  //     setSelectedInstrument(response); // response is from API
  //   } catch (err) {
  //     console.error("Failed to select instrument:", err);
  //   }
  // };
  const handleSelectInstrument = async (instrument) => {
    try {
      const response = await selectMutation.mutateAsync({
        instrument_id: instrument.id,
        session_id: chat.session_id,
      });
      // Find the full instrument object from instrumentsData
      const instruments = instrumentsData?.instruments || [];
      const fullInstrument = instruments.find(inst => inst.id === response.id);

      setSelectedInstrument(fullInstrument || response);

      // Notify parent (Home.jsx) of the change
      if (onInstrumentChange) {
        onInstrumentChange(fullInstrument || response);
      }
    } catch (err) {
      console.error("Failed to select instrument:", err);
    }
  };

  const handleDeleteInstrument = (instrumentId) => {
    if (selectedInstrument?.id === instrumentId) {
      setSelectedInstrument(null);
    }
    deleteInstrumentMutation.mutate({ instrument_id: instrumentId });
  };

  const handleDeleteAllInstruments = () => {
    setSelectedInstrument(null);
    deleteAllInstrumentMutation.mutate();
  };


  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // reset after 2s
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

const handleInputChange = (value) => {
  setInputValue(value);

  if (!value.trim()) {
    setGhostText("");
    return;
  }

  const rawParts = value.split(" ");
  let parts = rawParts.filter((p, idx) => p !== "" || idx < rawParts.length - 1);

  if (value.endsWith(" ") && parts[parts.length - 1] !== "") {
    parts.push(""); // placeholder for suggestion
  }

  console.log("Parts:", parts);

  let node = scpiSuggestions;
  let ghost = "";

  const metaKeys = ["command", "description", "parameters", "values"];

  // --- 1️⃣ Traverse hierarchy only ---
  let i = 0;
  for (; i < parts.length; i++) {
    const part = parts[i];
    if (!node || typeof node !== "object") break;

    // ignore metadata keys
    const keys = Object.keys(node).filter((k) => !metaKeys.includes(k));

    // stop hierarchy traversal once parameters exist
    if (node.parameters) break;

    if (i < parts.length - 1 || part !== "") {
      const match = keys.find((k) =>
        k.toLowerCase().startsWith(part.toLowerCase())
      );
      if (match) {
        if (match.toLowerCase() !== part.toLowerCase()) {
          ghost = match.slice(part.length);
          setGhostText(ghost);
          return;
        }
        node = node[match]; // go deeper
      } else {
        break;
      }
    } else {
      if (keys.length > 0) {
        ghost = keys[0];
        setGhostText(ghost);
        return;
      }
    }
  }

  // --- 2️⃣ Suggest parameters ---
  if (node.parameters && i === parts.length - 1) {
    const typed = parts[parts.length - 1].toLowerCase();
    const match = node.parameters.find((p) =>
      p.toLowerCase().startsWith(typed)
    );
    if (match && match.toLowerCase() !== typed) {
      ghost = match.slice(typed.length);
      setGhostText(ghost);
      return;
    }
  }

  // --- 3️⃣ Suggest values for selected parameter ---
  if (node.parameters && node.values) {
    const lastWord = parts[parts.length - 2]?.toLowerCase(); // param name
    const typed = parts[parts.length - 1].toLowerCase();

    const vals = node.values[lastWord] || [];

    const match = vals.find((v) => v.toLowerCase().startsWith(typed));
    if (match && match.toLowerCase() !== typed) {
      ghost = match.slice(typed.length);
    } else {
      ghost = "";
    }
  }

  setGhostText(ghost);
};



  const handleKeyDown = (e) => {

    if (e.key === " ") {
      e.preventDefault();
      handleInputChange(inputValue + " ");
    } else if ((e.key === "Tab" || e.key === "ArrowRight") && ghostText) {
      e.preventDefault();
      setInputValue((prev) => prev + ghostText);
      setGhostText("");
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Container>
      <MessagesContainer>
        {viewingHistory && versionData[viewingHistory]
          ? (() => {
            console.log(" Version Viewer Debug Info:");
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
              onCopy={(text) => copyToClipboard(text, message.message_id)}
              onEdit={handleEditMessage}
              versions={messageVersions[message.message_id] || []}
              currentVersionIndex={currentVersions[message.message_id]}
              isViewingHistory={viewingHistory === message.message_id}
              onViewVersion={handleViewVersion}
              onBackToCurrent={handleBackToCurrent}
              getMessageContent={getMessageContent}
              copiedMessageId={copiedMessageId}

            />
          ))}

        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputArea>
        <MessageInput
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          ghostText={ghostText}
          onKeyDown={handleKeyDown}
          onScan={handleScanInstrument}
          selectedInstrument={selectedInstrument}
          handleDeleteAllInstruments={handleDeleteAllInstruments}
          handleDeleteInstrument={handleDeleteInstrument}
          handleSelectInstrument={handleSelectInstrument}
          isScanning={isScanning}
          instrumentData={instrumentData}
          isGettingAllInstrument ={isGettingAllInstrument}

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
                <UserMessageBubble key={response.message_id}>
                  <UserMessageContent>{response.content}</UserMessageContent>
                </UserMessageBubble>
                <CircleUserRound />
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
  isStarred,
  versions,
  currentVersionIndex,
  isViewingHistory,
  onViewVersion,
  onBackToCurrent,
  getMessageContent,
  copiedMessageId,
  onScan
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
      copiedMessageId={copiedMessageId}
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
      isStarred={isStarred}
      versions={versions}
      copiedMessageId={copiedMessageId}
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
  copiedMessageId,
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
                {copiedMessageId === message.message_id ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
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
  copiedMessageId = { copiedMessageId },
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

      <ActionButtonsHover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => onCopy(messageContent)}>
                {copiedMessageId === message.message_id ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
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
      </ActionButtonsHover>
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

function MessageInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  ghostText,
  onKeyDown,
  onScan,
  selectedInstrument,
  handleDeleteAllInstruments,
  handleDeleteInstrument,
  handleSelectInstrument,
  isScanning,
  instrumentData,
  isGettingAllInstrument 

}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>

              <ScanInstrumentButton
                type="button"
                size="icon"
                $isLoading={isLoading}
                $hasValue={!!value.trim()}
                onClick={onScan}
                disabled={isScanning}
              >
                <Radar className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              </ScanInstrumentButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan instrument</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <Button variant="outline" className="shrink-0  bg-white ">
                {selectedInstrument ? (
                  <div className="flex items-center gap-2 mb-40">
                    <Badge variant="secondary" className="text-xs">
                      {selectedInstrument.model}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedInstrument.model}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs"></span>
                )}
                <ChevronDown className="h-5 w-5 opacity-50 shrink-0" />
              </Button>
            </div>
          </DropdownMenuTrigger>

         <DropdownMenuContent align="start" className="w-80 bg-white shadow-md">
  {isGettingAllInstrument ? (
    <DropdownMenuItem disabled>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Scanning instruments...
    </DropdownMenuItem>
  ) : !Array.isArray(instrumentData) || instrumentData.length === 0 ? (
    <DropdownMenuItem disabled>No instruments detected</DropdownMenuItem>
  ) : (
    <>
      {instrumentData.map((instrument) => (
        <DropdownMenuItem
          key={instrument.id}
          className="flex items-center justify-between p-3"
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => handleSelectInstrument(instrument)}
          >
            <div className="font-medium">{instrument.model}</div>
            <div className="text-sm text-muted-foreground">
              {instrument.model} • {instrument.resource_string}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteInstrument(instrument.id)
            }}
            className="ml-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handleDeleteAllInstruments}
        className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete All Instruments
      </DropdownMenuItem>
    </>
  )}
</DropdownMenuContent>

        </DropdownMenu>
        </div>
        <TextAreaWrapper style={{ position: "relative" }}>
          <MessageTextArea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your intent (e.g., measure)"
            rows={1}
            $isLoading={isLoading}
            disabled={isLoading}
          />
          {ghostText && (
            <GhostText>
              {value}<span>{ghostText}</span>
            </GhostText>
          )}
          <SubmitButton
            type="submit"
            size="icon"
            disabled={isLoading || !value.trim()}
            $isLoading={isLoading}
            $hasValue={!!value.trim()}
          >
            {isLoading ? <LoadingIcon /> : <Send size={16} />}
          </SubmitButton>
        </TextAreaWrapper>
      </div>
    </>
  );
}