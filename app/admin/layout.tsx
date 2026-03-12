'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
    {
        href: '/admin',
        label: 'Dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        href: '/admin/productos',
        label: 'Productos',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        href: '/admin/categorias',
        label: 'Categorías',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
    },
    {
        href: '/admin/servicios',
        label: 'Servicios',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },
    {
        href: '/admin/configuracion',
        label: 'Personalización',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarAbierta, setSidebarAbierta] = useState(false);

    const handleLogout = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        // Eliminar cookie de tiempo de sesión
        document.cookie = 'admin_login_time=;path=/;max-age=0';
        router.push('/admin/login');
        router.refresh();
    }, [router]);

    // Verificar expiración de sesión cada 60 segundos
    useEffect(() => {
        if (pathname === '/admin/login') return;

        const verificarSesion = () => {
            const cookies = document.cookie.split(';').reduce((acc, c) => {
                const [key, val] = c.trim().split('=');
                acc[key] = val;
                return acc;
            }, {} as Record<string, string>);

            const loginTime = cookies['admin_login_time'];
            if (!loginTime) {
                handleLogout();
                return;
            }

            const transcurrido = Date.now() - new Date(loginTime).getTime();
            const VEINTICUATRO_HORAS = 24 * 60 * 60 * 1000;
            if (transcurrido > VEINTICUATRO_HORAS) {
                handleLogout();
            }
        };

        // Verificar al cargar
        verificarSesion();

        // Verificar cada 60 segundos
        const intervalo = setInterval(verificarSesion, 60 * 1000);
        return () => clearInterval(intervalo);
    }, [pathname, handleLogout]);

    // No mostrar sidebar en página de login
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Overlay móvil */}
            {sidebarAbierta && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarAbierta(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1a365d] text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarAbierta ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header sidebar */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold">
                            A
                        </div>
                        <div>
                            <h2 className="font-bold text-sm">Panel Admin</h2>
                            <p className="text-xs text-white/40">Gestión de Catálogo</p>
                        </div>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-3 space-y-1">
                    {menuItems.map((item) => {
                        const activo = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarAbierta(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activo
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer sidebar */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    <a
                        href="/"
                        target="_blank"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/5 hover:text-white/70 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver sitio
                    </a>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarAbierta(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">
                        {menuItems.find((i) => i.href === pathname)?.label || 'Admin'}
                    </h1>
                </header>

                {/* Página */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
