import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log('--- Database Connection Test ---');
    console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1]);

    try {
        await prisma.$connect();
        console.log('✅ Connection established successfully.');

        const slug = 'demo';
        console.log(`--- Simulating Menu Query for slug: ${slug} ---`);
        const restaurant = await prisma.merchant.findFirst({
            where: { slug: slug.toLowerCase(), isActive: true },
            include: {
                categories: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        items: {
                            where: { isActive: true },
                            orderBy: { name: 'asc' },
                        },
                    },
                },
            },
        });

        if (!restaurant) {
            console.error('❌ Restaurant not found');
        } else {
            console.log('✅ Restaurant found:', restaurant.name);
            console.log('✅ Categories count:', restaurant.categories.length);
            const result = {
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    whatsapp_phone: restaurant.whatsappNumber,
                    currency: restaurant.currency,
                },
                categories: restaurant.categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                    sort_order: category.sortOrder,
                    products: category.items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        price_cents: item.priceCents,
                        image_url: item.imageUrl,
                        active: item.isActive,
                    })),
                })),
            };
            console.log('✅ Mapping successful');
        }
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

test();
