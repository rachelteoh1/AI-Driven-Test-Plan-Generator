"use client"

import { useState } from "react"
import styled from "styled-components"
import { Header } from "../header"
import { Profile } from "./profile"
import { DashboardContent } from "./dashboard-content"
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../../lib/styles"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${COLORS.background.light};
`

const TabWrapper = styled.div`
  padding: 0 ${SPACING.sm};
  border-bottom: 1px solid ${COLORS.grey};
`

const Tabs = styled.div`
  width: 100%;
  max-width: 28rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
`

const TabButton = styled.button`
  padding: ${SPACING.md} 0;
  text-align: center;
  font-weight: ${FONTWEIGHT.medium};
  font-size: ${FONTSIZE.sm};
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.active ? COLORS.accent : "transparent")};
  color: ${(props) => (props.active ? COLORS.accent : COLORS.medium)};
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  }
`

const Content = styled.div`
  flex: 1;
  padding: ${SPACING["2xl"]};
  overflow: auto;
  background-color: ${COLORS.background.light};
`

export function MainDashboard() {
  const [activeTab, setActiveTab] = useState("edit-profile")

  return (
    <Container>
      <Header />
      <TabWrapper>
        <Tabs>
          <TabButton
            onClick={() => setActiveTab("edit-profile")}
            active={activeTab === "edit-profile"}
          >
            Edit Profile
          </TabButton>
          <TabButton
            onClick={() => setActiveTab("summary-dashboard")}
            active={activeTab === "summary-dashboard"}
          >
            Summary Dashboard
          </TabButton>
        </Tabs>
      </TabWrapper>
      <Content>
        {activeTab === "edit-profile" && <Profile />}
        {activeTab === "summary-dashboard" && <DashboardContent />}
      </Content>
    </Container>
  )
}
