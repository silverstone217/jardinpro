export type Currency = "CDF" | "USD" | "EUR";

export interface Shop {
  id: string;
  singleton: string;
  name: string;
  logo: string | null;
  slogan: string | null;
  telephone: string;
  email: string | null;
  address: string;
  currency: Currency;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopInput {
  name: string;
  slogan?: string;
  telephone: string;
  email?: string;
  address: string;
  currency?: Currency;
}

export interface UpdateShopInput {
  name?: string;
  slogan?: string;
  telephone?: string;
  email?: string;
  address?: string;
  currency?: Currency;
}
