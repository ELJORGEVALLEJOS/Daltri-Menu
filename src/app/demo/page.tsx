import { redirect } from 'next/navigation';

const DEMO_SLUG =
    process.env.NEXT_PUBLIC_DEMO_CATALOG_SLUG?.trim() || 'casa-nera-cafe';

export default function DemoPage() {
    redirect(`/m/${DEMO_SLUG}`);
}
