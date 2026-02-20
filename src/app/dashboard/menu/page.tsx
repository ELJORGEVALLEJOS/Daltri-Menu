'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchMenu, createCategory, updateCategory, deleteCategory, createProduct, updateProduct, deleteProduct } from '@/lib/admin-api';
import { Trash2, Plus, ChevronDown, LayoutGrid, Package, DollarSign, Image as ImageIcon, Edit2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MenuPage() {
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formError, setFormError] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Edit/Add States
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [categoryEditName, setCategoryEditName] = useState('');

    const [itemData, setItemData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        description: '',
        imageUrl: ''
    });

    const loadMenu = async () => {
        try {
            const data = await fetchMenu();
            const activeCategories = data.filter(
                (category: any) => category.isActive !== false && category.active !== false,
            );
            setMenu(activeCategories);
            if (activeCategories.length > 0 && expandedCategories.length === 0) {
                setExpandedCategories([activeCategories[0].id]);
            }
        } catch (error) {
            console.error('Failed to load menu', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        await createCategory(newCategoryName);
        setNewCategoryName('');
        loadMenu();
    };

    const handleUpdateCategory = async (id: string) => {
        if (!categoryEditName) return;
        await updateCategory(id, categoryEditName);
        setEditingCategory(null);
        loadMenu();
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Estás seguro? Se ocultará la categoría y todos sus productos.')) return;
        try {
            await deleteCategory(id);
            setMenu((prev) => prev.filter((category) => category.id !== id));
            setExpandedCategories((prev) => prev.filter((categoryId) => categoryId !== id));
            loadMenu();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo eliminar la categoría';
            alert(message);
        }
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSaveItem = async (categoryId: string) => {
        setFormError('');

        const name = itemData.name.trim();
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

        const originalRaw = itemData.originalPrice.trim();
        let originalPriceCents: number | undefined;
        if (originalRaw.length > 0) {
            const originalNumber = Number(originalRaw);
            if (!Number.isFinite(originalNumber) || originalNumber < 0) {
                setFormError('El precio anterior debe ser un numero valido.');
                return;
            }
            originalPriceCents = Math.round(originalNumber * 100);
        }

        const payload = {
            category_id: categoryId,
            name,
            price_cents: Math.round(priceNumber * 100),
            original_price_cents: originalPriceCents,
            description: description || undefined,
            image_url: imageUrl || undefined,
        };

        try {
            if (editingItem) {
                await updateProduct(editingItem.id, payload);
            } else {
                await createProduct(payload);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo guardar el producto';
            setFormError(message);
            return;
        }

        setAddingItemTo(null);
        setEditingItem(null);
        setItemData({ name: '', price: '', originalPrice: '', description: '', imageUrl: '' });
        loadMenu();
    };

    const startEditingItem = (item: any, categoryId: string) => {
        setEditingItem(item);
        setAddingItemTo(categoryId);
        setItemData({
            name: item.name,
            price: (item.priceCents / 100).toString(),
            originalPrice: item.originalPriceCents ? (item.originalPriceCents / 100).toString() : '',
            description: item.description || '',
            imageUrl: item.imageUrl || ''
        });
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Seguro quieres eliminar este producto?')) return;
        await deleteProduct(id);
        loadMenu();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10 font-sans pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2 leading-tight">Gestión del Menú</h1>
                    <p className="text-gray-500 font-medium">Crea una experiencia gastronómica inolvidable</p>
                </div>

                {/* Add Category Quick Form */}
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex gap-2">
                    <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nueva categoría (ej. Vinos)"
                        className="h-12 w-64 border-none bg-gray-50/50 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#C5A059]/30"
                    />
                    <Button onClick={handleCreateCategory} className="bg-[#C5A059] hover:bg-[#B48F4D] text-white rounded-xl h-12 px-6 shadow-lg shadow-[#C5A059]/20">
                        <Plus className="h-5 w-5 mr-2" /> Añadir
                    </Button>
                </div>
            </header>

            {/* Categories Grid */}
            <div className="space-y-6">
                {menu.map((category) => (
                    <div key={category.id} className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden transition-all duration-300">
                        <div
                            className={cn(
                                "flex items-center justify-between p-6 cursor-pointer select-none transition-colors",
                                expandedCategories.includes(category.id) ? "bg-[#FDFCFB]/80" : "hover:bg-gray-50/50"
                            )}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-md shadow-gray-200/50",
                                    expandedCategories.includes(category.id) ? "bg-[#C5A059] text-white rotate-6" : "bg-gray-100 text-gray-400"
                                )}>
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    {editingCategory === category.id ? (
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <Input
                                                value={categoryEditName}
                                                onChange={e => setCategoryEditName(e.target.value)}
                                                className="h-10 w-48 font-serif font-bold"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" onClick={() => handleUpdateCategory(category.id)} className="h-10 w-10 text-green-500 hover:bg-green-50">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(null)} className="h-10 w-10 text-gray-400 hover:bg-gray-50">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2 group/cat">
                                                {category.name}
                                                <Edit2
                                                    className="h-3 w-3 text-gray-300 opacity-0 group-hover/cat:opacity-100 cursor-pointer hover:text-[#C5A059] transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setEditingCategory(category.id); setCategoryEditName(category.name); }}
                                                />
                                            </h3>
                                            <p className="text-sm text-gray-400 font-medium tracking-wide">{category.items.length} productos</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                                <div className={cn("transition-transform duration-300", expandedCategories.includes(category.id) && "rotate-180")}>
                                    <ChevronDown className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {expandedCategories.includes(category.id) && (
                            <div className="p-8 bg-white border-t border-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {category.items.map((item: any) => (
                                        <div key={item.id} className="group relative bg-[#FDFCFB] p-5 rounded-3xl border border-gray-100 hover:border-[#C5A059]/30 transition-all hover:shadow-2xl hover:shadow-gray-200/60 overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="h-6 w-6 text-gray-200" />
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-gray-200 hover:text-[#C5A059] hover:bg-[#C5A059]/5 rounded-xl transition-colors"
                                                        onClick={() => startEditingItem(item, category.id)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-gray-900 group-hover:text-[#C5A059] transition-colors line-clamp-1 mb-1">{item.name}</h4>
                                            <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem] mb-4 font-medium leading-relaxed">{item.description || 'Sin descripción'}</p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    {item.originalPriceCents && (
                                                        <span className="text-[10px] text-gray-300 line-through font-bold -mb-1">
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
                                                    item.isActive ? "bg-green-50 text-green-500" : "bg-gray-50 text-gray-400"
                                                )}>
                                                    {item.isActive ? 'Activo' : 'Oculto'}
                                                </div>
                                            </div>

                                            {item.originalPriceCents && item.originalPriceCents > item.priceCents && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <div className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-xl shadow-sm">
                                                        Oferta
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Quick Add Product Card toggle */}
                                    {addingItemTo !== category.id && (
                                        <button
                                            onClick={() => setAddingItemTo(category.id)}
                                            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-100 rounded-3xl hover:border-[#C5A059]/40 hover:bg-[#FDFCFB] transition-all group text-gray-300 hover:text-[#C5A059]"
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
                                    <div className="bg-[#FDFCFB] p-8 rounded-[2rem] border border-[#C5A059]/20 shadow-inner space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-[#C5A059] rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
                                                <Package className="h-5 w-5 text-white" />
                                            </div>
                                            <h4 className="text-xl font-serif font-bold text-gray-900">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nombre</Label>
                                                <Input
                                                    value={itemData.name}
                                                    onChange={e => setItemData({ ...itemData, name: e.target.value })}
                                                    placeholder="Nombre del plato"
                                                    className="h-14 bg-white rounded-2xl border-gray-100 px-5 focus:ring-[#C5A059]/20"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Precio</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5A059]" />
                                                        <Input
                                                            type="number"
                                                            value={itemData.price}
                                                            onChange={e => setItemData({ ...itemData, price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 focus:ring-[#C5A059]/20 font-bold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Anterior (Oferta)</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                                        <Input
                                                            type="number"
                                                            value={itemData.originalPrice}
                                                            onChange={e => setItemData({ ...itemData, originalPrice: e.target.value })}
                                                            placeholder="Opcional"
                                                            className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 focus:ring-[#C5A059]/20 text-gray-300 line-through"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Descripción</Label>
                                            <Input
                                                value={itemData.description}
                                                onChange={e => setItemData({ ...itemData, description: e.target.value })}
                                                placeholder="Ingredientes, preparación, etc."
                                                className="h-14 bg-white rounded-2xl border-gray-100 px-5 focus:ring-[#C5A059]/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Url de Imagen (Opcional)</Label>
                                            <div className="relative">
                                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                                <Input
                                                    value={itemData.imageUrl}
                                                    onChange={e => setItemData({ ...itemData, imageUrl: e.target.value })}
                                                    placeholder="https://images.unsplash.com/..."
                                                    className="h-14 bg-white rounded-2xl border-gray-100 pl-12 pr-5 focus:ring-[#C5A059]/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button onClick={() => handleSaveItem(category.id)} className="flex-1 h-14 bg-[#C5A059] hover:bg-[#B48F4D] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#C5A059]/20">
                                                {editingItem ? 'Actualizar Producto' : 'Guardar Producto'}
                                            </Button>
                                            <Button variant="ghost" onClick={() => { setAddingItemTo(null); setEditingItem(null); setItemData({ name: '', price: '', originalPrice: '', description: '', imageUrl: '' }); }} className="h-14 px-8 text-gray-400 font-bold rounded-2xl hover:bg-gray-100">
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
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Comienza tu menú</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-medium">Añade tu primera categoría arriba para empezar a cargar tus platos y bebidas.</p>
                </div>
            )}
        </div>
    );
}
