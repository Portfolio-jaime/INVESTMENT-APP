import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Loader2, BarChart3, Activity, DollarSign, Zap, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import styled, { keyframes } from 'styled-components';
import { designSystem } from '../theme/designSystem';
import { usePortfolios, useTopMovers, useBackendHealth, useRealTimeData, usePortfolioSummary } from '../src/hooks/useApi';

interface DashboardProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

// 🎭 Premium Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

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

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// 🎯 Button Component with Loveable Design
const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.xs};
  border: none;
  border-radius: ${designSystem.borderRadius.lg};
  font-family: ${designSystem.typography.fontFamily.sans};
  font-weight: ${designSystem.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  position: relative;
  overflow: hidden;
  
  ${({ size = 'md' }) => {
    const sizes = {
      sm: `
        padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
        font-size: ${designSystem.typography.fontSize.sm.size};
      `,
      md: `
        padding: ${designSystem.spacing.md} ${designSystem.spacing.xl};
        font-size: ${designSystem.typography.fontSize.base.size};
      `,
      lg: `
        padding: ${designSystem.spacing.lg} ${designSystem.spacing['2xl']};
        font-size: ${designSystem.typography.fontSize.lg.size};
      `,
    };
    return sizes[size];
  }}
  
  ${({ variant = 'primary' }) => {
    const variants = {
      primary: `
        background: ${designSystem.colors.gradient.primary};
        color: white;
        &:hover { transform: translateY(-2px); box-shadow: ${designSystem.shadows.lg}; }
      `,
      secondary: `
        background: ${designSystem.colors.background.secondary};
        color: ${designSystem.colors.text.primary};
        border: 1px solid ${designSystem.colors.border.medium};
        &:hover { border-color: ${designSystem.colors.primary[300]}; }
      `,
      success: `
        background: ${designSystem.colors.success[500]};
        color: white;
        &:hover { background: ${designSystem.colors.success[600]}; }
      `,
      error: `
        background: ${designSystem.colors.error[500]};
        color: white;
        &:hover { background: ${designSystem.colors.error[600]}; }
      `,
      warning: `
        background: ${designSystem.colors.warning[500]};
        color: white;
        &:hover { background: ${designSystem.colors.warning[600]}; }
      `,
    };
    return variants[variant];
  }}
  
  ${({ disabled }) => disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  `}
  
  ${({ isLoading }) => isLoading && `
    color: transparent;
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `}
`;

// 🃏 Premium Card Component
const Card = styled.div<{
  interactive?: boolean;
  padding?: string;
}>`
  background: ${designSystem.colors.background.primary};
  border: 1px solid ${designSystem.colors.border.light};
  border-radius: ${designSystem.borderRadius.xl};
  box-shadow: ${designSystem.shadows.md};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  padding: ${({ padding = designSystem.spacing.xl }) => padding};
  
  ${({ interactive }) => interactive && `
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${designSystem.shadows.lg};
    }
  `}
`;

// 🎯 Text Components
const Heading = styled.h1<{
  level?: 1 | 2 | 3 | 4;
  gradient?: boolean;
}>`
  font-family: ${designSystem.typography.fontFamily.display};
  margin: 0;
  line-height: 1.2;
  
  ${({ level = 1 }) => {
    const levels = {
      1: `font-size: ${designSystem.typography.fontSize['4xl'].size}; font-weight: ${designSystem.typography.fontWeight.bold};`,
      2: `font-size: ${designSystem.typography.fontSize['3xl'].size}; font-weight: ${designSystem.typography.fontWeight.bold};`,
      3: `font-size: ${designSystem.typography.fontSize['2xl'].size}; font-weight: ${designSystem.typography.fontWeight.semibold};`,
      4: `font-size: ${designSystem.typography.fontSize.xl.size}; font-weight: ${designSystem.typography.fontWeight.semibold};`,
    };
    return levels[level];
  }}
  
  color: ${designSystem.colors.text.primary};
  
  ${({ gradient }) => gradient && `
    background: ${designSystem.colors.gradient.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `}
`;

const Text = styled.p<{
  size?: 'sm' | 'base' | 'lg';
  muted?: boolean;
  weight?: 'normal' | 'medium' | 'semibold';
}>`
  font-family: ${designSystem.typography.fontFamily.sans};
  margin: 0;
  
  ${({ size = 'base' }) => {
    const sizes = {
      sm: `font-size: ${designSystem.typography.fontSize.sm.size}; line-height: ${designSystem.typography.fontSize.sm.lineHeight};`,
      base: `font-size: ${designSystem.typography.fontSize.base.size}; line-height: ${designSystem.typography.fontSize.base.lineHeight};`,
      lg: `font-size: ${designSystem.typography.fontSize.lg.size}; line-height: ${designSystem.typography.fontSize.lg.lineHeight};`,
    };
    return sizes[size];
  }}
  
  ${({ weight = 'normal' }) => `
    font-weight: ${designSystem.typography.fontWeight[weight]};
  `}
  
  color: ${({ muted }) => 
    muted ? designSystem.colors.text.secondary : designSystem.colors.text.primary
  };
`;

// 🌊 Layout Components
const Container = styled.div<{
  maxWidth?: string;
}>`
  width: 100%;
  margin: 0 auto;
  max-width: ${({ maxWidth = '1200px' }) => maxWidth};
  padding: 0 ${designSystem.spacing.lg};
`;

const Flex = styled.div<{
  justify?: 'start' | 'center' | 'end' | 'between';
  align?: 'start' | 'center' | 'end';
  gap?: string;
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
`;

// 🎨 Styled Components with Loveable Design
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    135deg, 
    ${designSystem.colors.background.primary} 0%,
    ${designSystem.colors.background.secondary} 100%
  );
  padding: ${designSystem.spacing['2xl']};
  
  @media (max-width: ${designSystem.breakpoints.md}) {
    padding: ${designSystem.spacing.lg};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${designSystem.spacing.xl};
  margin: ${designSystem.spacing['2xl']} 0;
  
  @media (max-width: ${designSystem.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${designSystem.spacing.lg};
  }
`;

const MarketCard = styled(Card)<{ trend?: 'positive' | 'negative' }>`
  position: relative;
  overflow: hidden;
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${designSystem.shadows['2xl']};
    
    ${({ trend }) => trend === 'positive' && `
      box-shadow: ${designSystem.shadows.glow.success}, ${designSystem.shadows['2xl']};
    `}
    
    ${({ trend }) => trend === 'negative' && `
      box-shadow: ${designSystem.shadows.glow.error}, ${designSystem.shadows['2xl']};
    `}
  }
  
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
  
  animation: ${fadeIn} ${designSystem.animation.duration.slow} ${designSystem.animation.easing.default};
`;

const PriceDisplay = styled.div<{ trend?: 'positive' | 'negative' }>`
  font-size: ${designSystem.typography.fontSize['3xl'].size};
  font-weight: ${designSystem.typography.fontWeight.bold};
  font-family: ${designSystem.typography.fontFamily.display};
  color: ${designSystem.colors.text.primary};
  margin: ${designSystem.spacing.md} 0;
  
  ${({ trend }) => trend === 'positive' && `
    color: ${designSystem.colors.success[600]};
  `}
  
  ${({ trend }) => trend === 'negative' && `
    color: ${designSystem.colors.error[600]};
  `}
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

const StatusIndicator = styled.div<{ status: 'live' | 'updating' | 'offline' }>`
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
      offline: `
        background: ${designSystem.colors.error[100]};
        color: ${designSystem.colors.error[800]};
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
        offline: designSystem.colors.error[500],
      };
      return colors[status];
    }};
    
    ${({ status }) => status === 'live' && `
      animation: ${pulse} 2s ease-in-out infinite;
    `}
  }
`;

const SelectInput = styled.select`
  padding: ${designSystem.spacing.md} ${designSystem.spacing.lg};
  border: 1px solid ${designSystem.colors.border.light};
  border-radius: ${designSystem.borderRadius.md};
  background: ${designSystem.colors.background.primary};
  color: ${designSystem.colors.text.primary};
  font-family: ${designSystem.typography.fontFamily.sans};
  font-size: ${designSystem.typography.fontSize.base.size};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  
  &:hover {
    border-color: ${designSystem.colors.border.medium};
  }
  
  &:focus {
    outline: none;
    border-color: ${designSystem.colors.primary[500]};
    box-shadow: 0 0 0 3px ${designSystem.colors.primary[100]};
  }
`;

const StatCard = styled(Card)`
  text-align: center;
  background: ${designSystem.colors.background.primary};
  border: 1px solid ${designSystem.colors.border.light};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${designSystem.shadows.lg};
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: ${designSystem.spacing.lg};
  
  svg {
    color: ${designSystem.colors.primary[500]};
    animation: spin 1s linear infinite;
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
`;

const ErrorState = styled(Card)`
  background: ${designSystem.colors.error[50]};
  border: 1px solid ${designSystem.colors.error[200]};
  padding: ${designSystem.spacing['2xl']};
  
  h3 {
    color: ${designSystem.colors.error[800]};
    font-size: ${designSystem.typography.fontSize.lg.size};
    font-weight: ${designSystem.typography.fontWeight.semibold};
    margin-bottom: ${designSystem.spacing.md};
  }
  
  p {
    color: ${designSystem.colors.error[600]};
    margin-bottom: ${designSystem.spacing.lg};
  }
`;

const LoveableDashboard: React.FC<DashboardProps> = ({ addNotification }) => {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  
  // API hooks
  const { 
    portfolioHealth, 
    marketDataHealth, 
    isPortfolioHealthy, 
    isMarketDataHealthy, 
    loading: healthLoading 
  } = useBackendHealth();
  
  const { data: portfolios, loading: portfoliosLoading, error: portfoliosError } = usePortfolios();
  const { data: topMovers, loading: topMoversLoading, error: topMoversError } = useTopMovers();
  const { data: portfolioSummary, loading: summaryLoading } = usePortfolioSummary(selectedPortfolio);
  
  // Real-time market data for selected symbols
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const { 
    data: marketQuotes, 
    loading: marketLoading, 
    error: marketError,
    lastUpdate
  } = useRealTimeData(symbols, 30000); // Update every 30 seconds

  // Set first portfolio as selected if available
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolio) {
      setSelectedPortfolio(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolio]);

  // Notification for successful data updates
  useEffect(() => {
    if (lastUpdate) {
      addNotification('success', 'Market data updated');
    }
  }, [lastUpdate, addNotification]);

  const getConnectionStatus = () => {
    if (healthLoading) return 'updating';
    if (isPortfolioHealthy && isMarketDataHealthy) return 'live';
    return 'offline';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
      isPositive
    };
  };

  if (portfoliosLoading || topMoversLoading || marketLoading) {
    return (
      <DashboardContainer>
        <Container maxWidth="1400px">
          <LoadingState>
            <Loader2 size={48} />
            <Text size="lg" muted>Loading investment data...</Text>
          </LoadingState>
        </Container>
      </DashboardContainer>
    );
  }

  if (portfoliosError || topMoversError || marketError) {
    const errorMessage = portfoliosError || topMoversError || marketError || 'Unknown error occurred';
    return (
      <DashboardContainer>
        <Container maxWidth="1400px">
          <ErrorState>
            <Flex align="center" gap={designSystem.spacing.md}>
              <AlertTriangle size={24} />
              <div>
                <h3>Connection Error</h3>
                <p>{errorMessage}</p>
                <Text size="sm" muted style={{ marginBottom: designSystem.spacing.lg }}>
                  Portfolio Service: {isPortfolioHealthy ? '✅ Connected' : '❌ Disconnected'}
                  <br />
                  Market Data Service: {isMarketDataHealthy ? '✅ Connected' : '❌ Disconnected'}
                </Text>
                <Button 
                  variant="error" 
                  onClick={() => window.location.reload()}
                  size="md"
                >
                  <RefreshCw size={16} />
                  Retry Connection
                </Button>
              </div>
            </Flex>
          </ErrorState>
        </Container>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Container maxWidth="1400px">
        {/* Backend Health Status */}
        <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing.lg }}>
          <StatusIndicator status={getConnectionStatus()}>
            {getConnectionStatus() === 'live' && <CheckCircle size={16} />}
            {getConnectionStatus() === 'updating' && <RefreshCw size={16} />}
            {getConnectionStatus() === 'offline' && <WifiOff size={16} />}
            Backend {getConnectionStatus() === 'live' ? 'Connected' : 
                   getConnectionStatus() === 'updating' ? 'Checking...' : 'Disconnected'}
          </StatusIndicator>
          
          {lastUpdate && (
            <Text size="sm" muted>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </Flex>

        {/* Header Section */}
        <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing['3xl'] }}>
          <div>
            <Heading level={1} gradient>
              Investment Dashboard
            </Heading>
            <Text size="lg" muted style={{ marginTop: designSystem.spacing.sm }}>
              Real-time portfolio management and market insights
            </Text>
          </div>
          
          <Flex align="center" gap={designSystem.spacing.lg}>
            {portfolios && portfolios.length > 0 && (
              <SelectInput 
                value={selectedPortfolio || ''} 
                onChange={(e) => setSelectedPortfolio(e.target.value)}
              >
                <option value="">Select Portfolio</option>
                {portfolios.map((portfolio: any) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </SelectInput>
            )}
            
            <StatusIndicator status={marketLoading ? 'updating' : 'live'}>
              <Wifi size={16} />
              {marketLoading ? 'Updating...' : 'Live Data'}
            </StatusIndicator>
          </Flex>
        </Flex>

        {/* Portfolio Summary */}
        {selectedPortfolio && portfolioSummary && (
          <StatsGrid style={{ marginBottom: designSystem.spacing['2xl'] }}>
            <StatCard>
              <DollarSign size={32} color={designSystem.colors.primary[500]} />
              <Heading level={3} style={{ margin: `${designSystem.spacing.md} 0` }}>
                {formatPrice(portfolioSummary.total_value)}
              </Heading>
              <Text muted>Total Portfolio Value</Text>
            </StatCard>
            
            <StatCard>
              <Activity size={32} color={designSystem.colors.success[500]} />
              <Heading level={3} style={{ margin: `${designSystem.spacing.md} 0` }}>
                {formatPrice(portfolioSummary.total_pnl)}
              </Heading>
              <Text muted>Total P&L</Text>
              <ChangeIndicator isPositive={portfolioSummary.total_pnl >= 0}>
                {portfolioSummary.total_pnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {formatChange(portfolioSummary.total_pnl_percent).value}
              </ChangeIndicator>
            </StatCard>
            
            <StatCard>
              <BarChart3 size={32} color={designSystem.colors.warning[500]} />
              <Heading level={3} style={{ margin: `${designSystem.spacing.md} 0` }}>
                {portfolioSummary.positions_count}
              </Heading>
              <Text muted>Active Positions</Text>
            </StatCard>
            
            <StatCard>
              <BarChart3 size={32} color={designSystem.colors.primary[500]} />
              <Heading level={3} style={{ margin: `${designSystem.spacing.md} 0` }}>
                {formatPrice(portfolioSummary.cash_balance)}
              </Heading>
              <Text muted>Cash Balance</Text>
            </StatCard>
          </StatsGrid>
        )}

        {/* Market Overview */}
        <Heading level={2} style={{ marginBottom: designSystem.spacing.xl }}>
          Market Overview
        </Heading>
        
        <StatsGrid>
          {marketQuotes.map((quote: any) => {
            const change = formatChange(quote.change_percent);
            const trend = change.isPositive ? 'positive' : 'negative';

            return (
              <MarketCard key={quote.symbol} trend={trend} interactive>
                <Flex justify="between" align="start">
                  <div style={{ flex: 1 }}>
                    <Flex align="center" gap={designSystem.spacing.sm}>
                      <Activity size={20} color={designSystem.colors.primary[500]} />
                      <Text weight="semibold" size="lg">
                        {quote.symbol}
                      </Text>
                    </Flex>
                    
                    <PriceDisplay trend={trend}>
                      {formatPrice(quote.current_price)}
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
                  <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing.sm }}>
                    <Text size="sm" muted>Volume</Text>
                    <Text size="sm" weight="medium">
                      {quote.volume?.toLocaleString() || 'N/A'}
                    </Text>
                  </Flex>
                  <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing.sm }}>
                    <Text size="sm" muted>High</Text>
                    <Text size="sm" weight="medium">
                      {formatPrice(quote.high)}
                    </Text>
                  </Flex>
                  <Flex justify="between" align="center">
                    <Text size="sm" muted>Low</Text>
                    <Text size="sm" weight="medium">
                      {formatPrice(quote.low)}
                    </Text>
                  </Flex>
                </div>
              </MarketCard>
            );
          })}
        </StatsGrid>

        {/* Top Movers */}
        {topMovers && topMovers.length > 0 && (
          <>
            <Heading level={2} style={{ marginTop: designSystem.spacing['3xl'], marginBottom: designSystem.spacing.xl }}>
              Top Movers
            </Heading>
            
            <StatsGrid>
              {topMovers.slice(0, 6).map((quote: any) => {
                const change = formatChange(quote.change_percent);
                const trend = change.isPositive ? 'positive' : 'negative';

                return (
                  <MarketCard key={quote.symbol} trend={trend} interactive>
                    <Flex align="center" gap={designSystem.spacing.sm}>
                      <Zap size={20} color={designSystem.colors.warning[500]} />
                      <Text weight="semibold" size="lg">
                        {quote.symbol}
                      </Text>
                    </Flex>
                    
                    <PriceDisplay trend={trend} style={{ fontSize: designSystem.typography.fontSize['2xl'].size }}>
                      {formatPrice(quote.current_price)}
                    </PriceDisplay>
                    
                    <ChangeIndicator isPositive={change.isPositive}>
                      {change.isPositive ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span>{change.value}</span>
                    </ChangeIndicator>
                  </MarketCard>
                );
              })}
            </StatsGrid>
          </>
        )}

        {/* No Data States */}
        {!portfolios || portfolios.length === 0 ? (
          <Card style={{ marginTop: designSystem.spacing['2xl'], textAlign: 'center', padding: designSystem.spacing['3xl'] }}>
            <DollarSign size={48} color={designSystem.colors.text.secondary} />
            <Heading level={3} style={{ margin: `${designSystem.spacing.lg} 0` }}>
              No Portfolios Found
            </Heading>
            <Text muted>Create your first portfolio to start tracking investments</Text>
            <Button 
              variant="primary" 
              size="lg" 
              style={{ marginTop: designSystem.spacing.xl }}
              onClick={() => addNotification('info', 'Portfolio creation coming soon!')}
            >
              Create Portfolio
            </Button>
          </Card>
        ) : null}

      </Container>
    </DashboardContainer>
  );
};

export default LoveableDashboard;