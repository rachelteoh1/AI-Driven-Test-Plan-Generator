// "use client"

import { Plus, MessageSquare, History, Download, Search, Trash2, User, LogOut } from "lucide-react"
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
import { useNavigate } from "react-router-dom"

const navigationItems = [
  {
    title: "New chat",
    icon: MessageSquare,
    action: () => {},
  },
  {
    title: "History",
    icon: History,
    action: () => {},
  },
  {
    title: "History",
    icon: History,
    action: () => {},
  },
]

export function AppSidebar() {
  const navigate  = useNavigate()

  const bottomItems = [
    {
      title: "Download result",
      icon: Download,
      action: () => {},
    },
    {
      title: "Search Chat",
      icon: Search,
      action: () => {},
    },
    {
      title: "Clear conversations",
      icon: Trash2,
      action: () => {},
    },
    {
      title: "My account",
      icon: User,
      action: () => navigate("/profile"),
    },
    {
      title: "Log out",
      icon: LogOut,
      action: () => navigate("/signup"),
    },
  ]

  return (
    <Sidebar className="w-64 border-r border-gray-200 fixed top-0 left-0 h-full bg-white z-10" >
      <SidebarHeader className="p-4">
        <Button
          className="w-full justify-start gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 no-underline"
          onClick={() => navigate("/home")}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="list-none">
              {navigationItems.map((item, index) => (
                <SidebarMenuItem key={`${item.title}-${index}`} className="list-none">
                  <SidebarMenuButton asChild>
                    <button
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 w-full text-left no-underline"
                      style={{ textDecoration: "none", listStyle: "none" }}
                      onClick={item.action}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu className="list-none">
          {bottomItems.map((item, index) => (
            <SidebarMenuItem key={`${item.title}-${index}`} className="list-none">
              <SidebarMenuButton asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 w-full text-left no-underline"
                  style={{ textDecoration: "none", listStyle: "none" }}
                  onClick={item.action}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
