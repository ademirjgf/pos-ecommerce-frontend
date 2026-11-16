# POS & E-commerce — Sistema Fullstack

Aplicación web para gestionar un punto de venta (POS), una tienda de comercio electrónico, inventario compartido, pedidos y conciliación de caja.

Desarrollada con **React, TypeScript y Tailwind CSS**, conectada a una API REST construida con NestJS y Prisma.

## 1. Enlaces del proyecto

| Recurso | URL |
|---|---|
| Frontend en producción | https://pos-ecommerce-frontend-seven.vercel.app |
| Repositorio frontend | https://github.com/ademirjgf/pos-ecommerce-frontend |
| Backend desplegado | https://pos-ecommerce-backend.onrender.com |
| Documentación Swagger | https://pos-ecommerce-backend.onrender.com/api/docs |

## 2. Tecnologías utilizadas

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Axios
- Zustand
- React Hook Form
- Zod
- React.lazy y Suspense
- useMemo
- Custom Hooks

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Autenticación JWT
- Control de acceso basado en roles
- API REST documentada con Swagger

### Infraestructura

- Vercel: despliegue del frontend.
- Render: alojamiento de la API.
- Supabase: base de datos PostgreSQL.
- GitHub: control de versiones.

## 3. Funcionalidades

### Autenticación y autorización

El sistema contempla tres roles:

**ADMIN**

- Administrar productos y catálogo.
- Gestionar usuarios cajeros.
- Consultar órdenes.
- Registrar pedidos manuales.
- Utilizar el POS.
- Abrir y cerrar su caja.
- Consultar la conciliación de efectivo.

**CASHIER**

- Acceder al punto de venta.
- Abrir su sesión de caja.
- Registrar ventas con múltiples productos.
- Seleccionar métodos de pago.
- Consultar comprobantes.
- Revisar el historial de ventas.

**CUSTOMER**

- Registrarse e iniciar sesión.
- Explorar el catálogo público.
- Consultar disponibilidad de productos.
- Agregar y eliminar productos del carrito.
- Registrar direcciones de entrega.
- Crear pedidos web.
- Consultar el historial y estado de sus pedidos.

Las rutas administrativas están protegidas según el rol autenticado.

## 4. Inventario compartido

El POS y la tienda online utilizan el mismo inventario del backend.

El sistema incorpora:

- Validación de stock disponible.
- Prevención de ventas superiores a la disponibilidad.
- Actualización de stock después de operaciones POS.
- Reservas de inventario para pedidos web.
- Revalidación periódica del catálogo.
- Revalidación al regresar a la pestaña del navegador.

Las reservas web tienen una duración inicial de 30 minutos.

## 5. Punto de venta (POS)

El módulo POS permite:

1. Abrir una sesión de caja.
2. Seleccionar productos.
3. Agregar múltiples artículos al carrito.
4. Calcular el total.
5. Seleccionar efectivo, tarjeta o transferencia/QR.
6. Confirmar la venta.
7. Obtener el comprobante.
8. Consultar el historial de ventas.

El backend valida nuevamente el stock antes de confirmar la operación.

## 6. Caja y conciliación

El administrador dispone de una pantalla exclusiva para:

- Abrir una sesión de caja.
- Registrar el monto inicial.
- Consultar la sesión activa.
- Registrar el efectivo físico contado.
- Cerrar la sesión.
- Visualizar ventas POS cobradas en efectivo.
- Comparar el efectivo esperado y el contado.
- Consultar la diferencia exacta.

La conciliación utiliza las ventas en efectivo asociadas a la sesión correspondiente.

## 7. Tienda online y órdenes

Los clientes pueden seleccionar productos, administrar su carrito, registrar una dirección y crear pedidos.

El backend registra pedidos web inicialmente como pendientes de pago y reserva el inventario.

El módulo administrativo permite consultar órdenes y gestionar las transiciones de estado permitidas cuando se cumplen las condiciones del pedido.

**Limitación conocida:** el proveedor externo MockPay ha presentado problemas de disponibilidad. Por ello, no se ha podido completar de forma verificable el flujo de confirmación de pagos web y las transiciones posteriores del pedido de prueba. El sistema no marca automáticamente como pagados los pedidos que carecen de confirmación válida del proveedor.

## 8. Instalación local

### Requisitos

- Node.js compatible con la versión de Vite utilizada.
- npm.
- Acceso a una API POS & E-commerce configurada.

### Clonar el repositorio

```bash
git clone https://github.com/ademirjgf/pos-ecommerce-frontend.git
cd pos-ecommerce-frontend
```

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

Crear un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=https://pos-ecommerce-backend.onrender.com
```

La variable `VITE_API_URL` determina la URL base utilizada por Axios para consumir la API.

No incluir contraseñas, tokens JWT ni secretos del backend en variables `VITE_`, porque sus valores se incorporan al frontend público.

### Ejecutar el proyecto

```bash
npm run dev
```

Abrir la dirección local indicada por Vite.

### Validar TypeScript

```bash
npx tsc --noEmit
```

### Compilar para producción

```bash
npm run build
```

### Previsualizar la compilación

```bash
npm run preview
```

## 9. Optimización del frontend

Se implementaron las siguientes mejoras:

**Code splitting**

Uso de `React.lazy` y `Suspense` para cargar páginas bajo demanda, evitando incluir todas las vistas administrativas en el bundle inicial.

**Memoización**

Uso de `useMemo` en el historial POS para memorizar el cálculo de totales y la preparación de filas.

**Custom Hook**

`src/hooks/useHistorialPOS.ts` encapsula la consulta de ventas, el estado de carga y el manejo de errores.

## 10. Despliegue en Vercel

El frontend está desplegado desde el repositorio de GitHub.

Configuración utilizada:

| Parámetro | Valor |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Automático |
| Variable de entorno | `VITE_API_URL` |

Valor de producción:

```env
VITE_API_URL=https://pos-ecommerce-backend.onrender.com
```

El archivo `vercel.json` configura una regla de reescritura hacia `index.html` para permitir la navegación y actualización de rutas internas de React Router sin errores 404.

El backend autoriza el dominio del frontend mediante la variable `CORS_ORIGINS` configurada en Render.

## 11. Usuarios de demostración

El sistema utiliza autenticación JWT y control de acceso basado en roles.

| Rol | Credenciales |
|---|---|
| ADMIN | Solicitar credenciales de demostración al responsable del proyecto |
| CASHIER | Solicitar credenciales de demostración al responsable del proyecto |
| CUSTOMER | Crear una cuenta desde `/registro` o solicitar una cuenta de prueba |

No se publican credenciales administrativas reales ni contraseñas personales en este repositorio.

Para una demostración evaluada, se pueden proporcionar cuentas temporales de prueba para cada rol mediante un canal autorizado.

## 12. Pruebas realizadas en producción

Se verificaron satisfactoriamente:

- Inicio de sesión como ADMIN.
- Visualización de catálogo y stock.
- Acceso y actualización de la ruta de caja.
- Inicio de sesión como CASHIER.
- Apertura de caja.
- Venta POS con múltiples productos.
- Comprobante e historial de ventas.
- Inicio de sesión como CUSTOMER.
- Sincronización de stock después de una venta POS.
- Administración del carrito.
- Creación de pedido con dirección de entrega.
- Apertura y cierre de caja del administrador.
- Cálculo exacto de diferencias de efectivo.
- Restricción de acceso a rutas según rol.
- Actualización de rutas internas sin errores 404.

**Pruebas pendientes por dependencia externa:**

- Confirmación del pago web mediante MockPay.
- Validación de la transición logística de un pedido web pagado.

## 13. Estado del proyecto

El frontend está publicado en Vercel y conectado al backend real desplegado en Render, con persistencia en PostgreSQL mediante Supabase.

Los módulos de autenticación, catálogo, POS, inventario compartido, control de acceso y conciliación de caja han sido probados en producción.

El flujo de pagos web requiere que el proveedor externo MockPay vuelva a estar disponible para completar su validación de extremo a extremo.

---

**Proyecto final — POS & E-commerce Fullstack**

React · TypeScript · Tailwind CSS · NestJS · Prisma · PostgreSQL · Vercel · Render · Supabase
