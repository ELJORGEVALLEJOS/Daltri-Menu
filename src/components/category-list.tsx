import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function CategoryList({ categories, slug }: { categories: any[], slug: string }) {
    return (
        <div className="space-y-4 mb-12">
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/m/${slug}#cat-${category.id}`}
                    className="group block bg-white rounded-2xl p-6 shadow-premium border border-gray-100/50 hover:scale-[1.01] transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-sans font-bold text-gray-800 leading-none">
                            {category.name}
                        </span>
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-gold transition-colors" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
