export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  
  // Surface colors (cards, panels, etc.)
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    glass: string;
    glassHover: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    accent: string;
    glass: string;
  };
  
  // Accent colors (cyan/blue theme)
  accent: {
    primary: string;
    secondary: string;
    glow: string;
    glowHover: string;
  };
  
  // Interactive states
  interactive: {
    hover: string;
    active: string;
    focus: string;
    disabled: string;
  };
  
  // Shadow colors
  shadow: {
    card: string;
    header: string;
    pill: string;
    glow: string;
  };
  
  // Dynamic background colors
  backgroundDynamic: {
    bg1: string;
    bg2: string;
    node: string;
    linkBase: string;
    overlay: string;
  };
}

export const darkTheme: ThemeColors = {
  background: {
    primary: '#0c1a24',
    secondary: '#0a1620',
    tertiary: '#061B2C',
    overlay: 'rgba(0, 0, 0, 0.9)',
  },
  surface: {
    primary: '#263B4C',
    secondary: '#1a2a3a',
    tertiary: '#0f1a26',
    glass: 'rgba(38, 59, 76, 0.65)',
    glassHover: 'rgba(38, 59, 76, 0.8)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    inverse: '#000000',
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    accent: 'rgba(34, 211, 238, 0.3)',
    glass: 'rgba(255, 255, 255, 0.15)',
  },
  accent: {
    primary: '#22d3ee',
    secondary: '#06b6d4',
    glow: 'rgba(34, 211, 238, 0.6)',
    glowHover: 'rgba(34, 211, 238, 0.8)',
  },
  interactive: {
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(34, 211, 238, 0.2)',
    focus: 'rgba(34, 211, 238, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.1)',
  },
  shadow: {
    card: '3px 5px 4px rgba(0,0,0,0.25)',
    header: '3px 4px 4px rgba(0,0,0,0.25)',
    pill: '7px 4px 19px 4px rgba(0,0,0,0.25)',
    glow: '0 0 12px rgba(34, 211, 238, 0.25)',
  },
  backgroundDynamic: {
    bg1: '#0c1a24',
    bg2: '#0a1620',
    node: '#1fefff',
    linkBase: 'rgba(31, 239, 255, 0.2)',
    overlay: 'linear-gradient(rgba(11, 44, 78, 0.4), rgba(0, 0, 0, 0.9))',
  },
};

export const lightTheme: ThemeColors = {
  background: {
    primary: '#f8fafc',
    secondary: '#f1f5f9',
    tertiary: '#e2e8f0',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
  surface: {
    primary: 'rgba(255, 255, 255, 0.8)',
    secondary: 'rgba(248, 250, 252, 0.9)',
    tertiary: 'rgba(241, 245, 249, 0.9)',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassHover: 'rgba(255, 255, 255, 0.85)',
  },
  text: {
    primary: '#1e293b',
    secondary: 'rgba(30, 41, 59, 0.8)',
    tertiary: 'rgba(30, 41, 59, 0.6)',
    inverse: '#ffffff',
  },
  border: {
    primary: 'rgba(30, 41, 59, 0.1)',
    secondary: 'rgba(30, 41, 59, 0.05)',
    accent: 'rgba(34, 211, 238, 0.4)',
    glass: 'rgba(30, 41, 59, 0.15)',
  },
  accent: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.4)',
    glowHover: 'rgba(6, 182, 212, 0.6)',
  },
  interactive: {
    hover: 'rgba(6, 182, 212, 0.1)',
    active: 'rgba(6, 182, 212, 0.15)',
    focus: 'rgba(6, 182, 212, 0.3)',
    disabled: 'rgba(30, 41, 59, 0.1)',
  },
  shadow: {
    card: '3px 5px 4px rgba(0,0,0,0.1)',
    header: '3px 4px 4px rgba(0,0,0,0.1)',
    pill: '7px 4px 19px 4px rgba(0,0,0,0.1)',
    glow: '0 0 12px rgba(6, 182, 212, 0.2)',
  },
  backgroundDynamic: {
    bg1: '#e0f2fe',
    bg2: '#bae6fd',
    node: '#0891b2',
    linkBase: 'rgba(8, 145, 178, 0.3)',
    overlay: 'linear-gradient(rgba(186, 230, 253, 0.3), rgba(255, 255, 255, 0.7))',
  },
};

export function getThemeColors(theme: 'dark' | 'light'): ThemeColors {
  return theme === 'dark' ? darkTheme : lightTheme;
}

