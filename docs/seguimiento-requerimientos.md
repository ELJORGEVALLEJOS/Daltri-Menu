# Seguimiento de Requerimientos

## Estado actual
| ID | Requerimiento | Estado | Fecha | Notas |
|---|---|---|---|---|
| RQ-001 | Login y dashboard de restaurante (sin admin.daltrishop.com) | Completado | 2026-02-21 | Dashboard enfocado a menú/configuración |
| RQ-002 | Gestión de menú: categorías, productos, ofertas, imágenes | Completado | 2026-02-21 | Incluye validación de oferta |
| RQ-003 | Flujo cliente: carrito, resumen, WhatsApp con total + envío | Completado | 2026-02-21 | Incluye enlace de pedido exacto |
| RQ-004 | Redes sociales opcionales (solo mostrar si existen) | Completado | 2026-02-21 | Contacto fijo removido |
| RQ-005 | Branding: logo, portada, colores, textos hero | Completado | 2026-02-21 | Editable desde configuración |
| RQ-006 | Responsivo móvil/desktop y grilla 2/4 productos | Completado | 2026-02-21 | UI compactada |
| RQ-007 | Seguridad: verificación de correo para nuevas cuentas | En progreso | 2026-02-21 | Backend y flujo de frontend implementados; requiere deploy y SMTP |
| RQ-008 | Manual de uso y documentación operativa | Completado | 2026-02-21 | Documento `docs/manual-usuario.md` |

## Pendientes operativos
| ID | Tarea | Prioridad | Responsable sugerido |
|---|---|---|---|
| OPS-001 | Configurar SMTP en producción | Alta | Backend/DevOps |
| OPS-002 | Ejecutar migración de DB para verificación de email | Alta | Backend/DevOps |
| OPS-003 | Validar flujo end-to-end de verificación en producción | Alta | QA/Producto |

## Plantilla para nuevas solicitudes
Usar este formato en cada nuevo pedido:

```md
### RQ-XXX - Título corto
- Fecha:
- Solicitado por:
- Contexto:
- Criterios de aceptación:
  - [ ] Criterio 1
  - [ ] Criterio 2
- Estado: Pendiente | En progreso | Completado | Bloqueado
- Evidencia (commits, PR, screenshots):
```
