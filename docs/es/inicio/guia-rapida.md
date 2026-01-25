# 🚀 Guía Rápida - TRII Investment App

## ⚡ Inicio en 5 Minutos

### Paso 1: Verificar Requisitos
```bash
node --version    # Necesitas 18+
python3 --version # Necesitas 3.11+
docker --version  # Opcional pero recomendado
```

### Paso 2: Inicializar Proyecto
```bash
cd /Users/jaime.henao/arheanja/investment-app
./init.sh
```

**Esto creará automáticamente:**
- ✅ Estructura completa de directorios
- ✅ Configuración Docker
- ✅ Variables de entorno (.env)
- ✅ Workspace PNPM
- ✅ Scripts de utilidad

### Paso 3: Configurar APIs (GRATIS)
```bash
nano .env
```

**APIs Gratuitas Recomendadas:**

1. **Alpha Vantage** (500 llamadas/día gratis)
   - Registrarse: https://www.alphavantage.co/support/#api-key
   - Agregar a `.env`: `ALPHA_VANTAGE_API_KEY=tu_key`

2. **Twelve Data** (800 llamadas/día gratis)
   - Registrarse: https://twelvedata.com/apikey
   - Agregar a `.env`: `TWELVE_DATA_API_KEY=tu_key`

3. **NewsAPI** (100 llamadas/día gratis)
   - Registrarse: https://newsapi.org/register
   - Agregar a `.env`: `NEWS_API_KEY=tu_key`

### Paso 4: Iniciar Infraestructura
```bash
docker-compose up -d
```

**Esto inicia:**
- PostgreSQL + TimescaleDB (Base de datos)
- Redis (Cache)
- RabbitMQ (Cola de mensajes)
- MinIO (Almacenamiento objetos)

### Paso 5: Desarrollo
```bash
pnpm install  # Instalar dependencias
pnpm dev      # Iniciar aplicación
```

---

## 📊 Arquitectura Simplificada

```
┌─────────────────────────────────────────────┐
│  Desktop App (Electron + React)             │
│  Puerto: 3000                               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  API Gateway (Traefik)                      │
│  Puerto: 8080                               │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────┐
│ Market   │ │Analysis │ │Portfolio │
│ Data     │ │ Engine  │ │ Manager  │
│ :8001    │ │ :8002   │ │ :8004    │
└──────────┘ └─────────┘ └──────────┘
      │           │           │
      └───────────┴───────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis  │ │RabbitMQ │
│  :5432   │ │  :6379  │ │ :5672   │
└──────────┘ └─────────┘ └─────────┘
```

---

## 🎯 Flujo de Trabajo Diario

### 1. Análisis de Mercado
```
Abrir app → Ver watchlist → Analizar gráficos + indicadores
```

### 2. Buscar Oportunidades
```
ML Predictions → Ver señales compra/venta → Revisar riesgo/recompensa
```

### 3. Tomar Decisión
```
Evaluar múltiples indicadores → Confirmar con análisis fundamental
```

### 4. Ejecutar en TRII
```
Abrir app móvil TRII → Ejecutar orden MANUALMENTE
```

### 5. Registrar Trade
```
Volver a la app → Portfolio Manager → Agregar transacción
```

### 6. Monitorear
```
Ver P&L en tiempo real → Recibir alertas de precio/señales
```

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Iniciar aplicación de escritorio
pnpm dev

# Iniciar solo backend
cd services/market-data
uvicorn app.main:app --reload

# Ver logs de servicios
docker-compose logs -f

# Verificar salud de servicios
./scripts/health-check.sh
```

### Testing
```bash
# Todos los tests
pnpm test

# Tests de un servicio específico
cd services/market-data
pytest

# Coverage
pytest --cov=app tests/
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d trii_dev

# Ver tablas
\dt

# Backup
docker-compose exec postgres pg_dump -U postgres trii_dev > backup.sql
```

### Docker
```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f [servicio]

# Reiniciar servicio
docker-compose restart [servicio]

# Ver recursos usados
docker stats
```

---

## 📁 Estructura de Proyecto

```
investment-app/
│
├── apps/
│   └── desktop-client/      # Aplicación Electron
│       ├── src/
│       │   ├── main/        # Proceso principal Electron
│       │   ├── renderer/    # UI React
│       │   └── shared/      # Código compartido
│       └── package.json
│
├── services/                # Microservicios backend
│   ├── market-data/         # FastAPI - Datos de mercado
│   ├── analysis-engine/     # FastAPI - Análisis técnico
│   ├── ml-prediction/       # Python - Modelos ML
│   ├── portfolio-manager/   # Node.js - Gestión portafolio
│   ├── risk-assessment/     # Python - Cálculo de riesgo
│   └── notification/        # Node.js - Alertas
│
├── libs/                    # Librerías compartidas
│   ├── common/              # Utils TypeScript
│   ├── api-client/          # Cliente API
│   └── python-common/       # Utils Python
│
├── infrastructure/
│   ├── docker/              # Docker configs
│   ├── terraform/           # IaC
│   └── monitoring/          # Prometheus/Grafana
│
├── scripts/                 # Scripts de utilidad
├── docs/                    # Documentación
├── tests/                   # Tests integración
│
├── docker-compose.yml       # Orquestación local
├── .env                     # Variables de entorno
├── pnpm-workspace.yaml      # Workspace config
└── init.sh                  # Script de inicialización
```

---

## 🎨 Características Principales

### 1. Indicadores Técnicos (20+)

**Tendencia:**
- SMA (Simple Moving Average)
- EMA (Exponential Moving Average)
- MACD (Moving Average Convergence Divergence)

**Momentum:**
- RSI (Relative Strength Index)
- Stochastic Oscillator
- CCI (Commodity Channel Index)

**Volatilidad:**
- Bollinger Bands
- ATR (Average True Range)
- Standard Deviation

**Volumen:**
- OBV (On-Balance Volume)
- VWAP (Volume Weighted Average Price)
- MFI (Money Flow Index)

### 2. Modelos ML

**LSTM (Long Short-Term Memory)**
- Predicción de precio a 5 días
- Basado en históricos
- Accuracy objetivo: 65%+

**XGBoost**
- Clasificación compra/venta/hold
- Features: 50+ indicadores técnicos
- Precision objetivo: 70%+

**Prophet (Facebook)**
- Tendencias a largo plazo
- Detección de estacionalidad
- Intervalos de confianza

**Sentiment Analysis**
- Análisis de noticias
- Clasificación positivo/negativo/neutral
- Agregación por ticker

### 3. Gestión de Riesgo

**Value at Risk (VaR)**
- VaR 95%
- VaR 99%
- Historical vs Parametric

**Sharpe Ratio**
- Risk-adjusted returns
- Comparación vs benchmark

**Monte Carlo**
- 10,000 simulaciones
- Proyección 30/60/90 días
- Probabilidad de escenarios

### 4. Alertas Inteligentes

**Precio:**
- Target price alcanzado
- Soporte/Resistencia roto
- Cambio % configurable

**Técnico:**
- RSI sobrecomprado/vendido
- MACD crossover
- Bollinger Bands breach

**ML:**
- Predicción cambio > threshold
- Señal compra/venta generada
- Cambio en sentiment score

---

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

```env
# Aplicación
NODE_ENV=development|production
APP_PORT=3000

# Base de Datos
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=50

# APIs
ALPHA_VANTAGE_API_KEY=tu_key
TWELVE_DATA_API_KEY=tu_key
FINNHUB_API_KEY=tu_key

# ML
ENABLE_ML_PREDICTIONS=true
ML_MODEL_PATH=/app/models

# Notificaciones
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
```

### Puertos Usados

| Servicio | Puerto | UI/Admin |
|----------|--------|----------|
| Desktop App | 3000 | - |
| Market Data | 8001 | /docs |
| Analysis Engine | 8002 | /docs |
| ML Prediction | 8003 | /docs |
| Portfolio Mgr | 8004 | /api |
| Risk Assessment | 8005 | /docs |
| Notification | 8006 | /api |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| RabbitMQ | 5672 | :15672 |
| MinIO | 9000 | :9001 |
| Prometheus | 9090 | - |
| Grafana | 3001 | - |

---

## 🐛 Troubleshooting

### Docker no inicia
```bash
# Verificar Docker está corriendo
docker ps

# Ver logs
docker-compose logs

# Limpiar y reiniciar
docker-compose down -v
docker-compose up -d
```

### Puerto ocupado
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 [PID]
```

### Error de permisos en init.sh
```bash
chmod +x init.sh
```

### PNPM no encontrado
```bash
npm install -g pnpm
```

### PostgreSQL connection error
```bash
# Verificar PostgreSQL está corriendo
docker-compose ps postgres

# Reiniciar
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

---

## 📖 Documentación Completa

| Archivo | Descripción |
|---------|-------------|
| **README.md** | Overview general |
| **RESUMEN_EJECUTIVO.md** | Visión de negocio |
| **GUIA_RAPIDA.md** | Esta guía |
| **ARCHITECTURE.md** | Arquitectura técnica |
| **TECH_STACK_JUSTIFICATION.md** | Decisiones técnicas |
| **PROJECT_STRUCTURE.md** | Estructura detallada |
| **QUICK_START.md** | Setup desarrollo |
| **IMPLEMENTATION_ROADMAP.md** | Plan 15 semanas |
| **DEVOPS_IMPLEMENTATION.md** | CI/CD y deploy |

---

## 🎓 Recursos de Aprendizaje

### Análisis Técnico
- [Investopedia](https://www.investopedia.com/technical-analysis-4689657)
- [TradingView Education](https://www.tradingview.com/education/)

### Machine Learning
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)
- [Scikit-learn Docs](https://scikit-learn.org/stable/)

### DevOps
- [Docker Docs](https://docs.docker.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)

---

## ⚡ Tips de Productividad

### 1. Usar Watchlist
Agregar solo acciones que realmente quieres monitorear (5-10 max)

### 2. Configurar Alertas Críticas
No todas las señales son iguales. Prioriza:
- Precio target
- RSI extremos
- Predicciones ML > 70% confianza

### 3. Revisar Backtesting
Antes de confiar ciegamente en señales, verifica performance histórica

### 4. Combinar Múltiples Señales
Nunca operar solo con 1 indicador. Esperar confirmación de 2-3 señales

### 5. Definir Stop-Loss
Siempre saber cuánto estás dispuesto a perder

---

## 🚀 Próximos Pasos

1. **Ahora:** Ejecutar `./init.sh`
2. **Hoy:** Configurar APIs y iniciar Docker
3. **Esta semana:** Implementar Market Data Service
4. **Próximas 2 semanas:** Analysis Engine + ML Prediction
5. **Mes 1:** Frontend básico funcionando
6. **Mes 2:** Features avanzadas
7. **Mes 3:** Testing y producción

---

## 📞 Soporte

**Autor:** Jaime Henao
**Email:** jaime.andres.henao.arbelaez@ba.com
**GitHub:** @arheanja

---

**¡Listo para empezar! Ejecuta `./init.sh` ahora mismo.** 🎯
