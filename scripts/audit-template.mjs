import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const excluded = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.vercel']);
const allowed = /\.(ts|tsx|js|mjs|json|md|sql|yml|yaml|css|html|svg|example)$/;
const forbidden = [
  { name: 'client_brand', re: /don[\s_-]*zarco|trancapecho|trancaburguer|salchipapa|hipermaxi/i },
  { name: 'api_secret', re: /sk-proj-[a-z0-9_-]{20,}|ghp_[a-zA-Z0-9]{30,}|AIza[a-zA-Z0-9_-]{30,}/ },
  { name: 'private_key', re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: 'database_credentials', re: /postgres(?:ql)?:\/\/[^"' \s:]+:[^"' \s@]+@/i },
];
const issues = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) await walk(path);
      continue;
    }
    if (!entry.isFile() || !allowed.test(entry.name) || path.endsWith('audit-template.mjs')) continue;
    const content = await readFile(path, 'utf8');
    for (const rule of forbidden) {
      if (rule.re.test(content)) issues.push({ file: path, rule: rule.name });
    }
  }
}
await walk(process.cwd());
if (issues.length) {
  for (const issue of issues) console.error(issue.rule + ': ' + issue.file);
  process.exitCode = 1;
} else {
  console.log('Auditoría estática de marcas y secretos conocidos: OK');
}
