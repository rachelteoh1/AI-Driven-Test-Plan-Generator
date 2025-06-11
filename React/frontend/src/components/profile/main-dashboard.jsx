"use client"

import { useState } from "react"
import styled from "styled-components"
import { Header } from "../header"
import { Profile } from "./profile"
import { DashboardContent } from "./dashboard-content"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const TabWrapper = styled.div`
  padding: 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`

const Tabs = styled.div`
  width: 100%;
  max-width: 28rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
`

const TabButton = styled.button`
  padding: 1rem 0;
  text-align: center;
  font-weight: 500;
  border-bottom: 2px solid
    ${(props) => (props.active ? "#3B82F6" : "transparent")};
  color: ${(props) => (props.active ? "#2563EB" : "#6B7280")};
  background: transparent;
  cursor: pointer;
`

const Content = styled.div`
  flex: 1;
  padding: 2.5rem;
  overflow: auto;
  background-color: #f9fafb;
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
