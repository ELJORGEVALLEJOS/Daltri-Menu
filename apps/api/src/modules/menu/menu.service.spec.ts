import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  const merchantFindFirstMock = jest.fn();
  const categoryFindManyMock = jest.fn();

  const prismaMock = {
    merchant: {
      findFirst: merchantFindFirstMock,
    },
    category: {
      findMany: categoryFindManyMock,
    },
  } as unknown as PrismaService;

  let service: MenuService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MenuService(prismaMock);
  });

  it('should throw NotFoundException when merchant does not exist', async () => {
    merchantFindFirstMock.mockResolvedValue(null);

    await expect(
      service.getMenu('f0ec4f4a-cf73-4f7b-92f3-89ea8fcfef91'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return active categories with active items', async () => {
    merchantFindFirstMock.mockResolvedValue({ id: 'merchant-id' });
    categoryFindManyMock.mockResolvedValue([{ id: 'cat-1', name: 'Combos' }]);

    const result = await service.getMenu('merchant-id');

    expect(result).toEqual([{ id: 'cat-1', name: 'Combos' }]);
    expect(categoryFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { merchantId: 'merchant-id', isActive: true },
      }),
    );
  });
});
