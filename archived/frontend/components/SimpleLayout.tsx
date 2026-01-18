import React from 'react';
import styled from 'styled-components';
import { designSystem } from '../theme/designSystem';
import SimpleNavigation from './SimpleNavigation';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${designSystem.colors.background.secondary};
`;

const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  margin-left: ${({ sidebarOpen }) => sidebarOpen ? '280px' : '80px'};
  transition: margin-left ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const SimpleLayout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    <LayoutContainer>
      <SimpleNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <MainContent sidebarOpen={sidebarOpen}>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default SimpleLayout;