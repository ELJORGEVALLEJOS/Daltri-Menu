'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage({ params }: { params: { slug: string } }) {
    const { items, removeItem, total } = useCart();
    const router = useRouter();
    const { slug } = params;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
                    <h2 className="text-xl font-serif font-bold mb-2 text-gray-800">Tu carrito está vacío</h2>
                    <p className="text-gray-500 mb-6">Parece que aún no has añadido nada.</p>
                    <Link href={`/m/${slug}`}>
                        <Button className="w-full bg-[#D4AF37] hover:bg-[#c4a132] text-white">Volver al Menú</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-[#EEDC82] pt-6 pb-12 px-4 rounded-b-[2rem] shadow-sm mb-[-2rem] relative z-0">
                <div className="container mx-auto max-w-md">
                    <div className="flex items-center mb-2">
                        <Link href={`/m/${slug}`} className="mr-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
                            <ArrowLeft className="h-6 w-6 text-gray-900" />
                        </Link>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Tu Pedido</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 max-w-md relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {items.map((item, index) => (
                        <div key={item.id} className={`flex justify-between items-center p-5 ${index !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div>
                                <h3 className="font-bold text-gray-800">{item.name}</h3>
                                <div className="text-sm text-gray-400 mt-1 font-medium">
                                    ${item.price} x {item.quantity}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-serif font-black text-gray-900 text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total del pedido</span>
                    <span className="text-2xl font-serif font-black text-gold-dark">${total.toFixed(2)}</span>
                </div>

                <Button
                    className="w-full bg-gray-900 hover:bg-black text-white h-16 text-lg font-bold rounded-2xl shadow-xl shadow-gray-900/10 transition-all active:scale-[0.98]"
                    onClick={() => router.push(`/m/${slug}/checkout`)}
                >
                    Continuar con el pedido
                </Button>
            </div>
        </div>
    );
}
