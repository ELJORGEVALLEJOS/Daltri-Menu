'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginMerchant, updateMerchant } from '@/lib/api';

export default function SettingsPage() {
    const [merchant, setMerchant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        whatsappNumber: '',
        shippingCost: '',
        freeShippingThreshold: '',
    });

    useEffect(() => {
        const slug = localStorage.getItem('merchant_slug');
        // Load local shipping settings
        const localSettings = JSON.parse(localStorage.getItem('shipping_settings') || '{}');

        if (slug) {
            loginMerchant(slug).then((data) => {
                setMerchant(data);
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    whatsappNumber: data.whatsappNumber || '',
                    shippingCost: localSettings.shippingCost || '',
                    freeShippingThreshold: localSettings.freeShippingThreshold || '',
                });
                setLoading(false);
            });
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // We can pass the whole object, the API function handles it. 
            // Ideally we should update the API signature or pass just what's needed.
            // Looking at api.ts, updateMerchant takes just 'data'.
            await updateMerchant({
                name: formData.name,
                whatsappNumber: formData.whatsappNumber,
                slug: formData.slug
            });

            // Save shipping settings to localStorage
            localStorage.setItem('shipping_settings', JSON.stringify({
                shippingCost: formData.shippingCost,
                freeShippingThreshold: formData.freeShippingThreshold
            }));

            alert('Settings updated successfully');
            // Update local storage if slug changed
            if (formData.slug !== merchant.slug) {
                localStorage.setItem('merchant_slug', formData.slug);
            }
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Merchant Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border">
                <div>
                    <Label htmlFor="name">Store Name</Label>
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
                    <Label htmlFor="slug">URL Slug</Label>
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
                    <p className="text-xs text-gray-500 mt-1">Changing this will change your store URL.</p>
                </div>

                <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                        id="whatsappNumber"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        placeholder="54911..."
                        className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code, no spaces or dashes.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <Label htmlFor="shippingCost">Costo de Envío ($)</Label>
                        <Input
                            id="shippingCost"
                            name="shippingCost"
                            type="number"
                            value={formData.shippingCost}
                            onChange={handleChange}
                            placeholder="0"
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="freeShippingThreshold">Envío Gratis desde ($)</Label>
                        <Input
                            id="freeShippingThreshold"
                            name="freeShippingThreshold"
                            type="number"
                            value={formData.freeShippingThreshold}
                            onChange={handleChange}
                            placeholder="Sin límite"
                            className="mt-2"
                        />
                    </div>
                    <p className="col-span-2 text-xs text-amber-600 font-medium">
                        * Nota: Esta configuración se guarda localmente en este dispositivo (Modo Demo Frontend).
                    </p>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
