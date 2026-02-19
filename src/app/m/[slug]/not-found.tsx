'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChefHat, ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 font-sans">
            <div className="container mx-auto max-w-md text-center">
                {/* Decorative Icon */}
                <div className="mb-8 relative inline-block">
                    <div className="h-24 w-24 bg-[#EEDC82] rounded-full flex items-center justify-center shadow-2xl relative z-10 mx-auto">
                        <SearchX className="text-gray-900 h-10 w-10" />
                    </div>
                    <div className="absolute -top-4 -right-4 h-12 w-12 bg-white rounded-full shadow-lg border-2 border-[#EEDC82] flex items-center justify-center text-[#B8860B] animate-pulse">
                        <ChefHat className="h-6 w-6" />
                    </div>
                </div>

                <h1 className="font-serif text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    Restaurante no encontrado
                </h1>

                <p className="text-gray-600 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
                    Lo sentimos, <span className="font-bold text-gray-800 italic">no existen menús disponibles con ese código</span> en nuestra plataforma.
                </p>

                <div className="space-y-4">
                    <Link href="/" className="block">
                        <Button className="w-full bg-gray-900 hover:bg-black text-white h-14 text-lg font-bold rounded-2xl shadow-xl shadow-gray-900/10 transition-all active:scale-[0.98]">
                            Volver al inicio
                        </Button>
                    </Link>

                    <Link href="/register" className="block">
                        <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900 font-medium py-4">
                            ¿Eres dueño? Registra tu restaurante
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Subtle background branding */}
            <div className="absolute bottom-8 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] pointer-events-none">
                Daltri Menu • Premium Selection
            </div>
        </div>
    );
}
