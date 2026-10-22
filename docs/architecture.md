# Arquitectura reutilizable de Pedilo

Cada instalación corresponde a UN restaurante. No hay multitenancy implícito.

```text
WhatsApp --> Kapso --> Agent (webhook + reglas de conversación)
                           |--> Perfil de restaurante
                           |--> Backend Central aislado
                           |--> Sesiones firmadas del menú
Cliente --> Next.js Menu --> Backend Central aislado
```

El repositorio define configuración, adaptadores y límites de confianza, pero no contiene datos de un cliente anterior ni de ningún otro cliente.

- Las credenciales son exclusivas de cada instalación.
- La web jamás puede recibir tokens de Central ni del agente.
- Central decide precios, promociones, comisiones, autorizaciones, pedidos y pagos.
- El backend valida un webhook autenticado antes de responder.
- No aceptar operaciones de pedido sin autenticación de sesión, cálculo autoritativo e idempotencia.
- La disponibilidad diaria no sustituye pausas operativas y cierres excepcionales.
- La plantilla es para despliegues aislados, no para que 20 restaurantes compartan tablas sin autorización.

Pendiente: integrar y verificar paridad con funcionalidades especializadas del agente un cliente anterior (reemplazos, QR, estados, alertas, concurrencia y HTTP 202) antes de afirmar que son soportadas aquí.
