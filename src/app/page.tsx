'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

export default function Home() {
  const [slug, setSlug] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setLoading(true);
    router.push(`/m/${slug}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-sans text-white p-6">
      <main className="flex w-full max-w-md flex-col items-center text-center space-y-8">
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm w-full">
          <div className="flex justify-center mb-6">
            <BrandMark size={72} className="h-[72px] w-[72px] transition-transform hover:scale-105" priority />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            Daltri Menu
          </h1>
          <p className="text-zinc-400 mb-8 text-sm">
            Ingresa el código de un restaurante para ver su menú.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Código del Restaurante (ej. 'demo')"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 h-12 rounded-xl focus:ring-amber-500 focus:border-amber-500 pl-4 pr-12 transition-all"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !slug}
              className="h-12 w-full rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group"
            >
              {loading ? 'Cargando...' : 'Ver Menú'}
              {!loading && <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-zinc-600">
            <p>© 2026 Daltri Menu. Todos los derechos reservados.</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-xs h-10 rounded-xl">
                Entrar a mi restaurante
              </Button>
            </Link>
            <Link href="/register" className="block text-center text-amber-500/80 hover:text-amber-500 text-xs font-medium hover:underline transition-all py-2">
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
