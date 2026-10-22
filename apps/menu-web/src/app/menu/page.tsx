import { Catalog } from '@/components/Catalog';
import { loadCatalog, resolveSession } from '@/lib/server';

export const dynamic = 'force-dynamic';

export default async function MenuPage({
  searchParams,
}: { searchParams: Promise<{ session?: string | string[] }> }) {
  const query = await searchParams;
  const token = typeof query.session === 'string' ? query.session : '';
  if (!token) {
    return <main className="wrap"><div className="notice">
      Para consultar el menú, abrí el enlace que recibiste por WhatsApp.
    </div></main>;
  }

  try {
    const session = await resolveSession(token);
    if (!session) {
      return <main className="wrap"><div className="notice" role="status">
        El enlace del menú venció o no es válido. Solicitá otro por WhatsApp.
      </div></main>;
    }
    const items = await loadCatalog();
    const currency = process.env.RESTAURANT_CURRENCY || 'BOB';
    return <main className="wrap">
      <p className="notice" role="status">
        Catálogo de consulta. El checkout permanece desactivado hasta validar
        pagos, entrega e idempotencia con Backend Central.
      </p>
      <Catalog items={items} currency={currency} />
    </main>;
  } catch {
    return <main className="wrap"><div className="notice" role="alert">
      No pudimos recuperar el menú en este momento. Intentá nuevamente más tarde.
    </div></main>;
  }
}
