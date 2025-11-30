/**
 * Kolibri PLASTER Module - Progress Screen (React Native)
 * Экран отслеживания прогресса и истории работ
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';

// Types
interface WorkEntry {
  id: string;
  date: string;
  project_name: string;
  stage_name: string;
  hours_worked: number;
  area_completed: number;
  notes?: string;
}

interface ProgressStats {
  total_hours: number;
  total_area: number;
  projects_count: number;
  avg_productivity: number;
  earnings: number;
}

interface ProgressScreenProps {
  navigation: any;
  workerId?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  navigation,
  workerId,
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Demo data
  const demoStats: Record<string, ProgressStats> = {
    week: {
      total_hours: 42,
      total_area: 185,
      projects_count: 3,
      avg_productivity: 22,
      earnings: 35700,
    },
    month: {
      total_hours: 168,
      total_area: 720,
      projects_count: 5,
      avg_productivity: 21.5,
      earnings: 142800,
    },
    all: {
      total_hours: 1240,
      total_area: 5100,
      projects_count: 28,
      avg_productivity: 20.5,
      earnings: 1054000,
    },
  };

  const demoEntries: WorkEntry[] = [
    {
      id: '1',
      date: '2024-01-28',
      project_name: 'Квартира на Невском',
      stage_name: 'Нанесение штукатурки',
      hours_worked: 8,
      area_completed: 25,
      notes: 'Гостиная завершена',
    },
    {
      id: '2',
      date: '2024-01-27',
      project_name: 'Квартира на Невском',
      stage_name: 'Грунтовка',
      hours_worked: 6,
      area_completed: 45,
    },
    {
      id: '3',
      date: '2024-01-26',
      project_name: 'Загородный дом',
      stage_name: 'Выравнивание',
      hours_worked: 8,
      area_completed: 30,
      notes: 'Холл второго этажа',
    },
    {
      id: '4',
      date: '2024-01-25',
      project_name: 'Загородный дом',
      stage_name: 'Нанесение штукатурки',
      hours_worked: 8,
      area_completed: 35,
    },
    {
      id: '5',
      date: '2024-01-24',
      project_name: 'Офис IT компании',
      stage_name: 'Установка маяков',
      hours_worked: 6,
      area_completed: 50,
    },
  ];

  const loadData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats(demoStats[period]);
      setEntries(demoEntries);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: 'week', label: 'Неделя' },
        { key: 'month', label: 'Месяц' },
        { key: 'all', label: 'Всё время' },
      ].map(item => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.periodButton,
            period === item.key && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod(item.key as typeof period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === item.key && styles.periodButtonTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>{formatCurrency(stats?.earnings || 0)}</Text>
          <Text style={styles.statLabel}>Заработок</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🕐</Text>
          <Text style={styles.statValueDark}>{stats?.total_hours || 0}</Text>
          <Text style={styles.statLabel}>Часов</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📐</Text>
          <Text style={styles.statValueDark}>{stats?.total_area || 0} м²</Text>
          <Text style={styles.statLabel}>Выполнено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValueDark}>{stats?.avg_productivity || 0}</Text>
          <Text style={styles.statLabel}>м²/день</Text>
        </View>
      </View>
    </View>
  );

  const renderProgressChart = () => {
    // Simple bar chart visualization
    const maxArea = Math.max(...entries.map(e => e.area_completed), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>📈 Производительность</Text>
        <View style={styles.chartBars}>
          {entries.slice(0, 7).reverse().map((entry, index) => (
            <View key={entry.id} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(entry.area_completed / maxArea) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Date(entry.date).getDate()}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartSubtitle}>м² за последние дни</Text>
      </View>
    );
  };

  const renderWorkHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.sectionTitle}>📋 История работ</Text>
      {entries.map(entry => (
        <TouchableOpacity
          key={entry.id}
          style={styles.historyItem}
          activeOpacity={0.7}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
            <Text style={styles.historyHours}>{entry.hours_worked}ч</Text>
          </View>
          <Text style={styles.historyProject}>{entry.project_name}</Text>
          <Text style={styles.historyStage}>{entry.stage_name}</Text>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>{entry.area_completed}</Text>
              <Text style={styles.historyStatLabel}>м²</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {(entry.area_completed / entry.hours_worked).toFixed(1)}
              </Text>
              <Text style={styles.historyStatLabel}>м²/ч</Text>
            </View>
          </View>
          {entry.notes && (
            <Text style={styles.historyNotes}>📝 {entry.notes}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsContainer}>
      <Text style={styles.sectionTitle}>🏆 Достижения</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.achievementsList}>
          {[
            { icon: '🌟', title: 'Первая 1000 м²', achieved: true },
            { icon: '🚀', title: '5 проектов', achieved: true },
            { icon: '💯', title: '100% качество', achieved: true },
            { icon: '📈', title: '25+ м²/день', achieved: false },
            { icon: '🎯', title: '10 проектов', achieved: false },
          ].map((achievement, index) => (
            <View
              key={index}
              style={[
                styles.achievementCard,
                !achievement.achieved && styles.achievementCardLocked,
              ]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text
                style={[
                  styles.achievementTitle,
                  !achievement.achieved && styles.achievementTitleLocked,
                ]}
              >
                {achievement.title}
              </Text>
              {!achievement.achieved && (
                <Text style={styles.achievementLock}>🔒</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мой прогресс</Text>
        <Text style={styles.headerSubtitle}>
          Статистика и история работ
        </Text>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Progress Chart */}
      {renderProgressChart()}

      {/* Achievements */}
      {renderAchievements()}

      {/* Work History */}
      {renderWorkHistory()}

      {/* Bottom Padding */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: '#3B82F6',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValueDark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 24,
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  achievementsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  achievementCard: {
    width: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementCardLocked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  achievementLock: {
    fontSize: 12,
    marginTop: 4,
  },
  historyContainer: {
    margin: 16,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  historyHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  historyProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyStage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  historyStats: {
    flexDirection: 'row',
    gap: 24,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyNotes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default ProgressScreen;
