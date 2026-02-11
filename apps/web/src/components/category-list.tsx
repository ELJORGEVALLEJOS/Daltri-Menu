import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function CategoryList({ categories, slug }: { categories: any[], slug: string }) {
    return (
        <div className="space-y-3 mb-6">
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/m/${slug}#cat-${category.id}`}
                    className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-800">{category.name}</span>
                        <ChevronRight className="text-gray-400" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
