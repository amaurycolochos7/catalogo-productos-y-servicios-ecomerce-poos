import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const esRutaAdmin = request.nextUrl.pathname.startsWith('/admin');
    const esRutaLogin = request.nextUrl.pathname.startsWith('/admin/login');

    // Verificar expiración de sesión de 24 horas en rutas admin
    if (user && esRutaAdmin && !esRutaLogin) {
        const loginTimeCookie = request.cookies.get('admin_login_time')?.value;
        let sesionExpirada = false;

        if (!loginTimeCookie) {
            // No tiene cookie de tiempo → sesión antigua, forzar logout
            sesionExpirada = true;
        } else {
            const loginTime = new Date(loginTimeCookie).getTime();
            const ahora = Date.now();
            const VEINTICUATRO_HORAS = 24 * 60 * 60 * 1000;
            if (ahora - loginTime > VEINTICUATRO_HORAS) {
                sesionExpirada = true;
            }
        }

        if (sesionExpirada) {
            await supabase.auth.signOut();
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            const response = NextResponse.redirect(url);
            // Eliminar cookie de tiempo de login
            response.cookies.set('admin_login_time', '', { path: '/', maxAge: 0 });
            return response;
        }
    }

    // Proteger rutas admin (excepto login)
    if (!user && esRutaAdmin && !esRutaLogin) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
    }

    // Si ya está logueado y va a login, redirigir a admin
    if (user && esRutaLogin) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
