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
    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [imagenPreview, setImagenPreview] = useState<string | null>(null);

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
            setImagenPreview(cat.imagen_url || null);
        } else {
            setEditando(null);
            setNombre('');
            setDescripcion('');
            setOrden('0');
            setImagenPreview(null);
        }
        setImagenFile(null);
        setModalAbierto(true);
    };

    const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImagenFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagenPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const subirImagen = async (file: File): Promise<string> => {
        const ext = file.name.split('.').pop();
        const fileName = `cat_${Date.now()}.${ext}`;
        const { error } = await supabase.storage
            .from('categorias')
            .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('categorias')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    };

    const eliminarImagenExistente = () => {
        setImagenPreview(null);
        setImagenFile(null);
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            let imagenUrl = editando?.imagen_url || null;

            // Si se eliminó la imagen
            if (!imagenPreview && !imagenFile) {
                imagenUrl = null;
            }

            // Si se seleccionó nueva imagen
            if (imagenFile) {
                imagenUrl = await subirImagen(imagenFile);
            }

            const datos = { nombre, descripcion, orden: parseInt(orden), imagen_url: imagenUrl };
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
                            <div className="flex items-center gap-3">
                                {cat.imagen_url ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-amber-600 font-bold text-lg">{cat.nombre.charAt(0)}</span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-800">{cat.nombre}</h3>
                                    {cat.descripcion && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{cat.descripcion}</p>}
                                </div>
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
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
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

                            {/* Imagen de categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de categoría</label>
                                {imagenPreview ? (
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                        <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={eliminarImagenExistente}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-400 cursor-pointer transition-colors bg-gray-50 hover:bg-amber-50">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[10px] text-gray-400 mt-1">Subir</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImagenChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
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
