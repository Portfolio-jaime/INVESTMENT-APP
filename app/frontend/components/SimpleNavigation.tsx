import React from 'react';
import styled from 'styled-components';
import { designSystem } from '../theme/designSystem';
import { Home, BarChart3, Eye, Briefcase, Zap } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const NavigationContainer = styled.nav<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${({ isOpen }) => isOpen ? '280px' : '80px'};
  background: ${designSystem.colors.background.primary};
  border-right: 1px solid ${designSystem.colors.border.light};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  z-index: 1000;
  box-shadow: ${designSystem.shadows.md};
  overflow: hidden;
`;

const NavHeader = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.md};
  padding: ${designSystem.spacing.xl};
  border-bottom: 1px solid ${designSystem.colors.border.light};
  min-height: 80px;
  
  .logo {
    width: 40px;
    height: 40px;
    background: ${designSystem.colors.gradient.primary};
    border-radius: ${designSystem.borderRadius.lg};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${designSystem.colors.text.inverse};
    font-weight: ${designSystem.typography.fontWeight.bold};
    flex-shrink: 0;
  }
  
  .brand {
    opacity: ${({ isOpen }) => isOpen ? 1 : 0};
    transition: opacity ${designSystem.animation.duration.normal};
    
    h1 {
      font-size: ${designSystem.typography.fontSize.xl.size};
      font-weight: ${designSystem.typography.fontWeight.bold};
      color: ${designSystem.colors.text.primary};
      margin: 0;
    }
    
    p {
      font-size: ${designSystem.typography.fontSize.sm.size};
      color: ${designSystem.colors.text.secondary};
      margin: 0;
    }
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: ${designSystem.spacing.lg} 0;
  margin: 0;
`;

const NavItem = styled.li<{ isActive: boolean; isOpen: boolean }>`
  margin: ${designSystem.spacing.xs} ${designSystem.spacing.md};
  
  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${designSystem.spacing.md};
    padding: ${designSystem.spacing.md} ${designSystem.spacing.lg};
    border: none;
    border-radius: ${designSystem.borderRadius.lg};
    background: ${({ isActive }) => 
      isActive 
        ? designSystem.colors.primary[100] 
        : 'transparent'
    };
    color: ${({ isActive }) => 
      isActive 
        ? designSystem.colors.primary[700] 
        : designSystem.colors.text.secondary
    };
    font-family: ${designSystem.typography.fontFamily.sans};
    font-size: ${designSystem.typography.fontSize.base.size};
    font-weight: ${designSystem.typography.fontWeight.medium};
    cursor: pointer;
    transition: all ${designSystem.animation.duration.normal};
    text-align: left;
    position: relative;
    
    &:hover {
      background: ${({ isActive }) => 
        isActive 
          ? designSystem.colors.primary[200] 
          : designSystem.colors.gray[50]
      };
      color: ${designSystem.colors.primary[600]};
      transform: translateX(4px);
    }
    
    .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }
    
    .label {
      opacity: ${({ isOpen }) => isOpen ? 1 : 0};
      transition: opacity ${designSystem.animation.duration.normal};
      white-space: nowrap;
    }
  }
`;

const ToggleButton = styled.button<{ isOpen: boolean }>`
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: 1px solid ${designSystem.colors.border.light};
  border-radius: ${designSystem.borderRadius.full};
  background: ${designSystem.colors.background.primary};
  color: ${designSystem.colors.text.secondary};
  cursor: pointer;
  transition: all ${designSystem.animation.duration.normal};
  z-index: 1;
  
  &:hover {
    color: ${designSystem.colors.primary[600]};
    border-color: ${designSystem.colors.primary[300]};
    transform: translateY(-50%) scale(1.1);
  }
  
  svg {
    width: 14px;
    height: 14px;
    transform: rotate(${({ isOpen }) => isOpen ? '180deg' : '0deg'});
    transition: transform ${designSystem.animation.duration.normal};
  }
`;

const navigationItems = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Market', icon: BarChart3 },
  { id: 'watchlist', label: 'Watchlist', icon: Eye },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
];

const SimpleNavigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    <NavigationContainer isOpen={sidebarOpen}>
      <NavHeader isOpen={sidebarOpen}>
        <div className="logo">
          <Zap />
        </div>
        <div className="brand">
          <h1>TRII</h1>
          <p>Investment Platform</p>
        </div>
      </NavHeader>

      <NavList>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavItem 
              key={item.id}
              isActive={activeTab === item.id}
              isOpen={sidebarOpen}
            >
              <button onClick={() => setActiveTab(item.id)}>
                <Icon className="icon" />
                <span className="label">{item.label}</span>
              </button>
            </NavItem>
          );
        })}
      </NavList>

      <ToggleButton 
        isOpen={sidebarOpen}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path 
            d="M9 18l6-6-6-6" 
            stroke="currentColor" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </ToggleButton>
    </NavigationContainer>
  );
};

export default SimpleNavigation;