import { PrismaService } from '../../prisma/prisma.service';
import { MerchantsService } from './merchants.service';

describe('MerchantsService', () => {
  const merchantCreateMock = jest.fn();
  const merchantFindManyMock = jest.fn();
  const merchantFindUniqueMock = jest.fn();

  const prismaMock = {
    merchant: {
      create: merchantCreateMock,
      findMany: merchantFindManyMock,
      findUnique: merchantFindUniqueMock,
    },
  } as unknown as PrismaService;

  let service: MerchantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MerchantsService(prismaMock);
  });

  it('should normalize slug and create merchant', async () => {
    merchantCreateMock.mockResolvedValue({ id: 'merchant-id' });

    const payload = {
      slug: 'Daltri-Centro',
      name: 'Daltri Centro',
      whatsappNumber: '+573001234567',
      logoUrl: 'https://example.com/logo.png',
      isActive: true,
      config: { currency: 'COP' },
    };

    await service.create(payload);

    const [createArgs] = merchantCreateMock.mock.calls[0] as [
      { data: { slug: string } },
    ];
    expect(createArgs.data.slug).toBe('daltri-centro');
  });

  it('should return only active merchants in findAll', async () => {
    merchantFindManyMock.mockResolvedValue([]);

    await service.findAll();

    expect(merchantFindManyMock).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  it('should load active categories and active items in findOne', async () => {
    merchantFindUniqueMock.mockResolvedValue(null);

    await service.findOne('DALTRI-CENTRO');

    expect(merchantFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'daltri-centro' },
      }),
    );
  });
});
