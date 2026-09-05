import { create } from "zustand";

import { api } from "@/utils/api";

import type {
  CreateStaffAssignmentInput,
  CreateStaffAssignmentResponse,
  DeactivateStaffAssignmentResponse,
  GetStaffAssignmentResponse,
  GetStaffAssignmentsResponse,
  PointOfSaleWithAssignments,
  StaffAssignment,
} from "@/types/staffAssignment";

type StaffAssignmentStore = {
  /**
   * Tous les points de vente avec leurs affectations actives.
   */
  pointsOfSale: PointOfSaleWithAssignments[];

  /**
   * États de chargement.
   */
  isLoading: boolean;
  isAssigning: boolean;
  isUnassigning: boolean;
  isFetchingAssignment: boolean;

  /**
   * Récupérer tous les points de vente avec leurs affectations.
   *
   * GET /staff-assignments
   */
  fetchStaffAssignments: () => Promise<void>;

  /**
   * Récupérer l'affectation active d'un employé.
   *
   * GET /employees/[id]/assignment
   */
  getEmployeeAssignment: (userId: string) => Promise<StaffAssignment | null>;

  /**
   * Affecter un employé à un point de vente.
   *
   * POST /employees/[id]/assignment
   */
  assignEmployee: (
    userId: string,
    pointOfSaleId: string,
  ) => Promise<StaffAssignment>;

  /**
   * Désaffecter un employé de son point de vente actuel.
   *
   * PATCH /employees/[id]/assignment
   */
  unassignEmployee: (userId: string) => Promise<StaffAssignment>;

  /**
   * Récupérer un point de vente depuis le store.
   */
  getPointOfSaleById: (
    pointOfSaleId: string,
  ) => PointOfSaleWithAssignments | undefined;

  /**
   * Récupérer l'affectation active d'un employé
   * directement depuis le store.
   */
  getAssignmentByUserId: (userId: string) => StaffAssignment | undefined;

  /**
   * Vider le store.
   */
  clearStaffAssignments: () => void;
};

export const useStaffAssignmentStore = create<StaffAssignmentStore>(
  (set, get) => ({
    pointsOfSale: [],

    isLoading: false,
    isAssigning: false,
    isUnassigning: false,
    isFetchingAssignment: false,

    /**
     * Récupérer tous les points de vente
     * avec leurs affectations actives.
     */
    fetchStaffAssignments: async () => {
      set({ isLoading: true });

      try {
        const response =
          await api.get<GetStaffAssignmentsResponse>("/staff-assignments");

        set({
          pointsOfSale: response.data.assignments,
        });
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * Récupérer l'affectation active d'un employé.
     *
     * Le backend retourne :
     *
     * 200 + assignment
     *
     * ou
     *
     * 200 + assignment: null
     *
     * lorsqu'il n'est pas affecté.
     */
    getEmployeeAssignment: async (userId) => {
      set({ isFetchingAssignment: true });

      try {
        const response = await api.get<GetStaffAssignmentResponse>(
          `/employees/${userId}/assignment`,
        );

        return response.data.assignment ?? null;
      } finally {
        set({ isFetchingAssignment: false });
      }
    },

    /**
     * Affecter un employé à un point de vente.
     *
     * IMPORTANT :
     * Si le backend retourne 409 ALREADY_ASSIGNED,
     * l'erreur Axios est volontairement laissée remonter.
     *
     * Le modal pourra alors récupérer :
     *
     * error.response.data.message
     */
    assignEmployee: async (userId, pointOfSaleId) => {
      set({ isAssigning: true });

      try {
        const data: CreateStaffAssignmentInput = {
          userId,
          pointOfSaleId,
        };

        const response = await api.post<CreateStaffAssignmentResponse>(
          `/employees/${userId}/assignment`,
          data,
        );

        const assignment = response.data.assignment;

        /**
         * Mise à jour immédiate du store
         * sans refaire une requête GET.
         */
        set((state) => ({
          pointsOfSale: state.pointsOfSale.map((pointOfSale) => {
            if (pointOfSale.id !== pointOfSaleId) {
              return pointOfSale;
            }

            /**
             * Sécurité supplémentaire :
             * éviter d'ajouter deux fois la même affectation
             * dans le store.
             */
            const alreadyExists = pointOfSale.assignments.some(
              (existingAssignment) => existingAssignment.id === assignment.id,
            );

            if (alreadyExists) {
              return pointOfSale;
            }

            return {
              ...pointOfSale,
              assignments: [...pointOfSale.assignments, assignment],
            };
          }),
        }));

        return assignment;
      } finally {
        set({ isAssigning: false });
      }
    },

    /**
     * Désaffecter un employé.
     *
     * L'affectation n'est pas supprimée en base.
     * Elle devient simplement inactive.
     */
    unassignEmployee: async (userId) => {
      set({ isUnassigning: true });

      try {
        const response = await api.patch<DeactivateStaffAssignmentResponse>(
          `/employees/${userId}/assignment`,
        );

        const assignment = response.data.assignment;

        /**
         * Comme le store contient uniquement les
         * affectations actives, on retire immédiatement
         * l'affectation désactivée du POS concerné.
         */
        set((state) => ({
          pointsOfSale: state.pointsOfSale.map((pointOfSale) => ({
            ...pointOfSale,

            assignments: pointOfSale.assignments.filter(
              (existingAssignment) => existingAssignment.id !== assignment.id,
            ),
          })),
        }));

        return assignment;
      } finally {
        set({ isUnassigning: false });
      }
    },

    /**
     * Récupérer un point de vente depuis le store.
     */
    getPointOfSaleById: (pointOfSaleId) => {
      return get().pointsOfSale.find(
        (pointOfSale) => pointOfSale.id === pointOfSaleId,
      );
    },

    /**
     * Récupérer l'affectation active d'un employé
     * directement depuis le store.
     */
    getAssignmentByUserId: (userId) => {
      for (const pointOfSale of get().pointsOfSale) {
        const assignment = pointOfSale.assignments.find(
          (assignment) => assignment.userId === userId && assignment.isActive,
        );

        if (assignment) {
          return assignment;
        }
      }

      return undefined;
    },

    /**
     * Vider le store.
     */
    clearStaffAssignments: () => {
      set({
        pointsOfSale: [],
      });
    },
  }),
);
