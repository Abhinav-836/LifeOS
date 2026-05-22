import { useTheme } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useTheme>['colors']
) {
  const { colors, isDark } = useTheme();
  const colorFromProps = props[isDark ? 'dark' : 'light'];

  if (colorFromProps) {
    return colorFromProps;
  }
  return colors[colorName];
}