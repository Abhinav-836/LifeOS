import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Daily reset function - FIXED
const checkDailyReset = async () => {
  try {
    const lastResetDate = await AsyncStorage.getItem('lastResetDate');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (lastResetDate !== today) {
      console.log('Running daily reset...');
      
      // Reset daily task completion status - DELETE COMPLETED TASKS
      const tasksJson = await AsyncStorage.getItem('tasks');
      if (tasksJson) {
        const tasks = JSON.parse(tasksJson);
        // Keep only incomplete tasks (delete completed ones)
        const incompleteTasks = tasks.filter((t: any) => !t.completed);
        await AsyncStorage.setItem('tasks', JSON.stringify(incompleteTasks));
        console.log(`Deleted ${tasks.length - incompleteTasks.length} completed tasks`);
      }
      
      // Habits don't need reset - they track completion by date automatically
      // The habit streak is calculated based on dates, so no action needed
      
      // Update last reset date
      await AsyncStorage.setItem('lastResetDate', today);
      console.log('Daily reset completed');
    }
  } catch (error) {
    console.error('Error checking daily reset:', error);
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkDailyReset();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="modal" 
              options={{ 
                presentation: 'modal',
                title: 'Settings',
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}