'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Check, Copy, Download, Link2, Printer, QrCode } from 'lucide-react';
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
import {
    OPENING_HOURS_DAYS,
    buildDefaultOpeningHours,
    normalizeOpeningHours,
    type MerchantOpeningHours,
    type OpeningHoursDayKey,
} from '@/lib/opening-hours';

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

const QR_LAYOUTS = {
    compact: {
        label: 'Pequeño',
        qrSize: 180,
        cardWidth: 300,
        logoSize: 56,
        padding: 18,
        titleSize: 20,
        subtitleSize: 12,
        urlSize: 10,
    },
    medium: {
        label: 'Mediano',
        qrSize: 240,
        cardWidth: 380,
        logoSize: 72,
        padding: 24,
        titleSize: 24,
        subtitleSize: 14,
        urlSize: 11,
    },
    large: {
        label: 'Grande',
        qrSize: 320,
        cardWidth: 480,
        logoSize: 88,
        padding: 28,
        titleSize: 30,
        subtitleSize: 16,
        urlSize: 12,
    },
} as const;

type QrLayoutKey = keyof typeof QR_LAYOUTS;

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
    payment_methods?: {
        cash_enabled?: boolean;
        transfer_enabled?: boolean;
        transfer_alias?: string;
        transfer_cbu_cvu?: string;
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
    opening_hours?: MerchantOpeningHours;
};

function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo cargar la imagen del logo.'));
        image.src = src;
    });
}

async function buildQrPoster(options: {
    menuUrl: string;
    restaurantName: string;
    logoUrl?: string;
    layout: (typeof QR_LAYOUTS)[QrLayoutKey];
}) {
    const { menuUrl, restaurantName, logoUrl, layout } = options;
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        width: layout.qrSize,
        margin: 1,
        color: {
            dark: '#0f172a',
            light: '#ffffff',
        },
    });

    const qrImage = await loadImageElement(qrDataUrl);

    let logoImage: HTMLImageElement | null = null;
    if (logoUrl) {
        try {
            logoImage = await loadImageElement(logoUrl);
        } catch {
            logoImage = null;
        }
    }

    const lineHeight = layout.subtitleSize + 6;
    const cardHeight =
        layout.padding * 2 +
        (logoImage ? layout.logoSize + 18 : 0) +
        layout.titleSize +
        14 +
        lineHeight +
        18 +
        layout.qrSize +
        20 +
        lineHeight * 2;

    const canvas = document.createElement('canvas');
    canvas.width = layout.cardWidth;
    canvas.height = cardHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No se pudo generar el QR.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    let cursorY = layout.padding;

    if (logoImage) {
        const logoX = (canvas.width - layout.logoSize) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX, cursorY, layout.logoSize, layout.logoSize);
        ctx.drawImage(logoImage, logoX, cursorY, layout.logoSize, layout.logoSize);
        cursorY += layout.logoSize + 18;
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = `800 ${layout.titleSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(
        restaurantName || 'Mi restaurante',
        canvas.width / 2,
        cursorY + layout.titleSize,
    );
    cursorY += layout.titleSize + 14;

    ctx.fillStyle = '#475569';
    ctx.font = `500 ${layout.subtitleSize}px Arial`;
    ctx.fillText('Escanea para ver el menú', canvas.width / 2, cursorY + layout.subtitleSize);
    cursorY += layout.subtitleSize + 18;

    const qrX = (canvas.width - layout.qrSize) / 2;
    ctx.drawImage(qrImage, qrX, cursorY, layout.qrSize, layout.qrSize);
    cursorY += layout.qrSize + 20;

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 ${layout.urlSize}px Arial`;
    const urlLines = splitTextIntoLines(
        ctx,
        menuUrl,
        canvas.width - layout.padding * 2,
    );
    for (const line of urlLines) {
        ctx.fillText(line, canvas.width / 2, cursorY + layout.urlSize);
        cursorY += layout.urlSize + 6;
    }

    return {
        qrDataUrl,
        posterDataUrl: canvas.toDataURL('image/png'),
    };
}

function splitTextIntoLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
) {
    const lines: string[] = [];
    let current = '';

    for (const char of text) {
        const next = current + char;
        if (ctx.measureText(next).width > maxWidth && current) {
            lines.push(current);
            current = char;
        } else {
            current = next;
        }
    }

    if (current) {
        lines.push(current);
    }

    return lines;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrPosterUrl, setQrPosterUrl] = useState('');
    const [qrLayout, setQrLayout] = useState<QrLayoutKey>('medium');
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
        transferAlias: '',
        transferCbuCvu: '',
        themePrimary: DEFAULT_THEME.primary,
        themeBackground: DEFAULT_THEME.background,
        themeSurface: DEFAULT_THEME.surface,
        themeText: DEFAULT_THEME.text,
        themeButtonText: DEFAULT_THEME.buttonText,
        heroTitle: DEFAULT_MENU_COPY.heroTitle,
        heroSubtitle: DEFAULT_MENU_COPY.heroSubtitle,
        heroBadge: DEFAULT_MENU_COPY.heroBadge,
        openingHours: buildDefaultOpeningHours(),
    });

    const normalizedSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const publicMenuUrl = normalizedSlug
        ? `https://menu.daltrishop.com/m/${normalizedSlug}`
        : '';
    const qrLayoutConfig = QR_LAYOUTS[qrLayout];

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
                    transferAlias: data.payment_methods?.transfer_alias || '',
                    transferCbuCvu: data.payment_methods?.transfer_cbu_cvu || '',
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
                    openingHours: normalizeOpeningHours(data.opening_hours),
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
                if (active) {
                    setQrDataUrl('');
                    setQrPosterUrl('');
                }
                return;
            }

            try {
                const result = await buildQrPoster({
                    menuUrl: publicMenuUrl,
                    restaurantName: formData.name.trim() || 'Mi restaurante',
                    logoUrl: formData.logoUrl.trim() || undefined,
                    layout: qrLayoutConfig,
                });

                if (active) {
                    setQrDataUrl(result.qrDataUrl);
                    setQrPosterUrl(result.posterDataUrl);
                }
            } catch {
                if (active) {
                    setQrDataUrl('');
                    setQrPosterUrl('');
                }
            }
        }

        void generateQr();

        return () => {
            active = false;
        };
    }, [formData.logoUrl, formData.name, publicMenuUrl, qrLayoutConfig]);

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

    const handleOpeningHoursChange = (
        dayKey: OpeningHoursDayKey,
        field: 'enabled' | 'open' | 'close',
        value: boolean | string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [dayKey]: {
                    ...prev.openingHours[dayKey],
                    [field]: value,
                },
            },
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
        if (!qrPosterUrl || !publicMenuUrl) {
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            setError('No se pudo abrir la ventana de impresión.');
            return;
        }

        const safeName = (formData.name.trim() || 'Mi restaurante').replace(/</g, '&lt;');
        const safePoster = qrPosterUrl.replace(/</g, '&lt;');
        const printWidth = qrLayoutConfig.cardWidth;

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
                  width: ${printWidth}px;
                  margin: 24px auto;
                  text-align: center;
                }
                .poster {
                  width: 100%;
                  display: block;
                }
              </style>
            </head>
            <body>
              <div class="sheet">
                <img src="${safePoster}" alt="QR del menú de ${safeName}" class="poster" />
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

    const handleDownloadQr = () => {
        if (!qrPosterUrl || !publicMenuUrl) {
            return;
        }

        const safeSlug = normalizedSlug || 'menu';
        const link = document.createElement('a');
        link.href = qrPosterUrl;
        link.download = `${safeSlug}-qr-${qrLayout}.png`;
        link.click();
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
                payment_methods: {
                    transfer_alias: formData.transferAlias.trim(),
                    transfer_cbu_cvu: formData.transferCbuCvu.replace(/\s+/g, ''),
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
                opening_hours: formData.openingHours,
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
        <div className="mx-auto w-full max-w-6xl text-gray-950">
            <h1 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">Configuracion del Restaurante</h1>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-3xl border bg-white p-4 text-gray-950 shadow sm:p-6 [&_input]:text-gray-950 [&_input]:placeholder:text-gray-500 [&_label]:text-gray-950"
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

                            <div className="grid gap-4 lg:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
                                <div className="min-w-0">
                                    <Label htmlFor="qrLayout">Tamaño del archivo QR</Label>
                                    <select
                                        id="qrLayout"
                                        value={qrLayout}
                                        onChange={(event) =>
                                            setQrLayout(event.target.value as QrLayoutKey)
                                        }
                                        className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-950 outline-none transition focus:border-[#2467F7]"
                                    >
                                        {Object.entries(QR_LAYOUTS).map(([key, option]) => (
                                            <option key={key} value={key}>
                                                {option.label} - QR {option.qrSize}px
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleCopyMenuLink()}
                                    disabled={!publicMenuUrl}
                                    className="h-10 w-full"
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
                                    onClick={handleDownloadQr}
                                    disabled={!qrPosterUrl}
                                    className="h-10 w-full"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar archivo
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrintQr}
                                    disabled={!qrPosterUrl}
                                    className="h-10 w-full"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir QR
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 sm:p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <QrCode className="h-4 w-4 text-gray-700" />
                                    <p className="text-sm font-semibold text-gray-950">
                                        Código QR del menú
                                    </p>
                                </div>

                                {qrDataUrl ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={qrPosterUrl || qrDataUrl}
                                            alt="QR del menú"
                                            className="w-full max-w-[22rem] rounded-2xl border border-gray-200 bg-white"
                                        />
                                        <p className="text-center text-xs font-medium text-gray-700">
                                            El archivo se generará en tamaño {QR_LAYOUTS[qrLayout].label.toLowerCase()} y, si tienes logo cargado, saldrá junto al QR.
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
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
                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
                            <div>
                                <Label>Horarios de atención</Label>
                                <p className="mt-1 text-sm font-medium text-gray-700">
                                    Define los días y horarios en los que aparece abierto tu restaurante.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {OPENING_HOURS_DAYS.map((day) => {
                                    const schedule = formData.openingHours[day.key];

                                    return (
                                        <div
                                            key={day.key}
                                            className="grid gap-3 rounded-2xl border border-gray-100 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-950">
                                                        {day.label}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500">
                                                        {schedule.enabled
                                                            ? `${schedule.open} - ${schedule.close}`
                                                            : 'Cerrado'}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant={schedule.enabled ? 'default' : 'outline'}
                                                    onClick={() =>
                                                        handleOpeningHoursChange(
                                                            day.key,
                                                            'enabled',
                                                            !schedule.enabled,
                                                        )
                                                    }
                                                    className="h-10 w-full sm:w-auto"
                                                >
                                                    {schedule.enabled ? 'Abierto' : 'Cerrado'}
                                                </Button>
                                            </div>

                                            <Input
                                                type="time"
                                                value={schedule.open}
                                                onChange={(event) =>
                                                    handleOpeningHoursChange(
                                                        day.key,
                                                        'open',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!schedule.enabled}
                                                className="h-10"
                                            />
                                            <Input
                                                type="time"
                                                value={schedule.close}
                                                onChange={(event) =>
                                                    handleOpeningHoursChange(
                                                        day.key,
                                                        'close',
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!schedule.enabled}
                                                className="h-10"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs font-medium text-gray-500">
                                El horario se mostrará en el menú público para indicar si el restaurante está abierto o cerrado.
                            </p>
                        </div>

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
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
                                            className="h-10 min-w-0"
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
                                            className="h-10 min-w-0"
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
                                            className="h-10 min-w-0"
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
                                            className="h-10 min-w-0"
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
                                            className="h-10 min-w-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
                            <div>
                                <Label>Envio</Label>
                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant={formData.shippingType === 'free' ? 'default' : 'outline'}
                                        onClick={() => handleShippingTypeChange('free')}
                                        className="h-10 w-full"
                                    >
                                        Gratis
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.shippingType === 'paid' ? 'default' : 'outline'}
                                        onClick={() => handleShippingTypeChange('paid')}
                                        className="h-10 w-full"
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
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

                        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
                            <div>
                                <Label className="text-base font-semibold">
                                    Cobros por transferencia
                                </Label>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                    Si completas estos datos, el cliente podrá elegir transferencia al finalizar el pedido.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="transferAlias">Alias</Label>
                                    <Input
                                        id="transferAlias"
                                        name="transferAlias"
                                        value={formData.transferAlias}
                                        onChange={handleChange}
                                        placeholder="mi-resto.alias"
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="transferCbuCvu">CBU / CVU</Label>
                                    <Input
                                        id="transferCbuCvu"
                                        name="transferCbuCvu"
                                        value={formData.transferCbuCvu}
                                        onChange={handleChange}
                                        placeholder="0000003100000000000000"
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <p className="text-xs font-medium text-gray-900">
                                El sistema seguirá ofreciendo efectivo. La opción transferencia solo aparecerá cuando el alias o el CBU/CVU estén cargados.
                            </p>
                        </div>
                    </section>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
