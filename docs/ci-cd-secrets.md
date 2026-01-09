# GitHub Actions Configuration

## Required Secrets

Para que el pipeline de CI/CD funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub.

### Configuración de Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret** para cada uno de los siguientes:

### Docker Hub Secrets (Requeridos)

```
DOCKERHUB_USERNAME = tu-usuario-dockerhub
DOCKERHUB_PASSWORD = tu-access-token-dockerhub
```

**Importante**: Usa un Access Token en lugar de tu contraseña para mayor seguridad.

#### Cómo crear un Docker Hub Access Token:

1. Ve a [Docker Hub](https://hub.docker.com/)
2. Click en tu avatar → **Account Settings**
3. Click en **Security** → **New Access Token**
4. Dale un nombre descriptivo como "GitHub Actions"
5. Copia el token generado (solo se muestra una vez)

### Secrets de Base de Datos (Opcionales)

```
POSTGRES_PASSWORD = contraseña-segura-postgres
RABBITMQ_DEFAULT_USER = usuario-rabbitmq
RABBITMQ_DEFAULT_PASS = contraseña-rabbitmq
```

### Variables de Entorno (Opcionales)

También puedes configurar variables de entorno no sensibles:

```
VITE_API_URL = https://api.trii-platform.com
VITE_APP_VERSION = 1.0.0
```

## Verificación

Una vez configurados los secrets, el pipeline podrá:
- ✅ Construir imágenes Docker
- ✅ Subir imágenes a Docker Hub
- ✅ Actualizar manifiestos de ArgoCD
- ✅ Desplegar automáticamente

## Troubleshooting

### Error: "Username and password required"
- Verifica que `DOCKERHUB_USERNAME` y `DOCKERHUB_PASSWORD` estén configurados
- Asegúrate de usar un Access Token válido

### Error: "Authentication failed"
- Verifica que el Access Token no haya expirado
- Confirma que el usuario tenga permisos de push al repositorio

### Build exitoso pero no push
- Es normal si los secrets no están configurados
- El pipeline construye la imagen localmente para validar que funciona