import React, { useState, useEffect } from 'react';
import { getQuotes, getHistoricalData, HistoricalData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Loader2, BarChart3, Activity, DollarSign, Zap } from 'lucide-react';
import { useAppStore, Quote } from '../store/useAppStore';
import ServiceStatus from './common/ServiceStatus';
import styled, { keyframes } from 'styled-components';
import { designSystem } from '../theme/designSystem';

interface DashboardProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

// 🎭 Premium Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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

// 🎨 Premium Button Component
const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
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
      success: `
        background: ${designSystem.colors.gradient.success};
        color: ${designSystem.colors.text.inverse};
      `,
      warning: `
        background: ${designSystem.colors.gradient.sunset};
        color: ${designSystem.colors.text.inverse};
      `,
      error: `
        background: ${designSystem.colors.error[500]};
        color: ${designSystem.colors.text.inverse};
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

const ChartContainer = styled(Card)`
  background: ${designSystem.colors.background.primary};
  border: 1px solid ${designSystem.colors.border.light};
  box-shadow: ${designSystem.shadows.xl};
  animation: ${fadeIn} ${designSystem.animation.duration.slow} ${designSystem.animation.easing.default} 0.2s;
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
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [refreshing, setRefreshing] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // Get state and actions from store
  const quotes = useAppStore((state) => state.quotes);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const refreshMarketData = useAppStore((state) => state.refreshMarketData);
  const setQuotes = useAppStore((state) => state.setQuotes);

  const MARKET_SYMBOLS = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, Nasdaq

  const fetchMarketOverview = async (showNotifications = false) => {
    try {
      const quotesList = await getQuotes(MARKET_SYMBOLS);
      const quotesMap = quotesList.reduce((acc, quote) => ({
        ...acc,
        [quote.symbol]: {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          timestamp: new Date().toISOString(),
        }
      }), {});

      setQuotes({ ...quotes, ...quotesMap });

      if (showNotifications) {
        addNotification('success', 'Market data updated successfully');
      }
    } catch (err) {
      console.error('Error fetching market overview:', err);
      if (showNotifications) {
        addNotification('error', 'Failed to update market data');
      }
    }
  };

  const fetchChartData = async (symbol: string, showNotifications = false) => {
    try {
      setChartLoading(true);
      const data = await getHistoricalData(symbol, '1mo');
      setChartData(data);
      if (showNotifications) {
        addNotification('success', `Chart data for ${symbol} updated`);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      if (showNotifications) {
        addNotification('error', `Failed to load chart for ${symbol}`);
      }
    } finally {
      setChartLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMarketOverview(true),
      fetchChartData(selectedSymbol, true)
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchMarketOverview(),
        fetchChartData(selectedSymbol)
      ]);
    };
    init();

    const interval = setInterval(() => {
      fetchMarketOverview();
      fetchChartData(selectedSymbol);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
      isPositive
    };
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Container maxWidth="1400px">
          <LoadingState>
            <Loader2 size={48} />
            <Text size="lg" muted>Loading market data...</Text>
          </LoadingState>
        </Container>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Container maxWidth="1400px">
          <ErrorState>
            <Flex align="center" gap={designSystem.spacing.md}>
              <AlertTriangle size={24} />
              <div>
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <Button 
                  variant="error" 
                  onClick={handleRefresh}
                  size="md"
                >
                  Try Again
                </Button>
              </div>
            </Flex>
          </ErrorState>
        </Container>
      </DashboardContainer>
    );
  }

  // Convert quotes object to array for market overview
  const marketOverview = MARKET_SYMBOLS
    .map(symbol => quotes[symbol])
    .filter(Boolean) as Quote[];

  return (
    <DashboardContainer>
      <Container maxWidth="1400px">
        {/* Service Status */}
        <ServiceStatus />

        {/* Header Section */}
        <Flex justify="between" align="center" style={{ marginBottom: designSystem.spacing['3xl'] }}>
          <div>
            <Heading level={1} gradient>
              Market Overview
            </Heading>
            <Text size="lg" muted style={{ marginTop: designSystem.spacing.sm }}>
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
              size="md"
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          </Flex>
        </Flex>

        {/* Market Overview Cards */}
        <StatsGrid>
          {marketOverview.map((quote) => {
            const change = formatChange(quote.change, quote.changePercent);
            const displayName = quote.symbol === '^GSPC' ? 'S&P 500' :
                               quote.symbol === '^DJI' ? 'Dow Jones' : 'Nasdaq';
            const trend = change.isPositive ? 'positive' : 'negative';

            return (
              <MarketCard key={quote.symbol} trend={trend} interactive padding="lg">
                <Flex justify="between" align="start">
                  <div style={{ flex: 1 }}>
                    <Flex align="center" gap={designSystem.spacing.sm}>
                      <BarChart3 size={20} color={designSystem.colors.primary[500]} />
                      <Text weight="semibold" size="lg">
                        {displayName}
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
                    <Text size="sm" weight="medium">
                      {quote.volume.toLocaleString()}
                    </Text>
                  </Flex>
                </div>
              </MarketCard>
            );
          })}
        </StatsGrid>

        {/* Price Chart */}
        <ChartContainer padding="xl">
          <Flex justify="between" align="start" style={{ marginBottom: designSystem.spacing['2xl'] }}>
            <div>
              <Heading level={2}>Price Chart</Heading>
              <Text muted style={{ marginTop: designSystem.spacing.xs }}>
                Historical price data for {selectedSymbol}
              </Text>
            </div>

            <Flex align="center" gap={designSystem.spacing.lg}>
              <SelectInput
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
              >
                <option value="AAPL">Apple (AAPL)</option>
                <option value="MSFT">Microsoft (MSFT)</option>
                <option value="GOOGL">Alphabet (GOOGL)</option>
                <option value="AMZN">Amazon (AMZN)</option>
                <option value="TSLA">Tesla (TSLA)</option>
                <option value="NVDA">NVIDIA (NVDA)</option>
                <option value="META">Meta (META)</option>
              </SelectInput>
            </Flex>
          </Flex>

          <div style={{ height: '320px', marginBottom: designSystem.spacing.xl }}>
            {chartLoading ? (
              <LoadingState>
                <Loader2 size={32} />
                <Text muted>Loading chart data...</Text>
              </LoadingState>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={designSystem.colors.primary[500]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={designSystem.colors.primary[500]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={designSystem.colors.border.light}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={designSystem.colors.text.tertiary}
                    tick={{ fill: designSystem.colors.text.tertiary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={designSystem.colors.text.tertiary}
                    tick={{ fill: designSystem.colors.text.tertiary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: designSystem.colors.background.primary,
                      border: `1px solid ${designSystem.colors.border.light}`,
                      borderRadius: designSystem.borderRadius.md,
                      boxShadow: designSystem.shadows.lg,
                      color: designSystem.colors.text.primary
                    }}
                    labelStyle={{ 
                      color: designSystem.colors.text.secondary, 
                      fontWeight: designSystem.typography.fontWeight.semibold 
                    }}
                    formatter={(value: any) => [formatPrice(value), 'Price']}
                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={designSystem.colors.primary[500]}
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <LoadingState>
                <Activity size={32} />
                <Text muted>No chart data available</Text>
              </LoadingState>
            )}
          </div>

          {/* Chart Stats */}
          {chartData.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: designSystem.spacing.lg,
              paddingTop: designSystem.spacing.xl,
              borderTop: `1px solid ${designSystem.colors.border.light}`
            }}>
              <StatCard padding="md">
                <DollarSign size={20} color={designSystem.colors.primary[500]} style={{ margin: '0 auto' }} />
                <PriceDisplay style={{ fontSize: designSystem.typography.fontSize.xl.size, margin: `${designSystem.spacing.sm} 0` }}>
                  {formatPrice(chartData[chartData.length - 1]?.close || 0)}
                </PriceDisplay>
                <Text size="sm" muted>Current Price</Text>
              </StatCard>
              
              <StatCard padding="md">
                <TrendingUp size={20} color={designSystem.colors.success[500]} style={{ margin: '0 auto' }} />
                <PriceDisplay style={{ fontSize: designSystem.typography.fontSize.xl.size, margin: `${designSystem.spacing.sm} 0`, color: designSystem.colors.success[600] }}>
                  {formatPrice(Math.max(...chartData.map(d => d.high)))}
                </PriceDisplay>
                <Text size="sm" muted>52W High</Text>
              </StatCard>
              
              <StatCard padding="md">
                <TrendingDown size={20} color={designSystem.colors.error[500]} style={{ margin: '0 auto' }} />
                <PriceDisplay style={{ fontSize: designSystem.typography.fontSize.xl.size, margin: `${designSystem.spacing.sm} 0`, color: designSystem.colors.error[600] }}>
                  {formatPrice(Math.min(...chartData.map(d => d.low)))}
                </PriceDisplay>
                <Text size="sm" muted>52W Low</Text>
              </StatCard>
              
              <StatCard padding="md">
                <Zap size={20} color={designSystem.colors.warning[500]} style={{ margin: '0 auto' }} />
                <PriceDisplay style={{ 
                  fontSize: designSystem.typography.fontSize.xl.size, 
                  margin: `${designSystem.spacing.sm} 0`,
                  color: (chartData[chartData.length - 1]?.close || 0) > (chartData[0]?.close || 0)
                    ? designSystem.colors.success[600] 
                    : designSystem.colors.error[600]
                }}>
                  {(((chartData[chartData.length - 1]?.close || 0) - (chartData[0]?.close || 0)) / (chartData[0]?.close || 1) * 100).toFixed(2)}%
                </PriceDisplay>
                <Text size="sm" muted>Period Change</Text>
              </StatCard>
            </div>
          )}
        </ChartContainer>
      </Container>
    </DashboardContainer>
  );
};

export default LoveableDashboard;