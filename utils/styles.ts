import { StyleSheet } from "react-native";

// COLORS
export const COLORS = {
  primary: "#2D5A27",
  secondary: "#FF9F1C",
  tertiary: "#FFBF00",
  neutral: "#FDFCF8",
  background: "#F5F5F5",
  text: "#333333",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",
  lightGray: "#E0E0E0",
  Gray: "#9E9E9E",
  darkGray: "#545454",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// FONT FAMILIES
export const fonts = {
  light: "Manrope_300Light",
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
} as const;

// FONT SIZES
export const fontSizes = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 28,
  xxxlarge: 32,
  lessoverlarge: 38,
  overlarge: 42,
};

// TYPOGRAPHY STYLES
export const typography = StyleSheet.create({
  display: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxxlarge,
    lineHeight: fontSizes.xxxlarge * 1.25,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xlarge,
    lineHeight: fontSizes.xlarge * 1.25,
  },

  heading: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.25,
  },

  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    lineHeight: fontSizes.medium * 1.25,
  },

  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.medium,
    lineHeight: fontSizes.medium * 1.25,
  },

  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.25,
  },

  price: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.25,
  },
});

export const SETTINGS_COLORS = {
  account: {
    background: "#FFF1E2",
    icon: "#E67E22",
  },

  business: {
    background: "#E8F2E5",
    icon: "#2D5A27",
  },

  production: {
    background: "#FFF4D9",
    icon: "#D88A00",
  },

  customers: {
    background: "#E8F1FB",
    icon: "#3478C5",
  },
  sales: {
    background: "#E8F1FB",
    icon: "#3478C5",
  },

  system: {
    background: "#F0EAF8",
    icon: "#7952A8",
  },
} as const;
