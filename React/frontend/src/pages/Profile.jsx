import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { MainDashboard } from "../components/profile/main-dashboard"
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export function Profile({ chats, setChats, activeChatId, setActiveChatId, onNewChat }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isChatSessionPage = location.pathname === "/home";

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    if (!isChatSessionPage) {
      navigate("/home");
    }
  };

  const handleNewChat = () => {
    onNewChat?.();
    if (!isChatSessionPage) {
      navigate("/home");
    }
  };

  useEffect(() => {
  setActiveChatId(null);
}, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          chats={chats}
          activeChat={activeChatId ? { id: activeChatId } : null}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onRenameChat={(id, newName) => {
            const updatedChats = chats.map(chat =>
              chat.id === id ? { ...chat, name: newName } : chat
            );
            setChats(updatedChats);
          }}
          onDeleteChat={(id) => {
            const updatedChats = chats.filter(chat => chat.id !== id);
            setChats(updatedChats);
            if (activeChatId === id && updatedChats.length > 0) {
              setActiveChatId(updatedChats[0].id);
            }
          }}
          onSetChat={(newChatList) => {
            setChats(newChatList);
            setActiveChatId(newChatList[0]?.id || null);
          }}
        />
        <main className="flex-1 bg-gray-50">
          <MainDashboard />
        </main>
      </div>
    </SidebarProvider>
  );
}

