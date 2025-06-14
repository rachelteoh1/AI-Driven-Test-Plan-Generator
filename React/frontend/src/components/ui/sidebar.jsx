// sidebar.jsx
"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"
import styled from "styled-components"
import { Button } from "./button"
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../../lib/styles";

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3rem"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarWrapper = styled.div`
  --sidebar-width: ${SIDEBAR_WIDTH};
  --sidebar-width-icon: ${SIDEBAR_WIDTH_ICON};
  display: flex;
  min-height: 100svh;
  width: 100%;
`

const StyledSidebar = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: ${SIDEBAR_WIDTH};
  background-color: ${({ theme }) => theme.card};

  &[data-collapsible="offcanvas"] {
    // Add collapsible styles if needed
  }
`

const StyledSidebarTrigger = styled(Button)`
  height: 1.75rem;
  width: 1.75rem;
`

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
  padding: ${SPACING.sm};
`

const SidebarContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};
  flex: 1;
  overflow: auto;
  min-height: 0;
`

const SidebarGroupWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  padding: ${SPACING.sm};
`

const SidebarGroupContentWrapper = styled.div`
  width: 100%;
  font-size: ${FONTSIZE.sm};
`

const SidebarMenuWrapper = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  min-width: 0;
`

const SidebarMenuItemWrapper = styled.li`
  position: relative;
  display: block;
`

const SidebarMenuButtonStyled = styled.button`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  width: 100%;
  overflow: hidden;
  border-radius: 0.375rem;
  padding: ${SPACING.sm};
  font-size: ${FONTSIZE.sm};
  text-align: left;
  outline: none;
  background-color: transparent;
  color: ${({ theme }) => theme.greys.dark};
  transition: background-color 0.2s, color 0.2s;
  font-weight: ${FONTWEIGHT.normal};

  &:hover {
    background-color: ${({ theme }) => theme.hover};
    color: ${({ theme }) => theme.greys.light};
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accent};
  }

  &[data-active="true"] {
    background-color: ${({ theme }) => theme.newChat};
    color: ${({ theme }) => theme.greys.light};
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
`

const SidebarProvider = React.forwardRef(
  ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
      },
      [setOpenProp, open],
    )

    const toggleSidebar = React.useCallback(() => {
      setOpen((open) => !open)
    }, [setOpen])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <SidebarWrapper className={className} style={style} ref={ref} {...props}>
          {children}
        </SidebarWrapper>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = "SidebarProvider"

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <StyledSidebarTrigger
      ref={ref}
      variant="ghost"
      size="icon"
      className={className}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </StyledSidebarTrigger>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export {
  StyledSidebar as Sidebar,
  SidebarContentWrapper as SidebarContent,
  SidebarSection as SidebarFooter,
  SidebarGroupWrapper as SidebarGroup,
  SidebarGroupContentWrapper as SidebarGroupContent,
  SidebarSection as SidebarHeader,
  SidebarMenuWrapper as SidebarMenu,
  SidebarMenuButtonStyled as SidebarMenuButton,
  SidebarMenuItemWrapper as SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} 
