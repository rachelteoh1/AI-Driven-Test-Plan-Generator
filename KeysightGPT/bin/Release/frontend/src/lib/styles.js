export const COLORS = {
  primary: "#EF4444",
  secondary: "#3B82F6",
  'greyblue': "#DCDFEA", // hover
  'lightgreyblue':"#ECEEF6", // newchat
  'primarylight':"#F7F9FB", // chat response and input
  'blue':"#3D5A80", // done
  'lightblue':"#D7E3F3", //tick circle
  'grey':"#C8C9D0" ,//cancel
  'red':"#EA072E", //delete
  'black':"#000000",
    'dark': "#1F2937",       // gray-800
    'medium': "#6B7280",     // gray-600
    'light': "#9CA3AF",      // gray-400
    'accent': "#3B82F6",  
    'textblue':"#88A9D7", // blue-500
  
  background: {
    light: "#F9FAFB",      // gray-50
    medium: "#F3F4F6",     // gray-100
  }
}

export const FONTSIZE = {
  
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem" // 30px
}

export const FONTWEIGHT = {
    light: 300,
    normal: 400,
    medium: 500,
    bold: 700
}

export const SPACING = {
  sm: "0.5rem",   // 8px
  md: "1rem",     // 16px
  lg: "1.5rem",   // 24px
  xl: "2rem",     // 32px
  "2xl": "3rem"   // 48px
}

// theme.js or styles.js

export const lightTheme = {
  background: "#F9FAFB",
  backgroundMedium: "#F3F4F6",
  text: "#000000",
  card: "#FFFFFF",

  primary: "#EF4444",
  secondary: "#3B82F6",
  accent: "#3B82F6",

  hover: "#ECEEF6",
  newChat: "#DCDFEA",
  primaryLight: "#F7F9FB",

  status: {
    done: "#3D5A80",
    cancel: "#C8C9D0",
    delete: "#EA072E",
    tick: "#D7E3F3",
  },

  greys: {
    dark: "#1F2937",
    medium: "#6B7280",
    light: "#9CA3AF",
    textblue: "#88A9D7",
  },

  sidebar: {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    accentPurple: "#667eea",
    border: "#e5e7eb",
    scrollbarThumb: "#d1d5db",
    scrollbarThumbHover: "#9ca3af",
    footerBg: "#f9fafb",
    dangerHover: "#fee2e2",
  },

  conversation: {
    editBorder: "#c0dbea",
    versionBorder: "#e0e0e0",
    versionText: "#666",
    actionBg: "#F9FAFB",
    actionBorder: "#e5e7eb",
  },

  home: {
    pageGradient: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
    logoGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    titleGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    subtitle: "#6b7280",
    cardBorder: "#e5e7eb",
    cardBg: "#ffffff",
    cardText: "#374151",
    cardHoverBorder: "#667eea",
  },
};

export const darkTheme = {
  background: "#1F2937",
  backgroundMedium: "#374151",
  text: "#F9FAFB",
  card: "#111827",

  primary: "#EF4444",
  secondary: "#3B82F6",
  accent: "#186ef7ff",

  hover: "#374151",
  newChat: "#2D3748",
  primaryLight: "#1A202C",

  status: {
    done: "#3D5A80",
    cancel: "#4B5563",
    delete: "#F87171",
    tick: "#2B6CB0",
  },

  greys: {
    dark: "#D1D5DB",
    medium: "#9CA3AF",
    light: "#6B7280",
    textblue: "#60A5FA",
  },

  sidebar: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    accentPurple: "#a855f7",
    border: "#374151",
    scrollbarThumb: "#4B5563",
    scrollbarThumbHover: "#6B7280",
    footerBg: "#1F2937",
    dangerHover: "#7f1d1d",
  },

  conversation: {
    editBorder: "#3B82F6",
    versionBorder: "#374151",
    versionText: "#9CA3AF",
    actionBg: "#1F2937",
    actionBorder: "#1F2937",
  },

  home: {
    pageGradient: "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
    logoGradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    titleGradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    subtitle: "#9CA3AF",
    cardBorder: "#374151",
    cardBg: "#1F2937",
    cardText: "#E5E7EB",
    cardHoverBorder: "#a855f7",
  },
};

