/**
 * Kolibri PLASTER Module - Workers API
 * Управление рабочими, назначениями и учет времени
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL in production)
let workers = [
  {
    id: uuidv4(),
    first_name: 'Александр',
    last_name: 'Петров',
    phone: '+7-999-111-2233',
    email: 'petrov@example.com',
    specialization: 'Штукатур',
    experience_years: 8,
    hourly_rate: 350.00,
    daily_rate: 2800.00,
    productivity_sqm_day: 25.00,
    rating: 4.8,
    status: 'available',
    passport_number: null,
    notes: 'Опытный мастер, специализируется на декоративной штукатурке',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    first_name: 'Иван',
    last_name: 'Сидоров',
    phone: '+7-999-222-3344',
    email: 'sidorov@example.com',
    specialization: 'Штукатур',
    experience_years: 5,
    hourly_rate: 300.00,
    daily_rate: 2400.00,
    productivity_sqm_day: 20.00,
    rating: 4.5,
    status: 'available',
    passport_number: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    first_name: 'Михаил',
    last_name: 'Козлов',
    phone: '+7-999-333-4455',
    email: 'kozlov@example.com',
    specialization: 'Штукатур-маляр',
    experience_years: 10,
    hourly_rate: 400.00,
    daily_rate: 3200.00,
    productivity_sqm_day: 30.00,
    rating: 4.9,
    status: 'busy',
    passport_number: null,
    notes: 'Бригадир, высшая квалификация',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let workerAssignments = [];
let timeEntries = [];
let workerPayments = [];

/**
 * GET /api/plaster/workers
 * Получить список рабочих
 */
router.get('/', (req, res) => {
  try {
    const { status, specialization, available_only = 'false' } = req.query;
    
    let filtered = [...workers];
    
    if (status) {
      filtered = filtered.filter(w => w.status === status);
    }
    
    if (specialization) {
      filtered = filtered.filter(w => 
        w.specialization?.toLowerCase().includes(specialization.toLowerCase())
      );
    }
    
    if (available_only === 'true') {
      filtered = filtered.filter(w => w.status === 'available');
    }
    
    // Calculate additional stats
    const enriched = filtered.map(worker => {
      const assignments = workerAssignments.filter(
        a => a.worker_id === worker.id && a.status === 'active'
      );
      const entries = timeEntries.filter(e => e.worker_id === worker.id);
      const totalHours = entries.reduce((sum, e) => sum + e.hours_worked, 0);
      const totalArea = entries.reduce((sum, e) => sum + (e.area_completed || 0), 0);
      
      return {
        ...worker,
        active_assignments: assignments.length,
        total_hours_worked: totalHours,
        total_area_completed: totalArea,
        actual_productivity: totalHours > 0 ? (totalArea / totalHours * 8).toFixed(2) : null
      };
    });
    
    res.json({
      success: true,
      data: enriched,
      total: enriched.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/workers/:id
 * Получить рабочего по ID
 */
router.get('/:id', (req, res) => {
  try {
    const worker = workers.find(w => w.id === req.params.id);
    
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    // Get assignments and time entries
    const assignments = workerAssignments.filter(a => a.worker_id === worker.id);
    const entries = timeEntries.filter(e => e.worker_id === worker.id);
    
    res.json({
      success: true,
      data: {
        ...worker,
        assignments,
        recent_entries: entries.slice(-10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/workers
 * Добавить рабочего
 */
router.post('/', (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      specialization,
      experience_years,
      hourly_rate,
      daily_rate,
      productivity_sqm_day,
      passport_number,
      notes
    } = req.body;
    
    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name'
      });
    }
    
    const worker = {
      id: uuidv4(),
      first_name,
      last_name,
      phone: phone || null,
      email: email || null,
      specialization: specialization || 'Штукатур',
      experience_years: experience_years ? Number(experience_years) : 0,
      hourly_rate: hourly_rate ? Number(hourly_rate) : 0,
      daily_rate: daily_rate ? Number(daily_rate) : 0,
      productivity_sqm_day: productivity_sqm_day ? Number(productivity_sqm_day) : 20,
      rating: 0,
      status: 'available',
      passport_number: passport_number || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    workers.push(worker);
    
    res.status(201).json({
      success: true,
      data: worker
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/workers/:id
 * Обновить рабочего
 */
router.put('/:id', (req, res) => {
  try {
    const index = workers.findIndex(w => w.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    const allowedUpdates = [
      'first_name', 'last_name', 'phone', 'email', 'specialization',
      'experience_years', 'hourly_rate', 'daily_rate', 'productivity_sqm_day',
      'rating', 'status', 'passport_number', 'notes'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate status
    if (updates.status) {
      const validStatuses = ['available', 'busy', 'on_leave', 'inactive'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(', ')}`
        });
      }
    }
    
    // Validate rating
    if (updates.rating !== undefined) {
      const rating = Number(updates.rating);
      if (rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'rating must be between 0 and 5'
        });
      }
      updates.rating = rating;
    }
    
    workers[index] = {
      ...workers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: workers[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/workers/assign
 * Назначить рабочего на проект/этап
 */
router.post('/assign', (req, res) => {
  try {
    const {
      project_id,
      stage_id,
      worker_id,
      role,
      start_date,
      end_date,
      notes
    } = req.body;
    
    if (!project_id || !worker_id || !start_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, worker_id, start_date'
      });
    }
    
    const worker = workers.find(w => w.id === worker_id);
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    // Check for conflicting assignments
    const conflict = workerAssignments.find(a => 
      a.worker_id === worker_id &&
      a.status === 'active' &&
      (!a.end_date || new Date(a.end_date) >= new Date(start_date))
    );
    
    if (conflict) {
      return res.status(400).json({
        success: false,
        error: 'Worker has a conflicting assignment',
        conflicting_assignment: conflict
      });
    }
    
    const assignment = {
      id: uuidv4(),
      project_id,
      stage_id: stage_id || null,
      worker_id,
      role: role || 'worker',
      start_date,
      end_date: end_date || null,
      status: 'scheduled',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    workerAssignments.push(assignment);
    
    res.status(201).json({
      success: true,
      data: {
        ...assignment,
        worker_name: `${worker.first_name} ${worker.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/workers/assignments/:id
 * Обновить назначение
 */
router.put('/assignments/:id', (req, res) => {
  try {
    const index = workerAssignments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    
    const allowedUpdates = ['stage_id', 'role', 'start_date', 'end_date', 'status', 'notes'];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate status
    if (updates.status) {
      const validStatuses = ['scheduled', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      // Update worker status based on assignment
      const worker = workers.find(w => w.id === workerAssignments[index].worker_id);
      if (worker) {
        if (updates.status === 'active') {
          worker.status = 'busy';
        } else if (['completed', 'cancelled'].includes(updates.status)) {
          // Check if worker has other active assignments
          const otherActive = workerAssignments.filter(
            a => a.worker_id === worker.id && a.id !== req.params.id && a.status === 'active'
          );
          if (otherActive.length === 0) {
            worker.status = 'available';
          }
        }
        worker.updated_at = new Date().toISOString();
      }
    }
    
    workerAssignments[index] = {
      ...workerAssignments[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: workerAssignments[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/workers/time
 * Записать время работы
 */
router.post('/time', (req, res) => {
  try {
    const {
      worker_id,
      project_id,
      stage_id,
      work_date,
      hours_worked,
      area_completed,
      overtime_hours,
      notes
    } = req.body;
    
    if (!worker_id || !project_id || !work_date || !hours_worked) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: worker_id, project_id, work_date, hours_worked'
      });
    }
    
    if (hours_worked <= 0 || hours_worked > 24) {
      return res.status(400).json({
        success: false,
        error: 'hours_worked must be between 0 and 24'
      });
    }
    
    const worker = workers.find(w => w.id === worker_id);
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    // Check for duplicate entry
    const duplicate = timeEntries.find(e => 
      e.worker_id === worker_id && 
      e.project_id === project_id && 
      e.work_date === work_date
    );
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: 'Time entry already exists for this worker/project/date'
      });
    }
    
    const entry = {
      id: uuidv4(),
      worker_id,
      project_id,
      stage_id: stage_id || null,
      work_date,
      hours_worked: Number(hours_worked),
      area_completed: area_completed ? Number(area_completed) : null,
      overtime_hours: overtime_hours ? Number(overtime_hours) : 0,
      notes: notes || null,
      approved: false,
      approved_by: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    timeEntries.push(entry);
    
    res.status(201).json({
      success: true,
      data: {
        ...entry,
        worker_name: `${worker.first_name} ${worker.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/workers/:id/time
 * Получить записи времени рабочего
 */
router.get('/:id/time', (req, res) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    
    const worker = workers.find(w => w.id === req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    let entries = timeEntries.filter(e => e.worker_id === req.params.id);
    
    if (start_date) {
      entries = entries.filter(e => e.work_date >= start_date);
    }
    
    if (end_date) {
      entries = entries.filter(e => e.work_date <= end_date);
    }
    
    if (project_id) {
      entries = entries.filter(e => e.project_id === project_id);
    }
    
    // Sort by date descending
    entries.sort((a, b) => new Date(b.work_date) - new Date(a.work_date));
    
    // Calculate summary
    const summary = {
      total_hours: entries.reduce((sum, e) => sum + e.hours_worked, 0),
      total_overtime: entries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0),
      total_area: entries.reduce((sum, e) => sum + (e.area_completed || 0), 0),
      days_worked: entries.length
    };
    
    res.json({
      success: true,
      data: entries,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/workers/:id/payment
 * Создать расчет зарплаты
 */
router.post('/:id/payment', (req, res) => {
  try {
    const {
      project_id,
      period_start,
      period_end,
      bonus_amount,
      deductions,
      notes
    } = req.body;
    
    if (!period_start || !period_end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: period_start, period_end'
      });
    }
    
    const worker = workers.find(w => w.id === req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    
    // Calculate hours and area from time entries
    let entries = timeEntries.filter(e => 
      e.worker_id === req.params.id &&
      e.work_date >= period_start &&
      e.work_date <= period_end
    );
    
    if (project_id) {
      entries = entries.filter(e => e.project_id === project_id);
    }
    
    const hoursWorked = entries.reduce((sum, e) => sum + e.hours_worked, 0);
    const overtimeHours = entries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0);
    const areaCompleted = entries.reduce((sum, e) => sum + (e.area_completed || 0), 0);
    
    // Calculate base amount
    const baseAmount = hoursWorked * worker.hourly_rate + overtimeHours * worker.hourly_rate * 1.5;
    
    const payment = {
      id: uuidv4(),
      worker_id: req.params.id,
      project_id: project_id || null,
      period_start,
      period_end,
      hours_worked: hoursWorked,
      overtime_hours: overtimeHours,
      area_completed: areaCompleted,
      base_amount: baseAmount,
      bonus_amount: bonus_amount ? Number(bonus_amount) : 0,
      deductions: deductions ? Number(deductions) : 0,
      total_amount: baseAmount + (bonus_amount ? Number(bonus_amount) : 0) - (deductions ? Number(deductions) : 0),
      payment_date: null,
      status: 'calculated',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    workerPayments.push(payment);
    
    res.status(201).json({
      success: true,
      data: {
        ...payment,
        worker_name: `${worker.first_name} ${worker.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/workers/productivity/report
 * Отчет по производительности рабочих
 */
router.get('/productivity/report', (req, res) => {
  try {
    const { start_date, end_date, project_id } = req.query;
    
    const report = workers.map(worker => {
      let entries = timeEntries.filter(e => e.worker_id === worker.id);
      
      if (start_date) {
        entries = entries.filter(e => e.work_date >= start_date);
      }
      if (end_date) {
        entries = entries.filter(e => e.work_date <= end_date);
      }
      if (project_id) {
        entries = entries.filter(e => e.project_id === project_id);
      }
      
      const totalHours = entries.reduce((sum, e) => sum + e.hours_worked, 0);
      const totalArea = entries.reduce((sum, e) => sum + (e.area_completed || 0), 0);
      const actualProductivity = totalHours > 0 ? (totalArea / totalHours * 8) : 0;
      const efficiency = worker.productivity_sqm_day > 0 
        ? (actualProductivity / worker.productivity_sqm_day * 100)
        : 0;
      
      return {
        worker_id: worker.id,
        worker_name: `${worker.first_name} ${worker.last_name}`,
        specialization: worker.specialization,
        expected_productivity: worker.productivity_sqm_day,
        actual_productivity: actualProductivity.toFixed(2),
        efficiency_percent: efficiency.toFixed(1),
        total_hours: totalHours,
        total_area: totalArea,
        days_worked: entries.length,
        rating: worker.rating
      };
    });
    
    // Sort by efficiency descending
    report.sort((a, b) => Number(b.efficiency_percent) - Number(a.efficiency_percent));
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/workers/schedule/today
 * Получить расписание на сегодня
 */
router.get('/schedule/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const schedule = workerAssignments
      .filter(a => 
        ['scheduled', 'active'].includes(a.status) &&
        a.start_date <= today &&
        (!a.end_date || a.end_date >= today)
      )
      .map(assignment => {
        const worker = workers.find(w => w.id === assignment.worker_id);
        return {
          assignment_id: assignment.id,
          worker_id: assignment.worker_id,
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown',
          project_id: assignment.project_id,
          stage_id: assignment.stage_id,
          role: assignment.role,
          status: assignment.status
        };
      });
    
    res.json({
      success: true,
      data: schedule,
      date: today
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for testing
export { workers, workerAssignments, timeEntries, workerPayments };
export default router;
