# Cotizador Daños Web — Insurance-Quoter-Front

**Repositorio:** https://github.com/Jomruizgo/Insurance-Quoter-Front

SPA Angular 19 (standalone) del cotizador de seguros de daños. Consume los microservicios `plataforma-danos-back` y `plataforma-core-ohs`.

## Ecosistema

| Servicio | Repositorio |
|----------|-------------|
| Frontend Angular (este repo) | https://github.com/Jomruizgo/Insurance-Quoter-Front |
| Backend core / catálogos | https://github.com/Jomruizgo/Insurance-Quoter-Core |
| Backend quoter | https://github.com/Jomruizgo/Insurance-Quoter-Back |

## Stack

| Tecnología | Versión |
|-----------|---------|
| Angular | 19 (standalone) |
| TypeScript | 5.x |
| Jasmine + Karma | — |
| Node | 20 |

## Ejecutar en local (desarrollo)

```bash
npm install
ng serve
```

La app queda en `http://localhost:4200`. Usa `localhost:8080` y `localhost:8081` como URLs de API por defecto (ver `AppConfigService`).

## Ejecutar tests

```bash
ng test
```

Solo se testean services, guards y pipes. Los componentes y templates no se prueban.

## Cobertura

```bash
ng test --code-coverage
```

## Build de producción

```bash
npm run build -- --configuration=production
```

Los artefactos quedan en `dist/cotizador-danos-web/`.

## Configuración de API en Docker

El archivo `src/assets/config.json` define las URLs de API para producción:

```json
{
  "apiUrl": "/api",
  "coreUrl": "/api-core"
}
```

Nginx hace proxy de `/api/` → `backend:8080` y `/api-core/` → `core:8081`.

## Rutas de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/cotizador` | Selección o creación de folio |
| `/quotes/:folio/general-info` | Datos generales |
| `/quotes/:folio/locations` | Ubicaciones |
| `/quotes/:folio/technical-info` | Información técnica y coberturas |
| `/quotes/:folio/terms-and-conditions` | Cálculo y resultados |
