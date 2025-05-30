import { SidebarProvider } from "../components/ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { Header } from "../components/header"

export function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gray-50">
          <Header />
          <div className="flex-1 p-10 overflow-auto bg-gray-50">
            <div className="flex justify-center items-center min-h-full w-full">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to KeysightGPT</h1>
                <p className="text-lg text-gray-600">Hello Li Chee</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
