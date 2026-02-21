# Entrega Final - Backend II

API REST para un e-commerce desarrollada con Node.js, Express y MongoDB.  
Incluye autenticación con JWT, roles, manejo de carritos, compra con generación de ticket y validación de ownership (un usuario no puede acceder al carrito de otro).

---

## Tecnologías
- Node.js
- Express
- MongoDB + Mongoose
- Passport (Local + JWT)
- JSON Web Tokens (JWT)

---

## Instalación y ejecución

1) Clonar el repositorio e instalar dependencias: ```npm install```

2) Crear archivo .env en la raíz del proyecto (no se incluye en el repo).

3) Ejecutar en modo desarrollo: ```npm run dev```

Servidor por defecto:
http://localhost:8080

---

## Variables de entorno
Crear un archivo `.env` con las siguientes variables:

PORT=
JWT_SECRET=
GMAIL_USER=
GMAIL_PASS=
BASE_URL=

---

## Autenticación y roles

La API utiliza autenticación JWT mediante Passport:

El token se envía por:

Header: Authorization: Bearer <token>

o cookie token (según configuración)

Roles:

user: acceso a carrito, compra y acciones de usuario.

admin: acceso a endpoints restringidos (por ejemplo manejo avanzado de usuarios / productos, según implementación).

---

## Endpoints Principales

Productos

GET /api/products → listar productos

GET /api/products/:pid → obtener producto por id

POST /api/products → crear producto (típicamente admin)

PUT /api/products/:pid → actualizar producto (típicamente admin)

DELETE /api/products/:pid → eliminar producto (típicamente admin)

Carritos

POST /api/carts → crear carrito (user)

GET /api/carts/:cid → ver carrito (JWT + ownership)

POST /api/carts/:cid/product/:pid → agregar producto (JWT + ownership)

PUT /api/carts/:cid/product/:pid → actualizar cantidad (JWT + ownership)

DELETE /api/carts/:cid/product/:pid → eliminar producto del carrito (JWT + ownership)

DELETE /api/carts/:cid → vaciar carrito (JWT + ownership)

POST /api/carts/:cid/purchase → realizar compra y generar ticket (JWT + ownership

---

## Purchase + Ticket

El endpoint POST /api/carts/:cid/purchase:

Verifica stock disponible por producto

Descuenta stock de los productos comprados

Genera un ticket con:

code

amount

purchaser (email del usuario)

Deja en el carrito únicamente los productos no comprables (si aplica)

Respuesta esperada:

purchased: productos comprados

notPurchased: productos no comprados por falta de stock

---

## Seguridad: Cart Ownership

Se valida ownership del carrito:

Un usuario user solo puede acceder/modificar su propio carrito.

Si intenta acceder a un carrito ajeno:

Respuesta 403 Forbidden

--- 

## Casos de prueba:

Token inválido → 401 Unauthorized

Token expirado → 401 Unauthorized

Acceso a carrito ajeno → 403 Forbidden

Carrito inexistente → 404 Not found

Stock insuficiente en purchase → error controlado (ej. 409 Conflict)


