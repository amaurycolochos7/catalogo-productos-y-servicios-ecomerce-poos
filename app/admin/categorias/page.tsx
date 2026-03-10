'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Categoria } from '@/lib/types';

export default function AdminCategorias() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Categoria | null>(null);
    const [guardando, setGuardando] = useState(false);

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [orden, setOrden] = useState('0');

    const supabase = createClient();

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        const { data } = await supabase.from('categorias').select('*').order('orden');
        setCategorias((data as Categoria[]) || []);
        setCargando(false);
    }, [supabase]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const abrirModal = (cat?: Categoria) => {
        if (cat) {
            setEditando(cat);
            setNombre(cat.nombre);
            setDescripcion(cat.descripcion || '');
            setOrden(cat.orden.toString());
        } else {
            setEditando(null);
            setNombre('');
            setDescripcion('');
            setOrden('0');
        }
        setModalAbierto(true);
    };

    const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const datos = { nombre, descripcion, orden: parseInt(orden) };
            if (editando) {
                await supabase.from('categorias').update(datos).eq('id', editando.id);
            } else {
                await supabase.from('categorias').insert(datos);
            }
            cerrarModal();
            cargarDatos();
        } catch { alert('Error al guardar'); }
        finally { setGuardando(false); }
    };

    const eliminar = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;
        await supabase.from('categorias').delete().eq('id', id);
        cargarDatos();
    };

    if (cargando) {
        return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
                    <p className="text-sm text-gray-500">{categorias.length} categorías</p>
                </div>
                <button onClick={() => abrirModal()} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nueva Categoría
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-800">{cat.nombre}</h3>
                                {cat.descripcion && <p className="text-sm text-gray-500 mt-1">{cat.descripcion}</p>}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Orden: {cat.orden}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => abrirModal(cat)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">Editar</button>
                            <button onClick={() => eliminar(cat.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium">Eliminar</button>
                        </div>
                    </div>
                ))}
                {categorias.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">No hay categorías. Crea la primera.</div>
                )}
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">{editando ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                            <button onClick={cerrarModal} className="p-2 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                                <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={cerrarModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                                <button type="submit" disabled={guardando} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors disabled:opacity-50">{guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
