import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { MainDashboard } from "../components/profile/main-dashboard"
import { useNavigate} from "react-router-dom";
import styled from "styled-components";
import { SPACING } from "../lib/styles";
import { useState } from "react";



const MainContent = styled.main`
  margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '4rem' : '18rem')};
  transition: margin-left 0.3s ease;
  background: transparent;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${SPACING.L};
  overflow-y: auto;
  height: calc(100vh - 80px);
  margin-top: 0;
  padding-bottom: 0;
`;

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
  text-align: center;
  padding: 2rem;
`;
export const Profile = ({ chats, onSelectChat }) => {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate("/home?newchat=true");
  };

  const handleSelectChat = (chatId) => {
    onSelectChat(chatId);
    navigate("/home");
  };
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          chats={chats}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
           collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
        />
         <MainContent $sidebarCollapsed={sidebarCollapsed}>
                   
                     <ContentContainer>
                        <main className="flex-1 bg-gray-50">
          <MainDashboard />
        </main>
                     </ContentContainer></MainContent>
      
      </div>
    </SidebarProvider>
  );
}

