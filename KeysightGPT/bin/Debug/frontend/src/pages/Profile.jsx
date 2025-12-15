import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { MainDashboard } from "../components/profile/main-dashboard"
import { useNavigate} from "react-router-dom";

export const Profile = ({ chats, onSelectChat }) => {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate("/home?newchat=true");
  };

  const handleSelectChat = (chatId) => {
    onSelectChat(chatId);
    navigate("/home");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          chats={chats}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
        <main className="flex-1 bg-gray-50">
          <MainDashboard />
        </main>
      </div>
    </SidebarProvider>
  );
}

