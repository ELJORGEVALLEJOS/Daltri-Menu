'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerMerchant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsapp_phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [registeredMerchant, setRegisteredMerchant] = useState<any>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cleanedData = {
                ...formData,
                whatsapp_phone: formData.whatsapp_phone.trim()
            };
            const result = await registerMerchant(cleanedData);
            setRegisteredMerchant(result);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error durante el registro');
        } finally {
            setLoading(false);
        }
    };

    if (success && registeredMerchant) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 font-sans">
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm w-full max-w-md text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <CheckCircle2 className="text-green-500 h-10 w-10" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">¡Registro Exitoso!</h1>
                    <p className="text-zinc-400">
                        Tu restaurante <strong>{registeredMerchant.name}</strong> ha sido creado.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Tu link público:</p>
                        <p className="text-amber-500 font-mono text-sm break-all">{registeredMerchant.share_link}</p>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <Link href={`/m/${registeredMerchant.slug}`}>
                            <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl">
                                Ir a mi Menú
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                                Volver al inicio
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 font-sans">
            <main className="flex w-full max-w-md flex-col space-y-8">
                <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Link>

                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <ChefHat className="text-black h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Registrar Restaurante</h1>
                            <p className="text-zinc-500 text-xs">Únete a Daltri Menu hoy</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-zinc-400 text-xs ml-1">Nombre del Restaurante</Label>
                            <Input
                                id="name"
                                required
                                placeholder="El palacio de la pizza"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-zinc-400 text-xs ml-1">Código Único (slug)</Label>
                            <Input
                                id="slug"
                                required
                                placeholder="palacio-pizzas"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl"
                            />
                            <p className="text-[10px] text-zinc-600 ml-1">Solo letras minúsculas y guiones.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="whatsapp" className="text-zinc-400 text-xs ml-1">Número de WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                required
                                placeholder="+5491112345678"
                                value={formData.whatsapp_phone}
                                onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-zinc-400 text-xs ml-1">Dirección (Opcional)</Label>
                            <Input
                                id="address"
                                placeholder="Calle 123, Ciudad"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl mt-4"
                        >
                            {loading ? 'Registrando...' : 'Crear mi Restaurante'}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
