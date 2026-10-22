import 'dotenv/config';
import { createServer } from 'node:http';
import { loadRestaurantConfig } from '@pedilo/config';

const restaurant = loadRestaurantConfig();
const port = Number(process.env.AGENT_PORT || 3000);
createServer((_request, response) => {
  response.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  response.end(JSON.stringify({ status: 'not_configured', restaurant: restaurant.id }));
}).listen(port, () => {
  console.log('Pedilo agent scaffold listening on', port);
});
