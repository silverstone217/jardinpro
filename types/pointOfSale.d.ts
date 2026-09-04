export type PointOfSale = {
  id: string;
  shopId: string;
  name: string;
  code: string;
  telephone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePointOfSaleInput = {
  name: string;
  code: string;
  telephone?: string;
  address?: string;
};

export type UpdatePointOfSaleInput = {
  name?: string;
  code?: string;
  telephone?: string;
  address?: string;
};

export type UpdatePointOfSaleStatusInput = {
  isActive: boolean;
};
