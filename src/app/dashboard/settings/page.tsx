'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchRestaurant, updateMerchant, type MerchantShippingType } from '@/lib/admin-api';

const DEFAULT_THEME = {
    primary: '#c5a059',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#0f172a',
    buttonText: '#ffffff',
};

const DEFAULT_MENU_COPY = {
    heroTitle: 'Todo lo seleccionado',
    heroSubtitle: 'Autenticas comidas y bebidas francesas.',
    heroBadge: 'Depuis 1978',
};

type Merchant = {
    name?: string;
    slug?: string;
    whatsapp_phone?: string;
    logo_url?: string;
    cover_url?: string;
    shipping_type?: MerchantShippingType;
    shipping_cost_cents?: number;
    social_links?: {
        uber_eats?: string;
        google?: string;
        instagram?: string;
        facebook?: string;
        tiktok?: string;
    };
    theme_colors?: {
        primary?: string;
        background?: string;
        surface?: string;
        text?: string;
        button_text?: string;
    };
    menu_copy?: {
        hero_title?: string;
        hero_subtitle?: string;
        hero_badge?: string;
    };
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsappPhone: '',
        logoUrl: '',
        coverUrl: '',
        shippingType: 'free' as MerchantShippingType,
        shippingCost: '',
        uberEats: '',
        google: '',
        instagram: '',
        facebook: '',
        tiktok: '',
        themePrimary: DEFAULT_THEME.primary,
        themeBackground: DEFAULT_THEME.background,
        themeSurface: DEFAULT_THEME.surface,
        themeText: DEFAULT_THEME.text,
        themeButtonText: DEFAULT_THEME.buttonText,
        heroTitle: DEFAULT_MENU_COPY.heroTitle,
        heroSubtitle: DEFAULT_MENU_COPY.heroSubtitle,
        heroBadge: DEFAULT_MENU_COPY.heroBadge,
    });

    useEffect(() => {
        let active = true;

        async function loadData() {
            try {
                const data = (await fetchRestaurant()) as Merchant;
                if (!active) return;

                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    whatsappPhone: data.whatsapp_phone || '',
                    logoUrl: data.logo_url || '',
                    coverUrl: data.cover_url || '',
                    shippingType: data.shipping_type === 'paid' ? 'paid' : 'free',
                    shippingCost:
                        data.shipping_type === 'paid'
                            ? String((data.shipping_cost_cents || 0) / 100)
                            : '',
                    uberEats: data.social_links?.uber_eats || '',
                    google: data.social_links?.google || '',
                    instagram: data.social_links?.instagram || '',
                    facebook: data.social_links?.facebook || '',
                    tiktok: data.social_links?.tiktok || '',
                    themePrimary: data.theme_colors?.primary || DEFAULT_THEME.primary,
                    themeBackground: data.theme_colors?.background || DEFAULT_THEME.background,
                    themeSurface: data.theme_colors?.surface || DEFAULT_THEME.surface,
                    themeText: data.theme_colors?.text || DEFAULT_THEME.text,
                    themeButtonText:
                        data.theme_colors?.button_text || DEFAULT_THEME.buttonText,
                    heroTitle: data.menu_copy?.hero_title || DEFAULT_MENU_COPY.heroTitle,
                    heroSubtitle:
                        data.menu_copy?.hero_subtitle || DEFAULT_MENU_COPY.heroSubtitle,
                    heroBadge: data.menu_copy?.hero_badge || DEFAULT_MENU_COPY.heroBadge,
                });

                if (data.slug) {
                    localStorage.setItem('merchant_slug', data.slug);
                }
            } catch {
                if (!active) return;
                setError('No se pudieron cargar los ajustes del restaurante.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadData();
        return () => {
            active = false;
        };
    }, []);

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            reader.readAsDataURL(file);
        });

    const handleMediaUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        field: 'logoUrl' | 'coverUrl',
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Selecciona un archivo de imagen válido.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no debe superar 5MB.');
            event.target.value = '';
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);
            setFormData((prev) => ({ ...prev, [field]: dataUrl }));
            setError('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo cargar la imagen.';
            setError(message);
        } finally {
            event.target.value = '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleShippingTypeChange = (shippingType: MerchantShippingType) => {
        setFormData((prev) => ({
            ...prev,
            shippingType,
            shippingCost: shippingType === 'free' ? '' : prev.shippingCost || '0',
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const normalizedSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
        const normalizedPhone = formData.whatsappPhone.trim();
        const normalizedLogoUrl = formData.logoUrl.trim();
        const normalizedCoverUrl = formData.coverUrl.trim();
        const shippingCostValue =
            formData.shippingType === 'paid'
                ? Math.max(0, Math.round(Number(formData.shippingCost || 0) * 100))
                : 0;

        try {
            await updateMerchant({
                name: formData.name.trim(),
                slug: normalizedSlug,
                whatsapp_phone: normalizedPhone,
                logo_url: normalizedLogoUrl || undefined,
                cover_url: normalizedCoverUrl || undefined,
                shipping_type: formData.shippingType,
                shipping_cost_cents: shippingCostValue,
                social_links: {
                    uber_eats: formData.uberEats.trim(),
                    google: formData.google.trim(),
                    instagram: formData.instagram.trim(),
                    facebook: formData.facebook.trim(),
                    tiktok: formData.tiktok.trim(),
                },
                theme_colors: {
                    primary: formData.themePrimary.trim().toLowerCase(),
                    background: formData.themeBackground.trim().toLowerCase(),
                    surface: formData.themeSurface.trim().toLowerCase(),
                    text: formData.themeText.trim().toLowerCase(),
                    button_text: formData.themeButtonText.trim().toLowerCase(),
                },
                menu_copy: {
                    hero_title: formData.heroTitle.trim(),
                    hero_subtitle: formData.heroSubtitle.trim(),
                    hero_badge: formData.heroBadge.trim(),
                },
            });

            localStorage.setItem('merchant_slug', normalizedSlug);
            alert('Configuracion guardada correctamente');
        } catch (error) {
            const message =
                error instanceof Error && error.message.trim()
                    ? error.message
                    : 'No se pudo actualizar la configuracion.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-6">Configuracion del Restaurante</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-6xl space-y-6 rounded-lg border bg-white p-6 shadow"
            >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="space-y-6">
                        <div>
                            <Label htmlFor="name">Nombre del negocio</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="slug">Codigo del restaurante</Label>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">daltri.com/m/</span>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Este codigo define tu URL publica.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="whatsappPhone">WhatsApp del restaurante</Label>
                            <Input
                                id="whatsappPhone"
                                name="whatsappPhone"
                                value={formData.whatsappPhone}
                                onChange={handleChange}
                                placeholder="54911..."
                                className="mt-2"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Incluye codigo de pais sin espacios.
                            </p>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <Label>Logo del restaurante</Label>
                            <Input
                                id="logoUrl"
                                name="logoUrl"
                                value={formData.logoUrl}
                                onChange={handleChange}
                                placeholder="URL del logo o usa el cargador de imagen"
                                className="mt-2"
                            />
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) => void handleMediaUpload(event, 'logoUrl')}
                                className="mt-2"
                            />
                            {formData.logoUrl && (
                                <div className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <img
                                        src={formData.logoUrl}
                                        alt="Logo preview"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <Label>Portada del menú</Label>
                            <Input
                                id="coverUrl"
                                name="coverUrl"
                                value={formData.coverUrl}
                                onChange={handleChange}
                                placeholder="URL de portada o usa el cargador de imagen"
                                className="mt-2"
                            />
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) => void handleMediaUpload(event, 'coverUrl')}
                                className="mt-2"
                            />
                            {formData.coverUrl && (
                                <div className="h-28 w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <img
                                        src={formData.coverUrl}
                                        alt="Cover preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4">
                            <Label>Textos principales del menu</Label>
                            <div>
                                <Label htmlFor="heroTitle">Titulo principal</Label>
                                <Input
                                    id="heroTitle"
                                    name="heroTitle"
                                    value={formData.heroTitle}
                                    onChange={handleChange}
                                    placeholder="Todo lo seleccionado"
                                    className="mt-2"
                                    maxLength={80}
                                />
                            </div>
                            <div>
                                <Label htmlFor="heroSubtitle">Subtitulo</Label>
                                <Input
                                    id="heroSubtitle"
                                    name="heroSubtitle"
                                    value={formData.heroSubtitle}
                                    onChange={handleChange}
                                    placeholder="Autenticas comidas y bebidas francesas."
                                    className="mt-2"
                                    maxLength={140}
                                />
                            </div>
                            <div>
                                <Label htmlFor="heroBadge">Etiqueta inferior</Label>
                                <Input
                                    id="heroBadge"
                                    name="heroBadge"
                                    value={formData.heroBadge}
                                    onChange={handleChange}
                                    placeholder="Depuis 1978"
                                    className="mt-2"
                                    maxLength={140}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <Label>Colores del menú</Label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="themePrimary">Color primario</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Input
                                            id="themePrimary"
                                            name="themePrimary"
                                            type="color"
                                            value={formData.themePrimary}
                                            onChange={handleChange}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            name="themePrimary"
                                            value={formData.themePrimary}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="themeBackground">Fondo</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Input
                                            id="themeBackground"
                                            name="themeBackground"
                                            type="color"
                                            value={formData.themeBackground}
                                            onChange={handleChange}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            name="themeBackground"
                                            value={formData.themeBackground}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="themeSurface">Tarjetas</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Input
                                            id="themeSurface"
                                            name="themeSurface"
                                            type="color"
                                            value={formData.themeSurface}
                                            onChange={handleChange}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            name="themeSurface"
                                            value={formData.themeSurface}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="themeText">Texto</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Input
                                            id="themeText"
                                            name="themeText"
                                            type="color"
                                            value={formData.themeText}
                                            onChange={handleChange}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            name="themeText"
                                            value={formData.themeText}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="themeButtonText">Texto del boton</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Input
                                            id="themeButtonText"
                                            name="themeButtonText"
                                            type="color"
                                            value={formData.themeButtonText}
                                            onChange={handleChange}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            name="themeButtonText"
                                            value={formData.themeButtonText}
                                            onChange={handleChange}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div>
                                <Label>Envio</Label>
                                <div className="mt-2 flex gap-3">
                                    <Button
                                        type="button"
                                        variant={formData.shippingType === 'free' ? 'default' : 'outline'}
                                        onClick={() => handleShippingTypeChange('free')}
                                        className="h-10"
                                    >
                                        Gratis
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.shippingType === 'paid' ? 'default' : 'outline'}
                                        onClick={() => handleShippingTypeChange('paid')}
                                        className="h-10"
                                    >
                                        Pago
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="shippingCost">Costo de envio (moneda local)</Label>
                                <Input
                                    id="shippingCost"
                                    name="shippingCost"
                                    type="number"
                                    value={formData.shippingCost}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min={0}
                                    step="1"
                                    disabled={formData.shippingType === 'free'}
                                    className="mt-2"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Si eliges envio gratis, este valor no se usa.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <Label>Redes sociales (opcional)</Label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="uberEats">Uber Eats</Label>
                                    <Input
                                        id="uberEats"
                                        name="uberEats"
                                        value={formData.uberEats}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="google">Google</Label>
                                    <Input
                                        id="google"
                                        name="google"
                                        value={formData.google}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        placeholder="https://instagram.com/..."
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="facebook">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        name="facebook"
                                        value={formData.facebook}
                                        onChange={handleChange}
                                        placeholder="https://facebook.com/..."
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tiktok">TikTok</Label>
                                    <Input
                                        id="tiktok"
                                        name="tiktok"
                                        value={formData.tiktok}
                                        onChange={handleChange}
                                        placeholder="https://tiktok.com/..."
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
