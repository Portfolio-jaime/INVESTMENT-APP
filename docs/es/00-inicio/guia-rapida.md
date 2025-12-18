# 🚀 Guía Rápida - TRII Investment Platform

**Configura todo en 15 minutos**

---

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ **macOS** 12+ (recomendado)
- ✅ **Windows** 10/11 con WSL2
- ✅ **Linux** Ubuntu 20.04+

### Software Necesario
- ✅ **Git** 2.30+ - [Descargar](https://git-scm.com/downloads)
- ✅ **Node.js** 18+ - [Descargar](https://nodejs.org/)
- ✅ **Python** 3.11+ - [Descargar](https://python.org)
- ✅ **Docker Desktop** - [Descargar](https://docker.com/products/docker-desktop)

### Verificar Instalación

```bash
# Verificar versiones
node --version      # Debe ser 18+
python --version    # Debe ser 3.11+
git --version       # Debe ser 2.30+
docker --version    # Debe funcionar
```

---

## ⚡ Instalación Rápida

### Paso 1: Clonar Repositorio

```bash
# Clonar el proyecto
git clone <repository-url>
cd investment-app

# Verificar que estamos en el directorio correcto
ls -la
# Deberías ver: apps/, services/, docker-compose.yml, etc.
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias del monorepo
pnpm install

# Verificar instalación
pnpm --version
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp config/environments/.env.example config/environments/.env.development

# Editar con tus API keys (opcional para desarrollo)
# nano config/environments/.env.development
```

### Paso 4: Iniciar Infraestructura

```bash
# Iniciar servicios base (PostgreSQL, Redis, RabbitMQ, MinIO)
docker-compose up -d

# Verificar que los servicios están corriendo
docker-compose ps
```

**Salida esperada:**
```
     Name                   Command               State                    Ports
------------------------------------------------------------------------------------------------
trii-market-data      docker-entrypoint.sh /bin/ash   Up      0.0.0.0:8001->8001/tcp
trii-minio           /usr/bin/docker-entrypoint ...   Up      0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
trii-postgres        docker-entrypoint.sh postgres    Up      0.0.0.0:5433->5432/tcp
trii-rabbitmq        docker-entrypoint.sh rabbi ...   Up      0.0.0.0:15672->15672/tcp, 0.0.0.0:5672->5672/tcp
trii-redis           docker-entrypoint.sh redis ...   Up      0.0.0.0:6379->6379/tcp
```

### Paso 5: Iniciar Servicios Backend

```bash
# Opción A: Iniciar todos los servicios
docker-compose --profile services up -d

# Opción B: Iniciar servicios individualmente
docker-compose up -d market-data analysis-engine portfolio-manager ml-prediction
```

### Paso 6: Iniciar Aplicación Frontend

```bash
# Cambiar al directorio del cliente desktop
cd apps/desktop-client

# Instalar dependencias específicas
pnpm install

# Iniciar en modo desarrollo
pnpm dev
```

### Paso 7: Verificar Instalación

1. **Abrir la aplicación**: La aplicación debería abrirse automáticamente
2. **Verificar servicios**: Abrir `http://localhost:3000` en el navegador
3. **Probar funcionalidad**: Intentar buscar una acción (ej: AAPL)

---

## 🔧 Solución de Problemas

### Error: "pnpm command not found"

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# O usando corepack (recomendado)
corepack enable
corepack prepare pnpm@latest --activate
```

### Error: "docker-compose: command not found"

```bash
# En macOS/Linux
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker-compose --version
```

### Error: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O cambiar puerto en la configuración
```

### Error: Servicios no inician

```bash
# Ver logs de servicios
docker-compose logs [service-name]

# Reiniciar servicios
docker-compose restart [service-name]

# Recrear contenedores
docker-compose up -d --force-recreate [service-name]
```

---

## 🧪 Probar la Instalación

### Test Básico

```bash
# Verificar que todos los servicios están up
docker-compose ps

# Probar API de market data
curl http://localhost:8001/health

# Probar API de analysis engine
curl http://localhost:8002/health

# Probar API de portfolio manager
curl http://localhost:8003/health

# Probar API de ML prediction
curl http://localhost:8004/health
```

### Test Avanzado

```bash
# Ejecutar tests
pnpm test

# Ejecutar tests de backend
docker-compose exec market-data pytest tests/

# Verificar base de datos
docker-compose exec postgres psql -U postgres -d trii_dev -c "SELECT version();"
```

---

## 📊 Servicios y Puertos

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| **Frontend (Electron)** | 3000 | http://localhost:3000 | ✅ |
| **Market Data API** | 8001 | http://localhost:8001 | ✅ |
| **Analysis Engine API** | 8002 | http://localhost:8002 | ✅ |
| **Portfolio Manager API** | 8003 | http://localhost:8003 | ✅ |
| **ML Prediction API** | 8004 | http://localhost:8004 | ✅ |
| **PostgreSQL** | 5433 | localhost:5433 | ✅ |
| **Redis** | 6379 | localhost:6379 | ✅ |
| **RabbitMQ** | 5672/15672 | localhost:15672 | ✅ |
| **MinIO** | 9000/9001 | localhost:9001 | ✅ |

---

## 🎯 Próximos Pasos

### Desarrollo Continuo

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Limpiar todo (datos incluidos)
docker-compose down -v --remove-orphans
```

### Configuración Avanzada

- [**Configuración Local Detallada**](../02-desarrollo/configuracion-local.md)
- [**Setup de Base de Datos**](../02-desarrollo/configuracion-local.md#base-de-datos)
- [**Variables de Entorno**](../02-desarrollo/configuracion-local.md#variables-de-entorno)

### Migración a Kubernetes

Si quieres usar Kubernetes en lugar de Docker Compose:

- [**Setup con Kind**](../04-kubernetes/kind-setup.md)
- [**Plan de Migración**](../04-kubernetes/migracion.md)

---

## 🆘 Ayuda y Soporte

### Recursos de Ayuda
- 📖 [**Documentación Completa**](../README.md)
- 🐛 [**Reportar Issues**](https://github.com/trii-platform/investment-app/issues)
- 💬 [**Discord Community**](https://discord.gg/trii-platform)
- 📧 **Email**: support@trii-platform.com

### Comandos Útiles

```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f [service-name]

# Reiniciar un servicio
docker-compose restart [service-name]

# Acceder a un contenedor
docker-compose exec [service-name] bash

# Ver uso de recursos
docker stats
```

---

## ✅ Checklist de Verificación

- [ ] Git repository clonado
- [ ] Dependencias instaladas (pnpm install)
- [ ] Variables de entorno configuradas
- [ ] Servicios de infraestructura corriendo (docker-compose up -d)
- [ ] Servicios backend iniciados
- [ ] Aplicación frontend funcionando
- [ ] APIs respondiendo correctamente
- [ ] Tests básicos pasan

**¡Felicitaciones! 🎉** Tu instalación de TRII Platform está completa.

¿Necesitas ayuda con algún paso? Revisa la [documentación detallada](../02-desarrollo/configuracion-local.md) o únete a nuestro [Discord](https://discord.gg/trii-platform).