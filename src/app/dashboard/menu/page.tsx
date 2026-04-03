'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FallbackImage } from '@/components/ui/fallback-image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AUTH_REQUIRED_ERROR,
    fetchMenu,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    type AdminMenuCategory,
    type AdminMenuItem,
} from '@/lib/admin-api';
import { Trash2, Plus, ChevronDown, LayoutGrid, Package, DollarSign, Image as ImageIcon, Edit2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPTY_ITEM_DATA = {
    name: '',
    sku: '',
    brand: '',
    stock: '',
    price: '',
    originalPrice: '',
    description: '',
    imageUrl: '',
};

export default function MenuPage() {
    const [menu, setMenu] = useState<AdminMenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const router = useRouter();
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Edit/Add States
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [categoryEditName, setCategoryEditName] = useState('');

    const [itemData, setItemData] = useState({
        ...EMPTY_ITEM_DATA,
    });

    const loadMenu = useCallback(async () => {
        try {
            const data = await fetchMenu();
            const activeCategories = data.filter(
                (category) => category.isActive !== false && category.active !== false,
            );
            setMenu(activeCategories);
            setExpandedCategories((current) =>
                activeCategories.length > 0 && current.length === 0
                    ? [activeCategories[0].id]
                    : current.filter((categoryId) =>
                          activeCategories.some((category) => category.id === categoryId),
                      ),
            );
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            console.error('Failed to load menu', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadMenu();
    }, [loadMenu]);

    useEffect(() => {
        if (!formSuccess) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setFormSuccess('');
        }, 4500);

        return () => window.clearTimeout(timeoutId);
    }, [formSuccess]);

    const handleCreateCategory = async () => {
        const categoryName = newCategoryName.trim();
        if (!categoryName) {
            setFormError('Escribe un nombre para la categoría.');
            return;
        }

        try {
            await createCategory(categoryName);
            setFormError('');
            setFormSuccess('Categoría guardada correctamente.');
            setNewCategoryName('');
            loadMenu();
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error ? error.message : 'No se pudo crear la categoría';
            setFormError(message);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!categoryEditName) return;
        try {
            await updateCategory(id, categoryEditName);
            setEditingCategory(null);
            setFormError('');
            setFormSuccess('Categoría actualizada correctamente.');
            loadMenu();
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error ? error.message : 'No se pudo actualizar la categoría';
            setFormError(message);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Estás seguro? Se ocultará la categoría y todos sus productos.')) return;
        try {
            await deleteCategory(id);
            setMenu((prev) => prev.filter((category) => category.id !== id));
            setExpandedCategories((prev) => prev.filter((categoryId) => categoryId !== id));
            setFormError('');
            setFormSuccess('Categoría eliminada correctamente.');
            loadMenu();
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error ? error.message : 'No se pudo eliminar la categoría';
            setFormError(message);
        }
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
            reader.readAsDataURL(file);
        });

    const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setFormError('Selecciona un archivo de imagen válido.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setFormError('La imagen no debe superar 5MB.');
            event.target.value = '';
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);
            setItemData((prev) => ({ ...prev, imageUrl: dataUrl }));
            setFormError('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo cargar la imagen.';
            setFormError(message);
        } finally {
            event.target.value = '';
        }
    };

    const handleSaveItem = async (categoryId: string) => {
        setFormError('');

        const name = itemData.name.trim();
        const sku = itemData.sku.trim();
        const brand = itemData.brand.trim();
        const description = itemData.description.trim();
        const imageUrl = itemData.imageUrl.trim();

        const priceNumber = Number(itemData.price);
        if (!name) {
            setFormError('El nombre del producto es obligatorio.');
            return;
        }
        if (!Number.isFinite(priceNumber) || priceNumber < 0) {
            setFormError('Ingresa un precio valido.');
            return;
        }

        let stockQuantity: number | null | undefined = undefined;
        if (itemData.stock.trim().length > 0) {
            const stockNumber = Number(itemData.stock);
            if (!Number.isInteger(stockNumber) || stockNumber < 0) {
                setFormError('El stock debe ser un numero entero mayor o igual a cero.');
                return;
            }
            stockQuantity = stockNumber;
        } else if (editingItem) {
            stockQuantity = null;
        }

        const originalRaw = itemData.originalPrice.trim();
        let originalPriceCents: number | undefined;
        if (originalRaw.length > 0) {
            const originalNumber = Number(originalRaw);
            if (!Number.isFinite(originalNumber) || originalNumber < 0) {
                setFormError('El precio anterior debe ser un numero valido.');
                return;
            }
            if (originalNumber <= priceNumber) {
                setFormError('El precio anterior (oferta) debe ser mayor que el precio actual.');
                return;
            }
            originalPriceCents = Math.round(originalNumber * 100);
        } else if (editingItem) {
            // In edit mode, empty offer means removing the previous offer.
            originalPriceCents = 0;
        }

        const payload = {
            category_id: categoryId,
            name,
            sku: sku || null,
            brand: brand || null,
            stock_quantity: stockQuantity,
            price_cents: Math.round(priceNumber * 100),
            original_price_cents: originalPriceCents,
            description: description || undefined,
            image_url: imageUrl || (editingItem ? '' : undefined),
        };

        try {
            if (editingItem) {
                await updateProduct(editingItem.id, payload);
            } else {
                await createProduct(payload);
            }
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error ? error.message : 'No se pudo guardar el producto';
            setFormError(message);
            return;
        }

        setAddingItemTo(null);
        setEditingItem(null);
        setItemData({ ...EMPTY_ITEM_DATA });
        setFormSuccess(
            editingItem
                ? 'Producto actualizado correctamente.'
                : 'Producto guardado correctamente.',
        );
        loadMenu();
    };

    const startEditingItem = (item: AdminMenuItem, categoryId: string) => {
        setEditingItem(item);
        setAddingItemTo(categoryId);
        setItemData({
            name: item.name,
            sku: item.sku || '',
            brand: item.brand || '',
            stock:
                typeof item.stockQuantity === 'number' ? String(item.stockQuantity) : '',
            price: (item.priceCents / 100).toString(),
            originalPrice: item.originalPriceCents ? (item.originalPriceCents / 100).toString() : '',
            description: item.description || '',
            imageUrl: item.imageUrl || item.image_url || ''
        });
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Seguro quieres eliminar este producto?')) return;
        try {
            await deleteProduct(id);
            setFormError('');
            setFormSuccess('Producto eliminado correctamente.');
            loadMenu();
        } catch (error) {
            if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }
            const message =
                error instanceof Error ? error.message : 'No se pudo eliminar el producto';
            setFormError(message);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]"></div>
        </div>
    );

    return (
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-10 font-sans pb-16 sm:pb-20">
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-2 leading-tight">Gestión del Catálogo</h1>
                    <p className="text-gray-500 font-medium">Organiza categorías, productos y precios de tu negocio</p>
                </div>

                {/* Add Category Quick Form */}
                <div className="flex w-full flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/50 md:w-auto md:min-w-[22rem]">
                    <Input
                        value={newCategoryName}
                        onChange={(e) => {
                            setNewCategoryName(e.target.value);
                            if (formError) setFormError('');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleCreateCategory();
                            }
                        }}
                        placeholder="Nueva categoría (ej. Vinos)"
                        className="h-12 w-full border-none bg-gray-50/50 rounded-xl text-gray-900 placeholder:text-[#99A1AF] focus:ring-1 focus:ring-[#C5A059]/30"
                    />
                    <Button
                        type="button"
                        onClick={() => void handleCreateCategory()}
                        disabled={!newCategoryName.trim()}
                        className="h-12 w-full rounded-xl bg-[#C5A059] px-6 text-white shadow-lg shadow-[#C5A059]/20 hover:bg-[#B48F4D] disabled:opacity-60"
                    >
                        <Plus className="h-5 w-5 mr-2" /> Añadir
                    </Button>
                </div>
            </header>

            {formError && (
                <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl p-3">
                    {formError}
                </div>
            )}
            {formSuccess && (
                <div className="text-sm text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    {formSuccess}
                </div>
            )}

            {/* Categories Grid */}
            <div className="space-y-6">
                {menu.map((category) => (
                    <div key={category.id} className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden transition-all duration-300">
                        <div
                            className={cn(
                                "flex cursor-pointer select-none flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-6",
                                expandedCategories.includes(category.id) ? "bg-[#FDFCFB]/80" : "hover:bg-gray-50/50"
                            )}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex min-w-0 items-start gap-4">
                                <div className={cn(
                                    "mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md shadow-gray-200/50 sm:h-12 sm:w-12",
                                    expandedCategories.includes(category.id) ? "bg-[#C5A059] text-white rotate-6" : "bg-gray-100 text-[#99A1AF]"
                                )}>
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    {editingCategory === category.id ? (
                                        <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <Input
                                                value={categoryEditName}
                                                onChange={e => setCategoryEditName(e.target.value)}
                                                className="h-10 w-full min-w-[12rem] font-serif font-bold sm:w-48"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateCategory(category.id)} className="h-10 w-10 text-green-500 hover:bg-green-50">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(null)} className="h-10 w-10 text-[#99A1AF] hover:bg-gray-50">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2 group/cat">
                                                {category.name}
                                                <Edit2
                                                    className="h-3 w-3 cursor-pointer text-[#99A1AF] opacity-100 transition-all hover:text-[#C5A059] md:opacity-0 md:group-hover/cat:opacity-100"
                                                    onClick={(e) => { e.stopPropagation(); setEditingCategory(category.id); setCategoryEditName(category.name); }}
                                                />
                                            </h3>
                                            <p className="text-sm text-[#99A1AF] font-medium tracking-wide">{category.items.length} productos</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-[#99A1AF] hover:text-red-500 hover:bg-red-50 rounded-xl"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                                <div className={cn("transition-transform duration-300", expandedCategories.includes(category.id) && "rotate-180")}>
                                    <ChevronDown className="h-6 w-6 text-[#99A1AF]" />
                                </div>
                            </div>
                        </div>

                        {expandedCategories.includes(category.id) && (
                            <div className="p-4 sm:p-8 bg-white border-t border-gray-50">
                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
                                    {category.items.map((item) => {
                                        const itemImageSrc = item.imageUrl || item.image_url || undefined;

                                        return (
                                        <div key={item.id} className="group relative bg-[#FDFCFB] p-5 rounded-3xl border border-gray-100 hover:border-[#C5A059]/30 transition-all hover:shadow-2xl hover:shadow-gray-200/60 overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                                    {itemImageSrc ? (
                                                        <FallbackImage
                                                            src={itemImageSrc}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                            wrapperClassName="h-full w-full"
                                                            fallbackLabel={item.name}
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-6 w-6 text-gray-200" />
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-gray-400 transition-colors hover:bg-[#C5A059]/5 hover:text-[#C5A059] md:text-gray-200"
                                                        onClick={() => startEditingItem(item, category.id)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 md:text-gray-200"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-gray-900 group-hover:text-[#C5A059] transition-colors line-clamp-1 mb-1">{item.name}</h4>
                                            {(item.brand || item.sku) && (
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#99A1AF]">
                                                    {[item.brand, item.sku ? `SKU ${item.sku}` : null]
                                                        .filter(Boolean)
                                                        .join(' • ')}
                                                </p>
                                            )}
                                            <p className="text-sm text-[#99A1AF] line-clamp-2 min-h-[2.5rem] mb-4 font-medium leading-relaxed">{item.description || 'Sin descripción'}</p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    {item.originalPriceCents && (
                                                        <span className="text-[10px] text-[#99A1AF] line-through font-bold -mb-1">
                                                            ${(item.originalPriceCents / 100).toLocaleString('es-AR')}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[#C5A059] font-bold text-lg">
                                                        <span className="text-sm mt-0.5">$</span>
                                                        {(item.priceCents / 100).toLocaleString('es-AR')}
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                                    item.isActive ? "bg-green-50 text-green-500" : "bg-gray-50 text-[#99A1AF]"
                                                )}>
                                                    {item.isActive ? 'Activo' : 'Oculto'}
                                                </div>
                                            </div>

                                            {typeof item.stockQuantity === 'number' && (
                                                <p className="mt-3 text-xs font-semibold text-[#99A1AF]">
                                                    {item.stockQuantity > 0
                                                        ? `Stock: ${item.stockQuantity}`
                                                        : 'Sin stock'}
                                                </p>
                                            )}

                                            {item.originalPriceCents && item.originalPriceCents > item.priceCents && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <div className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-xl shadow-sm">
                                                        Oferta
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}

                                    {/* Quick Add Product Card toggle */}
                                    {addingItemTo !== category.id && (
                                        <button
                                            onClick={() => setAddingItemTo(category.id)}
                                            className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-100 p-8 text-[#99A1AF] transition-all group hover:border-[#C5A059]/40 hover:bg-[#FDFCFB] hover:text-[#C5A059]"
                                        >
                                            <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#C5A059]/10 group-hover:scale-110 transition-all">
                                                <Plus className="h-8 w-8" />
                                            </div>
                                            <span className="font-bold tracking-wide uppercase text-xs">Añadir Producto</span>
                                        </button>
                                    )}
                                </div>

                                {/* Modern Add/Edit Product Form */}
                                {addingItemTo === category.id && (
                                    <div className="bg-[#FDFCFB] p-4 sm:p-8 rounded-[2rem] border border-[#C5A059]/20 shadow-inner space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-[#C5A059] rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
                                                <Package className="h-5 w-5 text-white" />
                                            </div>
                                            <h4 className="text-lg sm:text-xl font-serif font-bold text-gray-900">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Nombre</Label>
                                                <Input
                                                    value={itemData.name}
                                                    onChange={e => setItemData({ ...itemData, name: e.target.value })}
                                                    placeholder="Nombre del producto"
                                                    className="h-14 bg-white rounded-2xl border-gray-100 px-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">SKU</Label>
                                                    <Input
                                                        value={itemData.sku}
                                                        onChange={e => setItemData({ ...itemData, sku: e.target.value })}
                                                        placeholder="Opcional"
                                                        className="h-14 bg-white rounded-2xl border-gray-100 px-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Marca</Label>
                                                    <Input
                                                        value={itemData.brand}
                                                        onChange={e => setItemData({ ...itemData, brand: e.target.value })}
                                                        placeholder="Opcional"
                                                        className="h-14 bg-white rounded-2xl border-gray-100 px-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Precio</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5A059]" />
                                                        <Input
                                                            type="number"
                                                            value={itemData.price}
                                                            onChange={e => setItemData({ ...itemData, price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20 font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Stock</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={itemData.stock}
                                                    onChange={e => setItemData({ ...itemData, stock: e.target.value })}
                                                    placeholder="Sin control"
                                                    className="h-14 bg-white rounded-2xl border-gray-100 px-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Anterior (Oferta)</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                                                        <Input
                                                            type="number"
                                                            value={itemData.originalPrice}
                                                            onChange={e => setItemData({ ...itemData, originalPrice: e.target.value })}
                                                            placeholder="Opcional"
                                                            className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 focus:ring-[#C5A059]/20 text-[#99A1AF] placeholder:text-[#99A1AF] line-through"
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-[#99A1AF] ml-1">Debe ser mayor al precio actual.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Descripción</Label>
                                            <Input
                                                value={itemData.description}
                                                onChange={e => setItemData({ ...itemData, description: e.target.value })}
                                                placeholder="Ingredientes, preparación, etc."
                                                className="h-14 bg-white rounded-2xl border-gray-100 px-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">Foto del producto</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageFileChange}
                                                    className="h-14 bg-white rounded-2xl border-gray-100 px-4 py-3 text-[#99A1AF] file:mr-4 file:border-0 file:bg-[#C5A059]/10 file:text-[#B48F4D] file:px-3 file:py-2 file:rounded-lg file:font-semibold"
                                                />
                                            </div>

                                            {itemData.imageUrl && (
                                                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-100 bg-white">
                                                    <img src={itemData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setItemData((prev) => ({ ...prev, imageUrl: '' }))}
                                                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 border border-gray-100"
                                                    >
                                                        Quitar foto
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-[#99A1AF] ml-1">URL de Imagen (Opcional)</Label>
                                                <div className="relative">
                                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                                                    <Input
                                                        value={itemData.imageUrl.startsWith('data:image/') ? '' : itemData.imageUrl}
                                                        onChange={e => setItemData({ ...itemData, imageUrl: e.target.value })}
                                                        placeholder="https://..."
                                                        className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 text-[#99A1AF] placeholder:text-[#99A1AF] focus:ring-[#C5A059]/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
                                            <Button onClick={() => handleSaveItem(category.id)} className="h-14 w-full flex-1 bg-[#C5A059] hover:bg-[#B48F4D] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#C5A059]/20">
                                                {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setAddingItemTo(null); setEditingItem(null); setItemData({ ...EMPTY_ITEM_DATA }); }} className="h-14 w-full px-8 text-[#99A1AF] font-bold rounded-2xl hover:bg-gray-100 sm:w-auto">
                                                Cancelar
                                            </Button>
                                        </div>
                                        {formError && (
                                            <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl p-3">
                                                {formError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {menu.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                    <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <LayoutGrid className="h-10 w-10 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Comienza tu catálogo</h3>
                    <p className="text-[#99A1AF] max-w-sm mx-auto font-medium">Añade tu primera categoría arriba para empezar a cargar tus productos.</p>
                </div>
            )}
        </div>
    );
}
