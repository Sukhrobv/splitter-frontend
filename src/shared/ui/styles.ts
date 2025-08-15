import { StyleSheet } from 'react-native';
import { lightTheme } from './theme';

// Базовые переиспользуемые стили
export const commonStyles = StyleSheet.create({
  // Контейнеры
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.background,
  },
  
  // Текст
  title: {
    fontSize: lightTheme.fontSize.xxxl,
    fontWeight: 'bold',
    color: lightTheme.colors.text,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: lightTheme.fontSize.base,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: lightTheme.spacing.sm,
  },
  
  // Кнопки
  button: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  buttonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.fontSize.base,
    fontWeight: '600',
  },
});