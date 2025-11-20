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
import * as sequenceService from "../services/sequenceServices";

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
  const [availableParameters, setAvailableParameters] = useState([]);
  const [availableValues, setAvailableValues] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [showParameterDropdown, setShowParameterDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);
  const [uploadingMessageId, setUploadingMessageId] = useState(null);


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
      // Clear all dropdown states after sending
      setGhostText("");
      setAvailableParameters([]);
      setAvailableValues([]);
      setShowParameterDropdown(false);
      setShowValueDropdown(false);
      setSelectedParameter(null);
      setSelectedValue(null);
    }
  };


  const { data: instrumentData = [], isLoading: isGettingAllInstrument } = useAllInstruments({
    staleTime: 5 * 60 * 1000, // 5 mins
    cacheTime: 10 * 60 * 1000,
  });

  const scanMutation = useScanInstrument();
  const selectMutation = useSelectInstrument();
  const deleteInstrumentMutation = useDeleteInstrument();
  const deleteAllInstrumentMutation = useDeleteAllInstrument();

  // console.log("Session_ID:", chat.session_id);


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
      setAvailableParameters([]);
      setAvailableValues([]);
      setShowParameterDropdown(false);
      setShowValueDropdown(false);
      return;
    }

    const rawParts = value.split(" ");
    let parts = rawParts.filter((p, idx) => p !== "" || idx < rawParts.length - 1);

    if (value.endsWith(" ") && parts[parts.length - 1] !== "") {
      parts.push(""); // placeholder for suggestion
    }

    let node = scpiSuggestions;
    let ghost = "";

    const metaKeys = ["command", "description", "parameters", "values"];

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
            // Clear dropdowns when still in hierarchy traversal
            setShowParameterDropdown(false);
            setShowValueDropdown(false);
            setAvailableParameters([]);
            setAvailableValues([]);
            return;
          }
          node = node[match]; // go deeper
        } else {
          // Clear everything if no match found
          setShowParameterDropdown(false);
          setShowValueDropdown(false);
          setAvailableParameters([]);
          setAvailableValues([]);
          break;
        }
      } else {
        if (keys.length > 0) {
          ghost = keys[0];
          setGhostText(ghost);
          // Clear dropdowns when showing hierarchy suggestions
          setShowParameterDropdown(false);
          setShowValueDropdown(false);
          setAvailableParameters([]);
          setAvailableValues([]);
          return;
        }
      }
    }

    if (node.parameters && Array.isArray(node.parameters) && node.parameters.length > 0) {
      const currentPartIndex = i;
      const typed = parts[currentPartIndex]?.toLowerCase() || "";

      // Check if we have a complete parameter match and user pressed space
      const hasCompleteMatch = node.parameters.some(p =>
        p.toLowerCase() === typed.toLowerCase()
      );

      if (hasCompleteMatch) {
        const selectedParam = node.parameters.find(p =>
          p.toLowerCase() === typed.toLowerCase()
        );

        // Check if this parameter has values
        const hasValues = node.values && node.values[selectedParam] && node.values[selectedParam].length > 0;

        if (hasValues && parts.length > currentPartIndex + 1) {
          // Parameter has values and user typed space, show values
          const valueTyped = parts[currentPartIndex + 1]?.toLowerCase() || "";
          const matchingValues = node.values[selectedParam].filter((v) =>
            v.toLowerCase().startsWith(valueTyped)
          );

          setAvailableValues(matchingValues);
          setSelectedParameter(selectedParam);
          setShowParameterDropdown(false);
          setShowValueDropdown(true);
          setAvailableParameters([]);

          // Set ghost text for values
          if (matchingValues.length > 0 && valueTyped) {
            const match = matchingValues[0];
            if (match.toLowerCase() !== valueTyped) {
              ghost = match.slice(valueTyped.length);
              setGhostText(ghost);
              return;
            }
          } else if (matchingValues.length > 0 && !valueTyped) {
            ghost = matchingValues[0];
            setGhostText(ghost);
            return;
          }
        } else {
          setShowParameterDropdown(false);
          setShowValueDropdown(false);
          setAvailableParameters([]);
          setAvailableValues([]);
          setSelectedParameter(null);
          setGhostText("");
          return;
        }
      }
      else if (value.endsWith(" ") && parts[currentPartIndex] === "") {
        setAvailableParameters(node.parameters);
        setShowParameterDropdown(true);
        setShowValueDropdown(false);
        setAvailableValues([]);
        setSelectedParameter(null);

        // Set ghost text for first parameter
        if (node.parameters.length > 0) {
          ghost = node.parameters[0];
          setGhostText(ghost);
          return;
        }
      }
      // If user is typing parameter name (but hasn't pressed space yet)
      else if (typed && !value.endsWith(" ")) {
        const matchingParams = node.parameters.filter((p) =>
          p.toLowerCase().startsWith(typed)
        );

        if (matchingParams.length > 0) {
          setAvailableParameters(matchingParams);
          setShowParameterDropdown(true);
          setShowValueDropdown(false);
          setAvailableValues([]);
          setSelectedParameter(null);

          // Set ghost text for first matching parameter
          const match = matchingParams[0];
          if (match.toLowerCase() !== typed) {
            ghost = match.slice(typed.length);
            setGhostText(ghost);
            return;
          }
        } else {
          // No matching parameters, clear dropdowns
          setShowParameterDropdown(false);
          setShowValueDropdown(false);
          setAvailableParameters([]);
          setAvailableValues([]);
        }
      }
      else {
        // Clear dropdowns if we're not in the right state
        setShowParameterDropdown(false);
        setShowValueDropdown(false);
        setAvailableParameters([]);
        setAvailableValues([]);
      }
    } else {
      // Clear dropdowns if no parameters found
      setShowParameterDropdown(false);
      setShowValueDropdown(false);
      setAvailableParameters([]);
      setAvailableValues([]);
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
  const handleParameterSelect = (parameter) => {
    setSelectedParameter(parameter);
    setShowParameterDropdown(false);
    setShowValueDropdown(true);

    const words = inputValue.split(" ");
    words[words.length - 1] = parameter;
    const newValue = words.join(" ") + " ";
    setInputValue(newValue);
    handleInputChange(newValue);
  };

  const handleValueSelect = (value) => {
    setSelectedValue(value);
    setShowValueDropdown(false);
    setShowParameterDropdown(false);
    setAvailableParameters([]);
    setAvailableValues([]);

    const words = inputValue.split(" ");
    words[words.length - 1] = value;
    const newValue = words.join(" ");
    setInputValue(newValue);
    setGhostText("");
  };

  const onUpload = async (message) => {
    try {
      setUploadingMessageId(message.message_id);
      const data = await sequenceService.getSequence(message.message_id);

      if (!data) {
        alert("No optimized sequence found for this message.");
        return;
      }
      const scpiCommands = data.commands
        .sort((a, b) => a.order_sequence - b.order_sequence)
        .map(cmd => ({
          command: cmd.optimized_scpi,
          type: cmd.type,
          order: cmd.order_sequence
        }));

      const payload = {
        commands: scpiCommands
      };

      console.log("Sending to PTEM:", payload);

      // Send to PTEM via WebView2
      if (window.chrome?.webview) {
        window.chrome.webview.postMessage(JSON.stringify(payload));
        alert(`Successfully loaded ${scpiCommands.length} SCPI commands to PTEM!`);
      } else {
        console.warn("WebView2 not available. Would send:", payload);
        alert("PTEM integration not available in browser mode.");
      }

    } catch (error) {
      console.error("Failed to upload to PTEM:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setUploadingMessageId(null);
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
              onUpload={onUpload}
              isUploading={uploadingMessageId === message.message_id}
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
          availableParameters={availableParameters}
          availableValues={availableValues}
          selectedParameter={selectedParameter}
          selectedValue={selectedValue}
          onParameterSelect={handleParameterSelect}
          onValueSelect={handleValueSelect}
          showParameterDropdown={showParameterDropdown}
          showValueDropdown={showValueDropdown}
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
  onScan,
  onUpload,
  isUploading,
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
      onUpload={onUpload}
      isUploading={isUploading}
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
  isUploading,
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
  const hasOptimization = message.has_optimization;
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
          {hasOptimization && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  onClick={() => onUpload(message)}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                </ActionButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Load to PTEM</p>
              </TooltipContent>
            </Tooltip>
          )}
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
  availableParameters,
  availableValues,
  selectedParameter,
  selectedValue,
  onParameterSelect,
  onValueSelect,
  showParameterDropdown,
  showValueDropdown,  isGettingAllInstrument 

}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <MessageForm onSubmit={onSubmit}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
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
              <Button variant="outline" className="shrink-0 bg-white">
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

        <TextAreaWrapper style={{ position: "relative", flex: 1 }}>
          {/* Parameter Selection Dropdown */}
          {availableParameters.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              marginBottom: '8px'
            }}>
              <div style={{
                padding: '8px',
                fontWeight: 'bold',
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa',
                color: '#333'
              }}>
                Available Parameters ({availableParameters.length})
              </div>
              {availableParameters.map((param, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: selectedParameter === param ? '#e3f2fd' : 'transparent',
                    color: '#333',
                    borderBottom: index < availableParameters.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                  onClick={() => onParameterSelect(param)}
                  onMouseEnter={(e) => {
                    if (selectedParameter !== param) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = selectedParameter === param ? '#e3f2fd' : 'transparent';
                  }}
                >
                  {param}
                </div>
              ))}
            </div>
          )}

          {/* Value Selection Dropdown */}
          {availableValues.length > 0 && selectedParameter && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1001,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              marginBottom: '8px'
            }}>
              <div style={{
                padding: '8px',
                fontWeight: 'bold',
                borderBottom: '1px solid #eee',
                backgroundColor: '#e8f5e8',
                color: '#333'
              }}>
                Values for "{selectedParameter}" ({availableValues.length})
              </div>
              {availableValues.map((value, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: selectedValue === value ? '#e8f5e8' : 'transparent',
                    color: '#333',
                    borderBottom: index < availableValues.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                  onClick={() => onValueSelect(value)}
                  onMouseEnter={(e) => {
                    if (selectedValue !== value) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = selectedValue === value ? '#e8f5e8' : 'transparent';
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}

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
    </MessageForm>
  );
}