/**
 * Kolibri PLASTER Module - Projects Screen (React Native)
 * Экран списка проектов для мобильного приложения
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Types
interface Project {
  id: string;
  name: string;
  address: string;
  area_sqm: number;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  plaster_type: string;
  progress_percent: number;
  deadline?: string;
  total_stages: number;
  completed_stages: number;
}

interface ProjectsScreenProps {
  navigation: any;
  apiEndpoint?: string;
}

const statusColors: Record<string, string> = {
  planning: '#3B82F6',
  in_progress: '#F59E0B',
  paused: '#F97316',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const statusLabels: Record<string, string> = {
  planning: 'Планирование',
  in_progress: 'В работе',
  paused: 'Приостановлен',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Demo data
  const demoProjects: Project[] = [
    {
      id: '1',
      name: 'Квартира на Невском',
      address: 'Невский пр. 150, кв. 45',
      area_sqm: 75,
      status: 'in_progress',
      plaster_type: 'leveling',
      progress_percent: 45,
      deadline: '2024-02-15',
      total_stages: 6,
      completed_stages: 2,
    },
    {
      id: '2',
      name: 'Офис IT компании',
      address: 'ул. Рубинштейна 12',
      area_sqm: 200,
      status: 'planning',
      plaster_type: 'decorative',
      progress_percent: 0,
      deadline: '2024-03-01',
      total_stages: 6,
      completed_stages: 0,
    },
    {
      id: '3',
      name: 'Загородный дом',
      address: 'пос. Репино, ул. Сосновая 5',
      area_sqm: 350,
      status: 'in_progress',
      plaster_type: 'gypsum',
      progress_percent: 75,
      deadline: '2024-01-30',
      total_stages: 6,
      completed_stages: 4,
    },
    {
      id: '4',
      name: 'Ресторан "Вкусно"',
      address: 'Каменноостровский пр. 28',
      area_sqm: 150,
      status: 'completed',
      plaster_type: 'decorative',
      progress_percent: 100,
      total_stages: 6,
      completed_stages: 6,
    },
  ];

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setProjects(demoProjects);
      setFilteredProjects(demoProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(p => p.status === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, selectedFilter, projects]);

  const renderProject = ({ item }: { item: Project }) => {
    const isOverdue = item.deadline && new Date(item.deadline) < new Date() && item.status !== 'completed';

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.projectName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                {statusLabels[item.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.projectAddress} numberOfLines={1}>
            📍 {item.address}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Прогресс</Text>
            <Text style={styles.progressValue}>{item.progress_percent}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${item.progress_percent}%`,
                  backgroundColor:
                    item.progress_percent === 100
                      ? '#10B981'
                      : item.progress_percent > 50
                      ? '#3B82F6'
                      : '#F59E0B',
                },
              ]}
            />
          </View>
          <Text style={styles.stagesText}>
            Этапы: {item.completed_stages}/{item.total_stages}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Площадь</Text>
            <Text style={styles.footerValue}>{item.area_sqm} м²</Text>
          </View>
          {item.deadline && (
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Дедлайн</Text>
              <Text style={[styles.footerValue, isOverdue && styles.overdueText]}>
                {isOverdue && '⚠️ '}
                {new Date(item.deadline).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {[
        { key: 'all', label: 'Все' },
        { key: 'in_progress', label: 'В работе' },
        { key: 'planning', label: 'Планирование' },
        { key: 'completed', label: 'Завершены' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            selectedFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter(filter.key)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Загрузка проектов...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Поиск по названию или адресу"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Нет проектов</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Попробуйте изменить поиск' : 'Создайте первый проект'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewProject')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  stagesText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  overdueText: {
    color: '#EF4444',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default ProjectsScreen;
