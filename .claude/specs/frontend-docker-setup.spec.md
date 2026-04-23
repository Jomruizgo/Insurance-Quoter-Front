---
id: SPEC-002
status: IN_PROGRESS
feature: frontend-docker-setup
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-001  # design-system-atoms — primer feature que se ejecuta dentro del contenedor
---

# Spec: Contenedorización del Frontend Angular 19

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Contenedorizar el frontend Angular 19 del cotizador de seguros de daños para que pueda ejecutarse, desarrollarse y probarse sin necesidad de tener Node.js ni Angular CLI instalados localmente. Es el prerequisito de infraestructura (FE-00) para la integración E2E con el backend y para garantizar paridad entre entornos de desarrollo, CI y producción.

### Requerimiento de Negocio

El equipo de desarrollo debe poder levantar el frontend con un solo comando (`docker-compose up frontend-dev`) sin instalar ninguna dependencia local. En producción, la imagen debe ser mínima (solo nginx sirviendo los estáticos compilados) y la URL del API debe poder cambiarse sin re-compilar la imagen.

### Historias de Usuario

#### HU-01: Imagen de producción multi-stage

```
Como:        Desarrollador del equipo
Quiero:      Construir una imagen Docker del frontend lista para producción
Para:        Desplegar la app sin instalar Node.js en el servidor ni exponer código fuente

Prioridad:   Alta
Estimación:  S
Dependencias: Ninguna
Capa:        Frontend (infraestructura)
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Build de imagen de producción exitoso
  Dado que:  El desarrollador está en el directorio Insurance-Quoter-Front/
  Cuando:    Ejecuta `docker build -t sofka-iq-front .`
  Entonces:  El comando termina con exit code 0
             Y la imagen resultante contiene únicamente nginx (no Node.js)
             Y el tamaño de la imagen es inferior a 50 MB
```

```gherkin
CRITERIO-1.2: SPA servida correctamente en producción
  Dado que:  La imagen sofka-iq-front fue construida exitosamente
  Cuando:    Se ejecuta `docker run -p 4200:80 sofka-iq-front`
  Entonces:  GET http://localhost:4200/ responde HTTP 200
             Y GET http://localhost:4200/cotizador responde HTTP 200
```

```gherkin
CRITERIO-1.3: Router de Angular maneja rutas desconocidas (SPA fallback)
  Dado que:  El contenedor de producción está corriendo en el puerto 4200
  Cuando:    El navegador solicita GET http://localhost:4200/quotes/FOL-001/general-info (ruta directa o F5)
  Entonces:  nginx responde HTTP 200 con el index.html de Angular
             Y Angular Router renderiza la vista correcta en el cliente
             Y NO se retorna HTTP 404
```

#### HU-02: Imagen de desarrollo con hot reload

```
Como:        Desarrollador del equipo
Quiero:      Levantar el frontend en modo desarrollo con hot reload dentro de Docker
Para:        Editar archivos localmente y ver los cambios reflejados en el navegador sin rebuild de imagen

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Frontend (infraestructura)
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Servidor de desarrollo levanta con hot reload
  Dado que:  El desarrollador ejecuta `docker-compose up frontend-dev`
  Cuando:    El contenedor termina de iniciar
  Entonces:  http://localhost:4200 responde HTTP 200
             Y los logs muestran "Local: http://localhost:4200"
```

```gherkin
CRITERIO-2.2: Cambios en código fuente se reflejan sin rebuild
  Dado que:  El contenedor frontend-dev está corriendo con el volumen src/ montado
  Cuando:    El desarrollador modifica un archivo .ts dentro de src/
  Entonces:  El servidor detecta el cambio (polling 500ms) y recompila
             Y el navegador recarga la aplicación automáticamente
             Y NO es necesario hacer `docker-compose build` de nuevo
```

#### HU-03: Orquestación del monorepo con docker-compose

```
Como:        Desarrollador del equipo
Quiero:      Levantar frontend, backend y core con un solo comando
Para:        Tener un entorno completo de integración sin configuración manual

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-02
Capa:        Frontend (infraestructura)
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Stack completo levanta sin configuración adicional
  Dado que:  El desarrollador está en el directorio raíz Sofka-IQ/
  Cuando:    Ejecuta `docker-compose up frontend backend core`
  Entonces:  Los tres servicios levantan sin errores
             Y el frontend puede hacer peticiones HTTP al backend en http://backend:8080
             Y el frontend puede hacer peticiones HTTP al core en http://core:8081
```

```gherkin
CRITERIO-3.2: frontend espera que backend y core estén listos
  Dado que:  Se ejecuta `docker-compose up frontend backend core`
  Cuando:    backend o core tardan en iniciar
  Entonces:  El servicio frontend espera a que los health checks de backend y core pasen
             Y NO falla con "connection refused" por race condition de inicio
```

#### HU-04: Configuración de URLs de API en runtime

```
Como:        Operador de despliegue
Quiero:      Cambiar la URL del API sin re-compilar la imagen Docker
Para:        Usar la misma imagen en distintos entornos (local, staging, prod) cambiando solo config.json

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Frontend (infraestructura)
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Angular carga config.json antes de inicializar
  Dado que:  El contenedor de producción está corriendo
  Cuando:    Se hace GET http://localhost:4200/assets/config.json
  Entonces:  La respuesta contiene { "apiUrl": "...", "coreUrl": "..." }
             Y Angular usa esos valores para todas las peticiones HTTP
             Y NO están hardcodeadas en el bundle JavaScript
```

```gherkin
CRITERIO-4.2: Cambiar config.json en nginx cambia la URL del API
  Dado que:  Se monta un config.json personalizado en el contenedor via volumen
  Cuando:    La aplicación se carga en el navegador
  Entonces:  Las peticiones HTTP van a la URL definida en el config.json montado
```

### Reglas de Negocio / Restricciones de Infraestructura

1. La imagen de producción final **no debe contener Node.js** ni el código fuente TypeScript (solo los estáticos compilados y nginx).
2. La URL del API **no debe estar hardcodeada** en el bundle JavaScript compilado; debe ser configurable en runtime mediante `config.json`.
3. El `index.html` debe servirse **sin caché** (`Cache-Control: no-store`). Los assets con hash (`.js`, `.css`) pueden cachearse por 1 año.
4. El hot reload en desarrollo debe funcionar mediante **polling de archivos** (`--poll 500`) para compatibilidad con filesystems de host (Linux/Mac/WSL2).
5. Los servicios del docker-compose deben estar en la **misma red Docker** para que el frontend pueda resolver los nombres de host `backend` y `core` internamente.

---

## 2. DISEÑO

### Modelos de Datos

No aplica — este feature es exclusivamente de infraestructura y no define entidades de dominio ni tablas de base de datos.

### API Endpoints

No aplica — este feature no expone ni consume endpoints nuevos. Define únicamente cómo se configura la URL base (`apiUrl`) que los services de Angular usarán.

### Diseño de Archivos de Infraestructura

#### Archivo 1: `Insurance-Quoter-Front/Dockerfile`

Imagen de producción multi-stage.

```dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production
# Output: dist/cotizador-danos-web/browser/

# Stage 2 — serve
FROM nginx:alpine AS serve
COPY --from=build /app/dist/cotizador-danos-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Notas:**
- Angular 19 genera los estáticos en `dist/<project-name>/browser/` (con el subdirectorio `browser/`).
- El nombre del proyecto es `cotizador-danos-web` (ver `angular.json`).
- El stage `build` queda descartado en la imagen final; el resultado es solo nginx + estáticos.

#### Archivo 2: `Insurance-Quoter-Front/Dockerfile.dev`

Imagen de desarrollo con hot reload.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
# El código fuente se monta como volumen en tiempo de ejecución
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "500"]
```

**Notas:**
- `npm ci` instala las dependencias en la imagen (no se montan junto con `node_modules`).
- El volumen en docker-compose monta solo `./Insurance-Quoter-Front/src:/app/src`, no `node_modules/`.
- `--poll 500` es necesario para detectar cambios en sistemas de archivos de host (inotify no funciona en Docker Desktop).
- `--host 0.0.0.0` es obligatorio para que el servidor escuche fuera del contenedor.

#### Archivo 3: `Insurance-Quoter-Front/nginx.conf`

Configuración nginx para SPA (Angular Router).

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # index.html sin caché — siempre la versión más reciente
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Assets con hash — caché de 1 año
    location ~* \.(js|css|png|jpg|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # config.json sin caché — configurable por entorno
    location = /assets/config.json {
        add_header Cache-Control "no-store";
    }

    # SPA fallback — todas las rutas desconocidas retornan index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Archivo 4: `Sofka-IQ/docker-compose.yml`

Orquestación del monorepo completo.

```yaml
version: "3.9"

networks:
  sofka-net:
    driver: bridge

services:
  # --- Frontend producción ---
  frontend:
    build:
      context: ./Insurance-Quoter-Front
      dockerfile: Dockerfile
    ports:
      - "4200:80"
    networks:
      - sofka-net
    depends_on:
      backend:
        condition: service_healthy
      core:
        condition: service_healthy

  # --- Frontend desarrollo (hot reload) ---
  frontend-dev:
    build:
      context: ./Insurance-Quoter-Front
      dockerfile: Dockerfile.dev
    ports:
      - "4200:4200"
    volumes:
      - ./Insurance-Quoter-Front/src:/app/src:delegated
    networks:
      - sofka-net
    environment:
      - CHOKIDAR_USEPOLLING=true

  # --- Backend quoter (plataforma-danos-back) ---
  backend:
    build:
      context: ./Insurance-Quoter-Back
    ports:
      - "8080:8080"
    networks:
      - sofka-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  # --- Backend core (plataforma-core-ohs) ---
  core:
    build:
      context: ./Insurance-Quoter-Core
    ports:
      - "8081:8081"
    networks:
      - sofka-net
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8081/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
```

**Notas:**
- `frontend` y `frontend-dev` no pueden correr simultáneamente (mismo puerto 4200). Usar uno u otro según el contexto.
- Los health checks de `backend` y `core` dependen de que Spring Boot Actuator esté habilitado en esos proyectos (`/actuator/health`).
- El volumen usa `:delegated` para mejor performance en Mac (ignora ligera inconsistencia de cache).

#### Archivo 5: `Insurance-Quoter-Front/.dockerignore`

```
node_modules/
dist/
.git/
.claude/
*.md
.editorconfig
.stylelintrc.json
coverage/
.angular/
```

#### Archivo 6: `Insurance-Quoter-Front/src/assets/config.json`

Configuración runtime de URLs de API.

```json
{
  "apiUrl": "http://localhost:8080",
  "coreUrl": "http://localhost:8081"
}
```

**En producción Docker** (dentro de la red `sofka-net`), el frontend resuelve los backends por nombre de servicio:
```json
{
  "apiUrl": "http://backend:8080",
  "coreUrl": "http://core:8081"
}
```

Este archivo puede ser montado como volumen para cambiar la configuración sin rebuild:
```yaml
volumes:
  - ./config.prod.json:/usr/share/nginx/html/assets/config.json:ro
```

### Estrategia de Configuración de URL del API

Se adopta el patrón **config.json en runtime** (recomendado) sobre `--build-arg` (alternativa):

| Estrategia | Ventaja | Desventaja |
|------------|---------|------------|
| `config.json` en runtime | Una sola imagen para todos los entornos | Requiere `APP_INITIALIZER` en Angular |
| `--build-arg` + `environment.ts` | Patrón conocido por el equipo | Imagen distinta por entorno, no práctico |

#### Integración de `config.json` en Angular (`APP_INITIALIZER`)

La configuración se carga mediante un service singleton antes de que Angular levante la aplicación:

```typescript
// src/app/core/services/app-config.service.ts
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: { apiUrl: string; coreUrl: string } = {
    apiUrl: 'http://localhost:8080',
    coreUrl: 'http://localhost:8081'
  };

  load(): Promise<void> {
    return fetch('/assets/config.json')
      .then(r => r.json())
      .then(cfg => { this.config = cfg; });
  }

  get apiUrl(): string { return this.config.apiUrl; }
  get coreUrl(): string { return this.config.coreUrl; }
}
```

```typescript
// src/app/app.config.ts — registrar el initializer
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (cfg: AppConfigService) => () => cfg.load(),
      deps: [AppConfigService],
      multi: true
    }
  ]
};
```

Los services del cotizador inyectan `AppConfigService` en lugar de leer directamente `environment.ts`:

```typescript
// Patrón en services — usando AppConfigService
@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(AppConfigService);

  getQuote(folio: string): Observable<Quote> {
    return this.http.get<Quote>(`${this.cfg.apiUrl}/v1/quotes/${folio}`);
  }
}
```

### Árbol de archivos nuevos

```
Sofka-IQ/
└── docker-compose.yml                          ← NUEVO (raíz del monorepo)

Insurance-Quoter-Front/
├── Dockerfile                                  ← NUEVO
├── Dockerfile.dev                              ← NUEVO
├── nginx.conf                                  ← NUEVO
├── .dockerignore                               ← NUEVO
└── src/
    ├── assets/
    │   └── config.json                         ← NUEVO
    └── app/
        ├── core/
        │   └── services/
        │       └── app-config.service.ts       ← NUEVO
        └── app.config.ts                       ← MODIFICADO (agregar APP_INITIALIZER)
```

### Notas de Implementación

- Angular 19 genera el output en `dist/cotizador-danos-web/browser/` (con subdirectorio `browser/`). El `COPY` en el Dockerfile debe apuntar a esa ruta exacta.
- En `Dockerfile.dev`, el `COPY` de `package*.json` debe realizarse **antes** de montar el volumen `src/`, para que `node_modules/` quede dentro de la imagen y no sea sobreescrito por el volumen.
- El `docker-compose.yml` se ubica en `Sofka-IQ/` (raíz del monorepo), no dentro de `Insurance-Quoter-Front/`. Esto permite orquestar todos los servicios desde un único punto.
- El `APP_INITIALIZER` usa `fetch` nativo (no `HttpClient`) para evitar circularidad en la inicialización de providers.
- El `config.json` que se sube al repositorio contiene las URLs de desarrollo local (`localhost`). En producción se monta el archivo real mediante volumen o config map de Kubernetes.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Frontend / Infraestructura

#### Archivos de infraestructura Docker
- [x] Crear `Insurance-Quoter-Front/Dockerfile` — imagen multi-stage (build: node:20-alpine, serve: nginx:alpine)
- [x] Crear `Insurance-Quoter-Front/Dockerfile.dev` — imagen desarrollo con `ng serve --host 0.0.0.0 --poll 500`
- [x] Crear `Insurance-Quoter-Front/nginx.conf` — configuración SPA con fallback a `index.html` y cabeceras de caché
- [x] Crear `Insurance-Quoter-Front/.dockerignore` — excluir `node_modules/`, `dist/`, `.git/`, `.claude/`, `*.md`
- [x] Crear `Sofka-IQ/docker-compose.yml` — servicios: `frontend`, `frontend-dev`, `backend`, `core` con red común y health checks

#### Configuración runtime de Angular
- [x] Crear `Insurance-Quoter-Front/public/assets/config.json` — con `apiUrl` y `coreUrl` apuntando a `localhost`
- [x] Crear `src/app/core/services/app-config.service.ts` — carga `config.json` con `fetch` y expone `apiUrl` / `coreUrl`
- [x] Modificar `src/app/app.config.ts` — registrar `APP_INITIALIZER` que invoca `AppConfigService.load()`
- [x] Actualizar el patrón de services existentes para inyectar `AppConfigService` en lugar de leer `environment.ts` directamente

#### Tests
- [x] Crear `src/app/core/services/app-config.service.spec.ts` — test unitario de `AppConfigService.load()` con `fetch` mockeado

#### Verificación manual (criterios de aceptación)
- [x] Verificar CRITERIO-1.1: `docker build -t sofka-iq-front .` termina sin errores
- [x] Verificar CRITERIO-1.2: `docker run -p 4200:80 sofka-iq-front` → `GET /` responde HTTP 200
- [x] Verificar CRITERIO-1.3: `GET /quotes/FOL-001/general-info` responde HTTP 200 (no 404)
- [x] Verificar CRITERIO-2.1: `docker-compose up frontend-dev` → http://localhost:4200 responde HTTP 200
- [ ] Verificar CRITERIO-2.2: Modificar un `.ts` en `src/` → el navegador recarga sin rebuild _(requiere navegador manual)_
- [ ] Verificar CRITERIO-3.1: `docker-compose up frontend backend core` → los tres servicios levantan _(requiere backends Java compilados)_
- [x] Verificar CRITERIO-4.1: `GET /assets/config.json` dentro del contenedor retorna el JSON esperado

### QA
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos para este feature de infraestructura
- [ ] Revisar que todos los criterios de aceptación (CRITERIO-1.1 a 4.2) están cubiertos en la verificación manual
- [ ] Actualizar estado spec a `status: IMPLEMENTED` al completar todas las tareas
