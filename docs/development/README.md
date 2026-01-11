# Guía de Desarrollo - TRII Platform

## 🚀 Configuración del Entorno de Desarrollo

### 📋 Requisitos del Sistema

```yaml
# Requisitos mínimos
System Requirements:
  OS: macOS 12+ / Linux Ubuntu 20.04+ / Windows 11
  Memory: 16GB RAM (32GB recomendado)
  Storage: 50GB espacio libre
  CPU: Intel i5/AMD Ryzen 5 o superior (8 cores recomendado)

# Software requerido
Required Software:
  - Docker Desktop 4.15+
  - Kubernetes (incluido en Docker Desktop)
  - Node.js 18.x LTS
  - Python 3.11+
  - pnpm 8.x
  - Git 2.40+
  - VS Code (recomendado)
```

### 🔧 Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-org/trii-platform.git
cd trii-platform

# 2. Instalar dependencias globales
npm install -g pnpm@8
pip install poetry

# 3. Setup del workspace
pnpm install
poetry install

# 4. Configurar hooks de pre-commit
pre-commit install

# 5. Inicializar el cluster local
./scripts/setup/init-development.sh
```

### 🏗️ Arquitectura del Proyecto

```
trii-platform/
├── 🎨 app/                     # Frontend Applications
│   ├── frontend/               # React Web App
│   └── electron/              # Desktop Client
├── 🔧 backend/                 # Backend Microservices
│   ├── gateway/               # API Gateway (Node.js)
│   ├── market-data/           # Market Data Service (Python)
│   ├── ml-prediction/         # ML Service (Python)
│   ├── portfolio-manager/     # Portfolio Service (Node.js)
│   └── analysis-engine/       # Analysis Service (Python)
├── 📚 libs/                    # Shared Libraries
│   ├── api-client/            # API Client SDK
│   ├── common/                # Common utilities
│   └── python-common/         # Python shared code
├── 🚢 infrastructure/          # Kubernetes Manifests
├── 📝 docs/                    # Documentation
├── 🔧 scripts/                 # Development Scripts
└── 🧪 tests/                   # Test Suites
```

## 🛠️ Herramientas de Desarrollo

### 🎯 VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "ms-vscode.vscode-docker",
    "redhat.vscode-yaml",
    "streetsidesoftware.code-spell-checker",
    "github.copilot",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "ms-toolsai.jupyter"
  ]
}
```

### ⚙️ Configuración de VS Code

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

## 🎨 Frontend Development

### 🔧 Estructura del Frontend

```
app/frontend/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/              # Componentes básicos de UI
│   │   ├── charts/          # Gráficos y visualizaciones
│   │   └── forms/           # Formularios
│   ├── features/            # Características por dominio
│   │   ├── auth/           # Autenticación
│   │   ├── portfolio/      # Portfolio management
│   │   ├── trading/        # Trading functionality  
│   │   └── dashboard/      # Dashboard views
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utilities
├── public/                 # Assets estáticos
└── tests/                  # Frontend tests
```

### 🎭 Componentes y Patterns

#### 📦 Estructura de Componente

```typescript
// components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { ButtonProps } from './Button.types';
import { buttonVariants } from './Button.variants';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button.types.ts
import { VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';
import { buttonVariants } from './Button.variants';

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

// Button.variants.ts
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

#### 🎣 Custom Hooks Pattern

```typescript
// hooks/usePortfolio.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolio';
import { Portfolio, UpdatePortfolioRequest } from '@/types/portfolio';

export const usePortfolio = (portfolioId: string) => {
  const queryClient = useQueryClient();

  const portfolio = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => portfolioService.getById(portfolioId),
    staleTime: 30 * 1000, // 30 segundos
  });

  const updatePortfolio = useMutation({
    mutationFn: (data: UpdatePortfolioRequest) =>
      portfolioService.update(portfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });

  const deletePortfolio = useMutation({
    mutationFn: () => portfolioService.delete(portfolioId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['portfolio', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });

  return {
    portfolio: portfolio.data,
    isLoading: portfolio.isLoading,
    error: portfolio.error,
    updatePortfolio: updatePortfolio.mutate,
    deletePortfolio: deletePortfolio.mutate,
    isUpdating: updatePortfolio.isPending,
    isDeleting: deletePortfolio.isPending,
  };
};
```

#### 🗃️ Store Pattern (Zustand)

```typescript
// store/auth.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types/auth';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const result = await authService.login(email, password);
            set({
              user: result.user,
              tokens: result.tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        },

        logout: () => {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
          });
        },

        refreshToken: async () => {
          const { tokens } = get();
          if (!tokens?.refreshToken) return;

          try {
            const newTokens = await authService.refreshToken(tokens.refreshToken);
            set({ tokens: newTokens });
          } catch (error) {
            // Token inválido, hacer logout
            get().logout();
          }
        },

        updateProfile: async (data: Partial<User>) => {
          const { user } = get();
          if (!user) return;

          try {
            const updatedUser = await authService.updateProfile(user.id, data);
            set({ user: updatedUser });
          } catch (error) {
            set({ error: error.message });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
```

### 🎨 Styling Guide

#### 🎭 Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        // Semantic Colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // UI Colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
```

#### 🎨 Design Tokens

```typescript
// styles/tokens.ts
export const tokens = {
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
  
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};
```

## 🐍 Backend Development

### 🏗️ Estructura de Microservicio (Python)

```
backend/market-data/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration
│   │   ├── security.py     # Authentication
│   │   └── database.py     # DB connection
│   ├── api/                # API routes
│   │   ├── v1/             # API version 1
│   │   │   ├── endpoints/  # Route handlers
│   │   │   └── __init__.py
│   │   └── dependencies.py # Route dependencies
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   ├── repositories/       # Data access layer
│   └── utils/              # Utilities
├── tests/                  # Tests
├── migrations/             # Alembic migrations
├── Dockerfile
└── requirements.txt
```

#### 🚀 FastAPI Service Template

```python
# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import engine, database
from app.api.v1.api import api_router

# Create FastAPI instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Market Data Service API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Events
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown") 
async def shutdown():
    await database.disconnect()

# Health checks
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "market-data"}

@app.get("/health/ready")
async def readiness_check():
    try:
        # Check database connection
        await database.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not ready", "error": str(e)}
```

#### 🗄️ Repository Pattern

```python
# repositories/base.py
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get(self, id: int) -> Optional[ModelType]:
        result = await self.db.execute(select(self.model).filter(self.model.id == id))
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model(**obj_in.dict())
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def update(
        self, *, db_obj: ModelType, obj_in: UpdateSchemaType
    ) -> ModelType:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

# repositories/market_data.py
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from app.models.market_data import MarketData
from app.schemas.market_data import MarketDataCreate, MarketDataUpdate
from .base import BaseRepository

class MarketDataRepository(BaseRepository[MarketData, MarketDataCreate, MarketDataUpdate]):
    
    async def get_by_symbol_and_timeframe(
        self,
        symbol: str,
        timeframe: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[MarketData]:
        result = await self.db.execute(
            select(self.model).filter(
                and_(
                    self.model.symbol == symbol,
                    self.model.timeframe == timeframe,
                    self.model.timestamp >= start_time,
                    self.model.timestamp <= end_time
                )
            ).order_by(self.model.timestamp.desc())
        )
        return result.scalars().all()
    
    async def get_latest_by_symbol(self, symbol: str) -> Optional[MarketData]:
        result = await self.db.execute(
            select(self.model)
            .filter(self.model.symbol == symbol)
            .order_by(self.model.timestamp.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
```

#### 🏢 Service Layer

```python
# services/market_data.py
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio
from fastapi import HTTPException
from app.repositories.market_data import MarketDataRepository
from app.schemas.market_data import MarketDataCreate, MarketDataUpdate, MarketDataResponse
from app.core.cache import redis_client
from app.external.binance import BinanceClient
import json

class MarketDataService:
    def __init__(self, repository: MarketDataRepository):
        self.repository = repository
        self.binance_client = BinanceClient()
    
    async def get_realtime_price(self, symbol: str) -> MarketDataResponse:
        # Try cache first
        cache_key = f"realtime_price:{symbol}"
        cached_data = await redis_client.get(cache_key)
        
        if cached_data:
            return MarketDataResponse.parse_raw(cached_data)
        
        # Get from external API
        price_data = await self.binance_client.get_ticker(symbol)
        
        # Save to database
        db_obj = await self.repository.create(
            obj_in=MarketDataCreate(
                symbol=symbol,
                price=price_data.price,
                volume=price_data.volume,
                timestamp=datetime.utcnow(),
                source="binance"
            )
        )
        
        response = MarketDataResponse.from_orm(db_obj)
        
        # Cache for 5 seconds
        await redis_client.setex(
            cache_key, 5, response.json()
        )
        
        return response
    
    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "1h",
        days: int = 30
    ) -> List[MarketDataResponse]:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        data = await self.repository.get_by_symbol_and_timeframe(
            symbol=symbol,
            timeframe=timeframe,
            start_time=start_time,
            end_time=end_time
        )
        
        return [MarketDataResponse.from_orm(item) for item in data]
    
    async def bulk_update_prices(self, symbols: List[str]) -> None:
        """Update prices for multiple symbols concurrently"""
        tasks = [self.get_realtime_price(symbol) for symbol in symbols]
        await asyncio.gather(*tasks, return_exceptions=True)
```

### 🌐 Node.js Service Structure

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { register } from 'prom-client';

import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limit';
import { portfolioRoutes } from './routes/portfolio';
import { healthRoutes } from './routes/health';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
}));

// Logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Prometheus metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authMiddleware, portfolioRoutes);

// Error handling
app.use(errorHandler);

export { app };
```

## 🧪 Testing Strategy

### 🔬 Frontend Testing

```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('disables correctly', () => {
    render(<Button disabled>Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// tests/hooks/usePortfolio.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePortfolio } from '@/hooks/usePortfolio';
import { portfolioService } from '@/services/portfolio';

jest.mock('@/services/portfolio');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePortfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches portfolio data', async () => {
    const mockPortfolio = {
      id: 'p_123',
      name: 'Test Portfolio',
      value: 10000,
    };

    (portfolioService.getById as jest.Mock).mockResolvedValue(mockPortfolio);

    const { result } = renderHook(
      () => usePortfolio('p_123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.portfolio).toEqual(mockPortfolio);
  });
});
```

### 🐍 Backend Testing (Python)

```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_database, Base
from app.core.config import settings

# Test database
TEST_DATABASE_URL = f"{settings.DATABASE_URL}_test"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session(engine):
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest.fixture
async def client(db_session):
    app.dependency_overrides[get_database] = lambda: db_session
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# tests/api/test_market_data.py
import pytest
from httpx import AsyncClient
from app.models.market_data import MarketData

@pytest.mark.asyncio
async def test_get_realtime_price(client: AsyncClient, db_session):
    # Create test data
    market_data = MarketData(
        symbol="BTCUSDT",
        price=50000.0,
        volume=1000.0,
        timestamp=datetime.utcnow(),
        source="test"
    )
    db_session.add(market_data)
    await db_session.commit()
    
    # Test API
    response = await client.get("/api/v1/market-data/BTCUSDT/price")
    
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "BTCUSDT"
    assert data["price"] == 50000.0

@pytest.mark.asyncio
async def test_get_historical_data(client: AsyncClient, db_session):
    # Create multiple test data points
    for i in range(5):
        market_data = MarketData(
            symbol="ETHUSDT",
            price=3000.0 + i * 10,
            volume=500.0,
            timestamp=datetime.utcnow() - timedelta(hours=i),
            source="test"
        )
        db_session.add(market_data)
    
    await db_session.commit()
    
    # Test API
    response = await client.get(
        "/api/v1/market-data/ETHUSDT/historical?days=1"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all(item["symbol"] == "ETHUSDT" for item in data)

# tests/services/test_market_data_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.market_data import MarketDataService
from app.schemas.market_data import MarketDataCreate

@pytest.mark.asyncio
async def test_market_data_service_get_realtime_price():
    # Mock repository
    mock_repository = Mock()
    mock_repository.create = AsyncMock(return_value=Mock(
        id=1,
        symbol="BTCUSDT",
        price=50000.0,
        volume=1000.0,
        timestamp=datetime.utcnow()
    ))
    
    # Mock external API client
    service = MarketDataService(mock_repository)
    service.binance_client.get_ticker = AsyncMock(return_value=Mock(
        price=50000.0,
        volume=1000.0
    ))
    
    # Test service method
    result = await service.get_realtime_price("BTCUSDT")
    
    assert result.symbol == "BTCUSDT"
    assert result.price == 50000.0
    mock_repository.create.assert_called_once()
```

### 🌐 Node.js Testing

```typescript
// tests/services/portfolio.test.ts
import { PortfolioService } from '../../src/services/portfolio';
import { PortfolioRepository } from '../../src/repositories/portfolio';
import { CacheService } from '../../src/services/cache';

jest.mock('../../src/repositories/portfolio');
jest.mock('../../src/services/cache');

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let mockRepository: jest.Mocked<PortfolioRepository>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockRepository = new PortfolioRepository() as jest.Mocked<PortfolioRepository>;
    mockCache = new CacheService() as jest.Mocked<CacheService>;
    portfolioService = new PortfolioService(mockRepository, mockCache);
  });

  describe('getPortfolio', () => {
    it('should return portfolio from cache if available', async () => {
      const mockPortfolio = { id: 'p_123', name: 'Test Portfolio' };
      mockCache.get.mockResolvedValue(JSON.stringify(mockPortfolio));

      const result = await portfolioService.getPortfolio('p_123');

      expect(result).toEqual(mockPortfolio);
      expect(mockCache.get).toHaveBeenCalledWith('portfolio:p_123');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      const mockPortfolio = { id: 'p_123', name: 'Test Portfolio' };
      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(mockPortfolio);

      const result = await portfolioService.getPortfolio('p_123');

      expect(result).toEqual(mockPortfolio);
      expect(mockRepository.findById).toHaveBeenCalledWith('p_123');
      expect(mockCache.set).toHaveBeenCalledWith(
        'portfolio:p_123',
        JSON.stringify(mockPortfolio),
        300
      );
    });
  });
});

// tests/api/portfolio.integration.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { database } from '../../src/database';

describe('Portfolio API Integration', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  beforeEach(async () => {
    // Clean up database
    await database.query('TRUNCATE TABLE portfolios CASCADE');
  });

  describe('GET /api/v1/portfolios/:id', () => {
    it('should return portfolio when found', async () => {
      // Insert test data
      const portfolioData = {
        id: 'p_123',
        name: 'Test Portfolio',
        user_id: 'u_456',
        total_value: 10000,
      };
      
      await database.query(
        'INSERT INTO portfolios (id, name, user_id, total_value) VALUES ($1, $2, $3, $4)',
        [portfolioData.id, portfolioData.name, portfolioData.user_id, portfolioData.total_value]
      );

      const response = await request(app)
        .get('/api/v1/portfolios/p_123')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'p_123',
        name: 'Test Portfolio',
        totalValue: 10000,
      });
    });

    it('should return 404 when portfolio not found', async () => {
      await request(app)
        .get('/api/v1/portfolios/nonexistent')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(404);
    });
  });
});
```

## 📊 Performance Testing

### 🚀 Load Testing con K6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests under 500ms
    'http_req_failed': ['rate<0.01'],   // Less than 1% failures
    'errors': ['rate<0.1'],             // Less than 10% errors
  },
};

const BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'your-test-jwt-token';

export default function() {
  let params = {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Test portfolio retrieval
  let portfolioResponse = http.get(`${BASE_URL}/api/v1/portfolios/p_123`, params);
  
  let portfolioCheck = check(portfolioResponse, {
    'portfolio status is 200': (r) => r.status === 200,
    'portfolio response time < 500ms': (r) => r.timings.duration < 500,
    'portfolio has correct structure': (r) => {
      let json = r.json();
      return json.id && json.name && json.totalValue !== undefined;
    },
  });

  errorRate.add(!portfolioCheck);

  // Test market data endpoint
  let marketDataResponse = http.get(`${BASE_URL}/api/v1/market-data/BTCUSDT/price`, params);
  
  let marketDataCheck = check(marketDataResponse, {
    'market data status is 200': (r) => r.status === 200,
    'market data response time < 200ms': (r) => r.timings.duration < 200,
    'market data has price': (r) => {
      let json = r.json();
      return json.price && json.symbol === 'BTCUSDT';
    },
  });

  errorRate.add(!marketDataCheck);

  sleep(1);
}
```

---

## 🚀 Scripts de Desarrollo

### 📝 Package.json Scripts

```json
{
  "scripts": {
    "dev": "pnpm run dev:frontend & pnpm run dev:backend",
    "dev:frontend": "cd app/frontend && pnpm run dev",
    "dev:backend": "cd backend/gateway && pnpm run dev",
    "build": "pnpm run build:frontend && pnpm run build:backend",
    "test": "pnpm run test:unit && pnpm run test:integration",
    "test:unit": "pnpm -r run test:unit",
    "test:integration": "pnpm run test:e2e",
    "test:e2e": "playwright test",
    "lint": "pnpm -r run lint",
    "lint:fix": "pnpm -r run lint:fix",
    "type-check": "pnpm -r run type-check",
    "k8s:dev": "./scripts/k8s-context-selector.sh && kubectl apply -f infrastructure/k8s-manifests/dev/",
    "k8s:prod": "./scripts/k8s-context-selector.sh && kubectl apply -f infrastructure/k8s-manifests/prod/",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "clean": "pnpm -r run clean && rm -rf node_modules"
  }
}
```

### 🔧 Makefile para Desarrollo

```makefile
# Makefile
.PHONY: help install dev build test clean

# Colors
BLUE=\033[0;34m
GREEN=\033[0;32m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Show this help
	@echo "$(BLUE)TRII Platform Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install
	cd backend/market-data && poetry install
	cd backend/ml-prediction && poetry install
	cd backend/analysis-engine && poetry install

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d postgres redis
	pnpm run dev

build: ## Build all services
	@echo "$(BLUE)Building all services...$(NC)"
	pnpm run build
	docker-compose build

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	pnpm run test

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	pnpm run test:unit

test-e2e: ## Run E2E tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	pnpm run test:e2e

lint: ## Lint all code
	@echo "$(BLUE)Linting code...$(NC)"
	pnpm run lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing lint issues...$(NC)"
	pnpm run lint:fix

k8s-dev: ## Deploy to development Kubernetes
	@echo "$(BLUE)Deploying to dev cluster...$(NC)"
	./scripts/k8s-context-selector.sh
	kubectl apply -f infrastructure/k8s-manifests/dev/

k8s-prod: ## Deploy to production Kubernetes
	@echo "$(RED)Deploying to PRODUCTION cluster...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		./scripts/k8s-context-selector.sh; \
		kubectl apply -f infrastructure/k8s-manifests/prod/; \
	else \
		echo ""; \
		echo "Deployment cancelled."; \
	fi

clean: ## Clean all build artifacts and dependencies
	@echo "$(BLUE)Cleaning...$(NC)"
	pnpm run clean
	docker system prune -f
	docker volume prune -f

logs: ## Show logs for all services
	@echo "$(BLUE)Showing logs...$(NC)"
	docker-compose logs -f

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	cd backend/market-data && alembic upgrade head
	cd backend/portfolio-manager && npm run migrate

db-seed: ## Seed database with test data
	@echo "$(BLUE)Seeding database...$(NC)"
	./scripts/database/populate-test-data.sh

monitoring: ## Open monitoring dashboards
	@echo "$(BLUE)Opening monitoring dashboards...$(NC)"
	open http://trii-grafana.local
	open http://trii-prometheus.local

docs: ## Generate and serve documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	pnpm run docs:build
	pnpm run docs:serve
```

---

**🔧 Setup Rápido:**
```bash
git clone <repo-url>
cd trii-platform
make install
make dev
```

**📚 Para más información:**
- [Architecture Documentation](../architecture/README.md)
- [API Documentation](../api/README.md)  
- [Deployment Guide](../deployment/README.md)
- [Testing Guide](../../TESTING_GUIDE.md)

**📞 Soporte:** dev-team@trii.co