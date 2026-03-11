import { NextRequest, NextResponse } from 'next/server';

/**
 * API que resuelve URLs cortas de Google Maps (maps.app.goo.gl/...)
 * siguiendo los redirects y extrayendo coordenadas para generar un embed URL.
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    try {
        // Seguir redirects para obtener la URL final
        const response = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const finalUrl = response.url;

        // Intentar extraer coordenadas (@lat,lng)
        const coordMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
            const embedUrl = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=16`;
            return NextResponse.json({ embedUrl });
        }

        // Intentar extraer place name del path
        const placeMatch = finalUrl.match(/\/place\/([^/@]+)/);
        if (placeMatch) {
            const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
            const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed&z=16`;
            return NextResponse.json({ embedUrl });
        }

        // Fallback: usar la URL final como query
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(finalUrl)}&output=embed`;
        return NextResponse.json({ embedUrl });
    } catch {
        return NextResponse.json({ error: 'Could not resolve URL' }, { status: 500 });
    }
}
