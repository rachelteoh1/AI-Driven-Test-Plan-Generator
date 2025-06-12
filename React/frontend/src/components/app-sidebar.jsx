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
import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react";
import useModal from "../modal/useModal";
import { useLogout } from "../hook/useAuth";
import styled, { css } from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import * as React from "react"
import { PanelLeft } from "lucide-react"

// Button variants
const variantStyles = {
  default: css`
    background-color: ${COLORS.lightgreyblue};
    color: ${COLORS.dark};
    &:hover { background-color: ${COLORS.greyblue}dd; }
  `,
  ghost: css`
    background: transparent;
    color: ${COLORS.dark};
    &:hover { background-color: ${COLORS.lightgreyblue}; }
  `,
};

const sizeStyles = {
  default: css`
    padding: 0 ${SPACING.md};
    height: 2.5rem;
  `,
  icon: css`
    padding: 0;
    width: 2rem;
    height: 2rem;
    justify-content: center;
  `,
};

// Base button
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: left;
  gap: ${SPACING.sm};
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  
  ${({ variant = "default" }) => variantStyles[variant]};
  ${({ size = "default" }) => sizeStyles[size]};

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.accent};
    outline-offset: 2px;
  }
`;


// dropdown menu
const menuItem = css`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm};
  font-size: ${FONTSIZE.sm};
  color: ${COLORS.dark};
  cursor: pointer;
  border-radius: 0.375rem;
  min-width: 8rem;
  &:hover,
  &[data-highlighted] {
    background-color: ${COLORS.lightgreyblue};
  }
  &[data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
`;

// Styled components
const DropdownMenuContent = styled(Dropdown.Content)`
  background-color: white;
  border: 1px solid ${COLORS.grey};
  border-radius: 0.375rem;
  padding: ${SPACING.xs};
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
`;

const DropdownMenuItem = styled(Dropdown.Item)`
  ${menuItem}
`;

const DropdownMenuCheckboxItem = styled(Dropdown.CheckboxItem)`
  ${menuItem}
  padding-left: ${SPACING.lg};
`;

const DropdownMenuRadioItem = styled(Dropdown.RadioItem)`
  ${menuItem}
  padding-left: ${SPACING.lg};
`;

const DropdownMenuSubTrigger = styled(Dropdown.SubTrigger)`
  ${menuItem}
  justify-content: space-between;
`;

const DropdownMenuSubContent = styled(Dropdown.SubContent)`
  background-color: white;
  border: 1px solid ${COLORS.grey};
  border-radius: 0.375rem;
  padding: ${SPACING.xs};
  margin-left: ${SPACING.sm};
`;

const DropdownMenuLabel = styled(Dropdown.Label)`
  padding: ${SPACING.xs} ${SPACING.sm};
  font-size: ${FONTSIZE.sm};
  font-weight: bold;
`;

const DropdownMenuSeparator = styled(Dropdown.Separator)`
  height: 1px;
  background-color: ${COLORS.grey};
  margin: ${SPACING.sm} 0;
`;

const DropdownMenuShortcut = styled.span`
  margin-left: auto;
  font-size: ${FONTSIZE.xs};
  opacity: 0.6;
`;
const DropdownMenu = Dropdown.Root;
const DropdownMenuTrigger = Dropdown.Trigger;

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
      // disabled: !isChatSessionPage,
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
      // disabled: !isChatSessionPage,
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
                <SidebarMenuItem key={chat.session_id} className="list-none">
                  <ChatItem
                    chat={chat}
                    isActive={activeChat?.session_id === chat.session_id}
                    onSelect={() => onSelectChat(chat.session_id)}
                    onRename={(newName) => onRenameChat(chat.session_id, newName)}
                    onDelete={(session_id) => onDeleteChat(session_id)}
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
          <span className="truncate text-sm">{chat.title}</span>
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