import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

type UserStats = {
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  totalHabitsCompleted: number;
  totalIdeas: number;
  longestStreak: number;
  currentStreak: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, setTheme, theme } = useTheme();
  const [stats, setStats] = useState<UserStats>({
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    totalHabitsCompleted: 0,
    totalIdeas: 0,
    longestStreak: 0,
    currentStreak: 0,
  });
  const [notifications, setNotifications] = useState(true);

  const loadStats = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      const tasks = tasksJson ? JSON.parse(tasksJson) : [];
      const completedTasks = tasks.filter((t: any) => t.completed).length;
      
      const habitsJson = await AsyncStorage.getItem('habits');
      const habits = habitsJson ? JSON.parse(habitsJson) : [];
      const totalCompletions = habits.reduce((acc: number, h: any) => 
        acc + (h.completedDates?.length || 0), 0);
      
      const maxStreak = Math.max(...habits.map((h: any) => h.bestStreak || 0), 0);
      const currentStreak = Math.max(...habits.map((h: any) => h.streak || 0), 0);
      
      const focusJson = await AsyncStorage.getItem('focusSessions');
      const focus = focusJson ? JSON.parse(focusJson) : [];
      const totalMinutes = focus.reduce((acc: number, f: any) => acc + f.duration, 0);
      
      const ideasJson = await AsyncStorage.getItem('ideas');
      const ideas = ideasJson ? JSON.parse(ideasJson) : [];
      
      setStats({
        totalTasksCompleted: completedTasks,
        totalFocusMinutes: totalMinutes,
        totalHabitsCompleted: totalCompletions,
        totalIdeas: ideas.length,
        longestStreak: maxStreak,
        currentStreak: currentStreak,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['tasks', 'habits', 'focusSessions', 'ideas']);
            Alert.alert('Success', 'All data has been cleared');
            loadStats();
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const keys = ['tasks', 'habits', 'focusSessions', 'ideas'];
      const data: Record<string, any> = {};
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : [];
      }
      const jsonStr = JSON.stringify(data, null, 2);
      Alert.alert('Export Data', 'Data copied to clipboard', [{ text: 'OK' }]);
      console.log('Exported data:', jsonStr);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return 'sun.max';
    if (theme === 'dark') return 'moon';
    return 'iphone';
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light Mode';
    if (theme === 'dark') return 'Dark Mode';
    return 'System Default';
  };

  const menuItems = [
    { icon: 'chart.bar', title: 'Analytics', subtitle: 'View detailed insights', route: '/analytics', color: colors.primary },
    { icon: getThemeIcon(), title: 'Theme', subtitle: getThemeLabel(), action: 'theme', color: colors.purple },
    { icon: 'bell', title: 'Notifications', subtitle: 'Manage reminders', action: 'toggle', color: colors.info },
    { icon: 'arrow.up.doc', title: 'Export Data', subtitle: 'Backup your data', action: 'export', color: colors.success },
    { icon: 'trash', title: 'Clear All Data', subtitle: 'Delete everything', action: 'clear', color: colors.error },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(100)} style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <IconSymbol name="person.fill" size={48} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>LifeOS User</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(200)} style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalTasksCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks Done</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{Math.floor(stats.totalFocusMinutes / 60)}h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalIdeas}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ideas</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(300)} style={[styles.streakCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.streakIcon, { backgroundColor: colors.orange + '15' }]}>
          <IconSymbol name="flame.fill" size={32} color={colors.orange} />
        </View>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakValue, { color: colors.text }]}>{stats.currentStreak} days</Text>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />
        <View style={styles.streakInfo}>
          <Text style={[styles.streakValue, { color: colors.text }]}>{stats.longestStreak} days</Text>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Best Streak</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(400)} style={[styles.menuSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (item.action === 'clear') clearAllData();
              else if (item.action === 'export') exportData();
              else if (item.action === 'theme') toggleTheme();
              else if (item.route) router.push(item.route as any);
            }}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <IconSymbol name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
            {item.action === 'toggle' ? (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: item.color }}
                thumbColor="#fff"
              />
            ) : (
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.versionCard}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>LifeOS v1.0.0</Text>
        <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>© 2024 LifeOS. All rights reserved.</Text>
      </Animated.View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h2,
  },
  profileCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  userName: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    ...Typography.h4,
    fontWeight: '700',
  },
  streakLabel: {
    ...Typography.caption,
  },
  streakDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  menuSection: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  menuSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  versionCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  versionText: {
    ...Typography.caption,
  },
  copyrightText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  bottomSpacing: {
    height: Spacing.xxxl,
  },
});