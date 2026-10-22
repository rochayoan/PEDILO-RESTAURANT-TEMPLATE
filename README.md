# PEDILO — Restaurant Template

Repositorio maestro **independiente** para crear instalaciones aisladas de restaurantes. No contiene código copiado en bloque, historial, bases de datos ni activos comerciales de ningún cliente.

> **Estado: base técnica en desarrollo, NO lista para producción.**
> La atención automática de WhatsApp y la creación/modificación de pedidos permanecen bloqueadas por diseño hasta integrar los flujos operativos verificados.

## Incluido
- **Perfil configurable:** nombre, horarios, zona horaria, moneda, servicios (delivery / retiro / salón), métodos de pago y colores.
- **Agente HTTP:** healthcheck y emisión/resolución de sesiones de menú cifradas, válidas 30 minutos y asociadas al restaurante.
- **Menú Next.js:** identidad configurable, catálogo real desde Backend Central, búsqueda y categorías dinámicas.
- **Seguridad:** autenticación entre servicios; tokens del navegador cifrados (el teléfono no aparece en claro); secretos fuera de código público; catálogo sin credenciales en el cliente.
- **Automatización de onboarding:** script para generar .env sin sobrescribir instalaciones existentes, validador y pruebas unitarias.
- **CI:** pruebas y comprobaciones de compilación en GitHub Actions.

## Crear un restaurante
1. Usar GitHub **Use this template** (después de activar Template Repository en Settings) para generar un repositorio **privado** para el cliente.
2. Clonar el repositorio nuevo y ejecutar:

\`\`\`bash
npm install
npm run setup -- --name "Nombre del Restaurante" --slug nombre-restaurante
\`\`\`

3. Editar \`.env\` con datos **reales** de la marca y claves exclusivamente de ese restaurante. Revisar horario, zona horaria, pagos y servicios.
4. Configurar una instancia propia de Backend Central, credenciales Kapso y dominio del menú. El logo genérico está en \`apps/menu-web/public/brand/logo.svg\`.
5. Ejecutar:

\`\`\`bash
npm run validate
npm test
npm run build
npm run dev:agent
npm run dev:menu
\`\`\`

Agent: localhost:3000. Menú: localhost:3001.

## Contratos actuales
- Agente: \`GET /health\`; \`POST /internal/menu/sessions/issue\`; \`POST /internal/menu/sessions/resolve\`.
- Endpoints internos exigen \`Authorization: Bearer <AGENT_INTERNAL_TOKEN>\`.
- Menú: \`/menu?session=<token-cifrado>\`. La web verifica sesión con el agente y obtiene \`/products\`, \`/categories\` desde Central únicamente en servidor.
- \`RESTAURANT_ORDERING_ENABLED=false\` por defecto. **No hay checkout activo**; no simular que se crearon pedidos.

## Bloqueos para producción
Todavía falta integrar y probar: verificación del webhook Kapso con inbox durable/idempotente, agente conversacional y herramientas, carrito y checkout autoritativo, pagos QR/efectivo, cotización de entrega, promociones y modificadores, estados y reemplazos, seguimiento, errores HTTP 202, alertas Telegram, pruebas E2E móviles y despliegue seguro.

Estas funcionalidades no deben presentarse como operativas simplemente por existir en otro restaurante. Las APIs y contratos de Backend Central deben validarse por instalación.

Consulta [arquitectura](docs/architecture.md) y [onboarding](docs/onboarding.md).
