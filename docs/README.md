# 📚 Documentación TRII Investment Platform

**Plataforma de Apoyo a Decisiones de Inversión**

[![Versión](https://img.shields.io/badge/versión-1.0-blue.svg)](https://github.com/trii-platform/investment-app)
[![Estado](https://img.shields.io/badge/estado-activo-green.svg)]()
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

---

## 🚀 Inicio Rápido

### Para Empezar
- [**🇪🇸 Guía Rápida (Español)**](es/inicio/guia-rapida.md) - 5 minutos
- [**🇺🇸 Quick Start (English)**](en/getting-started/quick-start.md) - 5 minutes

### Primeros Pasos
- [**🇪🇸 Cómo Empezar**](es/inicio/primeros-pasos.md)
- [**🇺🇸 Getting Started**](en/getting-started/getting-started.md)

---

## 📖 Índice de Documentación

### 🏗️ Arquitectura y Diseño
- [**🇪🇸 Arquitectura General**](es/arquitectura/vision-general.md) - Visión completa del sistema
- [**🇪🇸 Decisiones Arquitectónicas**](es/arquitectura/decisiones/) - ADRs y justificaciones
- [**🇺🇸 Architecture Overview**](en/architecture/overview.md)
- [**🇺🇸 Technology Stack**](en/architecture/tech-stack.md)

### 💻 Desarrollo
- [**🇪🇸 Configuración Local**](es/desarrollo/configuracion-local.md) - Setup de desarrollo
- [**🇪🇸 Estándares de Código**](es/desarrollo/estandares-codigo.md) - Guías de desarrollo
- [**🇪🇸 Guía de Testing**](es/desarrollo/guia-testing.md) - Estrategias de testing
- [**🇺🇸 Local Setup**](en/development/local-setup.md)
- [**🇺🇸 Code Standards**](en/development/code-standards.md)

### 🔧 Servicios y APIs
- [**🇪🇸 Market Data Service**](es/servicios/market-data.md) - Servicio de datos de mercado
- [**🇪🇸 Analysis Engine**](es/servicios/analysis-engine.md) - Motor de análisis técnico
- [**🇪🇸 Portfolio Manager**](es/servicios/portfolio-manager.md) - Gestión de portafolios
- [**🇪🇸 ML Prediction**](es/servicios/ml-prediction.md) - Predicciones con IA
- [**🇺🇸 Services Overview**](en/services/overview.md)
- [**API Documentation**](api/) - Documentación OpenAPI

### ☸️ Kubernetes y Despliegue
- [**🇪🇸 Arquitectura K8s**](es/despliegue/kubernetes.md) - Diseño Kubernetes
- [**🇪🇸 Setup con Kind**](es/despliegue/kind-setup.md) - Desarrollo local
- [**🇪🇸 ArgoCD Setup**](es/despliegue/argocd-setup.md) - GitOps
- [**🇪🇸 Migración a K8s**](es/despliegue/migracion-k8s.md) - Guía de migración
- [**🇺🇸 Kubernetes Guide**](en/deployment/kubernetes.md)

### 🚀 Despliegue
- [**🇪🇸 Desarrollo Local**](es/despliegue/desarrollo-local.md) - Docker Compose
- [**🇪🇸 Staging**](es/despliegue/staging.md) - Ambiente de pruebas
- [**🇪🇸 Producción**](es/despliegue/produccion.md) - Ambiente productivo
- [**🇺🇸 Deployment Guide**](en/deployment/deployment-guide.md)

### 🔍 Operaciones y Monitoreo
- [**🇪🇸 Monitoreo**](es/operaciones/monitoreo.md) - Prometheus, Grafana
- [**🇪🇸 Logs**](es/operaciones/logs.md) - Agregación de logs
- [**🇪🇸 Respaldos**](es/operaciones/backups.md) - Estrategias de backup
- [**🇺🇸 Operations**](en/operations/operations.md)
- [**Runbooks**](es/operaciones/runbooks/) - Guías operativas

### 👥 Usuario
- [**🇪🇸 Manual de Usuario**](es/usuario/manual.md) - Guía completa
- [**🇪🇸 Tutoriales**](es/usuario/tutoriales/) - Guías paso a paso
- [**🇪🇸 FAQ**](es/usuario/faq.md) - Preguntas frecuentes
- [**🇺🇸 User Manual**](en/user/manual.md)

---

## 🏢 Acerca de TRII Platform

TRII es una plataforma de escritorio para detectar oportunidades óptimas de inversión utilizando análisis de datos en tiempo real, indicadores técnicos y predicciones de machine learning.

### ✨ Características Principales
- 📊 **Datos de Mercado en Tiempo Real** - Streaming de cotizaciones
- 📈 **Análisis Técnico** - RSI, MACD, Bandas de Bollinger, etc.
- 🤖 **Predicciones ML** - Modelos de IA para forecasting
- 💼 **Gestión de Portafolios** - Seguimiento y análisis de inversiones
- ⚡ **Interfaz de Usuario** - Electron + React + TradingView Charts

### 🛠️ Stack Tecnológico
- **Frontend**: Electron + React + TypeScript + TradingView
- **Backend**: FastAPI (Python) + NestJS (Node.js)
- **Base de Datos**: PostgreSQL + TimescaleDB
- **Cache**: Redis
- **Mensajería**: RabbitMQ
- **IA/ML**: TensorFlow, Scikit-learn, XGBoost
- **DevOps**: Docker, Kubernetes, ArgoCD, Prometheus

---

## 📋 Estado del Proyecto

| Componente | Estado | Versión |
|------------|--------|---------|
| Market Data Service | ✅ Completo | v1.0.0 |
| Analysis Engine | ✅ Completo | v1.0.0 |
| Portfolio Manager | ✅ Completo | v1.0.0 |
| ML Prediction | ✅ Completo | v1.0.0 |
| Desktop Client | ✅ Completo | v1.0.0 |
| Docker Compose | ✅ Completo | v1.0.0 |
| **Kubernetes Migration** | 🚧 **En Progreso** | v0.1.0 |
| ArgoCD Setup | 📋 Planificado | - |
| CI/CD Pipeline | ✅ Completo | v1.0.0 |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestras guías:

- [**🇪🇸 Guía de Contribución**](es/desarrollo/contribuir.md)
- [**🇺🇸 Contributing Guide**](en/development/contributing.md)
- [**Código de Conducta**](CODE_OF_CONDUCT.md)

### Reportar Issues
- 🐛 [**Reportar Bug**](https://github.com/trii-platform/investment-app/issues/new?template=bug_report.md)
- 💡 [**Sugerir Feature**](https://github.com/trii-platform/investment-app/issues/new?template=feature_request.md)

---

## 📞 Soporte

- 📧 **Email**: support@trii-platform.com
- 💬 **Discord**: [Únete a nuestro servidor](https://discord.gg/trii-platform)
- 📖 **Documentación**: [docs.trii-platform.com](https://docs.trii-platform.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/trii-platform/investment-app/issues)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **Equipo TRII Platform** - Desarrollo y mantenimiento
- **Contribuidores Open Source** - Bibliotecas y herramientas utilizadas
- **Comunidad** - Feedback y soporte

---

**📅 Última actualización**: Diciembre 2025
**👥 Mantenedor**: Equipo DevOps TRII Platform
**🌟 Estrellas**: ⭐⭐⭐⭐⭐ ¡Si te gusta el proyecto!

---

## 📂 Navegación Rápida

- [**🏠 Inicio**](../README.md) - README principal del proyecto
- [**🚀 Inicio Rápido**](es/inicio/guia-rapida.md) - Comienza aquí
- [**🏗️ Arquitectura**](es/arquitectura/vision-general.md) - Entiende el sistema
- [**💻 Desarrollo**](es/desarrollo/configuracion-local.md) - Configura tu entorno
- [**☸️ Kubernetes**](es/despliegue/kubernetes.md) - Despliegue en K8s
- [**🔌 APIs**](api/) - Documentación técnica
