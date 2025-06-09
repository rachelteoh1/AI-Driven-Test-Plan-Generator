// "use client"

import RenameModal from "../modal/RenameModal";
import DeleteModal from "../modal/DeleteModal";
import ClearModal from "../modal/ClearConversationModal";
import SearchChatModal from "../modal/SearchChatModal";

import {
  Plus,
  MessageSquare,
  Download,
  Search,
  Trash2,
  User,
  LogOut,
  MoreVertical,
  Edit,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"
import { Button } from "./ui/button"
import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import useModal from "../modal/useModal";
import { useLogout } from "../hook/useAuth";

export function AppSidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onSetChat,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showModal, hideModal } = useModal();
  const logout = useLogout();
  const bottomItems = [
    {
      title: "Search Chat",
      icon: Search,
      disabled: !isChatSessionPage,
      action: () => {
        showModal({
          modal: (
            <SearchChatModal
              chats={chats}
              onSelectChat={(selectedId) => onSelectChat(selectedId)}
              hideModal={hideModal}

            />
          ),
        });
      },
    },
    {
      title: "Clear conversations",
      icon: Trash2,
      disabled: !isChatSessionPage,
      action: () => {
        showModal({
          modal: (
            <ClearModal
              title="Clear Conversation?"
              onSetChat={onSetChat}
              activeChat={activeChat}
              hideModal={hideModal}

            />
          ),
        });

      },
    },
    {
      title: "My account",
      icon: User,
      action: (chats={chats}) => navigate("/profile"),
    },
    {
      title: "Log out",
      icon: LogOut,
      action: () => {logout(); 
        navigate("/");}
    },
  ];

  return (
    <Sidebar className="w-64 border-r border-gray-200 fixed top-0 left-0 h-full bg-white z-10">
      <SidebarHeader className="p-4">
        <Button
          className="w-full justify-start gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 no-underline"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="list-none">
              {(chats ?? []).map((chat) => (
                <SidebarMenuItem key={chat.id} className="list-none">
                  <ChatItem
                    chat={chat}
                    isActive={activeChat?.id === chat.id}
                    onSelect={() => onSelectChat(chat.id)}
                    onRename={(newName) => onRenameChat(chat.id, newName)}
                    onDelete={(id) => onDeleteChat(id)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu className="list-none">
          {bottomItems.map((item, index) => (
            <SidebarMenuItem
              key={`${item.title}-${index}`}
              className="list-none"
            >
              <SidebarMenuButton asChild>
                <button
                  className={`flex items-center gap-2 px-3 py-2 text-sm w-full text-left no-underline ${item.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-900"
                    }`}
                  onClick={!item.disabled ? item.action : undefined}
                  disabled={item.disabled}
                >
                  <item.icon className={`h-4 w-4 ${item.disabled ? "text-gray-400" : ""}`} />
                  <span>{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatItem({ chat, isActive, onSelect, onRename, onDelete }) {
  const [isEditing] = useState(false);
  const [newName] = useState(chat.name);
  const [isHovered, setIsHovered] = useState(false);
  const { showModal, hideModal } = useModal();



  return (
    <div
      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 group ${isActive ? "bg-gray-200" : ""
        }`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MessageSquare size={16} className="text-gray-600" />
        {isEditing ? (
          <input
            type="text"
            value={newName}

          />
        ) : (
          <span className="truncate text-sm">{chat.name}</span>
        )}
      </div>

      {(isHovered || isActive) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                // setIsEditing(true);
                showModal({
                  modal: (
                    <RenameModal
                      chat={chat}
                      onRename={onRename}
                      hideModal={hideModal}
                    />
                  ),
                });
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                showModal({
                  modal: (
                    <DeleteModal
                      chat={chat}
                      onDelete={onDelete}
                      hideModal={hideModal}
                    />
                  ),
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4 " />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
