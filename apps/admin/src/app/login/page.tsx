'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginMerchant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await loginMerchant(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB] px-4 py-12 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-md space-y-10 bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-[#C5A059] rounded-3xl flex items-center justify-center shadow-lg shadow-[#C5A059]/30 mb-6 rotate-3">
                        <ChefHat className="text-white h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-900 leading-tight">
                        Bienvenido de nuevo
                    </h2>
                    <p className="mt-2 text-gray-500 text-sm">Administra tu menú con estilo</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div className="relative">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email del Dueño</Label>
                            <div className="mt-1 relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#C5A059] text-gray-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="dueno@tucomercio.com"
                                    className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Contraseña</Label>
                            <div className="mt-1 relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#C5A059] text-gray-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium text-gray-900 placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-14 bg-[#C5A059] hover:bg-[#B48F4D] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#C5A059]/20 transition-all active:scale-[0.98] disabled:opacity-50" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
                    </Button>

                    <p className="text-center text-xs text-gray-400">
                        Daltri Menu • Premium Selection
                    </p>
                </form>
            </div>
        </div>
    );
}
