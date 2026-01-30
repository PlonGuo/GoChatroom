import { theme, type ThemeConfig } from 'antd';
import { lightColors } from './tokens';

export const getLightTheme = (): ThemeConfig => ({
  algorithm: theme.defaultAlgorithm, // Use Ant Design's default algorithm

  token: {
    colorPrimary: lightColors.colors.primary,
    colorSuccess: lightColors.colors.success,
    colorWarning: lightColors.colors.warning,
    colorError: lightColors.colors.danger,

    // Standard light theme colors
    colorBgBase: lightColors.bg.primary,
    colorBgContainer: lightColors.bg.primary,
    colorBgElevated: lightColors.bg.primary,
    colorBgLayout: '#f0f2f5',

    colorText: lightColors.text.primary,
    colorTextSecondary: lightColors.text.secondary,

    colorBorder: lightColors.border.default,

    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    borderRadius: 6,
  },

  components: {
    // Minimal overrides, use defaults
    Card: {
      boxShadowTertiary: lightColors.shadow.md,
    },
  },
});
