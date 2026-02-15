import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRegistration() {
    const data = {
        name: 'Daltri Shop Test',
        slug: '1234-test-' + Date.now().toString().slice(-4),
        whatsapp_phone: '+54 2974946299',
        address: 'los pinos'
    };

    console.log('--- Testing Registration Logic ---');
    console.log('Data:', data);

    try {
        const cleanPhone = data.whatsapp_phone.replace(/\D/g, '');
        console.log('Cleaned phone:', cleanPhone);

        const merchant = await prisma.merchant.create({
            data: {
                name: data.name,
                slug: data.slug.toLowerCase(),
                whatsappNumber: cleanPhone,
                address: data.address,
                isActive: true,
                currency: 'ARS',
            },
        });

        console.log('✅ Merchant created successfully:', merchant.id);
    } catch (error) {
        console.error('❌ Registration failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistration();
