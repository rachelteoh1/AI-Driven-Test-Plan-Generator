import { useState, useRef, useEffect, useCallback } from "react";
import * as React from "react";
import Button from "@mui/material/Button";
import ScanInstrumentModal from "../modal/ScanInstrumentModal";
import PTEMResultModal from "../modal/PTEMSuccessModal";
import { useAllInstruments, useScanInstrument, useSelectInstrument, useDeleteInstrument, useDeleteAllInstrument, useSessionInstrument } from "../hook/useInstrument";
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
  z-index: 1;
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
  z-index: 1;
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
  padding: ${({ $isEditing }) => $isEditing ? '0.5rem' : '1rem 1.5rem'};  /* Less padding when editing */
  max-width: 70%;
  min-width: 50px;  /* Add minimum width */
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
  z-index: 1;
`;

const BotMessageBubble = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 1.5rem;
  border-top-left-radius: 0.25rem;
  padding: 1rem 1.5rem;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid ${({ theme }) => theme.conversation.actionBorder};
`;

const BotMessageContent = styled.div`
  color: ${({ theme }) => theme.text};
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
  color: ${({ theme }) => theme.greys.medium};
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
  background: ${({ theme }) => theme.card};
  border-radius: 2rem;
  border: 2px solid ${({ theme }) => theme.conversation.actionBorder};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 4px 24px rgba(102, 126, 234, 0.2);
  }
`;
const EditContainer = styled.div`
  width: 100%;
  min-height: 120px;  /* Match textarea min-height */
`;

const MessageTextArea = styled.textarea`
  width: 100%;
  min-height: 3rem;
  max-height: 12rem;
  padding: 1rem 8rem 1rem 1.5rem;
  background: transparent;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text};
  resize: none;
  line-height: 1.5;
  font-family: inherit;
  font-size: ${FONTSIZE.base};
  font-weight: ${FONTWEIGHT.normal};
  
  &::placeholder {
    color: ${({ theme }) => theme.greys.light};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  background: ${({ $variant, theme }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : theme.backgroundMedium};
  color: ${({ $variant, theme }) => ($variant === 'primary' ? 'white' : theme.greys.medium)};
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
  background-color: ${({ theme }) => theme.conversation.actionBg};
  border: 1px solid ${({ theme }) => theme.conversation.actionBorder};
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
`;


const EditTextArea = styled.textarea`
  width: 100%;
  min-height: 120px;  /* Increased from 80px */
  max-height: 300px;  /* Add max height */
  padding: 1rem 1.5rem;  /* Match the bubble padding */
  border: 2px solid ${({ theme }) => theme.conversation.editBorder || '#667eea'};
  border-radius: 1rem;  /* Match bubble border radius */
  resize: vertical;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text};
  font-family: inherit;
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.normal};
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.greys.light};
  }
`;

const VersionHistoryIndicator = styled.div`
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.conversation.versionBorder};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.conversation.versionText};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InstrumentButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: 0.75rem 1.25rem;
  background: ${({ theme }) => theme.card};
  border: 2px solid ${({ theme }) => theme.conversation.actionBorder};
  border-radius: 1rem;
  color: ${({ theme }) => theme.text};
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

const DropdownHeader = styled.div`
  padding: 0.75rem;
  font-weight: bold;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundMedium};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: ${FONTSIZE.sm};
`;

const DropdownItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: ${({ $isSelected, theme }) => ($isSelected ? theme.hover : 'transparent')};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.backgroundMedium};
  font-size: ${FONTSIZE.sm};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${({ $isSelected, theme }) => ($isSelected ? theme.hover : theme.background)};
  }
`;

// Prefix Autocomplete Dropdown Styles
const PrefixDropdownContainer = styled.div`
  position: fixed;
  bottom: auto;
  top: auto;
  left: auto;
  right: auto;
  background: ${({ theme }) => theme.card};
  border: 2px solid #667eea;
  border-radius: 0.75rem;
  max-height: 300px;
  width: 600px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transform: translateY(-100%);
  margin-bottom: 0.5rem;
`;

const PrefixDropdownHeader = styled.div`
  padding: 0.75rem 1rem;
  font-weight: bold;
  border-bottom: 2px solid ${({ theme }) => theme.backgroundMedium};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: ${FONTSIZE.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PrefixDropdownItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: ${({ $isSelected, theme }) => ($isSelected ? '#e3f2fd' : 'transparent')};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.backgroundMedium};
  transition: background 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${({ $isSelected }) => ($isSelected ? '#bbdefb' : '#f5f5f5')};
  }
`;

const CommandText = styled.div`
  font-family: 'Courier New', monospace;
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  color: #667eea;
  margin-bottom: 0.25rem;
`;

const CommandDescription = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.greys.medium};
  line-height: 1.4;
`;

const CommandMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.greys.medium};
`;
function LoadingIndicator() {
  console.log("LoadingIndicator is rendered");
  return (
    <BotMessageContainer>
      <BotMessageBubble>
        <LoadingContainer>
          <LoadingIcon />
          <span>Generating response...</span>
        </LoadingContainer>
      </BotMessageBubble>
    </BotMessageContainer>
  );
}

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
  const inputWrapperRef = useRef(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [savingEditForMessage, setSavingEditForMessage] = useState(null);
 const [hiddenDuringEdit, setHiddenDuringEdit] = useState(() => new Set());


  // Prefix autocomplete states
  const [flattenedCommands, setFlattenedCommands] = useState([]);
  const [prefixSuggestions, setPrefixSuggestions] = useState([]);
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [selectedPrefixIndex, setSelectedPrefixIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });


  const {
    data: instrumentsData,
    isLoading: instrumentsLoading,
    error: instrumentsError,
  } = useGetAllInstruments();

  // Get all detected instruments for dropdown and scan modal
  const { data: instrumentData = [], isLoading: isGettingAllInstrument } = useAllInstruments({
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Get selected instruments for this session
  const { data: sessionInstrumentsData = [], isLoading: isSessionInstrumentsLoading } = useSessionInstrument(chat.session_id);

  const scanMutation = useScanInstrument();
  const selectMutation = useSelectInstrument();
  const deleteInstrumentMutation = useDeleteInstrument();
  const deleteAllInstrumentMutation = useDeleteAllInstrument();
  const handleParameterSelect = (parameter) => {
    setSelectedParameter(parameter);
    setShowParameterDropdown(false);

    // If this parameter has associated values, show value dropdown
    if (parameter && parameter.values && parameter.values.length > 0) {
      setAvailableValues(parameter.values);
      setShowValueDropdown(true);
    }
  };

  const handleValueSelect = (value) => {
    setSelectedValue(value);
    setShowValueDropdown(false);

    // Optionally append the selected value to input
    if (selectedParameter && value) {
      const newInput = `${inputValue} ${selectedParameter.name} ${value}`.trim();
      setInputValue(newInput);
    }
  };
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

  // Reset selected instrument and input field when session changes
  useEffect(() => {
    setSelectedInstrument(null);
    setInputValue("");
    if (onInstrumentChange) {
      onInstrumentChange(null);
    }
  }, [chat.session_id]);

  // Function to flatten SCPI JSON structure into searchable commands
  const flattenScpiCommands = (data) => {
    console.log('[FLATTEN] Starting to flatten data:', typeof data, Array.isArray(data));
    const commands = [];

    // If data is an array (flattened JSON format from PDF)
    if (Array.isArray(data)) {
      console.log('[FLATTEN] Data is array, length:', data.length);
      data.forEach(item => {
        if (item.command) {
          commands.push({
            command: item.command,
            description: item.description || '',
            parameters: item.parameters || [],
            values: item.values || {},
            page: item.page || 'N/A'
          });
        }
      });
    }
    // If data is hierarchical object (old format)
    else if (typeof data === 'object') {
      console.log('[FLATTEN] Data is hierarchical object');
      const traverse = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;

        // Check if this is a command node (has 'command' property)
        if (obj.command) {
          commands.push({
            command: obj.command,
            description: obj.description || '',
            parameters: obj.parameters || [],
            values: obj.values || {},
            page: obj.page || 'N/A'
          });
        }

        // Traverse children
        Object.keys(obj).forEach(key => {
          if (!['command', 'description', 'parameters', 'values', 'page'].includes(key)) {
            traverse(obj[key], path ? `${path}:${key}` : key);
          }
        });
      };
      traverse(data);
    }

    console.log('[FLATTEN] Total commands flattened:', commands.length);
    if (commands.length > 0) {
      console.log('[FLATTEN] Sample commands:', commands.slice(0, 3));
    }
    return commands;
  };

  useEffect(() => {
    console.log('selectedInstrument changed:', selectedInstrument);
    if (!selectedInstrument) return;

    if (selectedInstrument.json_url_manual) {
      console.log('Fetching JSON from:', selectedInstrument.json_url_manual);
      fetch(selectedInstrument.json_url_manual)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("Fetched SCPI JSON data:", data);
          setScpiSuggestions(data);

          // Flatten commands for prefix autocomplete
          const flattened = flattenScpiCommands(data);
          console.log("Flattened commands count:", flattened.length);
          setFlattenedCommands(flattened);
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

  // Prefix search for SCPI commands
  const searchPrefixCommands = (prefix) => {
    if (!prefix || prefix.length < 2) {
      console.log('[SEARCH] Prefix too short, clearing');
      setPrefixSuggestions([]);
      setShowPrefixDropdown(false);
      return;
    }
    const intentPattern = /^(explain|generate|create|optimize|analyze|show|list|get|set|configure|test|debug|help|what is)\s+(.+)/i;
    const match = prefix.match(intentPattern);
    const scpiPart = match ? match[2] : prefix;

    if (scpiPart.includes(' ')) {
      setPrefixSuggestions([]);
      setShowPrefixDropdown(false);
      return;
    }

    const upperPrefix = scpiPart.toUpperCase();
    const matches = flattenedCommands
      .filter(cmd => {
        const matches = cmd.command.toUpperCase().startsWith(upperPrefix);
        return matches;
      })
      .slice(0, 10);

    setPrefixSuggestions(matches);
    setShowPrefixDropdown(matches.length > 0);
    setSelectedPrefixIndex(0);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isLoading && inputValue.trim()) {
      onSendMessage(inputValue, selectedInstrument?.id);
      setInputValue("");
      setAvailableParameters([]);
      setAvailableValues([]);
      setShowParameterDropdown(false);
      setShowValueDropdown(false);
      setSelectedParameter(null);
      setSelectedValue(null);
      setPrefixSuggestions([]);
      setShowPrefixDropdown(false);
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
      // Create SelectedInstrument record for this session
      const response = await selectMutation.mutateAsync({
        instrument_id: instrument.id,
        session_id: chat.session_id,
      });

      console.log('[SELECT] Backend response:', response);
      console.log('[SELECT] json_url_manual:', response.json_url_manual);

      // Check if PDF manual exists
      if (!response.json_url_manual) {
        console.log('[SELECT] No PDF manual found, showing modal');
        showModal({
          modal: (
            <CrossedModal
              title="Manual not uploaded."
              description="Import a user manual to get started."
              hideModal={hideModal}
            />
          ),
        });
      }

      // Set selected instrument using backend response (which has PDF info)
      setSelectedInstrument(response);

      if (onInstrumentChange) {
        onInstrumentChange(response);
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

 
  const copyToClipboard = useCallback(async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, []);

 const handleEditMessage = (messageId, content) => {
  setEditingMessageId(messageId);
  setEditContent(content);
};


 

//  const handleSaveEdit = async (message, newContent) => {
//   try {
//     setIsSavingEdit(true);  // NEW LINE
     
//     // Update the message - backend will regenerate response
//     await modifyChatLogMutation.mutateAsync({
//       message_id: message.message_id,
//       session_id: message.session_id,
//       role: message.role,
//       content: newContent,
//       has_been_modified: true,
//     });

  
// setEditingMessageId(null);
// setEditContent("");
// setIsSavingEdit(false);

//   } catch (err) {
//     console.error("Edit failed:", err);
//     setIsSavingEdit(false);
//     showModal({
//       modal: (
//         <CrossedModal
//           title="Failed to save edit"
//           description="Please try again later"
//           hideModal={hideModal}
//         />
//       ),
//     });
//   }
// };


const collectDescendants = (messages, rootId) => {
  const idx = messages.findIndex(m => String(m.message_id) === String(rootId));
  if (idx === -1) return new Set();

  // hide everything after edited message (matches your backend deactivation behavior)
  const result = new Set();
  for (let i = idx + 1; i < messages.length; i++) {
    result.add(String(messages[i].message_id));
  }
  return result;
};





const handleSaveEdit = async (message, newContent) => {
  try {
    setSavingEditForMessage(message.message_id);
    setIsSavingEdit(true);

    // ✅ OPTIMISTIC UI: hide all descendants immediately
    const descendants = collectDescendants(chat.messages, message.message_id);
    console.log("root:", String(message.message_id));
console.log("descendants:", descendants.size, [...descendants]);
console.log(
  "sample pairs:",
  chat.messages.slice(0, 5).map(m => ({
    id: String(m.message_id),
    parent: m.parent_id ? String(m.parent_id) : null,
    role: m.role
  }))
);
    setHiddenDuringEdit(descendants);

    setEditingMessageId(null);
    setEditContent("");

    await modifyChatLogMutation.mutateAsync({
      message_id: message.message_id,
      session_id: message.session_id,
      role: message.role,
      content: newContent,
      has_been_modified: true,
    });

    // ✅ after refetch completes
    setHiddenDuringEdit(new Set());
    setSavingEditForMessage(null);
    setIsSavingEdit(false);
  } catch (err) {
    setHiddenDuringEdit(new Set());
    setSavingEditForMessage(null);
    setIsSavingEdit(false);
    // ...modal error
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
  // const getMessageContent = useCallback((message) => {
  //   if (viewingHistory === message.message_id) {
  //     const versions = messageVersions[message.message_id] || [];
  //     if (versions.length > 0) {
  //       return versions[0].old_content;
  //     }
  //   }
  //   return message.content;
  // }, [viewingHistory, messageVersions]);

  const handleInputChange = (value) => {
    setInputValue(value);

    if (!value.trim()) {
      setPrefixSuggestions([]);
      setShowPrefixDropdown(false);
      return;
    }

    if (flattenedCommands.length > 0) {
      searchPrefixCommands(value.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (showPrefixDropdown && prefixSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedPrefixIndex((prev) =>
          prev < prefixSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedPrefixIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handlePrefixSelect(prefixSuggestions[selectedPrefixIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowPrefixDropdown(false);
        setPrefixSuggestions([]);
        return;
      }
    }

    if (e.key === " ") {
      e.preventDefault();
      handleInputChange(inputValue + " ");
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePrefixSelect = (command) => {
    // Check if there's an intent prefix to preserve
    const intentPattern = /^(explain|generate|create|optimize|analyze|show|list|get|set|configure|test|debug|help|what is)\s+/i;
    const match = inputValue.match(intentPattern);
    const intentPrefix = match ? match[0] : '';

    // Combine intent prefix with selected command and add a space
    const newValue = intentPrefix + command.command + ' ';
    console.log('[SELECT] Intent prefix:', intentPrefix, 'Final value:', newValue);

    setInputValue(newValue);
    setShowPrefixDropdown(false);
    setPrefixSuggestions([]);
    setSelectedPrefixIndex(0);
  };

  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const onUpload = async (message) => {
    try {
      setUploadingMessageId(message.message_id);
      setUploadStatus(null);
      setUploadError("");

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
  editContent: initialEditContent,
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
  const editTextareaRef = useRef(null);
  const hasInitialized = useRef(false);
  const [localEditContent, setLocalEditContent] = useState(initialEditContent);


  // Update local state when editing starts
useEffect(() => {
  if (isEditing) {
    setLocalEditContent(initialEditContent);
    if (editTextareaRef.current) {
      editTextareaRef.current.focus();
      
      // Set cursor to the end
      const length = initialEditContent.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }
}, [isEditing, initialEditContent]);


// useEffect(() => {
//   if (isEditing && editTextareaRef.current) {
//     editTextareaRef.current.focus();
//   }
// }, [isEditing]);
  return (
    <UserMessageContainer>
      <UserMessageContent_Wrapper>
        <UserMessageBubble $isEditing={isEditing}>
          {isEditing ? (
            <EditContainer>
            <EditTextArea
                ref={editTextareaRef}
                value={localEditContent}  // Use LOCAL state
                onChange={(e) => setLocalEditContent(e.target.value)}  // Update LOCAL state
              />
            </EditContainer>
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
                  />
                </VersionHistoryIndicator>
              )}
            </>
          )}
        </UserMessageBubble>
        <CircleUserRound size={32} />
      </UserMessageContent_Wrapper>

      {/* Action buttons - always rendered but with different content */}
      <ActionButtons style={isEditing ? { opacity: 1, pointerEvents: 'auto' } : undefined}>
        <TooltipProvider>
          {isEditing ? (
            <>
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
                  <ActionButton onClick={() => onSaveEdit(message, localEditContent)}>
                    <Check size={16} />
                  </ActionButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save changes</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
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
            </>
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
                  <PTEMResultModal
                    status="success"
                    hideModal={() => setUploadStatus(null)}
                  />
                )}

                {uploadStatus === "fail" && (
                  <PTEMResultModal
                    status="fail"
                    errorMessage={uploadError}
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
          chat.messages
            .filter(message => !hiddenDuringEdit.has(String(message.message_id)))
            .map((message) => (
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

        {(isLoading || isSavingEdit) && <LoadingIndicator />}
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

              <DropdownMenuContent align="start" side="top" className="w-80 bg-white shadow-md" style={{ zIndex: 9999 }}>
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
                    {instrumentData.map((instrument) => {
                      // Check if this instrument is already selected in this session
                      const isSelected = sessionInstrumentsData?.some(
                        selected => selected.instrument_id === instrument.id
                      );

                      return (
                        <DropdownMenuItem
                          key={instrument.id}
                          className="flex items-center justify-between p-3"
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleSelectInstrument(instrument)}
                          >
                            <div className="font-medium">
                              {instrument.model}
                              {isSelected && <span className="ml-2 text-xs text-blue-600">✓ Selected</span>}
                            </div>
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
                      );
                    })}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleDeleteAllInstruments}
                      className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Detected Instruments
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </InstrumentBar>

          <MessageInputWrapper ref={inputWrapperRef}>
            {(() => {
              if (showPrefixDropdown && prefixSuggestions.length > 0 && inputWrapperRef.current) {
                const rect = inputWrapperRef.current.getBoundingClientRect();
                const style = {
                  position: 'fixed',
                  top: `${rect.top - 8}px`,
                  left: `${rect.left}px`,
                  width: `${rect.width}px`,
                  transform: 'translateY(-100%)'
                };

                return (
                  <PrefixDropdownContainer style={style}>
                    <PrefixDropdownHeader>
                      <span>SCPI Commands</span>
                      <span>{prefixSuggestions.length}</span>
                    </PrefixDropdownHeader>
                    {prefixSuggestions.map((suggestion, index) => (
                      <PrefixDropdownItem
                        key={index}
                        $isSelected={index === selectedPrefixIndex}
                        onClick={() => handlePrefixSelect(suggestion)}
                      >
                        <CommandText>{suggestion.command}</CommandText>
                      </PrefixDropdownItem>
                    ))}
                  </PrefixDropdownContainer>
                );
              }
              return null;
            })()}

            <MessageTextArea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your intent (e.g., generate)"
              rows={1}
              disabled={isLoading}
            />

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
