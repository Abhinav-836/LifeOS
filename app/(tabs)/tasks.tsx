import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import uuid from 'react-native-uuid';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other';
  completed: boolean;
  createdAt: string;
};

const categories = [
  { id: 'work', label: 'Work', icon: 'briefcase', color: '#6366F1' },
  { id: 'personal', label: 'Personal', icon: 'person', color: '#8B5CF6' },
  { id: 'shopping', label: 'Shopping', icon: 'cart', color: '#3B82F6' },
  { id: 'health', label: 'Health', icon: 'heart', color: '#10B981' },
  { id: 'other', label: 'Other', icon: 'star', color: '#F59E0B' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    category: 'personal',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      if (tasksJson) {
        setTasks(JSON.parse(tasksJson));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = () => {
    if (!newTask.title?.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const task: Task = {
      id: uuid.v4() as string,
      title: newTask.title,
      description: newTask.description || '',
      dueDate: newTask.dueDate || format(new Date(), 'yyyy-MM-dd'),
      priority: newTask.priority as 'high' | 'medium' | 'low',
      category: newTask.category as any,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveTasks([task, ...tasks]);
    setShowAddModal(false);
    resetNewTask();
  };

  const updateTask = () => {
    if (!editingTask || !newTask.title?.trim()) return;

    const updatedTasks = tasks.map(task =>
      task.id === editingTask.id ? { ...task, ...newTask } : task
    );
    saveTasks(updatedTasks);
    setEditingTask(null);
    setShowAddModal(false);
    resetNewTask();
  };

  const resetNewTask = () => {
    setNewTask({
      title: '',
      description: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium',
      category: 'personal',
    });
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            await saveTasks(updatedTasks);
            Alert.alert('Success', 'Task deleted successfully');
          },
        },
      ]
    );
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
    setShowAddModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return colors.textSecondary;
    }
  };

  const formatSafeDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'No date';
      return format(date, 'MMM d');
    } catch (error) {
      return 'No date';
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (selectedFilter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const renderRightActions = (taskId: string) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.info }]}
          onPress={() => {
            const task = tasks.find(t => t.id === taskId);
            if (task) editTask(task);
          }}>
          <IconSymbol name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.error }]}
          onPress={() => deleteTask(taskId)}>
          <IconSymbol name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const filteredTasks = getFilteredTasks();
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Tasks</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
          <IconSymbol name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['active', 'completed', 'all'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              { backgroundColor: selectedFilter === filter ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setSelectedFilter(filter as any)}>
            <Text style={[styles.filterText, { color: selectedFilter === filter ? '#fff' : colors.textSecondary }]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedCategory('all')}>
          <Text style={[styles.categoryChipText, { color: selectedCategory === 'all' ? '#fff' : colors.textSecondary }]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { borderColor: cat.color },
              selectedCategory === cat.id && { backgroundColor: cat.color }
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <IconSymbol name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#fff' : cat.color} />
            <Text style={[styles.categoryChipText, { color: selectedCategory === cat.id ? '#fff' : cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
              <IconSymbol name="checklist" size={64} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No tasks found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap the + button to add a new task</Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => {
            const cat = categories.find(c => c.id === task.category) || categories[4];
            const catColor = cat.color;
            return (
              <Animated.View
                key={task.id}
                entering={FadeInUp.delay(index * 50).springify()}
                layout={Layout.springify()}>
                <Swipeable renderRightActions={() => renderRightActions(task.id)}>
                  <View style={[styles.taskCard, { backgroundColor: colors.surface, ...Shadows.sm }]}>
                    <TouchableOpacity
                      style={[styles.checkbox, task.completed && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => toggleTask(task.id)}>
                      {task.completed && <IconSymbol name="checkmark" size={14} color="#fff" />}
                    </TouchableOpacity>
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: colors.text }, task.completed && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                          {task.description}
                        </Text>
                      ) : null}
                      <View style={styles.taskMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
                          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                            {task.priority}
                          </Text>
                        </View>
                        <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
                          <IconSymbol name={cat.icon as any} size={12} color={catColor} />
                          <Text style={[styles.categoryText, { color: catColor }]}>{cat.label}</Text>
                        </View>
                        <Text style={[styles.taskDate, { color: colors.textSecondary }]}>
                          {formatSafeDate(task.dueDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={[styles.taskActionBtn, { backgroundColor: colors.info + '15' }]}
                        onPress={() => editTask(task)}>
                        <IconSymbol name="pencil" size={18} color={colors.info} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.taskActionBtn, { backgroundColor: colors.error + '15' }]}
                        onPress={() => deleteTask(task.id)}>
                        <IconSymbol name="trash" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Swipeable>
              </Animated.View>
            );
          })
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setEditingTask(null);
                resetNewTask();
              }}>
                <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Task title"
              placeholderTextColor={colors.textSecondary}
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {(['high', 'medium', 'low'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    { backgroundColor: getPriorityColor(p) + '15' },
                    newTask.priority === p && { borderColor: getPriorityColor(p), borderWidth: 2 },
                  ]}
                  onPress={() => setNewTask({ ...newTask, priority: p })}>
                  <Text style={[styles.priorityOptionText, { color: getPriorityColor(p) }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
            <View style={styles.categoryContainerGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: cat.color, backgroundColor: colors.background },
                    newTask.category === cat.id && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setNewTask({ ...newTask, category: cat.id as any })}>
                  <IconSymbol name={cat.icon as any} size={20} color={newTask.category === cat.id ? '#fff' : cat.color} />
                  <Text style={[styles.categoryOptionText, { color: newTask.category === cat.id ? '#fff' : cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelModalButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => {
                  setShowAddModal(false);
                  setEditingTask(null);
                  resetNewTask();
                }}>
                <Text style={[styles.cancelModalText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveModalButton, { backgroundColor: colors.primary }]} 
                onPress={editingTask ? updateTask : addTask}>
                <Text style={styles.saveModalText}>{editingTask ? 'Update Task' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: { ...Typography.h2 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: { ...Typography.h3, fontWeight: '700' },
  statLabel: { ...Typography.caption, marginTop: 2 },
  filterContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  filterText: { ...Typography.caption, fontWeight: '600' },
  categoryContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryChipText: { ...Typography.caption, fontWeight: '500' },
  taskList: { flex: 1, paddingHorizontal: Spacing.xl },
  taskCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  taskContent: { flex: 1 },
  taskTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  taskDescription: { ...Typography.caption, marginBottom: Spacing.xs },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  priorityDot: { width: 6, height: 6, borderRadius: BorderRadius.round },
  priorityText: { ...Typography.caption, fontWeight: '600', fontSize: 10 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  categoryText: { ...Typography.caption, fontSize: 10, fontWeight: '500' },
  taskDate: { ...Typography.caption, fontSize: 10 },
  taskActions: { flexDirection: 'row', gap: Spacing.sm },
  taskActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginLeft: Spacing.sm },
  swipeAction: { width: 60, height: 60, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  emptyText: { ...Typography.h4, marginBottom: Spacing.xs },
  emptySubtext: { ...Typography.body, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    minHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h3 },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  inputLabel: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.sm },
  priorityContainer: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  priorityOption: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priorityOptionText: { ...Typography.bodySmall, fontWeight: '600' },
  categoryContainerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  categoryOptionText: { ...Typography.caption, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelModalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelModalText: { ...Typography.body, fontWeight: '600' },
  saveModalButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', ...Shadows.sm },
  saveModalText: { ...Typography.body, fontWeight: '600', color: '#fff' },
  bottomSpacing: { height: Spacing.xxxl },
});