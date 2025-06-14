import styled from "styled-components";
import { Button } from "@mui/material";
import { useState, useMemo } from "react";
import { MessageSquare, X } from "lucide-react";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";

const ModalWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Centered main container
const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 40vh;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.background};
`;

// Styled input field
const Input = styled.input`
  width: 30rem;
  min-height: 2.5rem;
  padding: 12px 40px 12px 16px;
  background-color: ${({ theme }) => theme.backgroundMedium};
  border: 1px solid ${({ theme }) => theme.status.tick};
  border-radius: 1rem;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: ${FONTSIZE.base};
  font-family: inherit;
  opacity: 1;
  line-height: 1.5;
  box-sizing: border-box;
  &::placeholder {
    color: ${({ theme }) => theme.greys.dark};
  }
`;

// Row for input and close button
const RowDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  position: relative;
  margin-top:2rem;
`;

// Scrollable chat container
const ScrollableChatList = styled.div`
  width: 100%;
  max-height: 15rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-left: 5px;
`;

const ChatTitle = styled.span`
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default function SearchChatModal({ chats, onSelectChat, hideModal }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const handleChatSelect = async (chatId) => {
    try {
      await onSelectChat(chatId);
      hideModal();
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  return (
    <ModalWrapper>
    <CenteredDiv>
      <RowDiv>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          autoFocus
        />
        <Button
          onClick={hideModal}
          variant="text"
          size="small"
          style={{ position: "absolute", right: 0 }}
        >
          <X className="h-5 w-5" />
        </Button>
      </RowDiv>

      <ScrollableChatList>
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.session_id}
              onClick={() => handleChatSelect(chat.session_id)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer w-11/12"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <ChatTitle>{chat.title}</ChatTitle>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {searchQuery ? "No matching chats found" : "No chats available"}
          </div>
        )}
      </ScrollableChatList>
    </CenteredDiv>
    </ModalWrapper>
  );
}
