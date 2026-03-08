'use client';

import { useState } from 'react';
import { registerMerchant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

type RegisteredMerchant = {
    name: string;
    slug: string;
    share_link: string;
    verification_required?: boolean;
    email_sent?: boolean;
    preview_url?: string;
};

function slugifyRestaurantName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
        .slice(0, 60);
}

function buildSlugSuggestions(name: string) {
    const baseSlug = slugifyRestaurantName(name);
    if (!baseSlug) {
        return [];
    }

    const suggestions = [
        baseSlug,
        `${baseSlug}-menu`,
        `${baseSlug}-oficial`,
    ];

    return Array.from(new Set(suggestions)).slice(0, 3);
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsapp_phone: '',
        address: '',
        owner_full_name: '',
        admin_email: '',
        admin_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [slugWasEdited, setSlugWasEdited] = useState(false);
    const [errorSuggestedSlug, setErrorSuggestedSlug] = useState('');
    const [registeredMerchant, setRegisteredMerchant] = useState<RegisteredMerchant | null>(null);
    const slugSuggestions = buildSlugSuggestions(formData.name);
    const suggestedSlug = slugSuggestions[0] || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setErrorSuggestedSlug('');

        try {
            const result = await registerMerchant({
                name: formData.name,
                slug: formData.slug,
                whatsapp_phone: formData.whatsapp_phone.trim(),
                address: formData.address.trim() || undefined,
                admin_email: formData.admin_email.trim().toLowerCase(),
                admin_password: formData.admin_password,
                admin_full_name: formData.owner_full_name.trim(),
            });
            setRegisteredMerchant(result as RegisteredMerchant);
            setSuccess(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ocurrio un error durante el registro';
            setError(message);
            const suggestedSlugFromMessage = message.match(/"([^"]+)"/)?.[1] || '';
            setErrorSuggestedSlug(suggestedSlugFromMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (value: string) => {
        const normalizedName = value;
        const nextSuggestedSlug = slugifyRestaurantName(normalizedName);

        setFormData((current) => ({
            ...current,
            name: normalizedName,
            slug: slugWasEdited ? current.slug : nextSuggestedSlug,
        }));
    };

    const handleSlugChange = (value: string) => {
        setSlugWasEdited(true);
        setFormData((current) => ({
            ...current,
            slug: slugifyRestaurantName(value),
        }));
    };

    const applySuggestedSlug = (value: string) => {
        setSlugWasEdited(true);
        setFormData((current) => ({
            ...current,
            slug: value,
        }));
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
                    <h1 className="text-2xl font-bold text-white">Registro exitoso</h1>
                    <p className="text-zinc-400">
                        Tu restaurante <strong>{registeredMerchant.name}</strong> ha sido creado.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Tu link publico:</p>
                        <p className="text-amber-500 font-mono text-sm break-all">{registeredMerchant.share_link}</p>
                    </div>

                    {registeredMerchant.verification_required ? (
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                            {(() => {
                                const hasPreviewUrl = Boolean(registeredMerchant.preview_url);
                                const verificationMessage = registeredMerchant.email_sent
                                    ? 'Revisa tu correo y verifica tu cuenta antes de entrar al panel de administracion.'
                                    : hasPreviewUrl
                                        ? 'No se pudo enviar el correo automatico. Usa este enlace para verificar tu cuenta.'
                                        : 'No se pudo enviar el correo de verificacion. Reenviarlo desde login o contacta soporte.';

                                return (
                                    <p className="text-xs text-blue-400 font-medium">
                                        {verificationMessage}
                                    </p>
                                );
                            })()}
                            {registeredMerchant.preview_url && (
                                <div className="space-y-2">
                                    <a
                                        href={registeredMerchant.preview_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-lg border border-blue-400/40 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-400/20"
                                    >
                                        Abrir enlace de verificacion
                                    </a>
                                    <p className="text-[11px] text-blue-300 break-all">
                                        {registeredMerchant.preview_url}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 font-medium">
                                Tu cuenta quedo activa. Puedes entrar al panel con tu email y contrasena.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <Link href="/login">
                            <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl">
                                Ir a mi panel
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 font-sans">
            <main className="flex w-full max-w-md flex-col space-y-8 py-10">
                <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Link>

                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <BrandMark size={48} className="h-12 w-12" />
                        <div>
                            <h1 className="text-xl font-bold text-white">Registrar restaurante</h1>
                            <p className="text-zinc-500 text-xs text-balance">Crea tu cuenta y empieza a vender</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-zinc-400 text-xs ml-1">Nombre del restaurante</Label>
                            <Input
                                id="name"
                                required
                                placeholder="El palacio de la pizza"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="slug" className="text-zinc-400 text-xs ml-1">Enlace publico de tu menu</Label>
                                <Input
                                    id="slug"
                                    required
                                    placeholder="se genera automaticamente"
                                    value={formData.slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                                />
                                <div className="space-y-2 pt-1">
                                    <p className="text-[11px] text-zinc-500">
                                        Se genera desde el nombre del restaurante. Puedes cambiarlo si quieres.
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                        URL publica: <span className="font-mono text-zinc-300">menu.daltrishop.com/m/{formData.slug || 'tu-menu'}</span>
                                    </p>
                                    {suggestedSlug && formData.slug !== suggestedSlug && (
                                        <p className="text-[11px] text-amber-400">
                                            Sugerencia principal: <button type="button" className="underline underline-offset-2" onClick={() => applySuggestedSlug(suggestedSlug)}>{suggestedSlug}</button>
                                        </p>
                                    )}
                                    {slugSuggestions.length > 1 && (
                                        <div className="flex flex-wrap gap-2">
                                            {slugSuggestions
                                                .filter((option) => option !== formData.slug)
                                                .map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => applySuggestedSlug(option)}
                                                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10"
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="whatsapp" className="text-zinc-400 text-xs ml-1">WhatsApp</Label>
                                <Input
                                    id="whatsapp"
                                    required
                                    placeholder="+54911..."
                                    value={formData.whatsapp_phone}
                                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                    className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="owner_full_name" className="text-zinc-400 text-xs ml-1">Nombre del dueno</Label>
                            <Input
                                id="owner_full_name"
                                required
                                placeholder="Juan Perez"
                                value={formData.owner_full_name}
                                onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="admin_email" className="text-zinc-400 text-xs ml-1">Email de acceso</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                required
                                placeholder="dueno@tucomercio.com"
                                value={formData.admin_email}
                                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="admin_password" className="text-zinc-400 text-xs ml-1">Contrasena (min. 6)</Label>
                            <Input
                                id="admin_password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="********"
                                value={formData.admin_password}
                                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-zinc-400 text-xs ml-1">Direccion (opcional)</Label>
                            <Input
                                id="address"
                                placeholder="Calle 123, Ciudad"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:ring-amber-500/50"
                            />
                        </div>

                        {error && (
                            <div className="space-y-3 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs">
                                <p>{error}</p>
                                {errorSuggestedSlug && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => applySuggestedSlug(errorSuggestedSlug)}
                                        className="h-9 border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                                    >
                                        Usar sugerencia: {errorSuggestedSlug}
                                    </Button>
                                )}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl mt-4 shadow-lg shadow-white/5 active:scale-[0.98] transition-all"
                        >
                            {loading ? 'Creando cuenta...' : 'Crear mi restaurante'}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
