import { describe, it, expect } from 'vitest';
import { getCyberpunkTheme, getLightTheme } from './index';
import { cyberpunkColors, lightColors } from './tokens';

describe('Theme Configurations', () => {
  describe('cyberpunkColors', () => {
    it('should have correct primary neon color', () => {
      expect(cyberpunkColors.neon.cyan).toBe('#00f0ff');
    });

    it('should have correct background colors', () => {
      expect(cyberpunkColors.bg.primary).toBe('#0a0e1a');
      expect(cyberpunkColors.bg.secondary).toBe('#131825');
      expect(cyberpunkColors.bg.elevated).toBe('#1a1f35');
    });

    it('should have correct accent colors', () => {
      expect(cyberpunkColors.neon.purple).toBe('#bf00ff');
      expect(cyberpunkColors.neon.green).toBe('#00ff9f');
      expect(cyberpunkColors.neon.magenta).toBe('#ff006e');
    });

    it('should have correct text colors', () => {
      expect(cyberpunkColors.text.primary).toBe('#ffffff');
      expect(cyberpunkColors.text.secondary).toBe('#e0e0e0');
    });
  });

  describe('lightColors', () => {
    it('should have correct primary color', () => {
      expect(lightColors.colors.primary).toBe('#1677ff');
    });

    it('should have correct background colors', () => {
      expect(lightColors.bg.primary).toBe('#ffffff');
      expect(lightColors.bg.secondary).toBe('#f8f9fa');
    });

    it('should have correct standard colors', () => {
      expect(lightColors.colors.success).toBe('#52c41a');
      expect(lightColors.colors.warning).toBe('#faad14');
      expect(lightColors.colors.danger).toBe('#ff4d4f');
    });
  });

  describe('getCyberpunkTheme', () => {
    it('should return a valid ThemeConfig object', () => {
      const theme = getCyberpunkTheme();
      expect(theme).toBeDefined();
      expect(theme.token).toBeDefined();
      expect(theme.components).toBeDefined();
    });

    it('should have correct token values', () => {
      const theme = getCyberpunkTheme();
      expect(theme.token?.colorPrimary).toBe('#00f0ff');
      expect(theme.token?.colorBgBase).toBe('#0a0e1a');
      expect(theme.token?.colorText).toBe('#ffffff');
    });

    it('should include Rajdhani and Orbitron fonts', () => {
      const theme = getCyberpunkTheme();
      expect(theme.token?.fontFamily).toContain('Rajdhani');
      expect(theme.token?.fontFamily).toContain('Orbitron');
    });

    it('should configure Layout component', () => {
      const theme = getCyberpunkTheme();
      expect(theme.components?.Layout).toBeDefined();
    });

    it('should configure Button component', () => {
      const theme = getCyberpunkTheme();
      expect(theme.components?.Button).toBeDefined();
    });

    it('should configure Input component', () => {
      const theme = getCyberpunkTheme();
      expect(theme.components?.Input).toBeDefined();
    });

    it('should configure Card component', () => {
      const theme = getCyberpunkTheme();
      expect(theme.components?.Card).toBeDefined();
    });
  });

  describe('getLightTheme', () => {
    it('should return a valid ThemeConfig object', () => {
      const theme = getLightTheme();
      expect(theme).toBeDefined();
      expect(theme.token).toBeDefined();
    });

    it('should have standard light theme colors', () => {
      const theme = getLightTheme();
      expect(theme.token?.colorPrimary).toBe('#1677ff');
      expect(theme.token?.colorSuccess).toBe('#52c41a');
      expect(theme.token?.colorWarning).toBe('#faad14');
      expect(theme.token?.colorError).toBe('#ff4d4f');
    });

    it('should use system fonts', () => {
      const theme = getLightTheme();
      const fontFamily = theme.token?.fontFamily || '';
      expect(fontFamily).toContain('-apple-system');
      expect(fontFamily).toContain('Segoe UI');
    });

    it('should use defaultAlgorithm', () => {
      const theme = getLightTheme();
      expect(theme.algorithm).toBeDefined();
    });
  });

  describe('theme consistency', () => {
    it('should have different primary colors for each theme', () => {
      const cyberpunk = getCyberpunkTheme();
      const light = getLightTheme();
      expect(cyberpunk.token?.colorPrimary).not.toBe(light.token?.colorPrimary);
    });

    it('should have different background colors for each theme', () => {
      const cyberpunk = getCyberpunkTheme();
      const light = getLightTheme();
      expect(cyberpunk.token?.colorBgBase).not.toBe(light.token?.colorBgBase);
    });

    it('should both have required token properties', () => {
      const cyberpunk = getCyberpunkTheme();
      const light = getLightTheme();
      
      ['colorPrimary', 'colorBgBase', 'fontFamily'].forEach(prop => {
        expect(cyberpunk.token).toHaveProperty(prop);
        expect(light.token).toHaveProperty(prop);
      });
    });
  });
});
