'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Producto, Configuracion } from '@/lib/types';
import { useCart } from './CartContext';

interface Props {
    producto: Producto;
    whatsapp: string;
    config?: Configuracion | null;
}

export default function ProductCard({ producto, whatsapp, config }: Props) {
    const { addItem, openCart } = useCart();
    const [agregado, setAgregado] = useState(false);

    const enStock = producto.stock > 0;
    const colorAccento = config?.color_acento || '#e8a020';
    const colorPrimario = config?.color_primario || '#1a365d';
    const productUrl = `/producto/${producto.slug || producto.id}`;
    const numero = (whatsapp || '').replace(/\D/g, '');
    const mensajeWa = encodeURIComponent(`Hola, me interesa: ${producto.nombre}`);

    const handleAgregar = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(producto);
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1200);
        openCart();
    };

    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 group flex flex-col">
            {/* Área clickeable: imagen + info */}
            <Link href={productUrl} className="flex flex-col flex-1">
                {/* Imagen */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {producto.imagen_url ? (
                        <Image
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            quality={70}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {producto.precio_descuento != null && (
                            <span className="w-11 h-11 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-lg animate-pulse" style={{ lineHeight: '1.1' }}>
                                ¡Oferta!
                            </span>
                        )}
                        {producto.destacado && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: colorAccento }}>
                                Destacado
                            </span>
                        )}
                    </div>

                    {/* Botón rápido agregar al carrito */}
                    {enStock && (
                        <button
                            onClick={handleAgregar}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${agregado
                                ? 'bg-green-500 scale-110'
                                : 'bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 hover:scale-110'
                                }`}
                            title="Agregar al carrito"
                        >
                            {agregado ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" style={{ color: colorPrimario }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: colorPrimario }}>
                        {producto.nombre}
                    </h3>

                    {producto.precio_descuento != null ? (
                        <div className="mb-2">
                            <p className="text-lg font-bold" style={{ color: '#dc2626' }}>
                                ${producto.precio_descuento.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                                ${producto.precio.toFixed(2)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg font-bold mb-2" style={{ color: colorAccento }}>
                            ${producto.precio.toFixed(2)}
                        </p>
                    )}

                    {/* Stock */}
                    <div className="flex items-center gap-1.5 mb-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${enStock ? 'bg-green-500' : 'bg-red-400'}`} />
                        <span className="text-[11px] text-gray-400">
                            {enStock ? `En Stock: ${producto.stock}` : 'Agotado'}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Botones (fuera del Link para que funcionen independientemente) */}
            {enStock && (
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                    <a
                        href={`https://wa.me/${numero}?text=${mensajeWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        Comprar ahora
                    </a>
                    <button
                        onClick={handleAgregar}
                        className={`text-center py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${agregado
                            ? 'bg-green-500 text-white scale-[1.02]'
                            : 'text-white hover:opacity-90'
                            }`}
                        style={!agregado ? { backgroundColor: colorAccento } : {}}
                    >
                        {agregado ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                ¡Agregado!
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                                Agregar al Carrito
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
