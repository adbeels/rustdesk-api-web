# Mantenimiento del fork adbeels/rustdesk-api-web

Fork de [lejianwen/rustdesk-api-web](https://github.com/lejianwen/rustdesk-api-web), la consola de administración
(Vue 3 + Element Plus) de [adbeels/rustdesk-api](https://github.com/adbeels/rustdesk-api). Licencia MIT; el crédito
es de lejianwen. Upstream no tiene commits desde el 2025-08-31 (`3998c2a`).

- La consola no se publica sola. La imagen de la API (`Dockerfile.adbeels` en adbeels/rustdesk-api) la construye
  desde **un commit fijo** de este fork. Para cambiar la consola: se fusiona aquí y se sube el commit allá.
- CI (`.github/workflows/revisar.yml`) corre `npm ci --ignore-scripts`, `npm audit` y `npm run build` en cada push y PR.
- Sin cliente web (retirado por DMCA): desde la ronda 2 ya no queda código para él en la consola.

## 2026-10-18 · Línea base y primera actualización

Herramientas: npm 11.13, Node 22.14 (laptop) y Node 24.22 (imagen).

### Antes (commit `3998c2a`, el que trae la v2.7 oficial)

`npm audit`: **28 vulnerabilidades** (2 críticas, 19 altas, 6 moderadas y 1 baja). De ellas, **12 están en
dependencias de producción**, es decir, en el código que llega al navegador.

- **`protobufjs` crítica**: la columna «prod.» dice «no» porque `npm audit --omit=dev` no la cuenta. Pero el código
  sí la importa (`src/utils/webclient/*`, junto con `long`) sin declararla: llegaba colgada de `ts-proto`, que es
  de desarrollo. Así que **sí iba en el bundle**.
- Las de herramientas de build (vite, rollup, webpack, braces, etc.) no llegan al navegador, pero corren en el CI
  que arma la imagen.

| Paquete | Severidad | Prod. | Directa | Primer aviso (+ otros) |
|---|---|---|---|---|
| @protobufjs/utf8 | moderada | no | no | protobufjs has overlong UTF-8 decoding |
| @vue/server-renderer | alta | sí | no | XSS via missing CR in attribute-name blacklist |
| ajv | moderada | no | no | ReDoS when using `$data` option (+1) |
| axios | alta | sí | sí | DoS through lack of data size check (+31: SSRF por NO_PROXY, bypass de autenticación por prototype pollution…) |
| braces | alta | no | no | stack-exhaustion DoS |
| browserslist | alta | no | no | Unbounded memory growth (+1) |
| chokidar | alta | no | no | vía braces |
| element-plus | moderada | sí | sí | el-link: validación insuficiente de entrada |
| fast-uri | alta | no | no | host confusion via backslash (+8) |
| follow-redirects | moderada | sí | no | filtra encabezados de autenticación en redirecciones a otro dominio |
| form-data | crítica | sí | no | random inseguro para el boundary (+1: inyección CRLF) |
| immutable | alta | no | no | Prototype Pollution (+2) |
| js-cookie | alta | sí | sí | prototype hijack en `assign()` |
| lodash / lodash-es | alta | sí | no | Code Injection via `_.template` (+2: prototype pollution) |
| nanoid | alta | sí | no | bucle infinito con tamaños negativos (+2) |
| picomatch | alta | no | no | Method Injection en clases POSIX (+3) |
| postcss | alta | sí | no | XSS por `</style>` sin escapar (+3) |
| protobufjs | **crítica** | **sí (no declarada)** | no | Arbitrary code execution (+10) |
| qs | moderada | no | sí | DoS por arrayLimit (+3) |
| rollup | alta | no | no | Arbitrary File Write via Path Traversal |
| sass | alta | no | sí | vía chokidar |
| serialize-javascript | alta | no | no | RCE via RegExp.flags (+1) |
| source-map-js | alta | sí | no | DoS con offsets de source-map |
| terser-webpack-plugin | moderada | no | no | vía serialize-javascript |
| vite | alta | no | sí | servidor de desarrollo: path traversal y lectura de archivos (+6) |
| vue | alta | sí | sí | vía @vue/server-renderer |
| webpack | baja | no | no | SSRF en buildHttp (+1) |

**Desactualizadas** (`npm outdated`):

| Paquete | Tenía | Última |
|---|---|---|
| axios | 1.8.2 | 1.20.0 |
| clipboard | 2.0.4 | 2.0.11 |
| element-plus | 2.8.2 | 2.14.7 |
| js-cookie | 3.0.5 | 3.0.8 |
| marked | 15.0.4 | 18.1.1 |
| pinia | 2.2.8 | 4.1.0 |
| vue | 3.5.13 | 3.5.44 |
| vue-router | 4.4.3 | 5.4.0 |
| vite | 6.3.4 | 8.3.4 |
| @vitejs/plugin-vue | 5.2.1 | 6.0.10 |
| sass | 1.78.0 | 1.105.2 |
| dotenv | 10.0.0 | 18.0.8 |
| ts-proto | 1.181.2 | 2.18.0 |
| qs, sass-loader | 6.13.0, 12.6.0 | (se quitaron, ver abajo) |

### Qué se cambió

- **Producción**: axios 1.20.0, clipboard 2.0.11, element-plus 2.14.7, js-cookie 3.0.8, marked 18.1.1, pinia 4.1.0,
  vue 3.5.44 y vue-router 5.4.0.
- **Desarrollo**: vite 8.3.4, @vitejs/plugin-vue 6.0.10, sass 1.105.2, dotenv 18.0.8 y ts-proto 2.18.0.
- **Declaradas explícitamente**: `protobufjs` ^7.6.6 y `long` ^5.3.2, que el código importa.
  - protobufjs queda en **7.x a propósito**: `src/utils/webclient/message.ts` se generó con ts-proto 1 para la API
    de protobufjs 7. La 7.6.6 ya trae todos los arreglos de seguridad.
- **Quitadas**, porque nada las usa: `qs` y `sass-loader`. sass-loader es un loader de webpack y arrastraba webpack,
  terser y serialize-javascript.
- **Código**:
  - `src/store/*.js`: `defineStore({ id: 'x', … })` → `defineStore('x', { … })`. La forma con `id` dentro del
    objeto se quitó en pinia 3.
  - `vite.config.js`: `minify: 'esbuild'` → `'oxc'`. Vite 8 ya no incluye esbuild.

### Después

`npm audit`: **0 vulnerabilidades** (total y producción). `npm outdated` solo lista protobufjs 8 (ver arriba).
`npm run build` ✅ con Vite 8.

### Pendiente

- ~~`@element-plus/icons`~~, ~~`vite.config.mjs`~~ y ~~código del cliente web~~: hechos en la ronda 2.

## 2026-10-18 · Ronda 2 (commit `cb0eb51`, va en la imagen `v2.7-adbeels.3`)

- **Fuera el cliente web.**
  - Se borraron `src/utils/webclient.js`, `src/utils/webclient/` (protobuf generado) y `shareByWebClient.vue`.
  - Se quitaron los botones «Web Client» y «Compartir por cliente web» de dispositivos y libretas, y
    `shareByWebClient` de `src/api`.
  - Ya no se escriben en `localStorage` las claves `wc-*`:
    - `wc-option:local:access_token` guardaba **el token del admin** y no se borraba al cerrar sesión. Ahora
      `removeToken` la limpia, por si quedó de una versión anterior.
    - `wc-key`, `wc-api-server` y `wc-custom-rendezvous-server` guardaban la configuración del servidor.
  - Fuera las dependencias que solo usaba ese código: `protobufjs`, `long` y `ts-proto`.
- Fuera `src/views/my/address_book/indexv2.vue`: no tenía ruta.
- `@element-plus/icons` 0.0.11 (obsoleto) → **`@element-plus/icons-vue` 2.3.2**. Tiene los mismos 280 nombres, así
  que solo cambia el import.
- `vite.config.js` → **`vite.config.mjs`**, ESM nativo: `fileURLToPath(new URL('./src', import.meta.url))` en
  lugar de `__dirname`. Se quitó el aviso de Vite.
- `appConfig.web_client` en 0 por omisión.
- `npm audit`: 0. Build: 1797 módulos (antes 2103). El bundle ya no trae `protobuf` ni `webclient2`.
