export type Employee = {
  id: string;
  name: string;
  telephone: string;
  email: string;
  image?: string | null;
  role: "EMPLOYEE";
  createdAt?: string;
  updatedAt?: string;
  isBanned: boolean;
  banExpiresAt?: string | null;
  banReason?: string | null;
};

export type CreateEmployeeInput = {
  name: string;
  telephone: string;
  email: string;
  // password: string;
};

export type UpdateEmployeeInput = {
  name?: string;
  telephone?: string;
  email?: string;
};
