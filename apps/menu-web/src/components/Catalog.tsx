'use client';

import { useMemo, useState } from 'react';
import type { MenuProduct } from '@/lib/server';

export function Catalog({ items, currency }: { items: MenuProduct[]; currency: string }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = [...new Set(items.map(item => item.category))];
  const visible = useMemo(() => items.filter(item =>
    (category === 'all' || item.category === category) &&
    (item.name + ' ' + (item.description ?? '')).toLocaleLowerCase().includes(search.toLocaleLowerCase())
  ), [items, search, category]);
  const money = (value: number) => {
    try { return new Intl.NumberFormat('es', { style: 'currency', currency }).format(value); }
    catch { return value.toFixed(2) + ' ' + currency; }
  };
  return <section>
    <label htmlFor="menu-search" style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>
      Buscar productos
    </label>
    <input id="menu-search" className="search" placeholder="Buscar en el menú"
      value={search} onChange={event => setSearch(event.target.value)} />
    <div className="tabs" role="group" aria-label="Filtrar por categoría">
      {['all', ...categories].map(item =>
        <button key={item} type="button" className={'tab ' + (category === item ? 'active' : '')}
          aria-pressed={category === item} onClick={() => setCategory(item)}>
          {item === 'all' ? 'Todos' : item}
        </button>)}
    </div>
    <div className="grid">
      {visible.map(item => <article key={item.id} className="card">
        <small className="muted">{item.category}</small>
        <h2 style={{margin:'8px 0'}}>{item.name}</h2>
        {item.description && <p className="muted">{item.description}</p>}
        <p className="price">{money(item.price)}</p>
        {!item.isAvailable && <p className="muted">No disponible</p>}
      </article>)}
    </div>
    {!visible.length && <p role="status">No encontramos productos con ese filtro.</p>}
  </section>;
}
