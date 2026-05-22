import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import uuid from 'react-native-uuid';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

type Idea = {
  id: string;
  title: string;
  content: string;
  category: 'startup' | 'business' | 'thought' | 'note' | 'other';
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
};

const categories = [
  { id: 'startup', label: 'Startup', icon: 'rocket', color: '#EF4444' },
  { id: 'business', label: 'Business', icon: 'briefcase', color: '#3B82F6' },
  { id: 'thought', label: 'Thought', icon: 'brain', color: '#F59E0B' },
  { id: 'note', label: 'Note', icon: 'note.text', color: '#10B981' },
  { id: 'other', label: 'Other', icon: 'star', color: '#8B5CF6' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function IdeasScreen() {
  const { colors } = useTheme();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [newIdea, setNewIdea] = useState<{ title: string; content: string; category: Idea['category'] }>({
    title: '',
    content: '',
    category: 'thought',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadIdeas();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIdeas();
    }, [])
  );

  const loadIdeas = async () => {
    try {
      const ideasJson = await AsyncStorage.getItem('ideas');
      if (ideasJson) {
        setIdeas(JSON.parse(ideasJson));
      }
    } catch (error) {
      console.error('Error loading ideas:', error);
    }
  };

  const saveIdeas = async (updatedIdeas: Idea[]) => {
    try {
      await AsyncStorage.setItem('ideas', JSON.stringify(updatedIdeas));
      setIdeas(updatedIdeas);
    } catch (error) {
      console.error('Error saving ideas:', error);
    }
  };

  const addIdea = () => {
    if (!newIdea.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const idea: Idea = {
      id: uuid.v4() as string,
      ...newIdea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
    };

    saveIdeas([idea, ...ideas]);
    setShowAddModal(false);
    resetNewIdea();
  };

  const updateIdea = () => {
    if (!editingIdea || !newIdea.title?.trim()) return;

    const updatedIdeas = ideas.map(idea =>
      idea.id === editingIdea.id ? { ...idea, ...newIdea, updatedAt: new Date().toISOString() } : idea
    );
    saveIdeas(updatedIdeas);
    setEditingIdea(null);
    setShowAddModal(false);
    resetNewIdea();
  };

  const resetNewIdea = () => {
    setNewIdea({
      title: '',
      content: '',
      category: 'thought',
    });
  };

  const deleteIdea = (ideaId: string) => {
    Alert.alert('Delete Idea', 'Are you sure you want to delete this idea?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedIdeas = ideas.filter(idea => idea.id !== ideaId);
          saveIdeas(updatedIdeas);
        },
      },
    ]);
  };

  const toggleFavorite = (ideaId: string) => {
    const updatedIdeas = ideas.map(idea =>
      idea.id === ideaId ? { ...idea, isFavorite: !idea.isFavorite } : idea
    );
    saveIdeas(updatedIdeas);
  };

  const shareIdea = async (idea: Idea) => {
    try {
      await Share.share({
        title: idea.title,
        message: `${idea.title}\n\n${idea.content || 'No additional content'}\n\n- Shared from LifeOS`,
      });
    } catch (error) {
      console.error('Error sharing idea:', error);
    }
  };

  const editIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setNewIdea({
      title: idea.title,
      content: idea.content || '',
      category: idea.category,
    });
    setShowAddModal(true);
  };

  const formatSafeDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'No date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'No date';
    }
  };

  const getFilteredIdeas = () => {
    let filtered = [...ideas];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(idea => idea.category === selectedCategory);
    }
    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      try {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } catch {
        return 0;
      }
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[4];
  };

  const filteredIdeas = getFilteredIdeas();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(600)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text }]}>Idea Vault</ThemedText>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]} 
          onPress={() => setShowAddModal(true)}>
          <IconSymbol name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            { borderColor: colors.border, backgroundColor: colors.background },
            selectedCategory === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setSelectedCategory('all')}>
          <Text style={[styles.categoryText, { color: colors.text }, selectedCategory === 'all' && { color: '#fff' }]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { borderColor: cat.color, backgroundColor: colors.background },
              selectedCategory === cat.id && { backgroundColor: cat.color },
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <IconSymbol name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#fff' : cat.color} />
            <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? '#fff' : cat.color }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ideas List */}
      <ScrollView style={styles.ideasList} showsVerticalScrollIndicator={false}>
        {filteredIdeas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
              <IconSymbol name="lightbulb" size={64} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No ideas yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Capture your thoughts and inspiration</Text>
          </View>
        ) : (
          filteredIdeas.map((idea, index) => {
            const cat = getCategoryInfo(idea.category);
            return (
              <Animated.View
                key={idea.id}
                entering={FadeInUp.delay(index * 50).springify()}
                layout={Layout.springify()}>
                <View style={[styles.ideaCard, { backgroundColor: colors.surface, borderColor: colors.border, ...Shadows.sm }]}>
                  <View style={styles.ideaHeader}>
                    <View style={[styles.ideaIcon, { backgroundColor: cat.color + '15' }]}>
                      <IconSymbol name={cat.icon as any} size={24} color={cat.color} />
                    </View>
                    <View style={styles.ideaContent}>
                      <View style={styles.ideaTitleRow}>
                        <Text style={[styles.ideaTitle, { color: colors.text }]} numberOfLines={1}>
                          {idea.title}
                        </Text>
                        <TouchableOpacity onPress={() => toggleFavorite(idea.id)}>
                          <IconSymbol 
                            name={idea.isFavorite ? 'star.fill' : 'star'} 
                            size={20} 
                            color={idea.isFavorite ? '#F59E0B' : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.ideaMeta}>
                        <View style={[styles.categoryBadge, { backgroundColor: cat.color + '15' }]}>
                          <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        <Text style={[styles.ideaDate, { color: colors.textSecondary }]}>
                          {formatSafeDate(idea.createdAt)}
                        </Text>
                      </View>
                      {idea.content ? (
                        <Text style={[styles.ideaText, { color: colors.textSecondary }]} numberOfLines={2}>
                          {idea.content}
                        </Text>
                      ) : null}
                      <View style={styles.ideaActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.info + '15' }]}
                          onPress={() => editIdea(idea)}>
                          <IconSymbol name="pencil" size={16} color={colors.info} />
                          <Text style={[styles.actionText, { color: colors.info }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}
                          onPress={() => shareIdea(idea)}>
                          <IconSymbol name="square.and.arrow.up" size={16} color={colors.success} />
                          <Text style={[styles.actionText, { color: colors.success }]}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                          onPress={() => deleteIdea(idea.id)}>
                          <IconSymbol name="trash" size={16} color={colors.error} />
                          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Add Button - PERFECTLY CIRCULAR */}
      {!showAddModal && (
        <AnimatedTouchable
          entering={ZoomIn.delay(500)}
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}>
          <IconSymbol name="plus" size={28} color="#fff" />
        </AnimatedTouchable>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingIdea ? 'Edit Idea' : 'New Idea'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setEditingIdea(null);
                resetNewIdea();
              }}>
                <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Title"
              placeholderTextColor={colors.textSecondary}
              value={newIdea.title}
              onChangeText={(text) => setNewIdea({ ...newIdea, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Write your idea..."
              placeholderTextColor={colors.textSecondary}
              value={newIdea.content}
              onChangeText={(text) => setNewIdea({ ...newIdea, content: text })}
              multiline
              numberOfLines={4}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: cat.color, backgroundColor: colors.background },
                    newIdea.category === cat.id && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setNewIdea({ ...newIdea, category: cat.id as any })}>
                  <IconSymbol name={cat.icon as any} size={20} color={newIdea.category === cat.id ? '#fff' : cat.color} />
                  <Text style={[styles.categoryOptionText, { color: newIdea.category === cat.id ? '#fff' : cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelModalButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
                onPress={() => {
                  setShowAddModal(false);
                  setEditingIdea(null);
                  resetNewIdea();
                }}>
                <Text style={[styles.cancelModalText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveModalButton, { backgroundColor: colors.primary }]} 
                onPress={editingIdea ? updateIdea : addIdea}>
                <Text style={styles.saveModalText}>{editingIdea ? 'Update Idea' : 'Save Idea'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  addButton: { width: 40, height: 40, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center', ...Shadows.md },
  categoryScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
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
  categoryText: { fontSize: 14, marginLeft: Spacing.xs },
  ideasList: { flex: 1, padding: Spacing.md },
  ideaCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, borderWidth: 1 },
  ideaHeader: { flexDirection: 'row' },
  ideaIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  ideaContent: { flex: 1 },
  ideaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  ideaTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: Spacing.sm },
  ideaMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  categoryBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  ideaDate: { fontSize: 11 },
  ideaText: { fontSize: 14, marginBottom: Spacing.sm },
  ideaActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  actionText: { fontSize: 11, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl },
  emptyIconContainer: { width: 120, height: 120, borderRadius: BorderRadius.round, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.md },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: Spacing.xs },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
  floatingButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 24, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.sm },
  categoryPicker: { flexDirection: 'row', marginBottom: Spacing.lg },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoryOptionText: { fontSize: 14, marginLeft: Spacing.xs, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: Spacing.md },
  cancelModalButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  cancelModalText: { fontWeight: '600' },
  saveModalButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', ...Shadows.sm },
  saveModalText: { fontWeight: '600', color: '#fff' },
  bottomSpacing: { height: Spacing.xxxl },
});