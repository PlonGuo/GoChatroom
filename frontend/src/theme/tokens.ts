// Color tokens for cyberpunk and light themes

export const cyberpunkColors = {
  // Background layers
  bg: {
    primary: '#0a0e1a',      // Deep dark blue-black
    secondary: '#131825',    // Slightly lighter
    elevated: '#1a1f35',     // Card backgrounds
    hover: '#252b45',        // Hover states
  },

  // Neon accents
  neon: {
    cyan: '#00f0ff',         // Primary neon cyan
    magenta: '#ff006e',      // Secondary neon magenta
    yellow: '#ffea00',       // Tertiary neon yellow
    purple: '#bf00ff',       // Accent purple
    green: '#00ff9f',        // Success green
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #00f0ff 0%, #bf00ff 100%)',
    secondary: 'linear-gradient(135deg, #ff006e 0%, #ffea00 100%)',
    card: 'linear-gradient(180deg, rgba(0,240,255,0.05) 0%, rgba(191,0,255,0.05) 100%)',
  },

  // Text
  text: {
    primary: '#ffffff',      // Pure white for maximum readability
    secondary: '#e0e0e0',    // Light gray for secondary text
    disabled: '#808080',     // Medium gray for disabled
    inverse: '#0a0e1a',      // For light backgrounds
  },

  // UI Elements
  border: {
    default: 'rgba(0, 240, 255, 0.2)',
    hover: 'rgba(0, 240, 255, 0.5)',
    active: '#00f0ff',
  },

  // Shadows and glows
  glow: {
    cyan: '0 0 20px rgba(0, 240, 255, 0.3)',
    cyanStrong: '0 0 20px rgba(0, 240, 255, 0.5)',
    magenta: '0 0 20px rgba(255, 0, 110, 0.5)',
    purple: '0 0 20px rgba(191, 0, 255, 0.5)',
  },
};

export const lightColors = {
  bg: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    elevated: '#ffffff',
    hover: '#f0f2f5',
  },

  // Vibrant but not neon colors
  colors: {
    primary: '#1677ff',      // Ant Design blue
    secondary: '#722ed1',    // Purple
    success: '#52c41a',      // Green
    warning: '#faad14',      // Yellow
    danger: '#ff4d4f',       // Red
  },

  text: {
    primary: '#000000',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#ffffff',
  },

  border: {
    default: '#d9d9d9',
    hover: '#40a9ff',
    active: '#1677ff',
  },

  // Soft shadows instead of glows
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  },
};
