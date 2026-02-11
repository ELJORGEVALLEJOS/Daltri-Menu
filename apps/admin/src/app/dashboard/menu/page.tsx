'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchMenu, createCategory, deleteCategory, createItem, deleteItem } from '@/lib/api';
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';

export default function MenuPage() {
    const [menu, setMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // New Item State
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [newItemData, setNewItemData] = useState({ name: '', price: '', description: '', imageUrl: '' });

    const merchantId = typeof window !== 'undefined' ? localStorage.getItem('merchant_id') : null;

    const loadMenu = async () => {
        if (!merchantId) return;
        try {
            const data = await fetchMenu(merchantId);
            setMenu(data);
        } catch (error) {
            console.error('Failed to load menu', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, [merchantId]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchantId || !newCategoryName) return;
        await createCategory(merchantId, newCategoryName);
        setNewCategoryName('');
        loadMenu();
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will delete all items in this category.')) return;
        await deleteCategory(id);
        loadMenu();
    };

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleCreateItem = async (categoryId: string) => {
        if (!merchantId) return;
        await createItem(merchantId, categoryId, {
            name: newItemData.name,
            price: parseFloat(newItemData.price),
            description: newItemData.description,
            imageUrl: newItemData.imageUrl
        });
        setAddingItemTo(null);
        setNewItemData({ name: '', price: '', description: '', imageUrl: '' });
        loadMenu();
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        await deleteItem(id);
        loadMenu();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Menu Management</h1>

            {/* Add Category */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <form onSubmit={handleCreateCategory} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Label htmlFor="new-category">New Category Name</Label>
                        <Input
                            id="new-category"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Burgers, Drinks"
                            className="mt-2"
                        />
                    </div>
                    <Button type="submit">Add Category</Button>
                </form>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {menu.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50">
                            <div
                                className="flex items-center gap-2 cursor-pointer select-none flex-1"
                                onClick={() => toggleCategory(category.id)}
                            >
                                {expandedCategories.includes(category.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <h3 className="font-semibold text-lg">{category.name}</h3>
                                <span className="text-sm text-gray-500">({category.items.length} items)</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                                <Trash2 className="text-red-500 h-4 w-4" />
                            </Button>
                        </div>

                        {expandedCategories.includes(category.id) && (
                            <div className="p-4 border-t">
                                <div className="space-y-2 mb-4">
                                    {category.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-sm text-gray-500">${item.price} - {item.description}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="text-red-500 h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {category.items.length === 0 && <p className="text-gray-400 text-sm italic">No items in this category.</p>}
                                </div>

                                {addingItemTo === category.id ? (
                                    <div className="bg-gray-100 p-4 rounded border mt-4">
                                        <h4 className="font-medium mb-3">New Item</h4>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <Label>Name</Label>
                                                <Input value={newItemData.name} onChange={e => setNewItemData({ ...newItemData, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <Label>Price</Label>
                                                <Input type="number" value={newItemData.price} onChange={e => setNewItemData({ ...newItemData, price: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <Label>Description</Label>
                                            <Input value={newItemData.description} onChange={e => setNewItemData({ ...newItemData, description: e.target.value })} />
                                        </div>
                                        <div className="mb-3">
                                            <Label>Image URL (Optional)</Label>
                                            <Input value={newItemData.imageUrl} onChange={e => setNewItemData({ ...newItemData, imageUrl: e.target.value })} placeholder="https://..." />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleCreateItem(category.id)}>Save Item</Button>
                                            <Button variant="ghost" onClick={() => setAddingItemTo(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setAddingItemTo(category.id)}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Item
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
