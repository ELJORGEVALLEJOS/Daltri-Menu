# Manual de Usuario - Daltri Menu

## 1. Registro y acceso seguro
- Entra a `/register` y crea tu restaurante con correo y contraseña.
- Revisa tu correo y abre el enlace de verificación.
- Una vez verificado, entra a `/login`.
- Si no llega el correo, en login usa `Reenviar verificación`.

## 2. Gestión del menú
- Ruta: `Dashboard > Gestión del Menú`.
- Crea categorías.
- Crea productos por categoría.
- Para oferta:
  - `Precio` = precio actual.
  - `Anterior (oferta)` = precio tachado.
  - La oferta solo aplica si `Anterior` es mayor que `Precio`.
- Puedes subir imagen real o usar URL.
- Puedes desactivar/eliminar categorías y productos que no se usan.

## 3. Configuración del restaurante
- Ruta: `Dashboard > Configuración`.
- Datos principales:
  - Nombre del negocio.
  - Código del restaurante (slug).
  - WhatsApp.
- Imagen y marca:
  - Logo.
  - Portada.
  - Colores del menú.
  - Textos de portada (título, subtítulo, etiqueta).
- Envío:
  - Gratis o Pago.
  - Costo de envío (si aplica).
- Redes sociales:
  - Solo se muestran en el menú público si tienen URL válida.

## 4. Flujo del cliente (menú público)
- El cliente abre `menu.daltrishop.com/m/{slug}`.
- Selecciona productos y agrega al carrito.
- Revisa resumen: subtotal + envío + total.
- Botón WhatsApp:
  - Abre chat del restaurante.
  - Incluye productos, totales y enlace al pedido exacto.

## 5. Problemas comunes
- No puedo iniciar sesión:
  - Verifica correo primero.
  - Reenvía verificación desde login.
- No aparece una oferta:
  - Asegura que `Anterior` > `Precio`.
- No aparece una red social:
  - Debe tener URL completa (`https://...`).

## 6. Operación recomendada
- Revisar configuración al inicio de cada semana.
- Validar enlaces de redes y WhatsApp mensualmente.
- Probar pedido de punta a punta después de cambios grandes.
