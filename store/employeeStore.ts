import {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from "@/types/employees";
import { StaffAssignment } from "@/types/staffAssignment";
import { api } from "@/utils/api";
import { create } from "zustand";

/**
 * ================================================================
 * STORE
 * ================================================================
 */

type EmployeeStore = {
  employees: Employee[];

  // États de chargement
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isUpdatingPassword: boolean;
  isBanning: boolean;

  // Actions
  fetchEmployees: () => Promise<void>;

  createEmployee: (data: CreateEmployeeInput) => Promise<Employee>;

  updateEmployee: (
    employeeId: string,
    data: UpdateEmployeeInput,
  ) => Promise<Employee>;

  updateEmployeePassword: (
    employeeId: string,
    password: string,
  ) => Promise<void>;

  banEmployee: (employeeId: string, banReason?: string) => Promise<Employee>;

  unbanEmployee: (employeeId: string) => Promise<Employee>;

  fetchPointOfSaleAssignments: (
    pointOfSaleId: string,
  ) => Promise<StaffAssignment[]>;
};

export const useEmployeeStore = create<EmployeeStore>((set) => ({
  /**
   * ============================================================
   * STATE
   * ============================================================
   */

  employees: [],

  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isUpdatingPassword: false,
  isBanning: false,

  /**
   * ============================================================
   * GET EMPLOYEES
   * ============================================================
   */

  fetchEmployees: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/employees");

      const employees = response.data?.employees ?? [];

      set({
        employees,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });

      throw error;
    }
  },

  /**
   * ============================================================
   * CREATE EMPLOYEE
   * ============================================================
   */

  createEmployee: async (data: CreateEmployeeInput) => {
    set({ isCreating: true });

    try {
      const response = await api.post("/employees", data);

      const employee = response.data?.employee;

      if (!employee) {
        throw new Error("EMPLOYEE_NOT_RETURNED");
      }

      set((state) => ({
        employees: [...state.employees, employee],
        isCreating: false,
      }));

      return employee;
    } catch (error) {
      set({ isCreating: false });

      throw error;
    }
  },

  /**
   * ============================================================
   * UPDATE EMPLOYEE
   * ============================================================
   */

  updateEmployee: async (employeeId: string, data: UpdateEmployeeInput) => {
    set({ isUpdating: true });

    try {
      const response = await api.patch(`/employees/${employeeId}`, data);

      const employee = response.data?.employee;

      if (!employee) {
        throw new Error("EMPLOYEE_NOT_RETURNED");
      }

      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === employeeId ? employee : item,
        ),
        isUpdating: false,
      }));

      return employee;
    } catch (error) {
      set({ isUpdating: false });

      throw error;
    }
  },

  /**
   * ============================================================
   * UPDATE PASSWORD
   * ============================================================
   */

  updateEmployeePassword: async (employeeId: string, password: string) => {
    set({ isUpdatingPassword: true });

    try {
      await api.patch(`/employees/${employeeId}/password`, {
        password,
      });

      set({
        isUpdatingPassword: false,
      });
    } catch (error) {
      set({
        isUpdatingPassword: false,
      });

      throw error;
    }
  },

  /**
   * ============================================================
   * BAN EMPLOYEE
   * ============================================================
   */

  banEmployee: async (employeeId: string, banReason?: string) => {
    set({ isBanning: true });

    try {
      const response = await api.patch(`/employees/${employeeId}/ban`, {
        isBanned: true,
        banReason,
      });

      const employee = response.data?.employee;

      if (!employee) {
        throw new Error("EMPLOYEE_NOT_RETURNED");
      }

      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === employeeId ? employee : item,
        ),
        isBanning: false,
      }));

      return employee;
    } catch (error) {
      set({ isBanning: false });

      throw error;
    }
  },

  /**
   * ============================================================
   * UNBAN EMPLOYEE
   * ============================================================
   */

  unbanEmployee: async (employeeId: string) => {
    set({ isBanning: true });

    try {
      const response = await api.patch(`/employees/${employeeId}/ban`, {
        isBanned: false,
      });

      const employee = response.data?.employee;

      if (!employee) {
        throw new Error("EMPLOYEE_NOT_RETURNED");
      }

      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === employeeId ? employee : item,
        ),
        isBanning: false,
      }));

      return employee;
    } catch (error) {
      set({ isBanning: false });

      throw error;
    }
  },

  /**
   * ============================================================
   * FETCH POINT OF SALE ASSIGNMENTS
   * ============================================================
   */
  fetchPointOfSaleAssignments: async (pointOfSaleId: string) => {
    const response = await api.get<{
      message: string;
      assignments: StaffAssignment[];
    }>(`/point-of-sales/${pointOfSaleId}/assignments`);

    return response.data.assignments;
  },
}));
