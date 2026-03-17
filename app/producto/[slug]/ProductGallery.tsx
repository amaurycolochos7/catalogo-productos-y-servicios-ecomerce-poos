'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
    imagenes: string[];
    nombre: string;
    destacado: boolean;
    enStock: boolean;
}

export default function ProductGallery({ imagenes, nombre, destacado, enStock }: Props) {
    const [imagenActiva, setImagenActiva] = useState(0);

    if (imagenes.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* Imagen principal */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                <Image
                    src={imagenes[imagenActiva]}
                    alt={`${nombre} - Foto ${imagenActiva + 1}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority
                />

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {destacado && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Destacado
                        </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {enStock ? 'Disponible' : 'Agotado'}
                    </span>
                </div>

                {/* Contador de fotos */}
                {imagenes.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {imagenActiva + 1} / {imagenes.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {imagenes.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {imagenes.map((src, i) => (
                        <button
                            key={i}
                            onClick={() => setImagenActiva(i)}
                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === imagenActiva
                                ? 'border-amber-500 ring-2 ring-amber-200 scale-105'
                                : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <Image
                                src={src}
                                alt={`${nombre} - Miniatura ${i + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
