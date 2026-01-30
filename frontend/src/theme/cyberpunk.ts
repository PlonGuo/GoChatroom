import type { ThemeConfig } from 'antd';
import { cyberpunkColors } from './tokens';

export const getCyberpunkTheme = (): ThemeConfig => ({
  token: {
    // Color tokens
    colorPrimary: cyberpunkColors.neon.cyan,
    colorSuccess: cyberpunkColors.neon.green,
    colorWarning: cyberpunkColors.neon.yellow,
    colorError: cyberpunkColors.neon.magenta,
    colorInfo: cyberpunkColors.neon.purple,

    colorBgBase: cyberpunkColors.bg.primary,
    colorBgContainer: cyberpunkColors.bg.elevated,
    colorBgElevated: cyberpunkColors.bg.hover,
    colorBgLayout: cyberpunkColors.bg.secondary,

    colorText: cyberpunkColors.text.primary,
    colorTextSecondary: cyberpunkColors.text.secondary,
    colorTextDisabled: cyberpunkColors.text.disabled,

    colorBorder: cyberpunkColors.border.default,
    colorBorderSecondary: 'rgba(0, 240, 255, 0.1)',

    // Typography
    fontFamily: "'Rajdhani', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,

    // Border radius
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 2,

    // Spacing
    padding: 16,
    margin: 16,

    // Shadows (glows for cyberpunk)
    boxShadow: cyberpunkColors.glow.cyan,
    boxShadowSecondary: '0 0 12px rgba(191, 0, 255, 0.2)',
  },

  components: {
    Layout: {
      headerBg: cyberpunkColors.bg.primary,
      bodyBg: cyberpunkColors.bg.secondary,
      siderBg: cyberpunkColors.bg.primary,
      triggerBg: cyberpunkColors.bg.elevated,
      triggerColor: cyberpunkColors.neon.cyan,
    },

    Menu: {
      darkItemBg: cyberpunkColors.bg.primary,
      darkItemColor: cyberpunkColors.text.secondary,
      darkItemSelectedBg: 'rgba(0, 240, 255, 0.15)',
      darkItemSelectedColor: cyberpunkColors.neon.cyan,
      darkItemHoverBg: 'rgba(0, 240, 255, 0.08)',
      darkItemHoverColor: cyberpunkColors.neon.cyan,
    },

    Card: {
      colorBgContainer: cyberpunkColors.bg.elevated,
      colorBorderSecondary: cyberpunkColors.border.default,
    },

    Button: {
      primaryColor: cyberpunkColors.text.inverse,
      primaryShadow: cyberpunkColors.glow.cyan,
    },

    Input: {
      colorBgContainer: 'rgba(26, 31, 53, 0.6)',
      colorBorder: 'rgba(0, 240, 255, 0.3)',
      hoverBorderColor: cyberpunkColors.neon.cyan,
      activeBorderColor: cyberpunkColors.neon.cyan,
      activeShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.5)',
    },

    Avatar: {
      colorTextPlaceholder: cyberpunkColors.neon.cyan,
    },

    Badge: {
      colorError: cyberpunkColors.neon.magenta,
    },

    List: {
      colorBorder: 'rgba(0, 240, 255, 0.15)',
    },

    Modal: {
      contentBg: cyberpunkColors.bg.elevated,
      headerBg: cyberpunkColors.bg.primary,
    },

    Dropdown: {
      colorBgElevated: cyberpunkColors.bg.hover,
    },

    Tabs: {
      itemColor: cyberpunkColors.text.secondary,
      itemSelectedColor: cyberpunkColors.neon.cyan,
      itemHoverColor: cyberpunkColors.neon.cyan,
      inkBarColor: cyberpunkColors.neon.cyan,
    },
  },
});
