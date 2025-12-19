

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
  Mic,
  MicOff,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/reusable/Tooltip";
import { COLORS, SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import styled, { keyframes, css } from "styled-components";
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
import TickedModal from "../modal/TickModal";
import InstrumentNotFoundModal from "../modal/InstrumentNotFoundModal";
import * as sequenceService from "../services/sequenceServices";

// Animation
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${SPACING.lg};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xl};
  margin-bottom: 1rem;
`;

const InputArea = styled.div`
  padding: ${SPACING.lg} ${SPACING.lg} ${SPACING.xl};
  background: transparent;
  width: 100%;
`;

const UserMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${SPACING.sm};
  margin-bottom: ${SPACING.lg};
  position: relative;
`;

const UserMessageContent_Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: ${SPACING.md};
`;

const UserMessageBubble = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1.5rem;
  border-bottom-right-radius: 0.25rem;
  padding: 1rem 1.5rem;
  max-width: 70%;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
`;

const UserMessageContent = styled.div`
  color: white;
  font-weight: ${FONTWEIGHT.normal};
  font-size: ${FONTSIZE.sm};
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const BotMessageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${SPACING.sm};
`;

const BotMessageBubble = styled.div`
  background: white;
  border-radius: 1.5rem;
  border-top-left-radius: 0.25rem;
  padding: 1rem 1.5rem;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
`;

const BotMessageContent = styled.div`
  color: #374151;
  font-weight: ${FONTWEIGHT.normal};
  font-size: ${FONTSIZE.sm};
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  color: #6b7280;
`;

const LoadingIcon = styled(Loader2)`
  height: ${FONTSIZE.lg};
  width: ${FONTSIZE.lg};
  ${css`animation: ${spin} 1s linear infinite;`}
  color: #667eea;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.md};
  width: 100%;
`;

const InstrumentBar = styled.div`
  display: flex;
  gap: ${SPACING.md};
  align-items: center;
  width: 100%;
`;

const MessageInputWrapper = styled.div`
  position: relative;
  width: 100%;
  background: white;
  border-radius: 2rem;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 4px 24px rgba(102, 126, 234, 0.2);
  }
`;

const MessageTextArea = styled.textarea`
  width: 100%;
  min-height: 3rem;
  max-height: 12rem;
  padding: 1rem 8rem 1rem 1.5rem;
  background: transparent;
  border: none;
  outline: none;
  color: #1f2937;
  resize: none;
  line-height: 1.5;
  font-family: inherit;
  font-size: ${FONTSIZE.base};
  font-weight: ${FONTWEIGHT.normal};
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GhostText = styled.span`
  position: absolute;
  top: 1rem;
  left: 1.5rem;
  color: #9ca3af;
  pointer-events: none;
  font-size: ${FONTSIZE.base};
  font-weight: ${FONTWEIGHT.normal};
  line-height: 1.5;
  font-family: inherit;
  white-space: nowrap;
  opacity: 0.5;
  z-index: 0;
`;

const InputActions = styled.div`
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  gap: ${SPACING.xs};
  align-items: center;
`;

const IconButton = styled(Button)`
  min-width: auto;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border-radius: 50%;
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : '#f3f4f6'};
  color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#6b7280')};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $variant }) =>
      $variant === 'primary'
        ? '0 8px 16px rgba(102, 126, 234, 0.4)'
        : '0 4px 8px rgba(0, 0, 0, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  ${({ $isRecording }) =>
    $isRecording &&
    css`
      background: #ef4444;
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;

  /* show when parent container is hovered */
  ${UserMessageContainer}:hover & {
    opacity: 1;
    pointer-events: auto;
  }
`;

const ActionButtonsHover = styled.div`
  display: flex;
  gap: ${SPACING.xs};
  margin-top: ${SPACING.sm};
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 200ms;
  /* show when the message container is hovered */
  ${BotMessageContainer}:hover & {
    opacity: 1;
  }
  /* position so buttons float over the message bubble */
  position: relative;
  z-index: 50;
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

const InstrumentButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: 0.75rem 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  color: #374151;
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }
`;

const ScanButton = styled(IconButton)`
  background: linear-gradient(135deg, #d3beebff 0%, #e2dee9ff 100%);
  color: white;
`;

const DropdownContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
`;

const DropdownHeader = styled.div`
  padding: 0.75rem;
  font-weight: bold;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
  color: #374151;
  font-size: ${FONTSIZE.sm};
`;

const DropdownItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: ${({ $isSelected }) => ($isSelected ? '#e3f2fd' : 'transparent')};
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  font-size: ${FONTSIZE.sm};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${({ $isSelected }) => ($isSelected ? '#e3f2fd' : '#f9fafb')};
  }
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
  const [isScanning, setIsScanning] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [availableParameters, setAvailableParameters] = useState([]);
  const [availableValues, setAvailableValues] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [showParameterDropdown, setShowParameterDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);
  const [uploadingMessageId, setUploadingMessageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const textareaRef = useRef(null);

  const {
    data: instrumentsData,
    isLoading: instrumentsLoading,
    error: instrumentsError,
  } = useGetAllInstruments();

  const { data: instrumentData = [], isLoading: isGettingAllInstrument } = useAllInstruments({
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const scanMutation = useScanInstrument();
  const selectMutation = useSelectInstrument();
  const deleteInstrumentMutation = useDeleteInstrument();
  const deleteAllInstrumentMutation = useDeleteAllInstrument();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInputValue(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (!selectedInstrument) return;

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
    if (e) e.preventDefault();
    if (!isLoading && inputValue.trim()) {
      onSendMessage(inputValue, selectedInstrument?.id);
      setInputValue("");
      setGhostText("");
      setAvailableParameters([]);
      setAvailableValues([]);
      setShowParameterDropdown(false);
      setShowValueDropdown(false);
      setSelectedParameter(null);
      setSelectedValue(null);
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      }
    }
  };

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
                  },
                  onError: (error) => {  // ADD THIS
                    console.error("Failed to select instrument:", error);
                    showModal({
                      modal: (
                        <CrossedModal
                          title="Failed to select instrument"
                          description="Please try again later"
                          hideModal={hideModal}
                        />
                      ),
                    });
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
    onError: (error) => {  // ADD THIS
      console.error("Scan failed:", error);
      showModal({
        modal: (
          <CrossedModal
            title="Failed to scan instruments"
            description="Please check connection and try again"
            hideModal={hideModal}
          />
        ),
      });
    }
  });
};
const handleSelectInstrument = async (instrument) => {
  try {
    const response = await selectMutation.mutateAsync({
      instrument_id: instrument.id,
      session_id: chat.session_id,
    });
    const instruments = instrumentsData?.instruments || [];
    const fullInstrument = instruments.find(inst => inst.id === response.id);
    setSelectedInstrument(fullInstrument || response);
    if (onInstrumentChange) {
      onInstrumentChange(fullInstrument || response);
    }
  } catch (err) {
    console.error("Failed to select instrument:", err);
    showModal({
      modal: (
        <CrossedModal
          title="Failed to select instrument"
          description="Please try again later"
          hideModal={hideModal}
        />
      ),
    });
  }
};
  // const handleSelectInstrument = async (instrument) => {
  //   try {
  //     const response = await selectMutation.mutateAsync({
  //       instrument_id: instrument.id,
  //       session_id: chat.session_id,
  //     });
  //     const instruments = instrumentsData?.instruments || [];
  //     const fullInstrument = instruments.find(inst => inst.id === response.id);

  //     setSelectedInstrument(fullInstrument || response);

  //     if (onInstrumentChange) {
  //       onInstrumentChange(fullInstrument || response);
  //     }
  //   } catch (err) {
  //     console.error("Failed to select instrument:", err);
  //   }
  // };

  // const handleDeleteInstrument = (instrumentId) => {
  //   if (selectedInstrument?.id === instrumentId) {
  //     setSelectedInstrument(null);
  //   }
  //   deleteInstrumentMutation.mutate({ instrument_id: instrumentId });
  // };
  const handleDeleteInstrument = (instrumentId) => {
  if (selectedInstrument?.id === instrumentId) {
    setSelectedInstrument(null);
  }
  deleteInstrumentMutation.mutate(
    { instrument_id: instrumentId },
    {
      onError: (error) => {
        console.error("Failed to delete instrument:", error);
        showModal({
          modal: (
            <CrossedModal
              title="Failed to delete instrument"
              description="Please try again later"
              hideModal={hideModal}
            />
          ),
        });
      }
    }
  );
};

  const handleDeleteAllInstruments = () => {
  setSelectedInstrument(null);
  deleteAllInstrumentMutation.mutate(undefined, {
    onError: (error) => {
      console.error("Failed to delete all instruments:", error);
      showModal({
        modal: (
          <CrossedModal
            title="Failed to delete all instruments"
            description="Please try again later"
            hideModal={hideModal}
          />
        ),
      });
    }
  });
};

  // const handleDeleteAllInstruments = () => {
  //   setSelectedInstrument(null);
  //   deleteAllInstrumentMutation.mutate();
  // };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  // const handleSaveEdit = async (message, editContent) => {
  //   try {
  //     await modifyChatLogMutation.mutateAsync({
  //       message_id: message.message_id,
  //       session_id: message.session_id,
  //       role: message.role,
  //       content: editContent,
  //       has_been_modified: true,
  //     });

  //     setEditingMessageId(null);
  //     setEditContent("");
  //   } catch (err) {
  //     console.error("Edit failed:", err);
  //   }
  // };

  const handleSaveEdit = async (message, editContent) => {
  try {
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
    showModal({
      modal: (
        <CrossedModal
          title="Failed to save edit"
          description="Please try again later"
          hideModal={hideModal}
        />
      ),
    });
  }
};

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // const handleViewVersion = async (messageId) => {
  //   try {
  //     const data = await getVersionChatLogs(messageId);
  //     setVersionData({ [messageId]: data || [] });
  //     setViewingHistory(messageId);
  //   } catch (err) {
  //     console.error("Error fetching version:", err);
  //   }
  // };

  const handleViewVersion = async (messageId) => {
  try {
    const data = await getVersionChatLogs(messageId);
    setVersionData({ [messageId]: data || [] });
    setViewingHistory(messageId);
  } catch (err) {
    console.error("Error fetching version:", err);
    showModal({
      modal: (
        <CrossedModal
          title="Failed to load version history"
          description="Please try again later"
          hideModal={hideModal}
        />
      ),
    });
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
        return versions[0].old_content;
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
      parts.push("");
    }

    let node = scpiSuggestions;
    let ghost = "";

    const metaKeys = ["command", "description", "parameters", "values"];

    let i = 0;
    for (; i < parts.length; i++) {
      const part = parts[i];
      if (!node || typeof node !== "object") break;

      const keys = Object.keys(node).filter((k) => !metaKeys.includes(k));

      if (node.parameters) break;

      if (i < parts.length - 1 || part !== "") {
        const match = keys.find((k) =>
          k.toLowerCase().startsWith(part.toLowerCase())
        );
        if (match) {
          if (match.toLowerCase() !== part.toLowerCase()) {
            ghost = match.slice(part.length);
            setGhostText(ghost);
            setShowParameterDropdown(false);
            setShowValueDropdown(false);
            setAvailableParameters([]);
            setAvailableValues([]);
            return;
          }
          node = node[match];
        } else {
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

      const hasCompleteMatch = node.parameters.some(p =>
        p.toLowerCase() === typed.toLowerCase()
      );

      if (hasCompleteMatch) {
        const selectedParam = node.parameters.find(p =>
          p.toLowerCase() === typed.toLowerCase()
        );

        const hasValues = node.values && node.values[selectedParam] && node.values[selectedParam].length > 0;

        if (hasValues && parts.length > currentPartIndex + 1) {
          const valueTyped = parts[currentPartIndex + 1]?.toLowerCase() || "";
          const matchingValues = node.values[selectedParam].filter((v) =>
            v.toLowerCase().startsWith(valueTyped)
          );

          setAvailableValues(matchingValues);
          setSelectedParameter(selectedParam);
          setShowParameterDropdown(false);
          setShowValueDropdown(true);
          setAvailableParameters([]);

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

        if (node.parameters.length > 0) {
          ghost = node.parameters[0];
          setGhostText(ghost);
          return;
        }
      }
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

          const match = matchingParams[0];
          if (match.toLowerCase() !== typed) {
            ghost = match.slice(typed.length);
            setGhostText(ghost);
            return;
          }
        } else {
          setShowParameterDropdown(false);
          setShowValueDropdown(false);
          setAvailableParameters([]);
          setAvailableValues([]);
        }
      }
      else {
        setShowParameterDropdown(false);
        setShowValueDropdown(false);
        setAvailableParameters([]);
        setAvailableValues([]);
      }
    } else {
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

const [uploadStatus, setUploadStatus] = useState(null);
const [uploadError, setUploadError] = useState("");

const onUpload = async (message) => {
  try {
    setUploadingMessageId(message.message_id);
    const data = await sequenceService.getSequence(message.message_id);
    
    if (!data) {
      setUploadStatus("fail");
      setUploadError("No optimized sequence found for this message.");
      return;
    }
    
    const scpiCommands = data.commands
      .sort((a, b) => a.order_sequence - b.order_sequence)
      .map(cmd => ({
        command: cmd.optimized_scpi,
        type: cmd.type,
        order: cmd.order_sequence
      }));
    
    const payload = { commands: scpiCommands };
    console.log("Sending to PTEM:", payload);
    
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      setUploadStatus("success");
      setTimeout(() => {
        setUploadStatus(null);
      }, 3000);
    } else {
      console.warn("WebView2 not available. Would send:", payload);
      setUploadStatus("fail");
      setUploadError("PTEM integration not available in browser mode.");
    }
  } catch (error) {
    console.error("Failed to upload to PTEM:", error);
    setUploadStatus("fail");
    setUploadError(error.message || "An unexpected error occurred");
  } finally {
    setUploadingMessageId(null);
  }
};



function PreviousVersionViewer({ versions, onBack }) {
  return (
    <div>
      {versions.map((logVersion) => (
        <div key={logVersion.version_id}>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Edited at:</strong>{" "}
            {new Date(logVersion.edited_at).toLocaleString()}
            <UserMessageContainer>
              <UserMessageContent_Wrapper>
                <UserMessageBubble>
                  <UserMessageContent>
                    {logVersion.old_content}
                  </UserMessageContent>
                </UserMessageBubble>
                <CircleUserRound size={32} />
              </UserMessageContent_Wrapper>
            </UserMessageContainer>
          </div>
          {logVersion.responses.map((response) =>
            response.role === "user" ? (
              <UserMessageContainer key={response.message_id}>
                <UserMessageContent_Wrapper>
                  <UserMessageBubble>
                    <UserMessageContent>{response.content}</UserMessageContent>
                  </UserMessageBubble>
                  <CircleUserRound size={32} />
                </UserMessageContent_Wrapper>
              </UserMessageContainer>
            ) : (
              <BotMessageContainer key={response.message_id}>
                <BotMessageBubble>
                  <BotMessageContent>{response.content}</BotMessageContent>
                </BotMessageBubble>
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
    <UserMessageContainer>
      <UserMessageContent_Wrapper>
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
        <CircleUserRound size={32} />
      </UserMessageContent_Wrapper>

      {/* Action buttons below the message */}
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
    </UserMessageContainer>
  );
}

function BotMessage({
  message,
  onCopy,
  onUpload,
  isUploading,
  isStarred,
  versions,
  copiedMessageId,
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
      <BotMessageBubble>
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
      </BotMessageBubble>

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
  <>
    <Tooltip>
      <TooltipTrigger asChild>
        <ActionButton
          onClick={() => onUpload(message)}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
        </ActionButton>
      </TooltipTrigger>
      <TooltipContent>
        <p>Load to PTEM</p>
      </TooltipContent>
    </Tooltip>

    {uploadStatus === "success" && (
      <TickedModal 
        title="Upload Successful!" 
        hideModal={() => setUploadStatus(null)} 
      />
    )}
    
    {uploadStatus === "fail" && (
      <CrossedModal
        title="Upload Failed"
        description={uploadError}
        hideModal={() => setUploadStatus(null)}
      />
    )}
  </>
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

  return (
    <Container>
      <MessagesContainer>
        {viewingHistory && versionData[viewingHistory] ? (
          <PreviousVersionViewer 
            versions={versionData[viewingHistory]} 
            onBack={handleBackToCurrent} 
          />
        ) : (
          chat.messages.map((message) => (
            
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
          ))
        )}

        {isLoading && (
          <BotMessageContainer>
            <BotMessageBubble>
              <LoadingContainer>
                <LoadingIcon />
                <span>Generating response...</span>
              </LoadingContainer>
            </BotMessageBubble>
          </BotMessageContainer>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputArea>
        <InputContainer>
          <InstrumentBar>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ScanButton
                    onClick={handleScanInstrument}
                    disabled={isScanning}
                  >
                    <Radar className="h-5 w-5" />
                  </ScanButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan instruments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InstrumentButton>
                  {selectedInstrument ? (
                    <>
                      <span>{selectedInstrument.model}</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>No instrument selected</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </InstrumentButton>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="start" className="w-80 bg-white shadow-md">
                {isGettingAllInstrument ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading instruments...
                  </DropdownMenuItem>
                ) : !Array.isArray(instrumentData) || instrumentData.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No instruments detected
                  </DropdownMenuItem>
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
                            e.stopPropagation();
                            handleDeleteInstrument(instrument.id);
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
          </InstrumentBar>

          <MessageInputWrapper>
            {/* Parameter Selection Dropdown */}
            {availableParameters.length > 0 && (
              <DropdownContainer>
                <DropdownHeader>
                  Available Parameters ({availableParameters.length})
                </DropdownHeader>
                {availableParameters.map((param, index) => (
                  <DropdownItem
                    key={index}
                    $isSelected={selectedParameter === param}
                    onClick={() => handleParameterSelect(param)}
                  >
                    {param}
                  </DropdownItem>
                ))}
              </DropdownContainer>
            )}

            {/* Value Selection Dropdown */}
            {availableValues.length > 0 && selectedParameter && (
              <DropdownContainer>
                <DropdownHeader>
                  Values for "{selectedParameter}" ({availableValues.length})
                </DropdownHeader>
                {availableValues.map((value, index) => (
                  <DropdownItem
                    key={index}
                    $isSelected={selectedValue === value}
                    onClick={() => handleValueSelect(value)}
                  >
                    {value}
                  </DropdownItem>
                ))}
              </DropdownContainer>
            )}

            <MessageTextArea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your intent (e.g., measure)"
              rows={1}
              disabled={isLoading}
            />
            
            {ghostText && (
              <GhostText>
                {inputValue}<span>{ghostText}</span>
              </GhostText>
            )}

            <InputActions>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      onClick={toggleRecording}
                      $isRecording={isRecording}
                      disabled={isLoading}
                    >
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isRecording ? 'Stop recording' : 'Start voice input'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      onClick={handleSubmit}
                      disabled={!inputValue.trim() || isLoading}
                      $variant="primary"
                    >
                      {isLoading ? <LoadingIcon /> : <Send size={18} />}
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </InputActions>
          </MessageInputWrapper>
        </InputContainer>
      </InputArea>
    </Container>
  );
}
