import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
    className?: string;
    size?: number;
    priority?: boolean;
};

export function BrandMark({ className, size = 48, priority = false }: BrandMarkProps) {
    return (
        <Image
            src="/daltri-mark.svg"
            alt="Daltri Menu"
            width={size}
            height={size}
            priority={priority}
            className={cn('select-none', className)}
        />
    );
}
