import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Activity, DollarSign, Zap } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { designSystem } from '../theme/designSystem';

// 🎭 Premium Animations
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// 🎨 Premium Components
const Button = styled.button<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}>`
  font-family: ${designSystem.typography.fontFamily.sans};
  font-weight: ${designSystem.typography.fontWeight.medium};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  border: none;
  cursor: pointer;
  outline: none;
  border-radius: ${designSystem.borderRadius.md};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  
  ${({ size = 'md' }) => {
    const sizes = {
      sm: `padding: ${designSystem.spacing.sm} ${designSystem.spacing.md}; font-size: ${designSystem.typography.fontSize.sm.size}; height: 32px;`,
      md: `padding: ${designSystem.spacing.md} ${designSystem.spacing.lg}; font-size: ${designSystem.typography.fontSize.base.size}; height: 40px;`,
      lg: `padding: ${designSystem.spacing.lg} ${designSystem.spacing.xl}; font-size: ${designSystem.typography.fontSize.lg.size}; height: 48px;`,
    };
    return sizes[size];
  }}
  
  ${({ variant = 'primary' }) => {
    const variants = {
      primary: `
        background: ${designSystem.colors.gradient.primary};
        color: ${designSystem.colors.text.inverse};
        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: ${designSystem.shadows.glow.primary}, ${designSystem.shadows.lg};
        }
      `,
      secondary: `
        background: ${designSystem.colors.background.secondary};
        color: ${designSystem.colors.text.primary};
        border: 1px solid ${designSystem.colors.border.light};
        &:hover:not(:disabled) {
          background: ${designSystem.colors.gray[100]};
        }
      `,
    };
    return variants[variant];
  }}
`;

const Card = styled.div<{ interactive?: boolean }>`
  background: ${designSystem.colors.background.primary};
  border: 1px solid ${designSystem.colors.border.light};
  border-radius: ${designSystem.borderRadius.xl};
  box-shadow: ${designSystem.shadows.md};
  padding: ${designSystem.spacing.xl};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  position: relative;
  overflow: hidden;
  
  ${({ interactive }) => interactive && `
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${designSystem.shadows.lg};
    }
  `}
  
  animation: ${fadeIn} ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
`;

const MarketCard = styled(Card)<{ trend?: 'positive' | 'negative' }>`
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ trend }) => 
      trend === 'positive' 
        ? designSystem.colors.gradient.success
        : trend === 'negative'
        ? designSystem.colors.error[500]
        : designSystem.colors.gradient.primary
    };
  }
  
  &:hover {
    ${({ trend }) => trend === 'positive' && `
      box-shadow: ${designSystem.shadows.glow.success}, ${designSystem.shadows.lg};
    `}
    
    ${({ trend }) => trend === 'negative' && `
      box-shadow: ${designSystem.shadows.glow.error}, ${designSystem.shadows.lg};
    `}
  }
`;

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg, 
    ${designSystem.colors.background.primary} 0%,
    ${designSystem.colors.background.secondary} 100%
  );
  padding: ${designSystem.spacing['2xl']};
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Heading = styled.h1<{ gradient?: boolean }>`
  font-family: ${designSystem.typography.fontFamily.display};
  font-size: ${designSystem.typography.fontSize['4xl'].size};
  font-weight: ${designSystem.typography.fontWeight.bold};
  margin: 0 0 ${designSystem.spacing.sm} 0;
  line-height: 1.2;
  
  ${({ gradient }) => gradient ? `
    background: ${designSystem.colors.gradient.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  ` : `
    color: ${designSystem.colors.text.primary};
  `}
`;

const Text = styled.p<{ size?: 'sm' | 'base' | 'lg'; muted?: boolean }>`
  font-family: ${designSystem.typography.fontFamily.sans};
  margin: 0;
  
  ${({ size = 'base' }) => {
    const sizes = {
      sm: `font-size: ${designSystem.typography.fontSize.sm.size};`,
      base: `font-size: ${designSystem.typography.fontSize.base.size};`,
      lg: `font-size: ${designSystem.typography.fontSize.lg.size};`,
    };
    return sizes[size];
  }}
  
  color: ${({ muted }) => 
    muted ? designSystem.colors.text.secondary : designSystem.colors.text.primary
  };
`;

const Flex = styled.div<{
  justify?: 'start' | 'center' | 'end' | 'between';
  align?: 'start' | 'center' | 'end';
  gap?: string;
  wrap?: boolean;
}>`
  display: flex;
  
  ${({ justify = 'start' }) => {
    const justifyMap = {
      start: 'flex-start',
      center: 'center', 
      end: 'flex-end',
      between: 'space-between',
    };
    return `justify-content: ${justifyMap[justify]};`;
  }}
  
  ${({ align = 'start' }) => {
    const alignMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end', 
    };
    return `align-items: ${alignMap[align]};`;
  }}
  
  gap: ${({ gap = designSystem.spacing.md }) => gap};
  
  ${({ wrap }) => wrap && 'flex-wrap: wrap;'}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${designSystem.spacing.xl};
  margin: ${designSystem.spacing['3xl']} 0;
`;

const PriceDisplay = styled.div<{ trend?: 'positive' | 'negative' }>`
  font-size: ${designSystem.typography.fontSize['3xl'].size};
  font-weight: ${designSystem.typography.fontWeight.bold};
  font-family: ${designSystem.typography.fontFamily.display};
  margin: ${designSystem.spacing.md} 0;
  
  color: ${({ trend }) => {
    if (trend === 'positive') return designSystem.colors.success[600];
    if (trend === 'negative') return designSystem.colors.error[600];
    return designSystem.colors.text.primary;
  }};
`;

const ChangeIndicator = styled.div<{ isPositive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  font-weight: ${designSystem.typography.fontWeight.semibold};
  font-size: ${designSystem.typography.fontSize.sm.size};
  
  color: ${({ isPositive }) => 
    isPositive ? designSystem.colors.success[600] : designSystem.colors.error[600]
  };
  
  svg {
    animation: ${float} 2s ease-in-out infinite;
  }
`;

const StatusIndicator = styled.div<{ status: 'live' | 'updating' }>`
  display: flex;
  align-items: center;
  gap: ${designSystem.spacing.xs};
  padding: ${designSystem.spacing.xs} ${designSystem.spacing.md};
  border-radius: ${designSystem.borderRadius.full};
  font-size: ${designSystem.typography.fontSize.sm.size};
  font-weight: ${designSystem.typography.fontWeight.medium};
  
  ${({ status }) => {
    const styles = {
      live: `
        background: ${designSystem.colors.success[100]};
        color: ${designSystem.colors.success[800]};
      `,
      updating: `
        background: ${designSystem.colors.primary[100]};
        color: ${designSystem.colors.primary[800]};
      `,
    };
    return styles[status];
  }}
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ status }) => {
      const colors = {
        live: designSystem.colors.success[500],
        updating: designSystem.colors.primary[500],
      };
      return colors[status];
    }};
    
    ${({ status }) => status === 'live' && `
      animation: ${pulse} 2s ease-in-out infinite;
    `}
  }
`;

// 📊 Mock Data
const mockMarketData = [
  {
    symbol: '^GSPC',
    name: 'S&P 500',
    price: 4756.50,
    change: 23.45,
    changePercent: 0.49,
    volume: 3456789000
  },
  {
    symbol: '^DJI', 
    name: 'Dow Jones',
    price: 37393.20,
    change: -45.32,
    changePercent: -0.12,
    volume: 2345678900
  },
  {
    symbol: '^IXIC',
    name: 'Nasdaq',
    price: 14864.50,
    change: 67.89,
    changePercent: 0.46,
    volume: 4567890123
  }
];

interface DashboardProps {
  addNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const SimpleDashboard: React.FC<DashboardProps> = ({ addNotification }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
      if (addNotification) {
        addNotification('success', 'Market data updated successfully!');
      }
    }, 1000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
      isPositive
    };
  };

  return (
    <DashboardContainer>
      <Container>
        {/* Header Section */}
        <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing['3xl'] }}>
          <div>
            <Heading gradient>Market Overview</Heading>
            <Text size="lg" muted>
              Real-time financial data and insights
            </Text>
          </div>
          
          <Flex align="center" gap={designSystem.spacing.lg}>
            <StatusIndicator status={refreshing ? 'updating' : 'live'}>
              {refreshing ? 'Updating...' : 'Live Data'}
            </StatusIndicator>
            
            <Button
              variant="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              isLoading={refreshing}
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          </Flex>
        </Flex>

        {/* Market Overview Cards */}
        <StatsGrid>
          {mockMarketData.map((quote) => {
            const change = formatChange(quote.change, quote.changePercent);
            const trend = change.isPositive ? 'positive' : 'negative';

            return (
              <MarketCard key={quote.symbol} trend={trend} interactive>
                <Flex justify="between" align="start">
                  <div style={{ flex: 1 }}>
                    <Flex align="center" gap={designSystem.spacing.sm}>
                      <BarChart3 size={20} color={designSystem.colors.primary[500]} />
                      <Text size="lg" style={{ fontWeight: designSystem.typography.fontWeight.semibold }}>
                        {quote.name}
                      </Text>
                    </Flex>
                    
                    <PriceDisplay trend={trend}>
                      {formatPrice(quote.price)}
                    </PriceDisplay>
                    
                    <ChangeIndicator isPositive={change.isPositive}>
                      {change.isPositive ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span>{change.value}</span>
                    </ChangeIndicator>
                  </div>
                </Flex>

                <div style={{ 
                  marginTop: designSystem.spacing.lg, 
                  paddingTop: designSystem.spacing.lg,
                  borderTop: `1px solid ${designSystem.colors.border.light}` 
                }}>
                  <Flex justify="between" align="center">
                    <Text size="sm" muted>Volume</Text>
                    <Text size="sm" style={{ fontWeight: designSystem.typography.fontWeight.medium }}>
                      {quote.volume.toLocaleString()}
                    </Text>
                  </Flex>
                </div>
              </MarketCard>
            );
          })}
        </StatsGrid>

        {/* Quick Stats */}
        <Flex wrap gap={designSystem.spacing.lg} style={{ marginTop: designSystem.spacing['2xl'] }}>
          <Card style={{ minWidth: '200px', textAlign: 'center' }}>
            <DollarSign size={32} color={designSystem.colors.primary[500]} style={{ margin: '0 auto 12px' }} />
            <Text size="lg" style={{ fontWeight: designSystem.typography.fontWeight.bold, margin: '8px 0' }}>
              $47,580.32
            </Text>
            <Text size="sm" muted>Portfolio Value</Text>
          </Card>
          
          <Card style={{ minWidth: '200px', textAlign: 'center' }}>
            <Activity size={32} color={designSystem.colors.success[500]} style={{ margin: '0 auto 12px' }} />
            <Text size="lg" style={{ fontWeight: designSystem.typography.fontWeight.bold, margin: '8px 0' }}>
              +$2,340.50
            </Text>
            <Text size="sm" muted>Today's Gain</Text>
          </Card>
          
          <Card style={{ minWidth: '200px', textAlign: 'center' }}>
            <Zap size={32} color={designSystem.colors.warning[500]} style={{ margin: '0 auto 12px' }} />
            <Text size="lg" style={{ fontWeight: designSystem.typography.fontWeight.bold, margin: '8px 0' }}>
              +12.4%
            </Text>
            <Text size="sm" muted>Total Return</Text>
          </Card>
        </Flex>

        {/* Last Update */}
        <div style={{ 
          marginTop: designSystem.spacing['3xl'],
          padding: designSystem.spacing.lg,
          background: designSystem.colors.background.secondary,
          borderRadius: designSystem.borderRadius.lg,
          textAlign: 'center'
        }}>
          <Text size="sm" muted>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        </div>
      </Container>
    </DashboardContainer>
  );
};

export default SimpleDashboard;