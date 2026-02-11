'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginMerchant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const [slug, setSlug] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const merchant = await loginMerchant(slug);
            // In a real app, we'd set a cookie/token here
            localStorage.setItem('merchant_id', merchant.id);
            localStorage.setItem('merchant_slug', merchant.slug);
            router.push('/dashboard');
        } catch (err) {
            setError('Comercio no encontrado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Inicia sesión en tu panel
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <Label htmlFor="slug">Código del Comercio</Label>
                        <Input
                            id="slug"
                            name="slug"
                            type="text"
                            required
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="ejemplo-comercio"
                            className="mt-2"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Entrar'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
