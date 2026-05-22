import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    totalTasks: 0,
    habitsCompleted: 0,
    totalHabits: 0,
    focusMinutes: 0,
    ideasCount: 0,
    weeklyData: [] as number[],
    habitCompletionRate: 0,
    taskCompletionByPriority: [] as { name: string; count: number; color: string; legendFontColor: string; legendFontSize: number; }[],
    weeklyFocusData: [] as number[],
  });

  const loadAnalytics = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      const tasks = tasksJson ? JSON.parse(tasksJson) : [];
      const completedTasks = tasks.filter((t: any) => t.completed).length;

      const habitsJson = await AsyncStorage.getItem('habits');
      const habits = habitsJson ? JSON.parse(habitsJson) : [];
      
      let last7Days: string[] = [];
      try {
        last7Days = eachDayOfInterval({
          start: subDays(new Date(), 6),
          end: new Date(),
        }).map(date => format(date, 'yyyy-MM-dd'));
      } catch (error) {
        console.error('Date error:', error);
        last7Days = [];
      }

      const weeklyCompletions = last7Days.map(date => 
        habits.filter((h: any) => h.completedDates?.includes(date)).length
      );

      const totalPossibleCompletions = habits.length * 7;
      const actualCompletions = habits.reduce(
        (acc: number, h: any) => acc + (h.completedDates?.length || 0), 
        0
      );

      const focusJson = await AsyncStorage.getItem('focusSessions');
      const focus = focusJson ? JSON.parse(focusJson) : [];
      const totalFocusMinutes = focus.reduce((acc: number, f: any) => acc + f.duration, 0);

      const weeklyFocus = last7Days.map(date => 
        focus
          .filter((f: any) => f.date === date)
          .reduce((acc: number, f: any) => acc + f.duration, 0)
      );

      const ideasJson = await AsyncStorage.getItem('ideas');
      const ideas = ideasJson ? JSON.parse(ideasJson) : [];

      const priorityCounts = {
        high: tasks.filter((t: any) => t.priority === 'high').length,
        medium: tasks.filter((t: any) => t.priority === 'medium').length,
        low: tasks.filter((t: any) => t.priority === 'low').length,
      };

      setStats({
        tasksCompleted: completedTasks,
        totalTasks: tasks.length,
        habitsCompleted: actualCompletions,
        totalHabits: habits.length,
        focusMinutes: totalFocusMinutes,
        ideasCount: ideas.length,
        weeklyData: weeklyCompletions,
        habitCompletionRate: totalPossibleCompletions > 0 
          ? (actualCompletions / totalPossibleCompletions) * 100 
          : 0,
        taskCompletionByPriority: [
          { name: 'High', count: priorityCounts.high, color: colors.error, legendFontColor: colors.textSecondary, legendFontSize: 12 },
          { name: 'Medium', count: priorityCounts.medium, color: colors.warning, legendFontColor: colors.textSecondary, legendFontSize: 12 },
          { name: 'Low', count: priorityCounts.low, color: colors.success, legendFontColor: colors.textSecondary, legendFontSize: 12 },
        ],
        weeklyFocusData: weeklyFocus,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const screenWidth = Dimensions.get('window').width - Spacing.xl * 2;

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.info,
    },
  };

  // Productivity Score: 50% Tasks + 50% Focus (Habits removed)
  const taskScore = stats.tasksCompleted / (stats.totalTasks || 1);
  const focusScore = Math.min(stats.focusMinutes / 600, 1);
  const productivityScore = Math.round((taskScore * 0.5 + focusScore * 0.5) * 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>Analytics</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>Your productivity insights</ThemedText>
      </ThemedView>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.sm }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.info + '20' }]}>
            <IconSymbol name="checklist" size={24} color={colors.info} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.tasksCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks Done</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.sm }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
            <IconSymbol name="repeat" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(stats.habitCompletionRate)}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Habit Consistency</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.sm }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol name="timer" size={24} color={colors.error} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{Math.floor(stats.focusMinutes / 60)}h {stats.focusMinutes % 60}m</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus Time</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.sm }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.purple + '20' }]}>
            <IconSymbol name="lightbulb" size={24} color={colors.purple} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.ideasCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ideas</Text>
        </View>
      </View>

      <ThemedView style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.md }]}>
        <ThemedText type="subtitle" style={[styles.chartTitle, { color: colors.text }]}>Weekly Habit Completion</ThemedText>
        {stats.weeklyData.length > 0 && (
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: stats.weeklyData.length === 7 ? stats.weeklyData : [0, 0, 0, 0, 0, 0, 0],
              }],
            }}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        )}
      </ThemedView>

      <ThemedView style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.md }]}>
        <ThemedText type="subtitle" style={[styles.chartTitle, { color: colors.text }]}>Daily Focus Time (minutes)</ThemedText>
        {stats.weeklyFocusData.length > 0 && (
          <BarChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: stats.weeklyFocusData.length === 7 ? stats.weeklyFocusData : [0, 0, 0, 0, 0, 0, 0],
              }],
            }}
            width={screenWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix="m"
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        )}
      </ThemedView>

      <ThemedView style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.md }]}>
        <ThemedText type="subtitle" style={[styles.chartTitle, { color: colors.text }]}>Tasks by Priority</ThemedText>
        {stats.taskCompletionByPriority.some(p => p.count > 0) && (
          <PieChart
            data={stats.taskCompletionByPriority}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}
      </ThemedView>

      <ThemedView style={[styles.insightsContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.md }]}>
        <ThemedText type="subtitle" style={[styles.insightsTitle, { color: colors.text }]}>Insights</ThemedText>
        
        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.warning + '20' }]}>
            <IconSymbol name="star.fill" size={20} color={colors.warning} />
          </View>
          <View style={styles.insightText}>
            <ThemedText style={[styles.insightMain, { color: colors.text }]}>
              {stats.habitCompletionRate > 70 ? 'Great consistency!' : 'Keep building momentum'}
            </ThemedText>
            <ThemedText style={[styles.insightDetail, { color: colors.textSecondary }]}>
              {stats.habitCompletionRate > 70
                ? `You're maintaining ${Math.round(stats.habitCompletionRate)}% habit consistency`
                : `Try to complete more habits to reach 70% consistency`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.info + '20' }]}>
            <IconSymbol name="clock.fill" size={20} color={colors.info} />
          </View>
          <View style={styles.insightText}>
            <ThemedText style={[styles.insightMain, { color: colors.text }]}>
              {stats.focusMinutes > 300 ? 'Focus master!' : 'Building focus'}
            </ThemedText>
            <ThemedText style={[styles.insightDetail, { color: colors.textSecondary }]}>
              {stats.focusMinutes > 300
                ? `You've focused for ${Math.floor(stats.focusMinutes / 60)} hours total`
                : `Aim for 5+ hours of focus time this week`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={[styles.insightIcon, { backgroundColor: colors.success + '20' }]}>
            <IconSymbol name="checklist" size={20} color={colors.success} />
          </View>
          <View style={styles.insightText}>
            <ThemedText style={[styles.insightMain, { color: colors.text }]}>
              {stats.totalTasks > 0 ? `${Math.round((stats.tasksCompleted / stats.totalTasks) * 100)}% tasks done` : 'No tasks yet'}
            </ThemedText>
            <ThemedText style={[styles.insightDetail, { color: colors.textSecondary }]}>
              {stats.totalTasks - stats.tasksCompleted} tasks remaining
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={[styles.productivityScore, { backgroundColor: colors.primary, ...Shadows.lg }]}>
        <ThemedText style={[styles.productivityTitle, { color: '#fff' }]}>Productivity Score</ThemedText>
        <View style={[styles.scoreCircle, { backgroundColor: '#fff', ...Shadows.md }]}>
          <Text style={[styles.scoreText, { color: colors.primary }]}>{productivityScore}</Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>out of 100</Text>
        </View>
        <Text style={styles.scoreFormula}>
          {Math.round(taskScore * 100)}% Tasks + {Math.round(focusScore * 100)}% Focus
        </Text>
      </ThemedView>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg, paddingTop: Spacing.xl, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', marginBottom: Spacing.xs },
  subtitle: { fontSize: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: Spacing.lg, gap: Spacing.md },
  statCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconContainer: { width: 48, height: 48, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 13 },
  chartContainer: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  chartTitle: { marginBottom: Spacing.md },
  chart: { marginVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  insightsContainer: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  insightsTitle: { marginBottom: Spacing.md },
  insightItem: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.md },
  insightIcon: { width: 40, height: 40, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1 },
  insightMain: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  insightDetail: { fontSize: 13 },
  productivityScore: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center' },
  productivityTitle: { fontSize: 18, fontWeight: '600', marginBottom: Spacing.lg },
  scoreCircle: { width: 140, height: 140, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 42, fontWeight: 'bold' },
  scoreLabel: { fontSize: 13, marginTop: 2 },
  scoreFormula: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm },
  bottomSpacing: { height: Spacing.xl },
});