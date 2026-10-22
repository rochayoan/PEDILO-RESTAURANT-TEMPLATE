#!/usr/bin/env node
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf('--' + name);
  return index < 0 ? '' : (args[index + 1] ?? '').trim();
}
const name = option('name');
const slug = option('slug');
const timezone = option('timezone') || 'America/La_Paz';
const currency = option('currency') || 'BOB';
if (!name || name.length > 90 || /[\r\n]/.test(name) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Uso: npm run setup -- --name "Mi Restaurante" --slug mi-restaurante [--timezone America/La_Paz] [--currency BOB]');
  process.exit(1);
}
try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
catch { throw new Error('invalid_timezone'); }
const path = resolve(process.cwd(), '.env');
try {
  await access(path);
  throw new Error('.env ya existe. No sobrescribir credenciales de otro restaurante.');
} catch (err) {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
    // Safe to create a new file.
  } else { throw err; }
}
let template = await readFile(resolve(process.cwd(), '.env.example'), 'utf8');
const changes = {
  RESTAURANT_ID: slug,
  RESTAURANT_NAME: name,
  RESTAURANT_DESCRIPTION: 'Descripción pendiente de completar',
  RESTAURANT_TIME_ZONE: timezone,
  RESTAURANT_CURRENCY: currency,
  NEXT_PUBLIC_RESTAURANT_NAME: name,
};
for (const [key, value] of Object.entries(changes)) {
  const line = new RegExp('^' + key + '=.*$', 'm');
  if (!line.test(template)) throw new Error('missing_template_key:' + key);
  template = template.replace(line, key + '=' + JSON.stringify(value));
}
await writeFile(path, template, { flag: 'wx', mode: 0o600 });
console.log('Configuración local creada. Completá los secretos, la descripción comercial y los servicios antes de desplegar.');
