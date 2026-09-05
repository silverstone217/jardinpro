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

export type StaffAssignmentUser = {
  id: string;
  name: string;
  email: string;
  telephone: string;
  image: string | null;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
};

export type StaffAssignmentPointOfSale = {
  id: string;
  name: string;
  code: string;
};

export type StaffAssignment = {
  id: string;
  userId: string;
  shopId: string;
  pointOfSaleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  user: StaffAssignmentUser;

  pointOfSale: StaffAssignmentPointOfSale;
};

export type PointOfSaleWithAssignments = {
  id: string;
  shopId: string;
  name: string;
  code: string;
  telephone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignments: StaffAssignment[];
};

export type CreateStaffAssignmentInput = {
  userId: string;
  pointOfSaleId: string;
};
/**
 * Réponse de GET /api/v1/employees/[id]/assignments
 */
export type GetStaffAssignmentResponse = {
  message: string;
  assignment: StaffAssignment | null;
};

/**
 * Réponse de GET /api/v1/staff-assignments
 */
export type GetStaffAssignmentsResponse = {
  message: string;
  assignments: PointOfSaleWithAssignments[];
};

/**
 * Réponse après affectation.
 */
export type CreateStaffAssignmentResponse = {
  message: string;
  assignment: StaffAssignment;
};

/**
 * Réponse après désaffectation.
 */
export type DeactivateStaffAssignmentResponse = {
  message: string;
  assignment: StaffAssignment;
};
