import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue, 
  Easing,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

type Session = {
  id: string;
  duration: number;
  completed: boolean;
  date: string;
  startTime: string;
  endTime?: string;
};

const timerOptions = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
];

export default function FocusScreen() {
  const { colors } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedTime, setSelectedTime] = useState(25);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const scale = useSharedValue(1);

  useEffect(() => {
    loadSessions();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const sessionsJson = await AsyncStorage.getItem('focusSessions');
      if (sessionsJson) {
        setSessions(JSON.parse(sessionsJson));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const saveSession = async (session: Session) => {
    try {
      const updatedSessions = [session, ...sessions].slice(0, 50);
      await AsyncStorage.setItem('focusSessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const startTimer = () => {
    setIsActive(true);
    startAnimation();
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          completeSession();
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAnimation = () => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  };

  const stopAnimation = () => {
    scale.value = withTiming(1, { duration: 300 });
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopAnimation();
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedTime * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopAnimation();
  };

  const completeSession = async () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAnimation();
    
    Vibration.vibrate(500);
    
    const session: Session = {
      id: Date.now().toString(),
      duration: selectedTime,
      completed: true,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: format(new Date(Date.now() - selectedTime * 60 * 1000), 'HH:mm'),
      endTime: format(new Date(), 'HH:mm'),
    };
    
    await saveSession(session);
    
    Alert.alert(
      '🎉 Session Complete!',
      `Amazing! You focused for ${selectedTime} minutes.`,
      [{ text: 'Awesome!', onPress: resetTimer }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySessions = sessions.filter(s => s.date === today);
    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    return { count: todaySessions.length, minutes: totalMinutes };
  };

  const getWeeklyTotal = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessions
      .filter(s => new Date(s.date) >= weekAgo)
      .reduce((acc, s) => acc + s.duration, 0);
  };

  const todayStats = getTodayStats();
  const weeklyTotal = getWeeklyTotal();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Focus Timer</Text>
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowHistory(!showHistory)}>
            <IconSymbol name="clock.arrow.circlepath" size={24} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {showHistory ? (
          <Animated.View entering={FadeInUp.duration(400)} style={[styles.historyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Sessions</Text>
            {sessions.slice(0, 10).map((session) => (
              <View key={session.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.primary + '15' }]}>
                    <IconSymbol name="timer" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.historyDuration, { color: colors.text }]}>{session.duration} min</Text>
                    <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                      {session.startTime} - {session.endTime}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {format(new Date(session.date), 'MMM d')}
                </Text>
              </View>
            ))}
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="timer" size={28} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{todayStats.count}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="clock" size={28} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>{todayStats.minutes}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <IconSymbol name="chart.bar" size={28} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{Math.floor(weeklyTotal / 60)}h</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={[styles.timerCard, { backgroundColor: colors.surface }]}>
              <Animated.View style={[styles.timerCircle, { backgroundColor: colors.background, borderColor: colors.primary + '30' }, animatedStyle]}>
                <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(timeLeft)}</Text>
              </Animated.View>
              
              <View style={styles.timeOptions}>
                {timerOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeChip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      selectedTime === option.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                      isActive && styles.disabled,
                    ]}
                    onPress={() => {
                      if (!isActive) {
                        setSelectedTime(option.value);
                        setTimeLeft(option.value * 60);
                      }
                    }}
                    disabled={isActive}>
                    <Text style={[
                      styles.timeChipText,
                      { color: colors.textSecondary },
                      selectedTime === option.value && { color: '#fff' },
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.controls}>
                {!isActive ? (
                  <TouchableOpacity
                    style={[styles.controlBtn, styles.startBtn]}
                    onPress={startTimer}>
                    <IconSymbol name="play.fill" size={24} color="#fff" />
                    <Text style={styles.controlBtnText}>Start</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.controlBtn, styles.pauseBtn]}
                    onPress={pauseTimer}>
                    <IconSymbol name="pause.fill" size={24} color="#fff" />
                    <Text style={styles.controlBtnText}>Pause</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.controlBtn, styles.resetBtn]}
                  onPress={resetTimer}>
                  <IconSymbol name="arrow.clockwise" size={24} color="#fff" />
                  <Text style={styles.controlBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 Focus Tips</Text>
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.error + '15' }]}>
                  <IconSymbol name="bell.slash" size={20} color={colors.error} />
                </View>
                <Text style={[styles.tipText, { color: colors.text }]}>Silence all notifications</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.warning + '15' }]}>
                  <IconSymbol name="headphones" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.tipText, { color: colors.text }]}>Use focus music or white noise</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.info + '15' }]}>
                  <IconSymbol name="drop" size={20} color={colors.info} />
                </View>
                <Text style={[styles.tipText, { color: colors.text }]}>Keep water nearby and stay hydrated</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.success + '15' }]}>
                  <IconSymbol name="figure.walk" size={20} color={colors.success} />
                </View>
                <Text style={[styles.tipText, { color: colors.text }]}>Take a 5-min break after each session</Text>
              </View>
            </Animated.View>
          </>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  timerCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  timerCircle: {
    width: Dimensions.get('window').width - Spacing.xxxl * 2,
    height: Dimensions.get('window').width - Spacing.xxxl * 2,
    borderRadius: (Dimensions.get('window').width - Spacing.xxxl * 2) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 3,
  },
  timerText: {
    ...Typography.h1,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  timeChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  startBtn: {
    backgroundColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  resetBtn: {
    backgroundColor: '#EF4444',
  },
  controlBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#fff',
  },
  tipsCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  tipsTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    ...Typography.body,
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  historyContainer: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.md,
  },
  historyTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDuration: {
    ...Typography.body,
    fontWeight: '600',
  },
  historyTime: {
    ...Typography.caption,
  },
  historyDate: {
    ...Typography.caption,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: Spacing.xxxl,
  },
});