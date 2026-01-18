import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { designSystem } from './theme/designSystem';
import SimpleLayout from './components/SimpleLayout';
import SimpleDashboard from './components/SimpleDashboard';

// 🎯 Global Styles with Loveable Design
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${designSystem.typography.fontFamily.sans};
    color: ${designSystem.colors.text.primary};
    background: ${designSystem.colors.background.secondary};
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* 🎨 Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${designSystem.colors.gray[100]};
    border-radius: ${designSystem.borderRadius.full};
  }

  ::-webkit-scrollbar-thumb {
    background: ${designSystem.colors.gray[300]};
    border-radius: ${designSystem.borderRadius.full};
    transition: background ${designSystem.animation.duration.fast} ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${designSystem.colors.gray[400]};
  }

  /* 🎯 Selection Styles */
  ::selection {
    background: ${designSystem.colors.primary[100]};
    color: ${designSystem.colors.primary[800]};
  }

  /* 🎪 Focus Styles */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid ${designSystem.colors.primary[500]};
    outline-offset: 2px;
  }

  /* 🎭 Smooth Animations */
  * {
    transition: background-color ${designSystem.animation.duration.fast} ease,
                border-color ${designSystem.animation.duration.fast} ease,
                color ${designSystem.animation.duration.fast} ease,
                opacity ${designSystem.animation.duration.fast} ease;
  }

  /* 🎨 Button Reset */
  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }

  /* 📝 Typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${designSystem.typography.fontFamily.display};
    font-weight: ${designSystem.typography.fontWeight.semibold};
    line-height: 1.2;
    margin-bottom: ${designSystem.spacing.md};
  }

  p {
    margin-bottom: ${designSystem.spacing.md};
  }

  /* 🔗 Link Styles */
  a {
    color: ${designSystem.colors.primary[600]};
    text-decoration: none;
    transition: color ${designSystem.animation.duration.fast} ease;

    &:hover {
      color: ${designSystem.colors.primary[700]};
      text-decoration: underline;
    }
  }
`;

// 🎯 Notification Component
const NotificationContainer = styled.div`
  position: fixed;
  bottom: ${designSystem.spacing.xl};
  right: ${designSystem.spacing.xl};
  z-index: ${designSystem.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${designSystem.spacing.md};
  max-width: 400px;
  
  @media (max-width: ${designSystem.breakpoints.sm}) {
    left: ${designSystem.spacing.lg};
    right: ${designSystem.spacing.lg};
    max-width: none;
  }
`;

const NotificationItem = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  padding: ${designSystem.spacing.lg};
  border-radius: ${designSystem.borderRadius.lg};
  box-shadow: ${designSystem.shadows.lg};
  backdrop-filter: blur(10px);
  border-left: 4px solid ${({ type }) => {
    const colors = {
      success: designSystem.colors.success[500],
      error: designSystem.colors.error[500],
      warning: designSystem.colors.warning[500],
      info: designSystem.colors.primary[500],
    };
    return colors[type];
  }};
  
  background: ${({ type }) => {
    const colors = {
      success: designSystem.colors.success[50],
      error: designSystem.colors.error[50],
      warning: designSystem.colors.warning[50],
      info: designSystem.colors.primary[50],
    };
    return colors[type];
  }};
  
  color: ${({ type }) => {
    const colors = {
      success: designSystem.colors.success[800],
      error: designSystem.colors.error[800],
      warning: designSystem.colors.warning[800],
      info: designSystem.colors.primary[800],
    };
    return colors[type];
  }};
  
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .notification-content {
    font-size: ${designSystem.typography.fontSize.sm.size};
    font-weight: ${designSystem.typography.fontWeight.medium};
  }
  
  .notification-time {
    font-size: ${designSystem.typography.fontSize.xs.size};
    opacity: 0.7;
    margin-top: ${designSystem.spacing.xs};
  }
`;

// 📱 Interfaces
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

const LoveableApp: React.FC = () => {
  const [setupCompleted, setSetupCompleted] = useState(
    localStorage.getItem('trii_setup_completed') === 'true'
  );
  const [activeTab, setActiveTab] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupCompleted(true);
    localStorage.setItem('trii_setup_completed', 'true');
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-remove notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => Date.now() - n.timestamp.getTime() < 5000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 🎯 Notification Manager
  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Show setup wizard if not completed
  // if (!setupCompleted) {
  //   return (
  //     <ThemeProvider theme={designSystem}>
  //       <GlobalStyle />
  //       <SetupWizard onComplete={handleSetupComplete} />
  //     </ThemeProvider>
  //   );
  // }

  // 🎨 Render Content Based on Active Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'landing':
        return (
          <div style={{
            padding: designSystem.spacing['3xl'],
            textAlign: 'center',
            background: designSystem.colors.background.primary,
            minHeight: '100vh'
          }}>
            <h1 style={{
              fontSize: designSystem.typography.fontSize['5xl'].size,
              fontWeight: designSystem.typography.fontWeight.bold,
              background: designSystem.colors.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: designSystem.spacing.xl
            }}>
              Welcome to TRII
            </h1>
            <p style={{
              fontSize: designSystem.typography.fontSize.lg.size,
              color: designSystem.colors.text.secondary,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Your intelligent investment platform. Navigate to Dashboard to see market data.
            </p>
          </div>
        );
      case 'dashboard':
        return <SimpleDashboard addNotification={addNotification} />;
      case 'watchlist':
        return (
          <div style={{
            padding: designSystem.spacing['3xl'],
            background: designSystem.colors.background.secondary,
            minHeight: '100vh'
          }}>
            <h2>Watchlist</h2>
            <p>Track your favorite stocks and cryptocurrencies (Coming Soon)</p>
          </div>
        );
      case 'portfolio':
        return (
          <div style={{
            padding: designSystem.spacing['3xl'],
            background: designSystem.colors.background.secondary,
            minHeight: '100vh'
          }}>
            <h2>Portfolio</h2>
            <p>Manage your investment portfolio (Coming Soon)</p>
          </div>
        );
      default:
        return <SimpleDashboard addNotification={addNotification} />;
    }
  };

  return (
    <ThemeProvider theme={designSystem}>
      <GlobalStyle />
      
      <SimpleLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {renderContent()}
      </SimpleLayout>

      {/* Notifications */}
      <NotificationContainer>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              {notification.message}
            </div>
            <div className="notification-time">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </NotificationItem>
        ))}
      </NotificationContainer>

      {/* Offline Indicator */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: designSystem.colors.warning[500],
          color: designSystem.colors.text.inverse,
          padding: designSystem.spacing.sm,
          textAlign: 'center',
          fontSize: designSystem.typography.fontSize.sm.size,
          fontWeight: designSystem.typography.fontWeight.medium,
          zIndex: designSystem.zIndex.banner,
        }}>
          ⚠️ You're currently offline. Some features may not be available.
        </div>
      )}
    </ThemeProvider>
  );
};

export default LoveableApp;