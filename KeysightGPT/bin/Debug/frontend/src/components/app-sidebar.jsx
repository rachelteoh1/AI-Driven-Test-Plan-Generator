// // "use client"

// import RenameModal from "../modal/RenameModal";
// import DeleteModal from "../modal/DeleteModal";
// import ClearModal from "../modal/ClearConversationModal";
// import SearchChatModal from "../modal/SearchChatModal";
// import LogoutModal from "../modal/LogoutModal";
// import PdfModal from "../modal/PdfModal";

// import {
//   Plus,
//   MessageSquare,
//   Download,
//   Search,
//   Trash2,
//   User,
//   LogOut,
//   MoreVertical,
//   Edit,
// } from "lucide-react";
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "./ui/sidebar";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useState } from "react";
// import useModal from "../modal/useModal";
// import { useLogout } from "../hook/useAuth";
// import styled, { css } from "styled-components";
// import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
// import * as Dropdown from "@radix-ui/react-dropdown-menu";
// import { Check, ChevronRight, Circle } from "lucide-react";
// import * as React from "react";
// import { PanelLeft } from "lucide-react";
// import { useUserProfile } from "../hook/useProfile";


// // Button variants
// const variantStyles = {
//   default: css`
//     background-color: ${({ theme }) => theme.newChat};
//     color: ${({ theme }) => theme.greys.dark};
//   `,
//   ghost: css`
//     background: transparent;
//     color: ${({ theme }) => theme.greys.dark};
//   `,
// };

// const sizeStyles = {
//   default: css`
//     padding: 0 ${SPACING.md};
//     height: 2.5rem;
//   `,
//   icon: css`
//     padding: 0;
//     width: 2rem;
//     height: 2rem;
//     justify-content: center;
//   `,
// };

// // Base button
// const Button = styled.button`
//   display: inline-flex;
//   align-items: center;
//   justify-content: left;
//   gap: ${SPACING.sm};
//   font-size: ${FONTSIZE.sm};
//   font-weight: ${FONTWEIGHT.medium};
//   border: none;
//   border-radius: 0.375rem;
//   cursor: pointer;
//   transition: background-color 0.2s, color 0.2s;

//   ${({ variant = "default" }) => variantStyles[variant]};
//   ${({ size = "default" }) => sizeStyles[size]};

//   &:disabled {
//     opacity: 0.5;
//     pointer-events: none;
//   }

//   &:focus-visible {
//     outline: 2px solid ${({ theme }) => theme.accent};
//     outline-offset: 2px;
//   }
// `;

// // dropdown menu
// const menuItem = css`
//   display: flex;
//   align-items: center;
//   gap: ${SPACING.sm};
//   padding: ${SPACING.sm};
//   font-size: ${FONTSIZE.sm};
//   color: ${({ theme }) => theme.greys.dark};
//   cursor: pointer;
//   border-radius: 0.375rem;
//   min-width: 8rem;
//   &:hover,
//   &[data-highlighted] {
//     background-color: ${({ theme }) => theme.newChat};
//   }
//   &[data-disabled] {
//     opacity: 0.5;
//     pointer-events: none;
//   }
// `;



// // chat item
// const StyledChatItem = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: ${SPACING.sm};
//   cursor: pointer;
//   border-radius: 0.375rem;

//   background-color: ${({ isActive, theme }) =>
//     isActive ? theme.newChat : "transparent"};
//   color: ${({ theme }) => theme.greys.dark};

//   &:hover {
//     background-color: ${({ isActive, theme }) =>
//     isActive ? theme.newChat : theme.hover};
//   }
// `;

// // rename n delete
// const DropdownMenuContent = styled(Dropdown.Content)`
//   background-color: ${({ theme }) => theme.background};
//   border: 1px solid ${({ theme }) => theme.greys.medium};
//   border-radius: 0.375rem;
//   padding: ${SPACING.xs};
//   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
// `;

// const DropdownMenuItem = styled(Dropdown.Item)`
//   ${menuItem}
// `;

// const DropdownMenuCheckboxItem = styled(Dropdown.CheckboxItem)`
//   ${menuItem}
//   padding-left: ${SPACING.lg};
// `;

// const DropdownMenuRadioItem = styled(Dropdown.RadioItem)`
//   ${menuItem}
//   padding-left: ${SPACING.lg};
// `;

// const DropdownMenuSubTrigger = styled(Dropdown.SubTrigger)`
//   ${menuItem}
//   justify-content: space-between;
// `;

// const DropdownMenuSubContent = styled(Dropdown.SubContent)`
//   background-color: white;
//   border: 1px solid ${({ theme }) => theme.greys.medium};
//   border-radius: 0.375rem;
//   padding: ${SPACING.xs};
//   margin-left: ${SPACING.sm};
// `;

// const DropdownMenuLabel = styled(Dropdown.Label)`
//   padding: ${SPACING.xs} ${SPACING.sm};
//   font-size: ${FONTSIZE.sm};
//   font-weight: bold;
// `;

// const DropdownMenuSeparator = styled(Dropdown.Separator)`
//   height: 1px;
//   background-color: ${({ theme }) => theme.greys.medium};
//   margin: ${SPACING.sm} 0;
// `;

// const DropdownMenuShortcut = styled.span`
//   margin-left: auto;
//   font-size: ${FONTSIZE.xs};
//   opacity: 0.6;
// `;
// const DropdownMenu = Dropdown.Root;
// const DropdownMenuTrigger = Dropdown.Trigger;

// export function AppSidebar({
//   chats,
//   activeChat,
//   onNewChat,
//   onSelectChat,
//   onRenameChat,
//   onDeleteChat,
//   onSetChat,
//   isChatsLoading,
//   onPdfUploadSuccess,
//   selectedInstrument,
// }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { showModal, hideModal } = useModal();
//   const { data: profile } = useUserProfile(true);
//   const logout = useLogout();
//   const bottomItems = [
//     {
//       title: "Import Manual",
//       icon: Download,
//       action: () => {
//         showModal({
//           modal: (
//             <PdfModal
//               key={selectedInstrument?.id}
//               hideModal={hideModal}
//               onUploadSuccess={onPdfUploadSuccess}
//               selectedInstrument={selectedInstrument}
//             />
//           ),
//         });
//       },
//     },
//     {
//       title: "Search Chat",
//       icon: Search,
//       // disabled: !isChatSessionPage,
//       action: () => {
//         showModal({
//           modal: (
//             <SearchChatModal
//               chats={chats}
//               onSelectChat={(selectedId) => onSelectChat(selectedId)}
//               hideModal={hideModal}
//             />
//           ),
//         });
//       },
//     },
//     {
//       title: "Clear conversations",
//       icon: Trash2,
//       // disabled: !isChatSessionPage,
//       action: () => {
//         showModal({
//           modal: (
//             <ClearModal
//               title="Clear Conversation?"
//               onSetChat={onSetChat}
//               activeChat={activeChat}
//               hideModal={hideModal}
//             />
//           ),
//         });
//       },
//     },
//     {
//       title: "My account",
//       icon: User,
//       action: (chats = { chats }) => navigate("/profile"),
//     },
//     {
//       title: "Log out",
//       icon: LogOut,
//       action: () => {
//         showModal({
//           modal: (
//             <LogoutModal
//               title="Logout?"

//               onLogout={async () => {
//                 await logout(profile, profile?.pref_autosave ?? true);
//               }}

//               hideModal={hideModal}
//               navigateTo="/signin"
//             />
//           ),
//         });

//       }
//     }

//   ];

//   return (
//     <Sidebar className="w-64 h-screen flex flex-col border-r border-gray-200 fixed top-0 left-0 bg-white z-10">
//       <SidebarHeader className="p-4">
//         <Button onClick={onNewChat}>
//           <Plus className="h-4 w-4" />
//           New chat
//         </Button>
//       </SidebarHeader>

//       <SidebarContent className="px-2 overflow-y-auto">
//         <SidebarGroup>
//           <SidebarGroupContent>
//             <SidebarMenu className="list-none">
//               {isChatsLoading ? (
//                 <p className="text-gray-500 px-4 py-2">Loading chats...</p>
//               ) : (
//                 (chats ?? []).map((chat) => (
//                   <SidebarMenuItem key={chat.session_id} className="list-none">
//                     <ChatItem
//                       chat={chat}
//                       isActive={activeChat?.session_id === chat.session_id}
//                       onSelect={() => onSelectChat(chat.session_id)}
//                       onRename={(newName) =>
//                         onRenameChat(chat.session_id, newName)
//                       }
//                       onDelete={(session_id) => onDeleteChat(session_id)}
//                     />
//                   </SidebarMenuItem>
//                 ))
//               )}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       <SidebarFooter className="p-2">
//         <SidebarMenu className="list-none">
//           {bottomItems.map((item, index) => (
//             <SidebarMenuItem
//               key={`${item.title}-${index}`}
//               className="list-none"
//             >
//               <SidebarMenuButton asChild>
//                 <Button
//                   variant="ghost"
//                   size="default"
//                   onClick={!item.disabled ? item.action : undefined}
//                   disabled={item.disabled}
//                   as="button"
//                   style={{ width: "100%", textAlign: "left" }}
//                 >
//                   <item.icon
//                     className={`h-4 w-4 ${item.disabled ? "text-gray-400" : ""
//                       }`}
//                   />
//                   <span>{item.title}</span>
//                 </Button>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           ))}
//         </SidebarMenu>
//       </SidebarFooter>
//     </Sidebar>
//   );
// }

// function ChatItem({ chat, isActive, onSelect, onRename, onDelete }) {
//   const [isEditing] = useState(false);
//   const [newName] = useState(chat.name);
//   const [isHovered, setIsHovered] = useState(false);
//   const { showModal, hideModal } = useModal();

//   return (
//     <StyledChatItem
//       isActive={isActive}
//       onClick={onSelect}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       <div className="flex items-center gap-2 flex-1 min-w-0">
//         <MessageSquare size={16} className="text-gray-600" />
//         {isEditing ? (
//           <input type="text" value={newName} />
//         ) : (
//           <span className="truncate text-sm">{chat.title}</span>
//         )}
//       </div>

//       {(isHovered || isActive) && (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
//             >
//               <MoreVertical size={16} />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem
//               className="hover:bg-gray-200"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 // setIsEditing(true);
//                 showModal({
//                   modal: (
//                     <RenameModal
//                       chat={chat}
//                       onRename={onRename}
//                       hideModal={hideModal}
//                     />
//                   ),
//                 });
//               }}
//             >
//               <Edit className="mr-2 h-4 w-4" />
//               Rename
//             </DropdownMenuItem>
//             <DropdownMenuItem
//               className="hover:bg-gray-200"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 showModal({
//                   modal: (
//                     <DeleteModal
//                       chat={chat}
//                       onDelete={onDelete}
//                       hideModal={hideModal}
//                     />
//                   ),
//                 });
//               }}
//             >
//               <Trash2 className="mr-2 h-4 w-4 " />
//               Delete
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       )}
//     </StyledChatItem>
//   );
// }

import RenameModal from "../modal/RenameModal";
import DeleteModal from "../modal/DeleteModal";
import ClearModal from "../modal/ClearConversationModal";
import SearchChatModal from "../modal/SearchChatModal";
import LogoutModal from "../modal/LogoutModal";
import PdfModal from "../modal/PdfModal";
import logo from "../assets/keysight.png"

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
  ChevronRight,
  ChevronLeft,
  Sparkles,
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
} from "./ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useModal from "../modal/useModal";
import { useLogout } from "../hook/useAuth";
import styled from "styled-components";
import { FONTSIZE, FONTWEIGHT, SPACING } from "../lib/styles";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useUserProfile } from "../hook/useProfile";

const SidebarContainer = styled.div`
  width: ${({ $collapsed }) => ($collapsed ? '4rem' : '18rem')};
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  padding: ${({ $collapsed }) => ($collapsed ? '1rem 0.5rem' : '1.5rem')};
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  gap: 0.75rem;
  color: white;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${FONTSIZE.lg};
  font-weight: ${FONTWEIGHT.bold};
`;

const LogoIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  position: relative;
  z-index: 1;
`;

const CollapseButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const NewChatButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: 0.75rem;
  padding: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.75rem 1rem')};
  background: white;
  color: #667eea;
  border: none;
  border-radius: 0.75rem;
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.25);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ $collapsed }) => ($collapsed ? '0.5rem' : '1rem')};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

const SectionLabel = styled.div`
  font-size: ${FONTSIZE.xs};
  font-weight: ${FONTWEIGHT.semibold};
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding: 0 ${({ $collapsed }) => ($collapsed ? '0' : '0.75rem')};
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  gap: 0.75rem;
  padding: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.75rem 1rem')};
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  background: ${({ $isActive }) => ($isActive ? '#f3f4f6' : 'transparent')};
  border-left: ${({ $isActive }) => ($isActive ? '3px solid #667eea' : '3px solid transparent')};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ $isActive }) => ($isActive ? '#f3f4f6' : '#f9fafb')};
  }
`;

const ChatItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
`;

const ChatIcon = styled(MessageSquare)`
  flex-shrink: 0;
  color: ${({ $isActive }) => ($isActive ? '#667eea' : '#9ca3af')};
`;

const ChatTitle = styled.span`
  font-size: ${FONTSIZE.sm};
  color: ${({ $isActive }) => ($isActive ? '#1f2937' : '#6b7280')};
  font-weight: ${({ $isActive }) => ($isActive ? FONTWEIGHT.medium : FONTWEIGHT.normal)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

const ChatActions = styled.button`
  opacity: 0;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  flex-shrink: 0;

  ${ChatItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: #e5e7eb;
    color: #6b7280;
  }

  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

const Footer = styled.div`
  padding: ${({ $collapsed }) => ($collapsed ? '0.5rem' : '1rem')};
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FooterButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  gap: 0.75rem;
  padding: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.75rem 1rem')};
  background: transparent;
  border: none;
  color: ${({ $danger }) => ($danger ? '#ef4444' : '#6b7280')};
  font-size: ${FONTSIZE.sm};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fee2e2' : '#f3f4f6')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DropdownMenuContent = styled(Dropdown.Content)`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 160px;
`;

const DropdownMenuItem = styled(Dropdown.Item)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  font-size: ${FONTSIZE.sm};
  color: #374151;
  cursor: pointer;
  border-radius: 0.375rem;
  outline: none;

  &:hover {
    background-color: #f3f4f6;
  }

  &[data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
`;

export function AppSidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onSetChat,
  isChatsLoading,
  onPdfUploadSuccess,
  selectedInstrument,
  collapsed,
  onCollapsedChange,
}) {
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { data: profile } = useUserProfile(true);
  const logout = useLogout();

  const bottomItems = [
    {
      title: "Import Manual",
      icon: Download,
      action: () => {
        showModal({
          modal: (
            <PdfModal
              key={selectedInstrument?.id}
              hideModal={hideModal}
              onUploadSuccess={onPdfUploadSuccess}
              selectedInstrument={selectedInstrument}
            />
          ),
        });
      },
    },
    {
      title: "Search Chat",
      icon: Search,
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
      action: () => navigate("/profile"),
    },
    {
      title: "Log out",
      icon: LogOut,
      danger: true,
      action: () => {
        showModal({
          modal: (
            <LogoutModal
              title="Logout?"
              onLogout={async () => {
                await logout(profile, profile?.pref_autosave ?? true);
              }}
              hideModal={hideModal}
              navigateTo="/signin"
            />
          ),
        });
      },
    },
  ];

  return (
    <SidebarContainer $collapsed={collapsed}>
      <Header $collapsed={collapsed}>
        <LogoSection $collapsed={collapsed}>
          {!collapsed && (
            <Logo>
              <LogoIcon src={logo} alt="Keysight Logo" />
              <span>KeysightGPT</span>
            </Logo>
          )}
          {collapsed && <Sparkles size={24} />}
          <CollapseButton onClick={() => onCollapsedChange(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </CollapseButton>
        </LogoSection>
        <NewChatButton onClick={onNewChat} $collapsed={collapsed}>
          <Plus size={18} />
          {!collapsed && <span>New chat</span>}
        </NewChatButton>
      </Header>

      <Content $collapsed={collapsed}>
        {!collapsed && <SectionLabel>Recent Chats</SectionLabel>}
        {isChatsLoading ? (
          !collapsed && (
            <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              Loading chats...
            </div>
          )
        ) : (
          (chats ?? []).map((chat) => (
            <ChatItemComponent
              key={chat.session_id}
              chat={chat}
              isActive={activeChat?.session_id === chat.session_id}
              onSelect={() => onSelectChat(chat.session_id)}
              onRename={(newName) => onRenameChat(chat.session_id, newName)}
              onDelete={(session_id) => onDeleteChat(session_id)}
              collapsed={collapsed}
            />
          ))
        )}
      </Content>

      <Footer $collapsed={collapsed}>
        {bottomItems.map((item, index) => (
          <FooterButton
            key={`${item.title}-${index}`}
            onClick={!item.disabled ? item.action : undefined}
            disabled={item.disabled}
            $collapsed={collapsed}
            $danger={item.danger}
            title={collapsed ? item.title : undefined}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.title}</span>}
          </FooterButton>
        ))}
      </Footer>
    </SidebarContainer>
  );
}

function ChatItemComponent({ chat, isActive, onSelect, onRename, onDelete, collapsed }) {
  const { showModal, hideModal } = useModal();

  return (
    <ChatItem
      $isActive={isActive}
      $collapsed={collapsed}
      onClick={onSelect}
      title={collapsed ? chat.title : undefined}
    >
      <ChatItemContent>
        <ChatIcon size={16} $isActive={isActive} />
        <ChatTitle $isActive={isActive} $collapsed={collapsed}>
          {chat.title}
        </ChatTitle>
      </ChatItemContent>

      {!collapsed && (
        <Dropdown.Root>
          <Dropdown.Trigger asChild onClick={(e) => e.stopPropagation()}>
            <ChatActions $collapsed={collapsed}>
              <MoreVertical size={16} />
            </ChatActions>
          </Dropdown.Trigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
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
              <Edit size={16} />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
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
              <Trash2 size={16} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </Dropdown.Root>
      )}
    </ChatItem>
  );
}
