'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Producto, Categoria } from '@/lib/types';

export default function AdminProductos() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Producto | null>(null);
    const [guardando, setGuardando] = useState(false);

    // Form state
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [destacado, setDestacado] = useState(false);
    const [activo, setActivo] = useState(true);
    const [imagenFile, setImagenFile] = useState<File | null>(null);

    const supabase = createClient();

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        const [prodRes, catRes] = await Promise.all([
            supabase.from('productos').select('*, categorias(nombre)').order('created_at', { ascending: false }),
            supabase.from('categorias').select('*').order('orden'),
        ]);
        setProductos((prodRes.data as Producto[]) || []);
        setCategorias((catRes.data as Categoria[]) || []);
        setCargando(false);
    }, [supabase]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const abrirModal = (producto?: Producto) => {
        if (producto) {
            setEditando(producto);
            setNombre(producto.nombre);
            setDescripcion(producto.descripcion || '');
            setPrecio(producto.precio.toString());
            setStock(producto.stock.toString());
            setCategoriaId(producto.categoria_id || '');
            setDestacado(producto.destacado);
            setActivo(producto.activo);
        } else {
            setEditando(null);
            setNombre('');
            setDescripcion('');
            setPrecio('');
            setStock('');
            setCategoriaId('');
            setDestacado(false);
            setActivo(true);
        }
        setImagenFile(null);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setEditando(null);
    };

    const subirImagen = async (file: File): Promise<string> => {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error } = await supabase.storage
            .from('productos')
            .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('productos')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    };

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);

        try {
            let imagenUrl = editando?.imagen_url || null;

            if (imagenFile) {
                imagenUrl = await subirImagen(imagenFile);
            }

            const datos = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria_id: categoriaId || null,
                destacado,
                activo,
                imagen_url: imagenUrl,
            };

            if (editando) {
                await supabase.from('productos').update(datos).eq('id', editando.id);
            } else {
                await supabase.from('productos').insert(datos);
            }

            cerrarModal();
            cargarDatos();
        } catch (err) {
            console.error('Error al guardar:', err);
            alert('Error al guardar el producto');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        await supabase.from('productos').delete().eq('id', id);
        cargarDatos();
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Productos</h2>
                    <p className="text-sm text-gray-500">{productos.length} productos en total</p>
                </div>
                <button
                    onClick={() => abrirModal()}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Producto</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Categoría</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Precio</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Stock</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Estado</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((prod) => (
                                <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {prod.imagen_url ? (
                                                    <img src={prod.imagen_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{prod.nombre}</p>
                                                {prod.destacado && <span className="text-xs text-amber-500">Destacado</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                                        {(prod.categorias as unknown as { nombre: string })?.nombre || '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                                        ${prod.precio.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-500 hidden sm:table-cell">{prod.stock}</td>
                                    <td className="py-3 px-4 text-center hidden md:table-cell">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prod.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {prod.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => abrirModal(prod)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => eliminar(prod.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {productos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        No hay productos. Crea tu primer producto.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editando ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                            <button onClick={cerrarModal} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                                    placeholder="Nombre del producto"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none"
                                    placeholder="Descripción del producto"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                                >
                                    <option value="">Sin categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImagenFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-600 hover:file:bg-amber-100"
                                />
                                {editando?.imagen_url && !imagenFile && (
                                    <p className="text-xs text-gray-400 mt-1">Ya tiene imagen. Sube una nueva para reemplazarla.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={destacado}
                                        onChange={(e) => setDestacado(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Destacado</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activo}
                                        onChange={(e) => setActivo(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Activo</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
                                >
                                    {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
