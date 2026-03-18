'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Check, Copy, Link2, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AUTH_REQUIRED_ERROR,
    fetchRestaurant,
    updateMerchant,
    type MerchantShippingType,
} from '@/lib/admin-api';
import { formatMoney } from '@/lib/format';

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
    free_shipping_over_cents?: number | null;
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
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsappPhone: '',
        logoUrl: '',
        coverUrl: '',
        shippingType: 'free' as MerchantShippingType,
        shippingCost: '',
        freeShippingOver: '',
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

    const normalizedSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const publicMenuUrl = normalizedSlug
        ? `https://menu.daltrishop.com/m/${normalizedSlug}`
        : '';

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
                    freeShippingOver:
                        data.shipping_type === 'paid' &&
                        typeof data.free_shipping_over_cents === 'number' &&
                        data.free_shipping_over_cents > 0
                            ? String(data.free_shipping_over_cents / 100)
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
            } catch (error) {
                if (!active) return;
                if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                    router.replace('/login');
                    return;
                }
                setError('No se pudieron cargar los ajustes del restaurante.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadData();
        return () => {
            active = false;
        };
    }, [router]);

    useEffect(() => {
        let active = true;

        async function generateQr() {
            if (!publicMenuUrl) {
                if (active) setQrDataUrl('');
                return;
            }

            try {
                const dataUrl = await QRCode.toDataURL(publicMenuUrl, {
                    width: 320,
                    margin: 1,
                    color: {
                        dark: '#0f172a',
                        light: '#ffffff',
                    },
                });

                if (active) {
                    setQrDataUrl(dataUrl);
                }
            } catch {
                if (active) {
                    setQrDataUrl('');
                }
            }
        }

        void generateQr();

        return () => {
            active = false;
        };
    }, [publicMenuUrl]);

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

    const handleCopyMenuLink = async () => {
        if (!publicMenuUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(publicMenuUrl);
            setCopyState('copied');
            window.setTimeout(() => setCopyState('idle'), 2200);
        } catch {
            setError('No se pudo copiar el link del menú.');
        }
    };

    const handlePrintQr = () => {
        if (!qrDataUrl || !publicMenuUrl) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            setError('No se pudo abrir la ventana de impresión.');
            return;
        }

        const safeName = (formData.name.trim() || 'Mi restaurante').replace(/</g, '&lt;');
        const safeUrl = publicMenuUrl.replace(/</g, '&lt;');
        const safeLogo = formData.logoUrl.trim();

        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="utf-8" />
              <title>QR del menú - ${safeName}</title>
              <style>
                body {
                  margin: 0;
                  font-family: Arial, sans-serif;
                  background: #f8fafc;
                  color: #0f172a;
                }
                .sheet {
                  width: 720px;
                  margin: 32px auto;
                  background: #ffffff;
                  border: 1px solid #e5e7eb;
                  border-radius: 24px;
                  padding: 32px;
                  text-align: center;
                }
                .logo {
                  width: 96px;
                  height: 96px;
                  margin: 0 auto 20px;
                  border-radius: 24px;
                  object-fit: contain;
                  border: 1px solid #e5e7eb;
                  background: #ffffff;
                }
                .title {
                  font-size: 34px;
                  font-weight: 800;
                  margin: 0 0 10px;
                }
                .subtitle {
                  font-size: 18px;
                  color: #475569;
                  margin: 0 0 26px;
                }
                .qr {
                  width: 320px;
                  height: 320px;
                  margin: 0 auto 24px;
                  display: block;
                  border-radius: 20px;
                  border: 1px solid #e5e7eb;
                  padding: 12px;
                  background: white;
                }
                .link {
                  font-size: 18px;
                  font-weight: 700;
                  word-break: break-word;
                }
                .note {
                  margin-top: 12px;
                  color: #64748b;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="sheet">
                ${safeLogo ? `<img src="${safeLogo}" alt="Logo" class="logo" />` : ''}
                <h1 class="title">${safeName}</h1>
                <p class="subtitle">Escanea este código para abrir el menú.</p>
                <img src="${qrDataUrl}" alt="QR del menú" class="qr" />
                <p class="link">${safeUrl}</p>
                <p class="note">Comparte o imprime este código para tus clientes.</p>
              </div>
              <script>
                window.onload = function () {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const normalizedPhone = formData.whatsappPhone.trim();
        const normalizedLogoUrl = formData.logoUrl.trim();
        const normalizedCoverUrl = formData.coverUrl.trim();
        const shippingCostValue =
            formData.shippingType === 'paid'
                ? Math.max(0, Math.round(Number(formData.shippingCost || 0) * 100))
                : 0;
        const freeShippingOverValue =
            formData.shippingType === 'paid' && Number(formData.freeShippingOver || 0) > 0
                ? Math.max(0, Math.round(Number(formData.freeShippingOver) * 100))
                : null;

        try {
            await updateMerchant({
                name: formData.name.trim(),
                slug: normalizedSlug,
                whatsapp_phone: normalizedPhone,
                logo_url: normalizedLogoUrl || undefined,
                cover_url: normalizedCoverUrl || undefined,
                shipping_type: formData.shippingType,
                shipping_cost_cents: shippingCostValue,
                free_shipping_over_cents: freeShippingOverValue,
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
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error && error.message.trim()
                    ? error.message
                    : 'No se pudo actualizar la configuracion.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="font-medium text-gray-950">Cargando configuración...</div>;
    }

    return (
        <div className="w-full text-gray-950">
            <h1 className="text-2xl font-bold mb-6">Configuracion del Restaurante</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-6xl space-y-6 rounded-lg border bg-white p-4 text-gray-950 shadow sm:p-6 [&_input]:text-gray-950 [&_input]:placeholder:text-gray-500 [&_label]:text-gray-950"
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
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <span className="text-sm font-medium text-gray-950">
                                    menu.daltrishop.com/m/
                                </span>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs font-medium text-gray-900">
                                Este codigo define tu URL publica.
                            </p>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Link2 className="h-4 w-4 text-gray-700" />
                                        <Label className="text-base font-semibold">
                                            Link del menú
                                        </Label>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        Copia tu link público o imprime el QR para compartirlo.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="break-all text-sm font-semibold text-gray-950">
                                    {publicMenuUrl || 'Define un código de restaurante para generar tu link.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleCopyMenuLink()}
                                    disabled={!publicMenuUrl}
                                    className="h-10"
                                >
                                    {copyState === 'copied' ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Link copiado
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar link
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrintQr}
                                    disabled={!qrDataUrl}
                                    className="h-10"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir QR
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <QrCode className="h-4 w-4 text-gray-700" />
                                    <p className="text-sm font-semibold text-gray-950">
                                        Código QR del menú
                                    </p>
                                </div>

                                {qrDataUrl ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={qrDataUrl}
                                            alt="QR del menú"
                                            className="h-48 w-48 rounded-2xl border border-gray-200 bg-white p-3"
                                        />
                                        <p className="text-center text-xs font-medium text-gray-700">
                                            Escaneando este QR, el cliente abre directamente tu menú público.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-gray-500">
                                        El QR aparecerá cuando tengas definido el link público del menú.
                                    </p>
                                )}
                            </div>
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
                            <p className="mt-1 text-xs font-medium text-gray-900">
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
                                <p className="mt-1 text-xs font-medium text-gray-900">
                                    Si eliges envio gratis, este valor no se usa.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="freeShippingOver">
                                    Envio gratis desde (opcional)
                                </Label>
                                <Input
                                    id="freeShippingOver"
                                    name="freeShippingOver"
                                    type="number"
                                    value={formData.freeShippingOver}
                                    onChange={handleChange}
                                    placeholder="30000"
                                    min={0}
                                    step="1"
                                    disabled={formData.shippingType === 'free'}
                                    className="mt-2"
                                />
                                <p className="mt-1 text-xs font-medium text-gray-900">
                                    Si el subtotal del pedido supera este monto, el envio pasa a ser gratis.
                                </p>
                                {formData.shippingType === 'paid' &&
                                    Number(formData.freeShippingOver || 0) > 0 && (
                                        <p className="mt-2 text-xs font-medium text-emerald-600">
                                            Los pedidos desde{' '}
                                            {formatMoney(Number(formData.freeShippingOver), {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}{' '}
                                            tendran envio gratis.
                                        </p>
                                    )}
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
