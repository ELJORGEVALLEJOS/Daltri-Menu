'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchRestaurant, updateMerchant } from '@/lib/admin-api';
import {
    DEFAULT_SHIPPING_SETTINGS,
    readShippingSettings,
    saveShippingSettings,
    type ShippingType,
} from '@/lib/shipping-settings';

type Merchant = {
    name?: string;
    slug?: string;
    whatsappNumber?: string;
    whatsapp_phone?: string;
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsappNumber: '',
        shippingType: DEFAULT_SHIPPING_SETTINGS.shippingType as ShippingType,
        shippingCost: '',
    });

    useEffect(() => {
        let active = true;

        async function loadData() {
            try {
                const data = (await fetchRestaurant()) as Merchant;
                if (!active) return;

                const merchantSlug = data.slug || localStorage.getItem('merchant_slug') || '';
                const shippingSettings = merchantSlug
                    ? readShippingSettings(merchantSlug)
                    : DEFAULT_SHIPPING_SETTINGS;

                setFormData({
                    name: data.name || '',
                    slug: merchantSlug,
                    whatsappNumber: data.whatsappNumber || data.whatsapp_phone || '',
                    shippingType: shippingSettings.shippingType,
                    shippingCost:
                        shippingSettings.shippingType === 'paid'
                            ? String(shippingSettings.shippingCost)
                            : '',
                });

                if (merchantSlug) {
                    localStorage.setItem('merchant_slug', merchantSlug);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleShippingTypeChange = (shippingType: ShippingType) => {
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
        const shippingCostValue =
            formData.shippingType === 'paid'
                ? Math.max(0, Number(formData.shippingCost || 0))
                : 0;

        try {
            await updateMerchant({
                name: formData.name,
                whatsappNumber: formData.whatsappNumber,
                slug: normalizedSlug,
            });

            saveShippingSettings(normalizedSlug, {
                shippingType: formData.shippingType,
                shippingCost: shippingCostValue,
            });
            localStorage.setItem('merchant_slug', normalizedSlug);

            setFormData((prev) => ({
                ...prev,
                slug: normalizedSlug,
                shippingCost: prev.shippingType === 'paid' ? String(shippingCostValue) : '',
            }));
            alert('Configuracion guardada correctamente');
        } catch {
            setError('No se pudo actualizar la configuracion.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Configuracion del Restaurante</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border">
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
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 text-sm">daltri.com/m/</span>
                        <Input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Este codigo define tu URL publica.</p>
                </div>

                <div>
                    <Label htmlFor="whatsappNumber">WhatsApp del restaurante</Label>
                    <Input
                        id="whatsappNumber"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        placeholder="54911..."
                        className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Incluye codigo de pais.</p>
                </div>

                <div className="space-y-4 border-t pt-4">
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

                    <div className="max-w-sm">
                        <Label htmlFor="shippingCost">Costo de envio</Label>
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
                        <p className="text-xs text-gray-500 mt-1">
                            Si eliges envio gratis, este valor no se usa.
                        </p>
                    </div>

                    <p className="text-xs text-amber-600 font-medium">
                        * Nota: esta configuracion se guarda localmente en este dispositivo.
                    </p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
