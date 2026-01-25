# 🇪🇸 Bienvenido a TRII Investment Platform

**Plataforma de Apoyo a Decisiones de Inversión**

> *"Transformando datos en decisiones inteligentes de inversión"*

---

## 🎯 ¿Qué es TRII?

TRII es una **plataforma de escritorio** que combina análisis técnico avanzado, machine learning y datos de mercado en tiempo real para ayudarte a identificar las mejores oportunidades de inversión.

### ✨ Lo que puedes hacer con TRII

- 📊 **Analizar mercados en tiempo real** - Cotizaciones actualizadas constantemente
- 📈 **Aplicar análisis técnico** - Más de 20 indicadores (RSI, MACD, Bandas de Bollinger, etc.)
- 🤖 **Obtener predicciones con IA** - Modelos de machine learning para forecasting
- 💼 **Gestionar portafolios** - Seguimiento completo de tus inversiones
- ⚡ **Visualizar datos** - Gráficos profesionales con TradingView
- 🔔 **Recibir alertas** - Notificaciones personalizadas

---

## 🚀 Inicio Rápido (5 minutos)

### Opción 1: Docker Compose (Recomendado para desarrollo)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd investment-app

# 2. Instalar dependencias
pnpm install

# 3. Iniciar infraestructura
docker-compose up -d

# 4. Iniciar aplicación
pnpm dev
```

### Opción 2: Kubernetes con Kind (Nuevo - Recomendado para producción)

```bash
# 1. Instalar Kind
brew install kind

# 2. Crear cluster
./scripts/kind/create-cluster.sh

# 3. Desplegar con ArgoCD
argocd app create trii-dev --repo <repo-url> --path infrastructure/kubernetes/overlays/dev
```

### Verificar instalación

Abre tu navegador en `http://localhost:3000` y deberías ver la aplicación TRII.

---

## 📚 Guías de Inicio

### Primeros Pasos
- [**Guía Rápida**](guia-rapida.md) - Setup completo en 15 minutos
- [**Cómo Empezar**](como-empezar.md) - Guía detallada paso a paso

### Configuración Avanzada
- [**Desarrollo Local**](es/02-desarrollo/configuracion-local.md) - Setup de desarrollo
- [**Kubernetes**](es/04-kubernetes/kind-setup.md) - Migración a K8s
- [**Producción**](es/05-despliegue/produccion.md) - Despliegue en producción

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    🖥️  Desktop Application                   │
│              Electron + React + TradingView Charts          │
└─────────────────────────────────────────────────────────────┘
                               │ WebSocket/REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    🔧 Microservicios                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Market Data │ │ Analysis   │ │ Portfolio  │ │ ML         │ │
│  │ Service     │ │ Engine     │ │ Manager    │ │ Prediction │ │
│  │ (FastAPI)   │ │ (FastAPI)  │ │ (NestJS)   │ │ (FastAPI)  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ PostgreSQL   │ │ Redis        │ │ RabbitMQ     │
        │ + TimescaleDB│ │ (Cache)      │ │ (Mensajería) │
        └──────────────┘ └──────────────┘ └──────────────┘
```

### Servicios Principales

| Servicio | Tecnología | Puerto | Función |
|----------|------------|--------|---------|
| **Market Data** | FastAPI/Python | 8001 | Datos de mercado en tiempo real |
| **Analysis Engine** | FastAPI/Python | 8002 | Análisis técnico e indicadores |
| **Portfolio Manager** | NestJS/Node.js | 8003 | Gestión de portafolios |
| **ML Prediction** | FastAPI/Python | 8004 | Predicciones con IA |

---

## 🛠️ Stack Tecnológico

### Frontend
- **Electron** - Aplicación de escritorio multiplataforma
- **React 18** - UI moderna con hooks
- **TypeScript** - Type safety
- **TradingView Charts** - Gráficos profesionales
- **Material-UI** - Componentes de UI

### Backend
- **FastAPI** - APIs de alto rendimiento (Python)
- **NestJS** - APIs empresariales (Node.js)
- **PostgreSQL + TimescaleDB** - Base de datos principal
- **Redis** - Cache y sesiones
- **RabbitMQ** - Mensajería asíncrona

### IA/Machine Learning
- **TensorFlow/Keras** - Deep learning
- **Scikit-learn** - ML clásico
- **XGBoost** - Gradient boosting
- **TA-Lib** - Indicadores técnicos
- **Pandas/NumPy** - Análisis de datos

### DevOps & Infraestructura
- **Docker** - Contenedorización
- **Kubernetes** - Orquestación (migración en progreso)
- **ArgoCD** - GitOps
- **Prometheus/Grafana** - Monitoreo
- **GitHub Actions** - CI/CD

---

## 📋 Requisitos del Sistema

### Desarrollo
- **Node.js**: 18+ (para frontend)
- **Python**: 3.11+ (para servicios)
- **Docker**: 24+ (para infraestructura)
- **Git**: 2.30+
- **8GB RAM** mínimo, 16GB recomendado

### Producción
- **Kubernetes**: 1.28+
- **PostgreSQL**: 15+
- **Redis**: 7+
- **4 CPU cores**, 16GB RAM por nodo

---

## 🎯 Roadmap del Proyecto

### ✅ Completado (v1.0.0)
- [x] Servicios backend funcionales
- [x] Aplicación desktop completa
- [x] Análisis técnico avanzado
- [x] Predicciones con ML
- [x] Gestión de portafolios
- [x] Docker Compose setup

### 🚧 En Progreso
- [ ] **Migración a Kubernetes** (Fase actual)
- [ ] ArgoCD y GitOps
- [ ] Monitoreo avanzado
- [ ] Reorganización documentación

### 📋 Planificado
- [ ] Mobile app (React Native)
- [ ] Integración con brokers
- [ ] Trading automatizado
- [ ] Análisis de sentimiento
- [ ] Multi-tenant architecture

---

## 🤝 Comunidad y Contribución

### Cómo Contribuir
1. 🍴 **Fork** el repositorio
2. 🌿 **Crea una rama** para tu feature (`git checkout -b feature/amazing-feature`)
3. 💾 **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
4. 📤 **Push** a la rama (`git push origin feature/amazing-feature`)
5. 🔄 **Abre un Pull Request**

### Canales de Comunicación
- 🐛 **Issues**: [Reportar bugs](https://github.com/trii-platform/investment-app/issues)
- 💡 **Discussions**: [Ideas y preguntas](https://github.com/trii-platform/investment-app/discussions)
- 💬 **Discord**: [Chat comunitario](https://discord.gg/trii-platform)
- 📧 **Email**: dev@trii-platform.com

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver [LICENSE](../../LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **Equipo TRII** - Por hacer esto posible
- **Comunidad Open Source** - Por las herramientas increíbles
- **Tú** - Por interesarte en el proyecto

---

**🚀 ¿Listo para empezar?** Ve a la [**Guía Rápida**](guia-rapida.md) para configurar todo en 15 minutos.

**📚 ¿Quieres saber más?** Explora la [**documentación completa**](../README.md) o únete a nuestra [**comunidad**](https://discord.gg/trii-platform).

---

*TRII Platform - Transformando datos en decisiones de inversión inteligentes* 💡📈