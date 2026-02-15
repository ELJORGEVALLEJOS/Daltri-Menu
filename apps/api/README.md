# Daltri Menu Server

Backend API para menu digital multi-restaurant usando NestJS + Prisma + PostgreSQL.

## Setup rapido

Requiere Node.js 20 o superior (`.nvmrc` incluido).

1. Instala dependencias:

```bash
npm install
```

2. Crea archivo de entorno:

```bash
cp .env.example .env
```

3. Ajusta variables en `.env`:

- `DATABASE_URL`: conexion PostgreSQL
- `PORT`: puerto HTTP
- `JWT_SECRET`: secreto para tokens JWT
- `JWT_EXPIRES_IN`: expiracion del token (por defecto `1d`)
- `SUPER_ADMIN_EMAIL`: email del super admin inicial
- `SUPER_ADMIN_PASSWORD`: password del super admin inicial
- `SUPER_ADMIN_FULL_NAME`: nombre del super admin inicial
- `ADMIN_API_KEY`: compatibilidad con endpoints legacy

4. Genera cliente Prisma:

```bash
npx prisma generate
```

5. Ejecuta:

```bash
npm run start:dev
```

## Contrato MVP implementado

### Publico

- `GET /public/restaurants/:slug/menu`
- `POST /public/restaurants/:slug/orders`
- `POST /public/orders/:orderId/mark-sent`

Notas:
- `POST /public/restaurants/:slug/orders` requiere `delivery_address` cuando `delivery=delivery`.
- El pedido se marca automaticamente como `sent_to_whatsapp` al generarse `whatsapp_url`.
- Se devuelve `order_number` corto ademas del `order_id` UUID.

### Auth (JWT)

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/users` (solo `SUPER_ADMIN`)

### Admin (JWT)

- `GET /admin/restaurant`
- `PUT /admin/restaurant`
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `GET /admin/products`
- `POST /admin/products`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- `GET /admin/orders`
- `GET /admin/orders/:id`

## Scripts

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:seed
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Deploy (Dokploy / Nixpacks)

- Build: `npm run build`
- Start: `npm run start` (usa `node dist/main`)
- Antes del primer arranque sobre una base vacia:
  - `npm run db:migrate:deploy`
  - `npm run db:seed`
