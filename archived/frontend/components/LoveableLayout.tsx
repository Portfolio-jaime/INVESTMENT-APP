import React from 'react';
import styled from 'styled-components';
import { designSystem } from '../theme/designSystem';
import LoveableNavigation from './LoveableNavigation';

interface LoveableLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications?: number;
}

// 🎨 Styled Components
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${designSystem.colors.background.secondary};
`;

const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  margin-left: ${({ sidebarOpen }) => sidebarOpen ? '280px' : '80px'};
  transition: margin-left ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  
  @media (max-width: ${designSystem.breakpoints.lg}) {
    margin-left: 0;
  }
`;

const ContentArea = styled.div`
  min-height: 100vh;
  position: relative;
`;

const LoveableLayout: React.FC<LoveableLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  notifications = 0
}) => {
  return (
    <LayoutContainer>
      <LoveableNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={notifications}
      />
      
      <MainContent sidebarOpen={sidebarOpen}>
        <ContentArea>
          {children}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default LoveableLayout;