# 🚀 TRII Frontend - Loveable Style

## ✨ Características Implementadas

### 🎨 Design System Premium
- **Paleta de colores moderna** con gradientes estilo Loveable
- **Tipografías premium** (Inter + JetBrains Mono)
- **Sistema de espaciado** basado en proporciones áureas
- **Micro-interacciones** fluidas y elegantes
- **Animaciones CSS** optimizadas

### 📊 Dashboard Funcional
- **Datos mock** para desarrollo sin APIs
- **Cards interactivas** con efectos hover
- **Indicadores de estado** en tiempo real
- **Diseño responsive** completo
- **Notificaciones premium** integradas

## 🛠️ Desarrollo Local

### Prerrequisitos
- Node.js 18+
- npm o pnpm

### Instalación y Ejecución

```bash
# Navegar al directorio frontend
cd app/frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Acceder en el navegador
http://localhost:3000
```

### 🎯 Funcionalidades Disponibles
- **Home**: Página de bienvenida
- **Market**: Dashboard con datos de mercado (mock)
- **Watchlist**: Placeholder para seguimiento de activos
- **Portfolio**: Placeholder para gestión de cartera

## 🐳 Despliegue en Kind Cluster

### Prerrequisitos Cluster
- Docker Desktop
- Kind cluster ejecutándose
- kubectl configurado

### Script de Despliegue Automático

```bash
# Desde el directorio raíz del proyecto
./scripts/deploy-frontend.sh
```

El script automáticamente:
1. 📦 Construye la aplicación React
2. 🐳 Crea la imagen Docker
3. 📤 Carga la imagen en Kind
4. 🚁 Despliega en Kubernetes
5. 🌐 Configura port-forwarding

### Acceso Post-Despliegue
- **Local**: http://localhost:8080
- **Cluster**: http://trii.local (con ingress)

## 🏗️ Arquitectura

### Estructura de Directorios
```
app/frontend/
├── components/           # Componentes React
│   ├── SimpleDashboard.tsx    # Dashboard principal
│   ├── SimpleNavigation.tsx   # Navegación lateral
│   └── SimpleLayout.tsx       # Layout base
├── theme/               # Design system
│   └── designSystem.ts       # Tokens de diseño
├── LoveableApp.tsx      # Aplicación principal
├── index.tsx           # Punto de entrada
├── Dockerfile          # Imagen para producción
└── package.json        # Dependencias
```

### 🎨 Design System Tokens
- **Colores**: Primary, Success, Warning, Error + neutrales
- **Tipografía**: Escalas y pesos definidos
- **Espaciado**: Sistema basado en múltiplos de 4px
- **Animaciones**: Duraciones y easings consistentes
- **Sombras**: Niveles de elevación
- **Border radius**: Esquinas redondeadas sistemáticas

## 🔧 Configuración

### Variables de Entorno
```bash
# .env.local (opcional)
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

### Nginx (Producción)
- Configuración optimizada para SPAs
- Compresión gzip habilitada
- Headers de seguridad
- Cache de assets estáticos

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Conectar APIs reales del backend
- [ ] Implementar dark mode toggle
- [ ] Añadir más charts interactivos
- [ ] PWA capabilities

### Medio Plazo
- [ ] Sistema de notificaciones push
- [ ] Integración con WebSockets
- [ ] Dashboard personalizable
- [ ] Analytics de usuario

### Largo Plazo
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] Micro-frontends architecture
- [ ] Advanced animations con Framer Motion

## 🐛 Troubleshooting

### Errores Comunes

#### Estilos no se aplican
```bash
# Verificar que styled-components esté instalado
npm install styled-components @types/styled-components

# Limpiar caché
rm -rf node_modules dist
npm install
```

#### Puerto en uso
```bash
# Cambiar puerto en vite.config.ts
export default defineConfig({
  server: {
    port: 3001
  }
})
```

#### Imagen Docker no construye
```bash
# Verificar que dist/ existe
npm run build

# Construir imagen manualmente
docker build -t trii/frontend:latest .
```

## 📊 Performance

### Métricas Objetivo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### Optimizaciones Implementadas
- Lazy loading de componentes
- Compresión gzip
- Cache de assets estáticos
- Minificación automática
- Tree shaking habilitado

---

## 🎯 Estado Actual

✅ **Frontend funcionando localmente**  
✅ **Design system implementado**  
✅ **Dashboard con datos mock**  
✅ **Navegación moderna**  
✅ **Dockerfile y K8s manifests**  
✅ **Script de despliegue automático**

**Próximo paso**: Ejecutar el deploy en Kind cluster con `./scripts/deploy-frontend.sh`