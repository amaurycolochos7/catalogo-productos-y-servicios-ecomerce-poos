'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Servicio } from '@/lib/types';

export default function AdminServicios() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Servicio | null>(null);
    const [guardando, setGuardando] = useState(false);

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [activo, setActivo] = useState(true);

    const supabase = createClient();

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        const { data } = await supabase.from('servicios').select('*').order('created_at', { ascending: false });
        setServicios((data as Servicio[]) || []);
        setCargando(false);
    }, [supabase]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const abrirModal = (serv?: Servicio) => {
        if (serv) {
            setEditando(serv);
            setNombre(serv.nombre);
            setDescripcion(serv.descripcion || '');
            setPrecio(serv.precio.toString());
            setActivo(serv.activo);
        } else {
            setEditando(null);
            setNombre('');
            setDescripcion('');
            setPrecio('');
            setActivo(true);
        }
        setModalAbierto(true);
    };

    const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const datos = { nombre, descripcion, precio: parseFloat(precio), activo };
            if (editando) {
                await supabase.from('servicios').update(datos).eq('id', editando.id);
            } else {
                await supabase.from('servicios').insert(datos);
            }
            cerrarModal();
            cargarDatos();
        } catch { alert('Error al guardar'); }
        finally { setGuardando(false); }
    };

    const eliminar = async (id: string) => {
        if (!confirm('¿Eliminar este servicio?')) return;
        await supabase.from('servicios').delete().eq('id', id);
        cargarDatos();
    };

    if (cargando) {
        return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Servicios</h2>
                    <p className="text-sm text-gray-500">{servicios.length} servicios</p>
                </div>
                <button onClick={() => abrirModal()} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nuevo Servicio
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Servicio</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Precio</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Estado</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicios.map((serv) => (
                                <tr key={serv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-3 px-4">
                                        <p className="font-medium text-gray-800">{serv.nombre}</p>
                                        {serv.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{serv.descripcion}</p>}
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium text-gray-800">${serv.precio.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${serv.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{serv.activo ? 'Activo' : 'Inactivo'}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => abrirModal(serv)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Editar">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => eliminar(serv.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Eliminar">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {servicios.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400">No hay servicios. Crea el primero.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">{editando ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                            <button onClick={cerrarModal} className="p-2 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                                <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                                <span className="text-sm text-gray-700">Activo</span>
                            </label>
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
