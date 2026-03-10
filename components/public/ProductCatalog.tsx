'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import type { Producto, Categoria, Configuracion } from '@/lib/types';

interface Props {
    productos: Producto[];
    categorias: Categoria[];
    whatsapp: string;
    config: Configuracion | null;
}

export default function ProductCatalog({ productos, categorias, whatsapp, config }: Props) {
    const [filtro, setFiltro] = useState('todos');

    const titulo = config?.texto_catalogo_titulo || 'Nuestro Catálogo Destacado';
    const subtitulo = config?.texto_catalogo_subtitulo || 'Los mejores productos para ti';
    const colorPrimario = config?.color_primario || '#1a365d';
    const colorAccento = config?.color_acento || '#e8a020';

    const productosFiltrados = filtro === 'todos'
        ? productos
        : productos.filter((p) => p.categoria_id === filtro);

    return (
        <section id="catalogo" className="py-14 md:py-20" style={{ backgroundColor: `${config?.color_fondo || '#faf5eb'}50` }}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: colorPrimario }}>
                        {titulo}
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto">{subtitulo}</p>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    <button
                        onClick={() => setFiltro('todos')}
                        className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                        style={filtro === 'todos'
                            ? { backgroundColor: colorPrimario, color: '#fff' }
                            : { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' }
                        }
                    >
                        Todos
                    </button>
                    {categorias.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFiltro(cat.id)}
                            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                            style={filtro === cat.id
                                ? { backgroundColor: colorPrimario, color: '#fff' }
                                : { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' }
                            }
                        >
                            {cat.nombre}
                        </button>
                    ))}
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                    {productosFiltrados.map((producto) => (
                        <ProductCard key={producto.id} producto={producto} whatsapp={whatsapp} config={config} />
                    ))}
                </div>

                {productosFiltrados.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">No hay productos en esta categoría</p>
                    </div>
                )}
            </div>
        </section>
    );
}
