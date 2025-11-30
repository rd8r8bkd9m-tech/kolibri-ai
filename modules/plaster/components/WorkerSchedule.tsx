import React, { useState } from 'react';

/**
 * WorkerSchedule Component
 * Расписание рабочих и назначение на проекты
 */

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialization: string;
  status: 'available' | 'busy' | 'on_leave' | 'inactive';
  productivity_sqm_day: number;
  hourly_rate: number;
  rating: number;
}

interface Assignment {
  id: string;
  project_id: string;
  project_name?: string;
  worker_id: string;
  start_date: string;
  end_date?: string;
  role: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

interface TimeEntry {
  id: string;
  worker_id: string;
  project_id: string;
  work_date: string;
  hours_worked: number;
  area_completed?: number;
}

interface WorkerScheduleProps {
  workers: Worker[];
  assignments: Assignment[];
  onAssign?: (workerId: string, projectId: string, dates: { start: string; end: string }) => void;
  onUpdateStatus?: (assignmentId: string, status: string) => void;
  onAddTimeEntry?: (entry: Omit<TimeEntry, 'id'>) => void;
  selectedDate?: string;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  on_leave: 'bg-orange-100 text-orange-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  available: 'Свободен',
  busy: 'Занят',
  on_leave: 'В отпуске',
  inactive: 'Неактивен',
};

const assignmentStatusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const WorkerSchedule: React.FC<WorkerScheduleProps> = ({
  workers,
  assignments,
  onAssign,
  onUpdateStatus,
  onAddTimeEntry,
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter workers
  const filteredWorkers = filterStatus === 'all' 
    ? workers 
    : workers.filter(w => w.status === filterStatus);

  // Get assignments for a worker
  const getWorkerAssignments = (workerId: string) => {
    return assignments.filter(a => a.worker_id === workerId);
  };

  // Get today's schedule
  const getTodaySchedule = () => {
    const today = selectedDate;
    return assignments.filter(a => 
      ['scheduled', 'active'].includes(a.status) &&
      a.start_date <= today &&
      (!a.end_date || a.end_date >= today)
    );
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
        <span className="text-sm text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Расписание рабочих</h2>
            <p className="text-green-100 text-sm">Управление бригадой и назначениями</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'list' ? 'bg-white text-green-600' : 'bg-green-700 text-white'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-white text-green-600' : 'bg-green-700 text-white'
              }`}
            >
              Календарь
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-4">
        <span className="text-sm text-gray-600">Фильтр:</span>
        <div className="flex gap-2">
          {['all', 'available', 'busy', 'on_leave'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="text-sm text-gray-500">
          Всего: {filteredWorkers.length} рабочих
        </div>
      </div>

      {/* Today's Summary */}
      <div className="px-6 py-4 bg-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Сегодня на объектах</h3>
            <p className="text-sm text-gray-500">{selectedDate}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workers.filter(w => w.status === 'busy').length}
              </div>
              <div className="text-xs text-gray-500">На работе</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {workers.filter(w => w.status === 'available').length}
              </div>
              <div className="text-xs text-gray-500">Свободны</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {workers.filter(w => w.status === 'on_leave').length}
              </div>
              <div className="text-xs text-gray-500">В отпуске</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="divide-y">
          {filteredWorkers.map(worker => (
            <div
              key={worker.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedWorker(worker)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {worker.first_name[0]}{worker.last_name[0]}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">
                        {worker.first_name} {worker.last_name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[worker.status]}`}>
                        {statusLabels[worker.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{worker.specialization}</p>
                    {renderRating(worker.rating)}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{worker.productivity_sqm_day}</div>
                    <div className="text-gray-500">м²/день</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{formatCurrency(worker.hourly_rate)}</div>
                    <div className="text-gray-500">/час</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{getWorkerAssignments(worker.id).length}</div>
                    <div className="text-gray-500">Назначений</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {worker.status === 'available' && onAssign && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorker(worker);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Назначить
                    </button>
                  )}
                  {onAddTimeEntry && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorker(worker);
                        setShowTimeModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Время
                    </button>
                  )}
                </div>
              </div>

              {/* Current Assignments */}
              {getWorkerAssignments(worker.id).filter(a => a.status === 'active').length > 0 && (
                <div className="mt-3 ml-16">
                  <div className="text-xs text-gray-500 mb-1">Текущие назначения:</div>
                  <div className="flex flex-wrap gap-2">
                    {getWorkerAssignments(worker.id)
                      .filter(a => a.status === 'active')
                      .map(assignment => (
                        <span
                          key={assignment.id}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {assignment.project_name || assignment.project_id}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6">
          <CalendarView 
            assignments={assignments} 
            workers={workers} 
            selectedDate={selectedDate}
          />
        </div>
      )}

      {/* Empty State */}
      {filteredWorkers.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-2">👷</div>
          <p>Нет рабочих по выбранному фильтру</p>
        </div>
      )}
    </div>
  );
};

// Calendar View Component
const CalendarView: React.FC<{
  assignments: Assignment[];
  workers: Worker[];
  selectedDate: string;
}> = ({ assignments, workers, selectedDate }) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1 + currentWeek * 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getAssignmentsForDay = (date: Date, workerId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(a => 
      a.worker_id === workerId &&
      ['scheduled', 'active'].includes(a.status) &&
      a.start_date <= dateStr &&
      (!a.end_date || a.end_date >= dateStr)
    );
  };

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentWeek(currentWeek - 1)}
          className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          ← Пред.
        </button>
        <span className="font-medium">
          {weekDays[0].toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
        </span>
        <button
          onClick={() => setCurrentWeek(currentWeek + 1)}
          className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          След. →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 bg-gray-100 border-b">
          <div className="p-2 text-sm font-medium text-gray-600 border-r">Рабочий</div>
          {weekDays.map((day, i) => (
            <div 
              key={i} 
              className={`p-2 text-center text-sm ${
                day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                  ? 'bg-blue-100'
                  : ''
              }`}
            >
              <div className="font-medium">{dayNames[i]}</div>
              <div className="text-gray-500">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        {workers.slice(0, 5).map(worker => (
          <div key={worker.id} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-2 text-sm border-r flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                {worker.first_name[0]}
              </div>
              <span className="truncate">{worker.first_name}</span>
            </div>
            {weekDays.map((day, i) => {
              const dayAssignments = getAssignmentsForDay(day, worker.id);
              return (
                <div 
                  key={i} 
                  className={`p-1 min-h-[50px] ${
                    day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  {dayAssignments.map(a => (
                    <div
                      key={a.id}
                      className={`text-xs p-1 rounded mb-1 truncate ${assignmentStatusColors[a.status]}`}
                    >
                      {a.project_name || 'Проект'}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerSchedule;
