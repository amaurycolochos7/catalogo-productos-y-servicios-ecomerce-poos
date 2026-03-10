'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Producto, Categoria, ProductoImagen } from '@/lib/types';

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

    // Galería de imágenes
    const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([]);
    const [imagenesExistentes, setImagenesExistentes] = useState<ProductoImagen[]>([]);
    const [imagenesAEliminar, setImagenesAEliminar] = useState<ProductoImagen[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

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

    const abrirModal = async (producto?: Producto) => {
        if (producto) {
            setEditando(producto);
            setNombre(producto.nombre);
            setDescripcion(producto.descripcion || '');
            setPrecio(producto.precio.toString());
            setStock(producto.stock.toString());
            setCategoriaId(producto.categoria_id || '');
            setDestacado(producto.destacado);
            setActivo(producto.activo);

            // Cargar imágenes existentes de la galería
            const { data } = await supabase
                .from('producto_imagenes')
                .select('*')
                .eq('producto_id', producto.id)
                .order('orden');
            setImagenesExistentes((data as ProductoImagen[]) || []);
        } else {
            setEditando(null);
            setNombre('');
            setDescripcion('');
            setPrecio('');
            setStock('');
            setCategoriaId('');
            setDestacado(false);
            setActivo(true);
            setImagenesExistentes([]);
        }
        setNuevasImagenes([]);
        setPreviews([]);
        setImagenesAEliminar([]);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setEditando(null);
    };

    const handleAgregarImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setNuevasImagenes(prev => [...prev, ...files]);

        // Crear previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
    };

    const eliminarNuevaImagen = (index: number) => {
        setNuevasImagenes(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const marcarParaEliminar = (imagen: ProductoImagen) => {
        setImagenesAEliminar(prev => [...prev, imagen]);
        setImagenesExistentes(prev => prev.filter(img => img.id !== imagen.id));
    };

    const subirImagen = async (file: File): Promise<string> => {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
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
            // 1. Eliminar imágenes marcadas
            for (const img of imagenesAEliminar) {
                // Eliminar del storage
                const path = img.imagen_url.split('/productos/')[1];
                if (path) {
                    await supabase.storage.from('productos').remove([path]);
                }
                // Eliminar del DB
                await supabase.from('producto_imagenes').delete().eq('id', img.id);
            }

            // 2. Subir nuevas imágenes
            const nuevasUrls: string[] = [];
            for (const file of nuevasImagenes) {
                const url = await subirImagen(file);
                nuevasUrls.push(url);
            }

            // 3. Determinar imagen principal (primera imagen existente o primera nueva)
            const todasLasImagenes = [
                ...imagenesExistentes.map(img => img.imagen_url),
                ...nuevasUrls
            ];
            const imagenPrincipal = todasLasImagenes[0] || null;

            // 4. Guardar producto
            const datos = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria_id: categoriaId || null,
                destacado,
                activo,
                imagen_url: imagenPrincipal,
            };

            let productoId = editando?.id;

            if (editando) {
                await supabase.from('productos').update(datos).eq('id', editando.id);
            } else {
                const { data } = await supabase.from('productos').insert(datos).select('id').single();
                productoId = data?.id;
            }

            // 5. Insertar nuevas imágenes en producto_imagenes
            if (productoId && nuevasUrls.length > 0) {
                const maxOrden = imagenesExistentes.length;
                const registros = nuevasUrls.map((url, i) => ({
                    producto_id: productoId,
                    imagen_url: url,
                    orden: maxOrden + i,
                }));
                await supabase.from('producto_imagenes').insert(registros);
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

        // Eliminar imágenes del storage
        const { data: imagenes } = await supabase
            .from('producto_imagenes')
            .select('imagen_url')
            .eq('producto_id', id);

        if (imagenes) {
            const paths = imagenes
                .map(img => img.imagen_url.split('/productos/')[1])
                .filter(Boolean);
            if (paths.length > 0) {
                await supabase.storage.from('productos').remove(paths);
            }
        }

        await supabase.from('productos').delete().eq('id', id);
        cargarDatos();
    };

    const totalImagenes = imagenesExistentes.length + nuevasImagenes.length;

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

                            {/* Galería de imágenes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fotos del producto
                                    <span className="text-xs text-gray-400 ml-2">({totalImagenes} {totalImagenes === 1 ? 'foto' : 'fotos'})</span>
                                </label>

                                <div className="grid grid-cols-4 gap-2">
                                    {/* Imágenes existentes */}
                                    {imagenesExistentes.map((img) => (
                                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={img.imagen_url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => marcarParaEliminar(img)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            {imagenesExistentes.indexOf(img) === 0 && imagenesAEliminar.length === 0 && (
                                                <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">Principal</span>
                                            )}
                                        </div>
                                    ))}

                                    {/* Previews de nuevas imágenes */}
                                    {previews.map((src, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-amber-200 group">
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => eliminarNuevaImagen(i)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <span className="absolute bottom-1 right-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">Nueva</span>
                                        </div>
                                    ))}

                                    {/* Botón agregar */}
                                    <label className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-400 cursor-pointer transition-colors bg-gray-50 hover:bg-amber-50">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[10px] text-gray-400 mt-1">Agregar</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAgregarImagenes}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <p className="text-[11px] text-gray-400 mt-2">
                                    La primera foto será la imagen principal del producto. Pasa el cursor sobre una foto para eliminarla.
                                </p>
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
