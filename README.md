# Savy — SaaS de Control de Ventas con IA para PYMEs

> Plataforma web diseñada para pequeñas y medianas empresas que necesitan controlar sus ventas, inventario y tomar decisiones inteligentes basadas en datos, sin necesidad de conocimientos técnicos avanzados.

---

## Tabla de Contenidos

1. [Descripción general](#1-descripción-general)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Módulos del sistema](#5-módulos-del-sistema)
6. [Modelo de base de datos](#6-modelo-de-base-de-datos)
7. [Integración con IA](#7-integración-con-ia)
8. [Autenticación y multi-tenant](#8-autenticación-y-multi-tenant)
9. [Roles y permisos](#9-roles-y-permisos)
10. [API REST — Endpoints principales](#10-api-rest--endpoints-principales)
11. [Planes y suscripciones](#11-planes-y-suscripciones)
12. [Roadmap de desarrollo](#12-roadmap-de-desarrollo)
13. [Estructura del proyecto](#13-estructura-del-proyecto)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Instalación y desarrollo local](#15-instalación-y-desarrollo-local)

---

## 1. Descripción general

**Savy** es una aplicación SaaS (Software as a Service) multi-empresa para la gestión comercial de pequeñas y medianas empresas. Centraliza el control de ventas, inventario, clientes y análisis en una sola plataforma accesible desde el navegador. Su diferenciador clave es el motor de recomendaciones impulsado por IA, que ayuda a los dueños y vendedores a tomar mejores decisiones de negocio sin necesidad de ser analistas de datos.

### Características clave

- **Multi-tenant**: cada empresa tiene su propio espacio de datos aislado.
- **Gestión de inventario** en tiempo real con alertas de stock bajo.
- **Pipeline de ventas** con seguimiento de oportunidades y clientes.
- **Dashboard de analytics** personalizable con métricas accionables.
- **Motor de IA** que genera recomendaciones de precios, productos estrella y predicciones de demanda.
- **Facturación y cotizaciones** con exportación a PDF.
- **Multi-usuario** con roles diferenciados (dueño, admin, vendedor, bodega).

---

## 2. Problema que resuelve

La mayoría de PYMEs en Latinoamérica controlan sus ventas e inventario en hojas de Excel o cuadernos físicos. Esto genera:

- Pérdida de información crítica.
- Errores de stock (vender lo que no hay, tener inventario muerto).
- Cero visibilidad de cuáles productos generan más margen.
- Decisiones de compra basadas en intuición, no en datos.
- Imposibilidad de escalar el equipo de ventas sin caos.

**Savy** resuelve estos problemas con una herramienta simple, económica y potenciada con IA, diseñada específicamente para el perfil de PYME latinoamericana.

---

## 3. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Backend** | Node.js + Express + TypeScript | Performance, ecosistema, tipado estricto |
| **Frontend** | React + Vite + TypeScript | SPA rápida, excelente DX |
| **Base de datos** | PostgreSQL | Relacional, robusto, soporte JSON para metadatos |
| **ORM / Queries** | SQL puro con `pg` (node-postgres) | Control total, sin magia de ORM |
| **Autenticación** | JWT + refresh tokens | Stateless, compatible con multi-tenant |
| **IA / LLM** | Claude API (Anthropic) | Recomendaciones contextuales por empresa |
| **Almacenamiento** | AWS S3 o Cloudflare R2 | Imágenes de productos, PDFs de facturas |
| **Email** | Nodemailer + SMTP / Resend | Notificaciones, facturas, recuperación de contraseña |
| **Caché** | Redis | Sesiones, rate limiting, caché de reportes |
| **Deploy Backend** | Railway / Render / VPS con PM2 | Simple y escalable |
| **Deploy Frontend** | Vercel / Netlify | CDN global, preview deploys |
| **Estilos** | Tailwind CSS | Desarrollo rápido, consistencia visual |
| **Gráficas** | Recharts | Componentes React nativos, fácil de customizar |

---

## 4. Arquitectura del sistema

```
┌─────────────────────────────────────────────────┐
│                    CLIENTE                       │
│            React SPA (Vite + TS)                │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / REST API
┌──────────────────▼──────────────────────────────┐
│              BACKEND (Express + TS)             │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Routes  │→ │Controllers│→ │   Services    │  │
│  └──────────┘  └──────────┘  └──────┬────────┘  │
│                                     │            │
│  ┌──────────────┐     ┌─────────────▼──────────┐ │
│  │  AI Engine   │     │      Queries / DB       │ │
│  │ (Claude API) │     │      (PostgreSQL)       │ │
│  └──────────────┘     └────────────────────────┘ │
└─────────────────────────────────────────────────┘

Multi-tenant: cada request lleva empresa_id en el JWT.
Todos los queries filtran por empresa_id automáticamente.
```

### Flujo de datos

```
Request HTTP
  → Middleware: verifyToken (extrae empresa_id + usuario del JWT)
  → Middleware: verifyRole (permisos de rol)
  → Route
  → Controller  ← parsea req, llama service, responde
      → Service ← lógica de negocio, validaciones, reglas
          → Queries ← SQL parametrizado, sin lógica
          → DB (withTransaction cuando hay múltiples writes)
  → Response HTTP
```

---

## 5. Módulos del sistema

### 5.1 Módulo de Autenticación

- Registro de empresa (onboarding en 3 pasos).
- Login / logout.
- Refresh token automático.
- Recuperación de contraseña vía email.
- Verificación de email al registrarse.
- Gestión de sesiones activas.

### 5.2 Módulo de Inventario

**Funciones:**
- CRUD de productos con: nombre, SKU, categoría, precio de costo, precio de venta, stock actual, stock mínimo, unidad de medida, imágenes.
- Movimientos de inventario: entrada, salida, ajuste, transferencia entre sucursales.
- Historial completo de movimientos por producto.
- Alertas automáticas cuando el stock cae por debajo del mínimo configurado.
- Importación masiva de productos desde CSV/Excel.
- Exportación de inventario actual a Excel.
- Categorías y subcategorías personalizables.
- Variantes de producto (color, talla, etc.).
- Códigos de barras / QR para productos.

**Base de datos (tablas principales):**
- `productos` — catálogo maestro
- `movimientos_inventario` — historial de entradas/salidas
- `categorias_producto`
- `variantes_producto`
- `alertas_stock`

### 5.3 Módulo de Ventas

**Funciones:**
- Crear venta directa con carrito de productos.
- Descuentos por producto o por venta total (porcentaje o monto fijo).
- Múltiples métodos de pago: efectivo, tarjeta, transferencia, crédito.
- Ventas a crédito con registro de pagos parciales y saldo pendiente.
- Historial de ventas con filtros: fecha, vendedor, cliente, estado.
- Cancelación de ventas con restitución de inventario.
- Devoluciones parciales.
- Vista de "corte de caja" por vendedor y por día.

**Base de datos:**
- `ventas` — cabecera de cada venta
- `detalle_ventas` — líneas de producto por venta
- `pagos_ventas` — pagos (para ventas a crédito con abonos)
- `devoluciones`

### 5.4 Módulo de Clientes (CRM Lite)

**Funciones:**
- Directorio de clientes con datos de contacto.
- Historial de compras por cliente.
- Segmentación automática: cliente frecuente, cliente inactivo, cliente nuevo.
- Notas y seguimientos por cliente.
- Exportación de cartera de clientes.
- Búsqueda avanzada por nombre, teléfono, RFC, correo.

### 5.5 Módulo de Cotizaciones y Facturas

**Funciones:**
- Generar cotización con logo, datos de empresa y productos.
- Convertir cotización en venta con un clic.
- Generar factura en PDF lista para imprimir o enviar por correo.
- Numeración automática de folio.
- Plantillas de cotización personalizables.
- Envío de cotización/factura por correo directamente desde la app.
- Historial de cotizaciones con estado: borrador, enviada, aceptada, rechazada, vencida.

### 5.6 Módulo de Analytics y Reportes

**Reportes disponibles:**
- Ventas totales por período (día, semana, mes, año).
- Productos más vendidos (por cantidad y por ingreso).
- Productos con menor rotación (inventario muerto).
- Margen de ganancia por producto y categoría.
- Rendimiento por vendedor.
- Clientes que más compran.
- Ventas por método de pago.
- Flujo de caja proyectado.
- Tasa de conversión de cotizaciones.
- Reporte de cuentas por cobrar (clientes con crédito).

**Visualizaciones:**
- Gráficas de línea: tendencia de ventas.
- Gráficas de barra: comparativos por período.
- Gráficas de pastel: distribución por categoría.
- Tablas exportables a Excel/CSV.
- Dashboard personalizable: el usuario elige qué widgets ver.

### 5.7 Módulo de IA — Recomendaciones Inteligentes

Ver sección [7. Integración con IA](#7-integración-con-ia).

### 5.8 Módulo de Configuración de Empresa

**Funciones:**
- Datos de la empresa: nombre, logo, RFC, dirección, teléfono.
- Gestión de usuarios y roles.
- Configuración de sucursales (para empresas con más de una ubicación).
- Personalización de plantillas de cotización y factura.
- Configuración de notificaciones (email, en-app).
- Plan de suscripción activo y gestión de facturación.
- Integración con SMTP propio para envío de correos.

### 5.9 Módulo de Notificaciones

**Tipos de notificaciones:**
- Stock bajo — cuando un producto cae al mínimo.
- Venta de monto alto — alerta al dueño de ventas grandes.
- Cotización vencida — si una cotización lleva X días sin respuesta.
- Cuenta por cobrar vencida — clientes que no han pagado.
- Reporte semanal automático por correo.
- Nuevo usuario registrado en la empresa.

---

## 6. Modelo de base de datos

### Tablas principales

```sql
-- Multi-tenant
empresas (id, nombre, rfc, logo_url, plan_id, activo, fecha_creacion)
sucursales (id, empresa_id, nombre, direccion, activo)
usuarios (id, empresa_id, nombre_completo, correo, password_hash, rol, activo)

-- Inventario
categorias_producto (id, empresa_id, nombre, categoria_padre_id)
productos (id, empresa_id, nombre, sku, descripcion, precio_costo, precio_venta,
           stock_actual, stock_minimo, categoria_id, unidad_medida, activo)
variantes_producto (id, producto_id, nombre, valor, precio_extra, stock_adicional)
movimientos_inventario (id, empresa_id, producto_id, tipo, cantidad, stock_anterior,
                        stock_nuevo, motivo, usuario_id, fecha)

-- Clientes
clientes (id, empresa_id, nombre_completo, correo, telefono, rfc, direccion,
          segmento, notas, activo, fecha_creacion)

-- Ventas
ventas (id, empresa_id, sucursal_id, cliente_id, vendedor_id, subtotal, descuento,
        total, tipo_pago, status, notas, fecha_venta, activo)
detalle_ventas (id, venta_id, producto_id, variante_id, cantidad, precio_unitario,
                descuento_linea, subtotal_linea)
pagos_ventas (id, venta_id, monto, metodo_pago, fecha_pago, notas)
devoluciones (id, venta_id, producto_id, cantidad, motivo, fecha, usuario_id)

-- Cotizaciones
cotizaciones (id, empresa_id, cliente_id, vendedor_id, folio, subtotal, descuento,
              total, status, fecha_vencimiento, notas, fecha_creacion)
detalle_cotizaciones (id, cotizacion_id, producto_id, cantidad, precio_unitario,
                      descuento_linea, subtotal_linea)

-- Configuración
planes (id, nombre, precio_mensual, limite_usuarios, limite_productos, tiene_ia)
suscripciones (id, empresa_id, plan_id, fecha_inicio, fecha_fin, activo)
configuracion_empresa (id, empresa_id, clave, valor)
notificaciones (id, empresa_id, usuario_id, tipo, titulo, cuerpo, leida, fecha)
```

---

## 7. Integración con IA

El motor de IA de Savy utiliza la API de Claude (Anthropic) para generar recomendaciones contextuales basadas en los datos reales de la empresa.

### 7.1 Recomendaciones de precios

- Analiza el historial de ventas por producto.
- Detecta productos donde la demanda es alta pero el margen es bajo.
- Sugiere ajuste de precio con impacto proyectado en ingresos.

### 7.2 Predicción de demanda

- Basada en historial de ventas (últimos 3-6 meses).
- Predice qué productos necesitan reabastecimiento en los próximos 15/30 días.
- Considera estacionalidad si hay suficiente historial.

### 7.3 Detección de inventario muerto

- Identifica productos con stock > 0 pero sin ventas en X días.
- Sugiere estrategias: descuento agresivo, liquidación, bundle con producto popular.

### 7.4 Recomendación de productos al vendedor

- En el momento de crear una venta, sugiere productos complementarios.
- Basado en historial de compras del cliente y patrones de ventas de la empresa.
- Ejemplo: "Los clientes que compran X frecuentemente también llevan Y."

### 7.5 Resumen ejecutivo semanal

- Cada lunes, genera un resumen en lenguaje natural de la semana anterior.
- Incluye: qué salió bien, qué preocupa, qué hacer esta semana.
- Se envía por correo y aparece en el dashboard.

### 7.6 Análisis de clientes en riesgo

- Detecta clientes que solían comprar frecuentemente y llevan semanas sin comprar.
- Genera lista de clientes a re-activar con sugerencia de oferta personalizada.

### Implementación técnica de IA

```typescript
// Cada llamada a IA recibe contexto estructurado de la empresa
// y devuelve una recomendación accionable

interface ContextoEmpresa {
  empresa_id: number;
  periodo: string;
  ventas_resumen: VentasResumen;
  top_productos: ProductoMetrica[];
  productos_sin_rotacion: ProductoMetrica[];
  clientes_activos: number;
  clientes_inactivos: number;
}

interface Recomendacion {
  tipo: 'precio' | 'stock' | 'cliente' | 'producto' | 'resumen';
  titulo: string;
  descripcion: string;
  accion_sugerida: string;
  impacto_estimado?: string;
  datos_relacionados?: Record<string, unknown>;
}
```

Los datos se pre-procesan en el backend antes de enviarlos a Claude para minimizar tokens y maximizar la calidad de la respuesta.

---

## 8. Autenticación y multi-tenant

### JWT Payload

```typescript
interface JWTPayload {
  usuario_id: number;
  empresa_id: number;  // clave del multi-tenant
  sucursal_id: number;
  rol: 'super_admin' | 'admin' | 'vendedor' | 'bodega' | 'contador';
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}
```

### Aislamiento de datos

- **Cada query incluye `empresa_id`** extraído del JWT. Nunca se confía en el body de la request.
- Un usuario de la empresa A nunca puede ver datos de la empresa B, incluso si conoce el ID.
- El `super_admin` de Savy tiene acceso de solo lectura a todas las empresas (para soporte).

### Flujo de autenticación

```
1. Usuario hace login → backend valida credenciales
2. Backend genera: access_token (15 min) + refresh_token (7 días)
3. Frontend guarda access_token en memoria, refresh_token en httpOnly cookie
4. Cada request incluye access_token en Authorization header
5. Cuando access_token expira, frontend usa refresh_token automáticamente
6. Al logout, se invalida el refresh_token en BD
```

---

## 9. Roles y permisos

| Permiso | super_admin | admin | vendedor | bodega | contador |
|---|---|---|---|---|---|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear venta | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancelar venta propia | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancelar venta de otro | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver inventario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar inventario | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver costos de productos | ✅ | ✅ | ❌ | ✅ | ✅ |
| Ver reportes completos | ✅ | ✅ | Solo propios | ❌ | ✅ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configuración empresa | ✅ | ✅ | ❌ | ❌ | ❌ |
| Acceder a IA | ✅ | ✅ | ✅ | ❌ | ✅ |
| Exportar datos | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 10. API REST — Endpoints principales

```
# Auth
POST   /api/auth/register          Registrar empresa + usuario admin
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/refresh           Renovar access token
POST   /api/auth/forgot-password   Solicitar reset de contraseña
POST   /api/auth/reset-password    Establecer nueva contraseña

# Usuarios
GET    /api/usuarios               Listar usuarios de la empresa
POST   /api/usuarios               Crear usuario
PUT    /api/usuarios/:id           Editar usuario
DELETE /api/usuarios/:id           Desactivar usuario (soft delete)

# Productos / Inventario
GET    /api/productos              Listar con filtros y paginación
POST   /api/productos              Crear producto
GET    /api/productos/:id          Detalle de producto
PUT    /api/productos/:id          Editar producto
DELETE /api/productos/:id          Desactivar producto
POST   /api/productos/importar     Importar CSV
GET    /api/productos/exportar     Exportar Excel

POST   /api/inventario/movimiento  Registrar entrada/salida/ajuste
GET    /api/inventario/movimientos Historial de movimientos
GET    /api/inventario/alertas     Productos con stock bajo

# Clientes
GET    /api/clientes               Listar clientes
POST   /api/clientes               Crear cliente
GET    /api/clientes/:id           Detalle + historial de compras
PUT    /api/clientes/:id           Editar cliente

# Ventas
GET    /api/ventas                 Listar ventas con filtros
POST   /api/ventas                 Crear venta
GET    /api/ventas/:id             Detalle de venta
POST   /api/ventas/:id/cancelar    Cancelar venta
POST   /api/ventas/:id/devolucion  Registrar devolución
POST   /api/ventas/:id/pago        Registrar pago (crédito)
GET    /api/ventas/corte           Corte de caja del día

# Cotizaciones
GET    /api/cotizaciones           Listar cotizaciones
POST   /api/cotizaciones           Crear cotización
PUT    /api/cotizaciones/:id       Editar cotización
POST   /api/cotizaciones/:id/convertir  Convertir a venta
GET    /api/cotizaciones/:id/pdf   Descargar PDF

# Reportes / Analytics
GET    /api/reportes/ventas        Reporte de ventas por período
GET    /api/reportes/productos     Productos más vendidos / sin rotación
GET    /api/reportes/vendedores    Rendimiento por vendedor
GET    /api/reportes/clientes      Análisis de cartera de clientes
GET    /api/reportes/caja          Flujo de caja
GET    /api/reportes/exportar      Exportar reporte a Excel

# IA
POST   /api/ia/recomendaciones     Generar recomendaciones del negocio
GET    /api/ia/resumen-semanal     Resumen ejecutivo de la semana
POST   /api/ia/analisis-producto   Analizar un producto específico
GET    /api/ia/clientes-riesgo     Clientes en riesgo de abandono

# Configuración
GET    /api/configuracion          Obtener config de la empresa
PUT    /api/configuracion          Actualizar config
GET    /api/notificaciones         Listar notificaciones del usuario
PUT    /api/notificaciones/:id     Marcar como leída
```

---

## 11. Planes y suscripciones

| Característica | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Usuarios | 1 | 3 | 10 | Ilimitados |
| Productos | 50 | 500 | 5,000 | Ilimitados |
| Ventas/mes | 100 | Ilimitadas | Ilimitadas | Ilimitadas |
| Sucursales | 1 | 1 | 3 | Ilimitadas |
| Recomendaciones IA | ❌ | 10/mes | Ilimitadas | Ilimitadas |
| Exportación Excel | ❌ | ✅ | ✅ | ✅ |
| Soporte | Email | Email | Chat | Dedicado |
| **Precio/mes** | Gratis | $299 MXN | $799 MXN | Cotizar |

---

## 12. Roadmap de desarrollo

### Fase 1 — MVP (mes 1-2)
- [ ] Proyecto base: backend Express + TypeScript + PostgreSQL
- [ ] Autenticación JWT con multi-tenant
- [ ] CRUD de productos e inventario básico
- [ ] Módulo de ventas directas
- [ ] Dashboard con métricas básicas
- [ ] Deploy en Railway (backend) + Vercel (frontend)

### Fase 2 — Core completo (mes 3-4)
- [ ] Módulo de clientes (CRM lite)
- [ ] Cotizaciones con generación de PDF
- [ ] Movimientos de inventario con historial
- [ ] Reportes de ventas y productos
- [ ] Sistema de notificaciones en-app
- [ ] Roles y permisos granulares
- [ ] Importación/exportación CSV-Excel

### Fase 3 — IA y diferenciadores (mes 5-6)
- [ ] Integración Claude API para recomendaciones
- [ ] Resumen ejecutivo semanal por correo
- [ ] Predicción de demanda
- [ ] Análisis de inventario muerto
- [ ] Recomendaciones de upsell en el punto de venta
- [ ] Dashboard personalizable con widgets arrastrables

### Fase 4 — Escala y monetización (mes 7+)
- [ ] Sistema de planes y suscripciones (Stripe)
- [ ] Onboarding guiado en 3 pasos
- [ ] Multi-sucursal con transferencias de inventario
- [ ] App móvil (PWA o React Native)
- [ ] Integración con SAT (CFDI para México)
- [ ] API pública para integraciones de terceros
- [ ] Webhooks para automatizaciones externas

---

## 13. Estructura del proyecto

```
savy/
├── backend/
│   ├── src/
│   │   ├── config/           # DB, email, redis, multer, swagger
│   │   ├── controllers/      # Parsean request, llaman service, responden
│   │   ├── middleware/        # auth, roles, validaciones HTTP, rate limit
│   │   ├── queries/          # SQL centralizado por módulo
│   │   │   ├── productos/
│   │   │   ├── ventas/
│   │   │   ├── clientes/
│   │   │   └── reportes/
│   │   ├── routes/           # Rutas y middlewares por módulo
│   │   ├── services/         # Lógica de negocio
│   │   │   ├── inventario/
│   │   │   ├── ventas/
│   │   │   ├── clientes/
│   │   │   ├── reportes/
│   │   │   └── ia/           # Servicio de IA (Claude API)
│   │   ├── types/            # Tipos TypeScript del backend
│   │   └── utils/            # errors, database, validations, pdf, email
│   ├── database/
│   │   └── migrations/       # Archivos SQL numerados
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Componentes base (Button, Input, Modal, Table)
│   │   │   ├── layout/       # Sidebar, Topbar, Layout
│   │   │   ├── inventario/
│   │   │   ├── ventas/
│   │   │   ├── clientes/
│   │   │   ├── reportes/
│   │   │   └── ia/           # Componentes del módulo IA
│   │   ├── context/          # AuthContext, NotificacionesContext
│   │   ├── hooks/            # Custom hooks por módulo
│   │   ├── pages/            # Una página por módulo
│   │   ├── services/         # Llamadas HTTP (axios)
│   │   └── utils/            # errorHandler, formatters, validations
│   ├── .env.example
│   └── package.json
│
├── shared/
│   ├── types/                # Interfaces compartidas backend/frontend
│   └── constants/            # Constantes compartidas (roles, status, etc.)
│
└── README.md
```

---

## 14. Variables de entorno

### Backend `.env`

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=savy_db
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_secreto_super_seguro_de_minimo_32_caracteres
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=otro_secreto_para_refresh_token
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:5173,https://app.savy.mx

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@savy.mx
EMAIL_PASS=app_password

# IA — Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Almacenamiento (imágenes, PDFs)
S3_BUCKET=savy-archivos
S3_REGION=us-east-1
S3_ACCESS_KEY=xxxxx
S3_SECRET_KEY=xxxxx

# Redis (opcional para dev)
REDIS_URL=redis://localhost:6379
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Savy
```

---

## 15. Instalación y desarrollo local

### Prerequisitos

- Node.js 20+
- PostgreSQL 15+
- Redis (opcional para desarrollo)
- Git

### Setup inicial

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/savy.git
cd savy

# Instalar dependencias del backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores locales

# Crear base de datos y ejecutar migraciones
createdb savy_db
psql -U postgres -d savy_db -f database/migrations/001_initial_schema.sql
# ... ejecutar migraciones en orden

# Instalar dependencias del frontend
cd ../frontend
npm install
cp .env.example .env

# Levantar en desarrollo (dos terminales)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### Scripts disponibles

```bash
# Backend
npm run dev        # Desarrollo con hot reload (ts-node-dev)
npm run build      # Compilar TypeScript a dist/
npm run start      # Ejecutar build de producción

# Frontend
npm run dev        # Servidor de desarrollo Vite
npm run build      # Build de producción en dist/
npm run preview    # Preview del build
```

---

*Savy — Hecho para que las PYMEs tomen mejores decisiones, más rápido.*
