/**
 * Genera URL de WhatsApp con mensaje automático
 * Formato: https://wa.me/NUMERO?text=MENSAJE
 */
export function generarUrlWhatsApp(
    telefono: string,
    nombreProducto?: string
): string {
    // Limpiar número (solo dígitos)
    const numero = telefono.replace(/\D/g, '');

    let mensaje: string;
    if (nombreProducto) {
        mensaje = `Hola, me interesa el producto: ${nombreProducto}`;
    } else {
        mensaje = 'Hola, me gustaría obtener más información sobre sus productos y servicios.';
    }

    const mensajeCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numero}?text=${mensajeCodificado}`;
}

/**
 * Genera URL de WhatsApp para servicios
 */
export function generarUrlWhatsAppServicio(
    telefono: string,
    nombreServicio: string
): string {
    const numero = telefono.replace(/\D/g, '');
    const mensaje = `Hola, me interesa el servicio: ${nombreServicio}`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    return `https://wa.me/${numero}?text=${mensajeCodificado}`;
}
