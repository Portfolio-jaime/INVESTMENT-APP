import styled, { css, keyframes } from 'styled-components';
import { designSystem } from '../../theme/designSystem';

// 🎭 Animation Keyframes
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

const slideUp = keyframes`
  from { 
    transform: translateY(100%); 
    opacity: 0;
  }
  to { 
    transform: translateY(0); 
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from { 
    transform: scale(0.95); 
    opacity: 0; 
  }
  to { 
    transform: scale(1); 
    opacity: 1; 
  }
`;

const shimmer = keyframes`
  0% { 
    transform: translateX(-100%); 
  }
  100% { 
    transform: translateX(100%); 
  }
`;

const pulse = keyframes`
  0%, 100% { 
    opacity: 1; 
  }
  50% { 
    opacity: 0.5; 
  }
`;

const float = keyframes`
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-10px); 
  }
`;

// 🎨 Premium Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

const getButtonStyles = (variant: string) => {
  const styles = {
    primary: css`
      background: ${designSystem.colors.gradient.primary};
      color: ${designSystem.colors.text.inverse};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.glow.primary}, ${designSystem.shadows.lg};
      }
      
      &:active {
        transform: translateY(0);
      }
    `,
    secondary: css`
      background: ${designSystem.colors.background.secondary};
      color: ${designSystem.colors.text.primary};
      border: 1px solid ${designSystem.colors.border.light};
      
      &:hover:not(:disabled) {
        background: ${designSystem.colors.gray[100]};
        border-color: ${designSystem.colors.border.medium};
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.md};
      }
    `,
    success: css`
      background: ${designSystem.colors.gradient.success};
      color: ${designSystem.colors.text.inverse};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.glow.success}, ${designSystem.shadows.lg};
      }
    `,
    warning: css`
      background: ${designSystem.colors.gradient.sunset};
      color: ${designSystem.colors.text.inverse};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.glow.warning}, ${designSystem.shadows.lg};
      }
    `,
    error: css`
      background: ${designSystem.colors.error[500]};
      color: ${designSystem.colors.text.inverse};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        background: ${designSystem.colors.error[600]};
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.glow.error}, ${designSystem.shadows.lg};
      }
    `,
    ghost: css`
      background: transparent;
      color: ${designSystem.colors.text.primary};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        background: ${designSystem.colors.gray[50]};
        color: ${designSystem.colors.primary[600]};
      }
    `,
    outline: css`
      background: transparent;
      color: ${designSystem.colors.primary[600]};
      border: 1px solid ${designSystem.colors.primary[300]};
      
      &:hover:not(:disabled) {
        background: ${designSystem.colors.primary[50]};
        border-color: ${designSystem.colors.primary[500]};
        transform: translateY(-1px);
        box-shadow: ${designSystem.shadows.md};
      }
    `,
  };
  
  return styles[variant as keyof typeof styles] || styles.primary;
};

const getSizeStyles = (size: string) => {
  const styles = {
    sm: css`
      padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
      font-size: ${designSystem.typography.fontSize.sm.size};
      line-height: ${designSystem.typography.fontSize.sm.lineHeight};
      border-radius: ${designSystem.borderRadius.md};
      height: 32px;
      min-width: 64px;
    `,
    md: css`
      padding: ${designSystem.spacing.md} ${designSystem.spacing.lg};
      font-size: ${designSystem.typography.fontSize.base.size};
      line-height: ${designSystem.typography.fontSize.base.lineHeight};
      border-radius: ${designSystem.borderRadius.md};
      height: 40px;
      min-width: 80px;
    `,
    lg: css`
      padding: ${designSystem.spacing.lg} ${designSystem.spacing.xl};
      font-size: ${designSystem.typography.fontSize.lg.size};
      line-height: ${designSystem.typography.fontSize.lg.lineHeight};
      border-radius: ${designSystem.borderRadius.lg};
      height: 48px;
      min-width: 96px;
    `,
    xl: css`
      padding: ${designSystem.spacing.xl} ${designSystem.spacing['2xl']};
      font-size: ${designSystem.typography.fontSize.xl.size};
      line-height: ${designSystem.typography.fontSize.xl.lineHeight};
      border-radius: ${designSystem.borderRadius.lg};
      height: 56px;
      min-width: 112px;
    `,
  };
  
  return styles[size as keyof typeof styles] || styles.md;
};

export const Button = styled.button<ButtonProps>`
  font-family: ${designSystem.typography.fontFamily.sans};
  font-weight: ${designSystem.typography.fontWeight.medium};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${designSystem.spacing.sm};
  
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  cursor: pointer;
  outline: none;
  position: relative;
  overflow: hidden;
  
  ${({ variant = 'primary' }) => getButtonStyles(variant)}
  ${({ size = 'md' }) => getSizeStyles(size)}
  
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  ${({ disabled }) => disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  `}
  
  ${({ isLoading }) => isLoading && css`
    color: transparent;
    
    &::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `}
  
  &:focus-visible {
    outline: 2px solid ${designSystem.colors.primary[500]};
    outline-offset: 2px;
  }
`;

// 🃏 Premium Card Component
interface CardProps {
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost';
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const getCardStyles = (variant: string) => {
  const styles = {
    elevated: css`
      background: ${designSystem.colors.background.primary};
      border: 1px solid ${designSystem.colors.border.light};
      box-shadow: ${designSystem.shadows.md};
    `,
    outlined: css`
      background: ${designSystem.colors.background.primary};
      border: 1px solid ${designSystem.colors.border.medium};
      box-shadow: none;
    `,
    filled: css`
      background: ${designSystem.colors.background.secondary};
      border: 1px solid transparent;
      box-shadow: none;
    `,
    ghost: css`
      background: transparent;
      border: 1px solid transparent;
      box-shadow: none;
    `,
  };
  
  return styles[variant as keyof typeof styles] || styles.elevated;
};

export const Card = styled.div<CardProps>`
  border-radius: ${designSystem.borderRadius.xl};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  position: relative;
  
  ${({ variant = 'elevated' }) => getCardStyles(variant)}
  
  ${({ padding = 'md' }) => {
    const paddingMap = {
      sm: designSystem.spacing.lg,
      md: designSystem.spacing.xl,
      lg: designSystem.spacing['2xl'],
      xl: designSystem.spacing['3xl'],
    };
    return css`
      padding: ${paddingMap[padding]};
    `;
  }}
  
  ${({ interactive }) => interactive && css`
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${designSystem.shadows.lg};
      border-color: ${designSystem.colors.primary[200]};
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
  
  ${({ animate }) => animate && css`
    animation: ${fadeIn} ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  `}
`;

// 💫 Input Component Premium
interface InputProps {
  variant?: 'default' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'error' | 'success' | 'warning';
  hasIcon?: boolean;
}

export const Input = styled.input<InputProps>`
  width: 100%;
  font-family: ${designSystem.typography.fontFamily.sans};
  font-size: ${designSystem.typography.fontSize.base.size};
  line-height: ${designSystem.typography.fontSize.base.lineHeight};
  border-radius: ${designSystem.borderRadius.md};
  transition: all ${designSystem.animation.duration.normal} ${designSystem.animation.easing.default};
  outline: none;
  
  ${({ size = 'md' }) => {
    const sizeMap = {
      sm: css`
        padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
        font-size: ${designSystem.typography.fontSize.sm.size};
        height: 32px;
      `,
      md: css`
        padding: ${designSystem.spacing.md} ${designSystem.spacing.lg};
        height: 40px;
      `,
      lg: css`
        padding: ${designSystem.spacing.lg} ${designSystem.spacing.xl};
        font-size: ${designSystem.typography.fontSize.lg.size};
        height: 48px;
      `,
    } as const;
    return sizeMap[size as keyof typeof sizeMap];
  }}
  
  ${({ hasIcon }) => hasIcon && css`
    padding-left: ${designSystem.spacing['3xl']};
  `}
  
  ${({ variant = 'default' }) => {
    const variantMap = {
      default: css`
        background: ${designSystem.colors.background.primary};
        border: 1px solid ${designSystem.colors.border.light};
        
        &:hover {
          border-color: ${designSystem.colors.border.medium};
        }
        
        &:focus {
          border-color: ${designSystem.colors.primary[500]};
          box-shadow: 0 0 0 3px ${designSystem.colors.primary[100]};
        }
      `,
      filled: css`
        background: ${designSystem.colors.background.secondary};
        border: 1px solid transparent;
        
        &:hover {
          background: ${designSystem.colors.gray[100]};
        }
        
        &:focus {
          background: ${designSystem.colors.background.primary};
          border-color: ${designSystem.colors.primary[500]};
          box-shadow: 0 0 0 3px ${designSystem.colors.primary[100]};
        }
      `,
      minimal: css`
        background: transparent;
        border: none;
        border-bottom: 1px solid ${designSystem.colors.border.light};
        border-radius: 0;
        
        &:focus {
          border-bottom-color: ${designSystem.colors.primary[500]};
          box-shadow: 0 1px 0 0 ${designSystem.colors.primary[500]};
        }
      `,
    };
    return variantMap[variant];
  }}
  
  ${({ state }) => {
    if (!state || state === 'default') return '';
    
    const stateMap = {
      error: css`
        border-color: ${designSystem.colors.error[500]} !important;
        box-shadow: 0 0 0 3px ${designSystem.colors.error[100]} !important;
      `,
      success: css`
        border-color: ${designSystem.colors.success[500]} !important;
        box-shadow: 0 0 0 3px ${designSystem.colors.success[100]} !important;
      `,
      warning: css`
        border-color: ${designSystem.colors.warning[500]} !important;
        box-shadow: 0 0 0 3px ${designSystem.colors.warning[100]} !important;
      `,
    };
    return stateMap[state as keyof typeof stateMap];
  }}
  
  &::placeholder {
    color: ${designSystem.colors.text.tertiary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 📊 Loading Skeleton Premium
export const Skeleton = styled.div<{ 
  width?: string; 
  height?: string; 
  borderRadius?: string;
  animate?: boolean;
}>`
  background: linear-gradient(
    90deg,
    ${designSystem.colors.gray[200]} 25%,
    ${designSystem.colors.gray[100]} 50%,
    ${designSystem.colors.gray[200]} 75%
  );
  background-size: 200% 100%;
  border-radius: ${({ borderRadius = designSystem.borderRadius.md }) => borderRadius};
  
  width: ${({ width = '100%' }) => width};
  height: ${({ height = '20px' }) => height};
  
  ${({ animate = true }) => animate && css`
    animation: ${shimmer} 1.5s infinite;
  `}
`;

// 🎯 Badge Component
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${designSystem.typography.fontFamily.sans};
  font-weight: ${designSystem.typography.fontWeight.medium};
  border-radius: ${designSystem.borderRadius.full};
  white-space: nowrap;
  
  ${({ size = 'md' }) => {
    const sizeMap = {
      sm: css`
        font-size: ${designSystem.typography.fontSize.xs.size};
        line-height: ${designSystem.typography.fontSize.xs.lineHeight};
        padding: 2px ${designSystem.spacing.sm};
        min-height: 16px;
      `,
      md: css`
        font-size: ${designSystem.typography.fontSize.sm.size};
        line-height: ${designSystem.typography.fontSize.sm.lineHeight};
        padding: ${designSystem.spacing.xs} ${designSystem.spacing.md};
        min-height: 20px;
      `,
      lg: css`
        font-size: ${designSystem.typography.fontSize.base.size};
        line-height: ${designSystem.typography.fontSize.base.lineHeight};
        padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
        min-height: 24px;
      `,
    };
    return sizeMap[size];
  }}
  
  ${({ variant = 'primary' }) => {
    const variantMap = {
      primary: css`
        background: ${designSystem.colors.primary[100]};
        color: ${designSystem.colors.primary[800]};
      `,
      secondary: css`
        background: ${designSystem.colors.gray[100]};
        color: ${designSystem.colors.gray[800]};
      `,
      success: css`
        background: ${designSystem.colors.success[100]};
        color: ${designSystem.colors.success[800]};
      `,
      warning: css`
        background: ${designSystem.colors.warning[100]};
        color: ${designSystem.colors.warning[800]};
      `,
      error: css`
        background: ${designSystem.colors.error[100]};
        color: ${designSystem.colors.error[800]};
      `,
    };
    return variantMap[variant];
  }}
  
  ${({ dot }) => dot && css`
    width: 8px;
    height: 8px;
    min-width: 8px;
    min-height: 8px;
    padding: 0;
    border-radius: 50%;
  `}
`;

// 🌊 Container & Layout
export const Container = styled.div<{
  maxWidth?: string;
  padding?: string;
  center?: boolean;
}>`
  width: 100%;
  margin: 0 auto;
  
  ${({ maxWidth = '1200px' }) => css`
    max-width: ${maxWidth};
  `}
  
  ${({ padding = designSystem.spacing.lg }) => css`
    padding: 0 ${padding};
  `}
  
  ${({ center }) => center && css`
    display: flex;
    align-items: center;
    justify-content: center;
  `}
`;

export const Flex = styled.div<{
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: string;
  wrap?: boolean;
}>`
  display: flex;
  
  ${({ direction = 'row' }) => css`
    flex-direction: ${direction};
  `}
  
  ${({ align = 'start' }) => {
    const alignMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return css`
      align-items: ${alignMap[align]};
    `;
  }}
  
  ${({ justify = 'start' }) => {
    const justifyMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    };
    return css`
      justify-content: ${justifyMap[justify]};
    `;
  }}
  
  ${({ gap = designSystem.spacing.md }) => css`
    gap: ${gap};
  `}
  
  ${({ wrap }) => wrap && css`
    flex-wrap: wrap;
  `}
`;

// 📝 Text Components
export const Heading = styled.h1<{
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: keyof typeof designSystem.typography.fontWeight;
  color?: string;
  gradient?: boolean;
}>`
  font-family: ${designSystem.typography.fontFamily.display};
  margin: 0;
  line-height: 1.2;
  
  ${({ level = 1 }) => {
    const levelMap = {
      1: css`
        font-size: ${designSystem.typography.fontSize['4xl'].size};
        font-weight: ${designSystem.typography.fontWeight.bold};
      `,
      2: css`
        font-size: ${designSystem.typography.fontSize['3xl'].size};
        font-weight: ${designSystem.typography.fontWeight.bold};
      `,
      3: css`
        font-size: ${designSystem.typography.fontSize['2xl'].size};
        font-weight: ${designSystem.typography.fontWeight.semibold};
      `,
      4: css`
        font-size: ${designSystem.typography.fontSize.xl.size};
        font-weight: ${designSystem.typography.fontWeight.semibold};
      `,
      5: css`
        font-size: ${designSystem.typography.fontSize.lg.size};
        font-weight: ${designSystem.typography.fontWeight.medium};
      `,
      6: css`
        font-size: ${designSystem.typography.fontSize.base.size};
        font-weight: ${designSystem.typography.fontWeight.medium};
      `,
    };
    return levelMap[level];
  }}
  
  ${({ weight }) => weight && css`
    font-weight: ${designSystem.typography.fontWeight[weight]};
  `}
  
  ${({ color = designSystem.colors.text.primary }) => css`
    color: ${color};
  `}
  
  ${({ gradient }) => gradient && css`
    background: ${designSystem.colors.gradient.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `}
`;

export const Text = styled.p<{
  size?: keyof typeof designSystem.typography.fontSize;
  weight?: keyof typeof designSystem.typography.fontWeight;
  color?: string;
  muted?: boolean;
}>`
  font-family: ${designSystem.typography.fontFamily.sans};
  margin: 0;
  
  ${({ size = 'base' }) => css`
    font-size: ${designSystem.typography.fontSize[size].size};
    line-height: ${designSystem.typography.fontSize[size].lineHeight};
  `}
  
  ${({ weight = 'normal' }) => css`
    font-weight: ${designSystem.typography.fontWeight[weight]};
  `}
  
  ${({ color, muted }) => {
    if (color) {
      return css`color: ${color};`;
    }
    if (muted) {
      return css`color: ${designSystem.colors.text.secondary};`;
    }
    return css`color: ${designSystem.colors.text.primary};`;
  }}
`;

// Export animation keyframes for direct use
export const animations = {
  fadeIn,
  slideUp,
  scaleIn,
  shimmer,
  pulse,
  float,
};