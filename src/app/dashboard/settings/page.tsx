'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchRestaurant, updateMerchant, type MerchantShippingType } from '@/lib/admin-api';

type Merchant = {
    name?: string;
    slug?: string;
    whatsapp_phone?: string;
    shipping_type?: MerchantShippingType;
    shipping_cost_cents?: number;
};

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsappPhone: '',
        shippingType: 'free' as MerchantShippingType,
        shippingCost: '',
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
                    shippingType: data.shipping_type === 'paid' ? 'paid' : 'free',
                    shippingCost:
                        data.shipping_type === 'paid'
                            ? String((data.shipping_cost_cents || 0) / 100)
                            : '',
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
        const shippingCostValue =
            formData.shippingType === 'paid'
                ? Math.max(0, Math.round(Number(formData.shippingCost || 0) * 100))
                : 0;

        try {
            await updateMerchant({
                name: formData.name.trim(),
                slug: normalizedSlug,
                whatsapp_phone: normalizedPhone,
                shipping_type: formData.shippingType,
                shipping_cost_cents: shippingCostValue,
            });

            localStorage.setItem('merchant_slug', normalizedSlug);
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
                    <Label htmlFor="whatsappPhone">WhatsApp del restaurante</Label>
                    <Input
                        id="whatsappPhone"
                        name="whatsappPhone"
                        value={formData.whatsappPhone}
                        onChange={handleChange}
                        placeholder="54911..."
                        className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Incluye codigo de pais sin espacios.</p>
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
                        <p className="text-xs text-gray-500 mt-1">
                            Si eliges envio gratis, este valor no se usa.
                        </p>
                    </div>
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
