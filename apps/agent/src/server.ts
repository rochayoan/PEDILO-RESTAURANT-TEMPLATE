import { createServer } from 'node:http';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { loadRestaurantConfig } from '@pedilo/config';
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const { menuSessionRoute } = await import('./routes.ts');

const restaurant = loadRestaurantConfig();
const port = Number(process.env.AGENT_PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid_port');

createServer(async (request, response) => {
  if (await menuSessionRoute(request, response)) return;
  if (request.url === '/health' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ status: 'ok', restaurantId: restaurant.id }));
    return;
  }
  response.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  response.end(JSON.stringify({ error: 'whatsapp_not_configured' }));
}).listen(port, () => console.log('Pedilo agent started on port', port));
