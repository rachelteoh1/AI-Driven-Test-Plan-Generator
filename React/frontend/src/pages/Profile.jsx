import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { MainDashboard } from "../components/profile/main-dashboard"

export function Profile() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gray-50">
          <MainDashboard />
        </main>
      </div>
    </SidebarProvider>
  )
}

