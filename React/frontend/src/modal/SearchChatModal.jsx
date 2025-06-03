import styled from "styled-components";
import { Button } from "@mui/material";
import { useState } from "react";
import { MessageSquare ,X} from "lucide-react";
import { useMemo } from "react";


const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 40vh;
  margin: 0 auto;
`;


const Input = styled.input`
  width: 100%;
  text-align: center;
  border: none;
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 12px 0;
  color: #6b7280;
  font-size: 1rem;
  &::placeholder {
    color: #9ca3af;
  }
  outline: none;
`;

const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
 
`;

export default function SearchChatModal({ chats, onSelectChat, hideModal }) {
  const [searchQuery, setSearchQuery] = useState("");


  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const handleChatSelect = async (chatId) => {

    try {
      await onSelectChat(chatId);
      hideModal(); // Close the modal after selection
    } catch (error) {
      console.error("Error selecting chat:", error);
    } finally {

    }
  };

  return (
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
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button></RowDiv>
      

      <div className="w-full max-h-60 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => handleChatSelect(chat.id)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="text-gray-900 truncate">{chat.name}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {searchQuery ? "No matching chats found" : "No chats available"}
          </div>
        )}
      </div>
    </CenteredDiv>
  );
}