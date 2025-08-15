// Цветовая палитра
export const colors = {
  primary: '#3B82F6',     // Синий
  secondary: '#10B981',   // Зелёный  
  danger: '#EF4444',      // Красный
  warning: '#F59E0B',     // Жёлтый
  
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6', 
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  white: '#FFFFFF',
  black: '#000000',
};

// Размеры и отступы
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Размеры текста
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Тема для светлого режима
export const lightTheme = {
  colors: {
    ...colors,
    background: colors.white,
    surface: colors.gray[50],
    text: colors.gray[900],
    textSecondary: colors.gray[600],
    border: colors.gray[200],
  },
  spacing,
  fontSize,
};

// Можно будет добавить тёмную тему
export const darkTheme = {
  colors: {
    ...colors,
    background: colors.gray[900],
    surface: colors.gray[800],
    text: colors.white,
    textSecondary: colors.gray[300],
    border: colors.gray[700],
  },
  spacing,
  fontSize,
};