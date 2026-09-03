export type UserRole = "MANAGER" | "EMPLOYEE" | "ADMIN";

export type SettingsSection =
  | "account"
  | "business"
  | "sales"
  | "production"
  | "customers"
  | "system";

export type SettingsLink = {
  label: string;
  value: string;
  description?: string;
  icon: string;
  section: SettingsSection;
  roles: UserRole[];
};

export const LINKS_SETTINGS: SettingsLink[] = [
  {
    label: "Mon compte",
    value: "/settings/profile",
    description: "Gérer vos informations personnelles",
    icon: "user",
    section: "account",
    roles: ["MANAGER", "EMPLOYEE", "ADMIN"],
  },

  {
    label: "Sécurité",
    value: "/settings/security",
    description: "Mot de passe et sécurité du compte",
    icon: "lock",
    section: "account",
    roles: ["MANAGER", "EMPLOYEE", "ADMIN"],
  },

  {
    label: "Boutique",
    value: "/settings/shop",
    description: "Informations et identité de votre boutique",
    icon: "shopping-bag",
    section: "business",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Points de vente",
    value: "/settings/points-of-sale",
    description: "Gérer vos différents points de vente",
    icon: "map-pin",
    section: "business",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Personnel",
    value: "/settings/employees",
    description: "Gérer les employés et leurs affectations",
    icon: "users",
    section: "business",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Produits",
    value: "/settings/products",
    description: "Gérer les jus, saveurs, formats et prix",
    icon: "coffee",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Matières premières",
    value: "/settings/raw-materials",
    description: "Gérer les fruits et ingrédients",
    icon: "package",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Emballages",
    value: "/settings/packaging",
    description: "Gérer les bouteilles et autres emballages",
    icon: "box",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Production",
    value: "/settings/production",
    description: "Planifier et enregistrer les productions",
    icon: "activity",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Stock",
    value: "/settings/stock",
    description: "Consulter et gérer les mouvements de stock",
    icon: "archive",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Distribution",
    value: "/settings/distribution",
    description: "Distribuer les produits aux points de vente",
    icon: "truck",
    section: "production",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Clients",
    value: "/settings/customers",
    description: "Gérer les clients et leur historique",
    icon: "users",
    section: "customers",
    roles: ["MANAGER", "EMPLOYEE", "ADMIN"],
  },

  {
    label: "Fidélité",
    value: "/settings/loyalty",
    description: "Configurer le programme de fidélité",
    icon: "star",
    section: "customers",
    roles: ["MANAGER", "ADMIN"],
  },

  {
    label: "Notifications",
    value: "/settings/notifications",
    description: "Gérer les notifications",
    icon: "bell",
    section: "system",
    roles: ["MANAGER", "EMPLOYEE", "ADMIN"],
  },

  {
    label: "Préférences",
    value: "/settings/preferences",
    description: "Personnaliser votre expérience",
    icon: "sliders",
    section: "system",
    roles: ["MANAGER", "EMPLOYEE", "ADMIN"],
  },
];

// ---

export const SECTION_CONFIG: Record<
  SettingsSection,
  {
    title: string;
    description: string;
  }
> = {
  account: {
    title: "Mon compte",
    description: "Vos informations et la sécurité",
  },

  business: {
    title: "Entreprise",
    description: "Gérez votre activité et votre équipe",
  },

  sales: {
    title: "Ventes",
    description: "Paramètres liés aux ventes",
  },

  production: {
    title: "Production & stock",
    description: "Produits, matières premières et production",
  },

  customers: {
    title: "Clients",
    description: "Clients et programme de fidélité",
  },

  system: {
    title: "Application",
    description: "Préférences et notifications",
  },
};

export const SECTION_ORDER: SettingsSection[] = [
  "account",
  "business",
  "sales",
  "production",
  "customers",
  "system",
];
