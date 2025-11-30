/**
 * Kolibri PLASTER Module - Mobile Navigation
 * Навигация для мобильного приложения
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';

// Screens
import ProjectsScreen from '../screens/ProjectsScreen';
import TasksScreen from '../screens/TasksScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Icons
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

// Projects Stack
const ProjectsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#3B82F6' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="ProjectsList"
      component={ProjectsScreen}
      options={{ title: 'Проекты' }}
    />
    <Stack.Screen
      name="ProjectDetail"
      component={ProjectDetailPlaceholder}
      options={{ title: 'Детали проекта' }}
    />
    <Stack.Screen
      name="NewProject"
      component={NewProjectPlaceholder}
      options={{ title: 'Новый проект' }}
    />
  </Stack.Navigator>
);

// Tasks Stack
const TasksStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="TasksList"
      component={TasksScreen}
      options={{ title: 'Задачи на сегодня' }}
    />
    <Stack.Screen
      name="TaskDetail"
      component={TaskDetailPlaceholder}
      options={{ title: 'Детали задачи' }}
    />
    <Stack.Screen
      name="PhotoUpload"
      component={PhotoUploadScreen}
      options={{
        title: 'Загрузка фото',
        headerStyle: { backgroundColor: '#8B5CF6' },
      }}
    />
  </Stack.Navigator>
);

// Progress Stack
const ProgressStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#3B82F6' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="ProgressMain"
      component={ProgressScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#6B7280' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="ProfileMain"
      component={ProfilePlaceholder}
      options={{ title: 'Профиль' }}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsPlaceholder}
      options={{ title: 'Настройки' }}
    />
  </Stack.Navigator>
);

// Placeholder Components
const ProjectDetailPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>🏗️</Text>
    <Text style={styles.placeholderText}>Детали проекта</Text>
  </View>
);

const NewProjectPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>➕</Text>
    <Text style={styles.placeholderText}>Создание проекта</Text>
  </View>
);

const TaskDetailPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>📋</Text>
    <Text style={styles.placeholderText}>Детали задачи</Text>
  </View>
);

const ProfilePlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>👷</Text>
    <Text style={styles.placeholderText}>Профиль пользователя</Text>
    <Text style={styles.placeholderSubtext}>Имя, контакты, статистика</Text>
  </View>
);

const SettingsPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>⚙️</Text>
    <Text style={styles.placeholderText}>Настройки</Text>
    <Text style={styles.placeholderSubtext}>Уведомления, язык, тема</Text>
  </View>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Projects"
      component={ProjectsStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="🏗️" label="Проекты" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Tasks"
      component={TasksStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="📋" label="Задачи" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Progress"
      component={ProgressStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="📊" label="Прогресс" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="👷" label="Профиль" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// App Navigation
export const AppNavigation = () => (
  <NavigationContainer>
    <MainTabs />
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AppNavigation;
