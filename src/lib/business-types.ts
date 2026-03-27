export type BusinessType =
    | 'generic'
    | 'restaurant'
    | 'retail'
    | 'hardware'
    | 'fashion'
    | 'beauty';

export const BUSINESS_TYPE_OPTIONS: Array<{
    value: BusinessType;
    label: string;
    description: string;
}> = [
    {
        value: 'generic',
        label: 'General',
        description: 'Catálogo multipropósito para cualquier tipo de negocio.',
    },
    {
        value: 'restaurant',
        label: 'Gastronomía',
        description: 'Comidas, bebidas y pedidos por WhatsApp.',
    },
    {
        value: 'retail',
        label: 'Tienda',
        description: 'Ropa, accesorios, bazar, electrónica y más.',
    },
    {
        value: 'hardware',
        label: 'Ferretería',
        description: 'Herramientas, repuestos y materiales.',
    },
    {
        value: 'fashion',
        label: 'Moda',
        description: 'Indumentaria, calzado y accesorios.',
    },
    {
        value: 'beauty',
        label: 'Belleza',
        description: 'Cosmética, cuidado personal y bienestar.',
    },
];

export function getDefaultMenuCopyByBusinessType(businessType: BusinessType) {
    switch (businessType) {
        case 'restaurant':
            return {
                heroTitle: 'Sabores listos para pedir',
                heroSubtitle: 'Descubre platos, bebidas y combos para retiro o envío desde un solo catálogo.',
                heroBadge: 'Pedidos por WhatsApp',
            };
        case 'retail':
            return {
                heroTitle: 'Productos listos para llevar',
                heroSubtitle: 'Explora novedades, favoritos y lanzamientos para comprar por WhatsApp.',
                heroBadge: 'Compra simple',
            };
        case 'hardware':
            return {
                heroTitle: 'Soluciones para tu proyecto',
                heroSubtitle: 'Encuentra herramientas, repuestos y materiales en un solo lugar.',
                heroBadge: 'Stock activo',
            };
        case 'fashion':
            return {
                heroTitle: 'Colección seleccionada',
                heroSubtitle: 'Descubre prendas, accesorios y lanzamientos para tu estilo.',
                heroBadge: 'Nueva temporada',
            };
        case 'beauty':
            return {
                heroTitle: 'Belleza y cuidado',
                heroSubtitle: 'Compra productos de cuidado personal, cosmética y bienestar.',
                heroBadge: 'Favoritos',
            };
        case 'generic':
        default:
            return {
                heroTitle: 'Lo mejor de este negocio',
                heroSubtitle: 'Explora productos, categorías y opciones de compra en un catálogo fácil de compartir.',
                heroBadge: 'Compra directa',
            };
    }
}
