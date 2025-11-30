import React, { useState, useEffect } from 'react';

/**
 * Dashboard Component
 * Главная панель управления для модуля PLASTER
 */

interface DashboardStats {
  projects: {
    total: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  financials: {
    total_revenue: number;
    total_expenses: number;
    profit: number;
    pending_payments: number;
  };
  workers: {
    total: number;
    active: number;
    available: number;
  };
  quality: {
    total_checks: number;
    pass_rate: number;
    open_defects: number;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress_percent: number;
  deadline?: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface DashboardProps {
  stats?: DashboardStats;
  recentProjects?: Project[];
  alerts?: Alert[];
  onNavigate?: (section: string) => void;
  onRefresh?: () => void;
}

const defaultStats: DashboardStats = {
  projects: { total: 0, in_progress: 0, completed: 0, overdue: 0 },
  financials: { total_revenue: 0, total_expenses: 0, profit: 0, pending_payments: 0 },
  workers: { total: 0, active: 0, available: 0 },
  quality: { total_checks: 0, pass_rate: 0, open_defects: 0 },
};

const alertTypeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-400', icon: '⚠️' },
  error: { bg: 'bg-red-50', border: 'border-red-400', icon: '❌' },
  info: { bg: 'bg-blue-50', border: 'border-blue-400', icon: 'ℹ️' },
  success: { bg: 'bg-green-50', border: 'border-green-400', icon: '✅' },
};

export const Dashboard: React.FC<DashboardProps> = ({
  stats = defaultStats,
  recentProjects = [],
  alerts = [],
  onNavigate,
  onRefresh,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'paused': return 'text-orange-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Планирование';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершен';
      case 'paused': return 'Приостановлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    onRefresh?.();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">PLASTER Dashboard</h1>
            <p className="text-gray-500">Управление штукатурными работами</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <div className="flex bg-white rounded-lg shadow p-1">
              {(['day', 'week', 'month'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period === 'day' ? 'День' : period === 'week' ? 'Неделя' : 'Месяц'}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
              title="Обновить"
            >
              🔄
            </button>
            
            {/* Last Updated */}
            <span className="text-sm text-gray-500">
              Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Projects */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => onNavigate?.('projects')}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">🏗️</span>
            <span className="text-sm text-gray-500">Проекты</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">{stats.projects.total}</div>
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">{stats.projects.in_progress} в работе</span>
            <span className="text-green-600">{stats.projects.completed} завершено</span>
          </div>
          {stats.projects.overdue > 0 && (
            <div className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ {stats.projects.overdue} просрочено
            </div>
          )}
        </div>

        {/* Financial */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => onNavigate?.('financials')}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">💰</span>
            <span className="text-sm text-gray-500">Финансы</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {formatCurrency(stats.financials.profit)}
          </div>
          <div className="text-sm text-gray-500 mb-1">
            Прибыль за период
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600">+{formatCurrency(stats.financials.total_revenue)}</span>
            <span className="text-red-600">-{formatCurrency(stats.financials.total_expenses)}</span>
          </div>
        </div>

        {/* Workers */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => onNavigate?.('workers')}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👷</span>
            <span className="text-sm text-gray-500">Рабочие</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">{stats.workers.total}</div>
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">{stats.workers.active} на объектах</span>
            <span className="text-green-600">{stats.workers.available} свободны</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500" 
              style={{ width: `${stats.workers.total > 0 ? (stats.workers.active / stats.workers.total * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Quality */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => onNavigate?.('quality')}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">✅</span>
            <span className="text-sm text-gray-500">Качество</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {formatPercent(stats.quality.pass_rate)}
          </div>
          <div className="text-sm text-gray-500 mb-1">
            Успешных проверок
          </div>
          <div className="flex justify-between text-sm">
            <span>{stats.quality.total_checks} проверок</span>
            {stats.quality.open_defects > 0 && (
              <span className="text-orange-600">{stats.quality.open_defects} дефектов</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Последние проекты</h2>
            <button
              onClick={() => onNavigate?.('projects')}
              className="text-indigo-600 text-sm hover:text-indigo-800"
            >
              Все проекты →
            </button>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map(project => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onNavigate?.(`project/${project.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{project.name}</h3>
                    <span className={`text-sm ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Прогресс</span>
                        <span className="font-medium">{project.progress_percent}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            project.progress_percent === 100 ? 'bg-green-500' :
                            project.progress_percent > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${project.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    {project.deadline && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Дедлайн</div>
                        <div className={`text-sm font-medium ${
                          new Date(project.deadline) < new Date() ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {new Date(project.deadline).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>Нет активных проектов</p>
              <button
                onClick={() => onNavigate?.('projects/new')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Создать проект
              </button>
            </div>
          )}
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Уведомления</h2>
          
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${alertTypeStyles[alert.type].bg} ${alertTypeStyles[alert.type].border}`}
                >
                  <div className="flex items-start gap-2">
                    <span>{alertTypeStyles[alert.type].icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{alert.title}</h4>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(alert.timestamp).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>Нет новых уведомлений</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: '➕', label: 'Новый проект', action: 'projects/new' },
            { icon: '📸', label: 'AI диагностика', action: 'diagnosis' },
            { icon: '📊', label: 'Калькулятор', action: 'calculator' },
            { icon: '👷', label: 'Добавить рабочего', action: 'workers/new' },
            { icon: '📝', label: 'Создать смету', action: 'estimate' },
            { icon: '📈', label: 'Отчеты', action: 'reports' },
          ].map(action => (
            <button
              key={action.action}
              onClick={() => onNavigate?.(action.action)}
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <span className="text-3xl mb-2">{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
