import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

type Stats = {
  totalTasks: number;
  completedTasks: number;
  habitStreak: number;
  totalFocusMinutes: number;
  weeklyProgress: number;
  todayHabits: number;
  totalHabits: number;
  productivityScore: number;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    habitStreak: 0,
    totalFocusMinutes: 0,
    weeklyProgress: 0,
    todayHabits: 0,
    totalHabits: 0,
    productivityScore: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 17) setGreeting('Afternoon');
    else setGreeting('Evening');
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      const tasks = tasksJson ? JSON.parse(tasksJson) : [];
      const completedTasks = tasks.filter((t: any) => t.completed).length;
      
      const habitsJson = await AsyncStorage.getItem('habits');
      const habits = habitsJson ? JSON.parse(habitsJson) : [];
      
      let streak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      let currentDate = new Date();
      
      while (streak < 365) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const completedToday = habits.some((h: any) => 
          h.completedDates?.includes(dateStr)
        );
        if (completedToday) streak++;
        else break;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      const todayHabits = habits.filter((h: any) => 
        h.completedDates?.includes(today)
      ).length;
      
      const focusJson = await AsyncStorage.getItem('focusSessions');
      const focus = focusJson ? JSON.parse(focusJson) : [];
      const totalFocusMinutes = focus.reduce((acc: number, f: any) => acc + f.duration, 0);
      
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const tasksThisWeek = tasks.filter((t: any) => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd && t.completed;
      }).length;
      
      // Productivity Score: 50% Tasks + 50% Focus (Habits removed)
      const taskScore = completedTasks / (tasks.length || 1);
      const focusScore = Math.min(totalFocusMinutes / 600, 1);
      const productivityScore = Math.round((taskScore * 0.5 + focusScore * 0.5) * 100);
      
      setStats({
        totalTasks: tasks.length,
        completedTasks,
        habitStreak: streak,
        totalFocusMinutes,
        weeklyProgress: tasksThisWeek,
        todayHabits,
        totalHabits: habits.length,
        productivityScore,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  // Stats Cards - Only 3 cards (removed Habit Streak card)
  const statsCards = [
    { label: 'Tasks Done', value: `${stats.completedTasks}/${stats.totalTasks}`, icon: 'checkmark.circle', color: colors.primary },
    { label: 'Focus Time', value: `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m`, icon: 'timer', color: colors.info },
    { label: 'Productivity', value: `${stats.productivityScore}%`, icon: 'chart.line.uptrend.xyaxis', color: colors.success },
  ];

  const quickActions = [
    { title: 'Focus', icon: 'timer', route: '/focus', color: colors.info },
    { title: 'Task', icon: 'plus.circle', route: '/tasks', color: colors.primary },
    { title: 'Habit', icon: 'repeat', route: '/habits', color: colors.success },
    { title: 'Idea', icon: 'lightbulb', route: '/ideas', color: colors.warning },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Good {greeting}!</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{format(currentTime, 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile' as any)}>
          <IconSymbol name="person.circle.fill" size={44} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(100)}>
        <View style={[styles.productivityCard, { backgroundColor: colors.surface }]}>
          <View style={styles.productivityHeader}>
            <Text style={[styles.productivityTitle, { color: colors.textSecondary }]}>Productivity Score</Text>
            <Text style={[styles.productivityValue, { color: colors.primary }]}>{stats.productivityScore}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${stats.productivityScore}%` }]} />
          </View>
          <Text style={[styles.productivitySubtext, { color: colors.textSecondary }]}>
            {stats.productivityScore >= 80 ? 'Excellent! Keep it up! 🎉' :
             stats.productivityScore >= 60 ? 'Good progress! 🚀' :
             stats.productivityScore >= 40 ? 'Building momentum 💪' :
             'Start your day strong! 🌅'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(200)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          {statsCards.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }, Shadows.md]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <IconSymbol name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <AnimatedTouchable
              key={index}
              entering={FadeInUp.delay(400 + index * 100)}
              layout={Layout.springify()}
              style={[styles.actionCard, { backgroundColor: colors.surface }, Shadows.md]}
              onPress={() => router.push(action.route as any)}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <IconSymbol name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            </AnimatedTouchable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Habits</Text>
          <TouchableOpacity onPress={() => router.push('/habits' as any)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.habitsCard, { backgroundColor: colors.surface }, Shadows.md]}>
          <View style={styles.habitStats}>
            <Text style={[styles.habitStatsValue, { color: colors.primary }]}>{stats.todayHabits}/{stats.totalHabits}</Text>
            <Text style={[styles.habitStatsLabel, { color: colors.textSecondary }]}>Completed Today</Text>
          </View>
          <View style={[styles.habitProgress, { backgroundColor: colors.border }]}>
            <View style={[styles.habitProgressFill, { backgroundColor: colors.success, width: `${(stats.todayHabits / (stats.totalHabits || 1)) * 100}%` }]} />
          </View>
          {stats.habitStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.orange + '15' }]}>
              <IconSymbol name="flame.fill" size={16} color={colors.orange} />
              <Text style={[styles.streakText, { color: colors.orange }]}>{stats.habitStreak} day streak!</Text>
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h2,
  },
  date: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productivityCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  productivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productivityTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  productivityValue: {
    ...Typography.h3,
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  productivitySubtext: {
    ...Typography.caption,
    textAlign: 'center',
  },
  statsScroll: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  statCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 140,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
  },
  seeAll: {
    ...Typography.caption,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '22%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    ...Typography.caption,
    fontWeight: '600',
  },
  habitsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  habitStats: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  habitStatsValue: {
    ...Typography.h1,
  },
  habitStatsLabel: {
    ...Typography.caption,
  },
  habitProgress: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  habitProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  streakText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: Spacing.xxxl,
  },
});