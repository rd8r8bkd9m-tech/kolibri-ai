import React from 'react';

/**
 * ProjectCard Component
 * Карточка проекта для отображения в списке и на дашборде
 */

interface ProjectStage {
  id: string;
  stage_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  progress_percent: number;
}

interface Project {
  id: string;
  name: string;
  address: string;
  area_sqm: number;
  room_type: 'residential' | 'commercial' | 'industrial' | 'office';
  plaster_type: string;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  deadline?: string;
  budget?: number;
  client_name?: string;
  progress_percent: number;
  total_stages: number;
  completed_stages: number;
}

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  planning: 'Планирование',
  in_progress: 'В работе',
  paused: 'Приостановлен',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const roomTypeLabels: Record<string, string> = {
  residential: 'Жилое',
  commercial: 'Коммерческое',
  industrial: 'Промышленное',
  office: 'Офис',
};

const plasterTypeLabels: Record<string, string> = {
  leveling: 'Выравнивающая',
  decorative: 'Декоративная',
  finish: 'Финишная',
  gypsum: 'Гипсовая',
  cement: 'Цементная',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isOverdue = project.deadline && 
    new Date(project.deadline) < new Date() && 
    !['completed', 'cancelled'].includes(project.status);

  if (compact) {
    return (
      <div
        className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(project)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 truncate">{project.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mb-2">{project.address}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{project.area_sqm} м²</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
          <span className="text-gray-600">{project.progress_percent}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      onClick={() => onClick?.(project)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">{project.name}</h3>
            <p className="text-blue-100 text-sm mt-1">{project.address}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Прогресс</span>
          <span className="text-sm font-bold text-blue-600">{project.progress_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              project.progress_percent === 100
                ? 'bg-green-500'
                : project.progress_percent > 50
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${project.progress_percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Этапы: {project.completed_stages}/{project.total_stages}</span>
          {isOverdue && (
            <span className="text-red-500 font-medium">⚠️ Просрочено</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Площадь</p>
          <p className="text-lg font-semibold text-gray-800">{project.area_sqm} м²</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Тип помещения</p>
          <p className="text-lg font-semibold text-gray-800">
            {roomTypeLabels[project.room_type] || project.room_type}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Штукатурка</p>
          <p className="text-lg font-semibold text-gray-800">
            {plasterTypeLabels[project.plaster_type] || project.plaster_type}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Бюджет</p>
          <p className="text-lg font-semibold text-gray-800">{formatCurrency(project.budget)}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="px-6 py-3 bg-gray-50 flex justify-between text-sm">
        <div>
          <span className="text-gray-500">Начало: </span>
          <span className="font-medium">{formatDate(project.start_date)}</span>
        </div>
        <div>
          <span className="text-gray-500">Дедлайн: </span>
          <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
            {formatDate(project.deadline)}
          </span>
        </div>
      </div>

      {/* Client */}
      {project.client_name && (
        <div className="px-6 py-3 border-t">
          <p className="text-sm text-gray-500">
            Заказчик: <span className="font-medium text-gray-700">{project.client_name}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Редактировать
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
