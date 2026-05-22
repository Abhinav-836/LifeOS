import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, addDays, eachDayOfInterval, subWeeks, addWeeks } from 'date-fns';
import uuid from 'react-native-uuid';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

type Habit = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  completedDates: string[];
  streak: number;
  bestStreak: number;
  createdAt: string;
  reminderTime?: string;
};

const habitColors = [
  '#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'
];

const habitIcons = [
  'figure.walk', 'leaf', 'drop', 'flame', 'moon.stars', 'book.closed', 
  'heart', 'brain', 'sparkles', 'star', 'bolt', 'checkmark.seal'
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HabitsScreen() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: habitColors[0],
    icon: habitIcons[0],
  });

  useEffect(() => {
    loadHabits();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const loadHabits = async () => {
    try {
      const habitsJson = await AsyncStorage.getItem('habits');
      if (habitsJson) {
        setHabits(JSON.parse(habitsJson));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const habit: Habit = {
      id: uuid.v4() as string,
      ...newHabit,
      completedDates: [],
      streak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString(),
    };

    saveHabits([habit, ...habits]);
    setShowAddModal(false);
    setNewHabit({ name: '', description: '', color: habitColors[0], icon: habitIcons[0] });
  };

  const toggleHabit = (habitId: string, date: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(date);
        const newCompletedDates = isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date];
        
        let streak = 0;
        let currentDate = new Date();
        while (streak < 365) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (newCompletedDates.includes(dateStr)) streak++;
          else break;
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        const bestStreak = Math.max(habit.bestStreak, streak);
        
        return { ...habit, completedDates: newCompletedDates, streak, bestStreak };
      }
      return habit;
    });
    saveHabits(updatedHabits);
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedHabits = habits.filter(habit => habit.id !== habitId);
            await saveHabits(updatedHabits);
            Alert.alert('Success', 'Habit deleted successfully');
          },
        },
      ]
    );
  };

  const getWeekDates = () => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: addDays(start, 6),
    });
  };

  const weekDates = getWeekDates();
  const weekLabels = weekDates.map(date => format(date, 'EEE'));
  const today = format(new Date(), 'yyyy-MM-dd');

  const getHabitCompletionRate = (habit: Habit) => {
    const completedCount = weekDates.filter(date => 
      habit.completedDates.includes(format(date, 'yyyy-MM-dd'))
    ).length;
    return Math.round((completedCount / 7) * 100);
  };

  const totalCompletionsByDay = weekDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habits.filter(h => h.completedDates.includes(dateStr)).length;
  });

  const chartData = {
    labels: weekLabels,
    datasets: [{ data: totalCompletionsByDay }],
  };

  const goToPreviousWeek = () => setSelectedWeek(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setSelectedWeek(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setSelectedWeek(new Date());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Habits</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
          <IconSymbol name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Week Navigator */}
      <View style={styles.weekNavigator}>
        <TouchableOpacity onPress={goToPreviousWeek} style={[styles.navButton, { backgroundColor: colors.surface }]}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToCurrentWeek}>
          <Text style={[styles.weekTitle, { color: colors.primary }]}>
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextWeek} style={[styles.navButton, { backgroundColor: colors.surface }]}>
          <IconSymbol name="chevron.right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Header */}
      <View style={styles.weekHeader}>
        {weekLabels.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={[styles.weekDayLabel, { color: colors.textSecondary }]}>{day}</Text>
            <Text style={[styles.weekDayDate, { color: colors.textSecondary }]}>{format(weekDates[index], 'd')}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
              <IconSymbol name="repeat" size={64} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No habits yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add your first habit to start building consistency</Text>
          </View>
        ) : (
          <>
            {/* Chart */}
            <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Overview</Text>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - Spacing.xl * 2}
                height={180}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                  strokeWidth: 2,
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {/* Habits List */}
            {habits.map((habit, index) => {
              const rate = getHabitCompletionRate(habit);
              return (
                <AnimatedTouchable
                  key={habit.id}
                  entering={FadeInUp.delay(index * 100).springify()}
                  layout={Layout.springify()}
                  style={[styles.habitCard, { backgroundColor: colors.surface }, Shadows.sm]}>
                  <View style={styles.habitHeader}>
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '15' }]}>
                      <IconSymbol name={habit.icon as any} size={28} color={habit.color} />
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                      <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>{habit.description || 'Build consistency'}</Text>
                    </View>
                    <View style={styles.habitStats}>
                      <Text style={[styles.habitRate, { color: colors.primary }]}>{rate}%</Text>
                      <View style={styles.streakBadge}>
                        <IconSymbol name="flame.fill" size={12} color="#F59E0B" />
                        <Text style={[styles.streakText, { color: '#F59E0B' }]}>{habit.streak}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteHabitBtn, { backgroundColor: colors.error + '15' }]}
                      onPress={() => deleteHabit(habit.id)}>
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.weekGrid}>
                    {weekDates.map((date, idx) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isCompleted = habit.completedDates.includes(dateStr);
                      const isToday = dateStr === today;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.dayButton,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            isCompleted && { backgroundColor: habit.color, borderColor: habit.color },
                            isToday && styles.todayButton,
                          ]}
                          onPress={() => toggleHabit(habit.id, dateStr)}>
                          {isCompleted && <IconSymbol name="checkmark" size={16} color="#fff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {habit.bestStreak > 0 && (
                    <View style={[styles.bestStreakContainer, { borderTopColor: colors.border }]}>
                      <Text style={[styles.bestStreakText, { color: colors.textSecondary }]}>🏆 Best streak: {habit.bestStreak} days</Text>
                    </View>
                  )}
                </AnimatedTouchable>
              );
            })}
          </>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Habit</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Habit name"
              placeholderTextColor={colors.textSecondary}
              value={newHabit.name}
              onChangeText={(text) => setNewHabit({ ...newHabit, name: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newHabit.description}
              onChangeText={(text) => setNewHabit({ ...newHabit, description: text })}
              multiline
              numberOfLines={2}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Choose Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {habitIcons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    newHabit.icon === icon && { backgroundColor: newHabit.color + '15', borderColor: newHabit.color },
                  ]}
                  onPress={() => setNewHabit({ ...newHabit, icon })}>
                  <IconSymbol name={icon as any} size={24} color={newHabit.color} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {habitColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newHabit.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewHabit({ ...newHabit, color })}>
                  {newHabit.color === color && <IconSymbol name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelModalButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => setShowAddModal(false)}>
                <Text style={[styles.cancelModalText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveModalButton, { backgroundColor: colors.primary }]} 
                onPress={addHabit}>
                <Text style={styles.saveModalText}>Create Habit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  deleteHabitBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  weekTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  weekDayCell: {
    alignItems: 'center',
    width: 44,
  },
  weekDayLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  weekDayDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  habitList: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  emptyText: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  chartTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  habitCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  habitIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitDescription: {
    ...Typography.caption,
  },
  habitStats: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  habitRate: {
    ...Typography.h4,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  streakText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  todayButton: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  bestStreakContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  bestStreakText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  iconScroll: {
    marginBottom: Spacing.lg,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    ...Shadows.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelModalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelModalText: {
    ...Typography.body,
    fontWeight: '600',
  },
  saveModalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  saveModalText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacing: {
    height: Spacing.xxxl,
  },
});