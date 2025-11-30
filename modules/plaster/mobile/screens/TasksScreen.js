/**
 * Kolibri PLASTER Module - Tasks Screen (React Native)
 * Экран задач на день для рабочего
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';

// Types
interface Task {
  id: string;
  project_id: string;
  project_name: string;
  project_address: string;
  stage_name: string;
  stage_type: string;
  status: 'pending' | 'in_progress' | 'completed';
  planned_area_sqm: number;
  completed_area_sqm: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  start_time?: string;
  end_time?: string;
}

interface TasksScreenProps {
  navigation: any;
  workerId?: string;
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: '#F0FDF4', text: '#166534', border: '#22C55E' },
  normal: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' },
  high: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  urgent: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  urgent: 'Срочно',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Завершено',
};

const stageIcons: Record<string, string> = {
  preparation: '🧹',
  priming: '🎨',
  beacon_setup: '📍',
  application: '🏗️',
  leveling_stage: '📏',
  finishing: '✨',
};

export const TasksScreen: React.FC<TasksScreenProps> = ({ navigation, workerId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [completedCount, setCompletedCount] = useState(0);

  // Demo data
  const demoTasks: Task[] = [
    {
      id: '1',
      project_id: 'p1',
      project_name: 'Квартира на Невском',
      project_address: 'Невский пр. 150, кв. 45',
      stage_name: 'Нанесение штукатурки',
      stage_type: 'application',
      status: 'in_progress',
      planned_area_sqm: 25,
      completed_area_sqm: 15,
      priority: 'high',
      start_time: '09:00',
      notes: 'Стена в гостиной, использовать Ротбанд',
    },
    {
      id: '2',
      project_id: 'p1',
      project_name: 'Квартира на Невском',
      project_address: 'Невский пр. 150, кв. 45',
      stage_name: 'Грунтовка',
      stage_type: 'priming',
      status: 'pending',
      planned_area_sqm: 30,
      completed_area_sqm: 0,
      priority: 'normal',
      start_time: '14:00',
      notes: 'Спальня, после высыхания штукатурки',
    },
    {
      id: '3',
      project_id: 'p2',
      project_name: 'Загородный дом',
      project_address: 'пос. Репино, ул. Сосновая 5',
      stage_name: 'Выравнивание',
      stage_type: 'leveling_stage',
      status: 'completed',
      planned_area_sqm: 20,
      completed_area_sqm: 20,
      priority: 'normal',
      notes: 'Холл второго этажа',
    },
    {
      id: '4',
      project_id: 'p3',
      project_name: 'Офис IT компании',
      project_address: 'ул. Рубинштейна 12',
      stage_name: 'Установка маяков',
      stage_type: 'beacon_setup',
      status: 'pending',
      planned_area_sqm: 50,
      completed_area_sqm: 0,
      priority: 'urgent',
      start_time: '16:00',
      notes: 'Переговорная комната, срочно!',
    },
  ];

  const loadTasks = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTasks(demoTasks);
      setCompletedCount(demoTasks.filter(t => t.status === 'completed').length);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const handleStartTask = (task: Task) => {
    Alert.alert(
      'Начать задачу',
      `Начать работу над "${task.stage_name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Начать',
          onPress: () => {
            const updatedTasks = tasks.map(t =>
              t.id === task.id ? { ...t, status: 'in_progress' as const } : t
            );
            setTasks(updatedTasks);
          },
        },
      ]
    );
  };

  const handleCompleteTask = (task: Task) => {
    Alert.alert(
      'Завершить задачу',
      `Завершить "${task.stage_name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: () => {
            const updatedTasks = tasks.map(t =>
              t.id === task.id
                ? { ...t, status: 'completed' as const, completed_area_sqm: t.planned_area_sqm }
                : t
            );
            setTasks(updatedTasks);
            setCompletedCount(prev => prev + 1);
          },
        },
      ]
    );
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const renderTask = ({ item }: { item: Task }) => {
    const priority = priorityColors[item.priority];
    const progress = item.planned_area_sqm > 0
      ? (item.completed_area_sqm / item.planned_area_sqm) * 100
      : 0;

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          { borderLeftColor: priority.border },
          item.status === 'completed' && styles.taskCardCompleted,
        ]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <Text style={styles.stageIcon}>{stageIcons[item.stage_type] || '📋'}</Text>
            <View>
              <Text style={styles.stageName}>{item.stage_name}</Text>
              <Text style={styles.projectName}>{item.project_name}</Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.priorityText, { color: priority.text }]}>
              {priorityLabels[item.priority]}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.taskInfo}>
          <Text style={styles.addressText}>📍 {item.project_address}</Text>
          {item.start_time && (
            <Text style={styles.timeText}>🕐 {item.start_time}</Text>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Прогресс</Text>
            <Text style={styles.progressValue}>
              {item.completed_area_sqm}/{item.planned_area_sqm} м²
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%` },
                item.status === 'completed' && styles.progressBarCompleted,
              ]}
            />
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>📝 {item.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStartTask(item)}
            >
              <Text style={styles.actionButtonText}>▶️ Начать</Text>
            </TouchableOpacity>
          )}
          {item.status === 'in_progress' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.photoButton]}
                onPress={() => navigation.navigate('PhotoUpload', { taskId: item.id })}
              >
                <Text style={styles.actionButtonText}>📸 Фото</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompleteTask(item)}
              >
                <Text style={styles.actionButtonText}>✅ Завершить</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Выполнено</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => navigateDate(-1)}
        >
          <Text style={styles.dateArrowText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          {isToday && <Text style={styles.todayBadge}>Сегодня</Text>}
        </View>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => navigateDate(1)}
        >
          <Text style={styles.dateArrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>Задач</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, styles.completedNumber]}>
            {completedCount}
          </Text>
          <Text style={styles.summaryLabel}>Выполнено</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {tasks.reduce((sum, t) => sum + t.planned_area_sqm, 0)}
          </Text>
          <Text style={styles.summaryLabel}>м² план</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={tasks.sort((a, b) => {
          // Sort: in_progress first, then pending, then completed
          const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        })}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Нет задач на этот день</Text>
            <Text style={styles.emptySubtext}>Отдыхайте или выберите другую дату</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateArrow: {
    padding: 8,
  },
  dateArrowText: {
    fontSize: 18,
    color: '#3B82F6',
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  todayBadge: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  completedNumber: {
    color: '#10B981',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  projectName: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressBarCompleted: {
    backgroundColor: '#10B981',
  },
  notesContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#92400E',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  photoButton: {
    backgroundColor: '#8B5CF6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default TasksScreen;
