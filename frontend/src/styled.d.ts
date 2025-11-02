import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    background: string;
    text: string;
    cardBackground: string;
    border: string;
    highlight: string;
    accent: string;
    darkShadow: string;
    lightText: string;
    neutralText: string;
    primaryGradient: string;
    primaryBoxShadow: string;
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      text: string;
    };
  }
} 