/**
 * Kolibri PLASTER Module - Projects API
 * Управление проектами штукатурных работ
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL in production)
let projects = [];
let projectStages = [];

/**
 * GET /api/plaster/projects
 * Получить список всех проектов
 */
router.get('/', (req, res) => {
  try {
    const { status, room_type, limit = 50, offset = 0 } = req.query;
    
    let filtered = [...projects];
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    if (room_type) {
      filtered = filtered.filter(p => p.room_type === room_type);
    }
    
    // Add calculated fields
    const enriched = filtered.map(project => ({
      ...project,
      progress_percent: calculateProjectProgress(project.id),
      total_stages: projectStages.filter(s => s.project_id === project.id).length,
      completed_stages: projectStages.filter(s => s.project_id === project.id && s.status === 'completed').length
    }));
    
    // Sort by created_at descending
    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Paginate
    const paginated = enriched.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/projects/:id
 * Получить проект по ID
 */
router.get('/:id', (req, res) => {
  try {
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Get stages for this project
    const stages = projectStages.filter(s => s.project_id === project.id);
    
    res.json({
      success: true,
      data: {
        ...project,
        stages,
        progress_percent: calculateProjectProgress(project.id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/projects
 * Создать новый проект
 */
router.post('/', (req, res) => {
  try {
    const {
      name,
      address,
      area_sqm,
      room_type,
      plaster_type,
      start_date,
      deadline,
      budget,
      client_name,
      client_phone,
      client_email,
      notes
    } = req.body;
    
    // Validation
    if (!name || !address || !area_sqm || !room_type || !plaster_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, address, area_sqm, room_type, plaster_type'
      });
    }
    
    if (area_sqm <= 0) {
      return res.status(400).json({
        success: false,
        error: 'area_sqm must be greater than 0'
      });
    }
    
    const validRoomTypes = ['residential', 'commercial', 'industrial', 'office'];
    if (!validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        error: `room_type must be one of: ${validRoomTypes.join(', ')}`
      });
    }
    
    const project = {
      id: uuidv4(),
      name,
      address,
      area_sqm: Number(area_sqm),
      room_type,
      plaster_type,
      status: 'planning',
      start_date: start_date || null,
      end_date: null,
      deadline: deadline || null,
      budget: budget ? Number(budget) : null,
      client_name: client_name || null,
      client_phone: client_phone || null,
      client_email: client_email || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    projects.push(project);
    
    // Create default stages
    createDefaultStages(project.id);
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/projects/:id
 * Обновить проект
 */
router.put('/:id', (req, res) => {
  try {
    const index = projects.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const allowedUpdates = [
      'name', 'address', 'area_sqm', 'room_type', 'plaster_type',
      'status', 'start_date', 'end_date', 'deadline', 'budget',
      'client_name', 'client_phone', 'client_email', 'notes'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate status transition
    if (updates.status) {
      const validStatuses = ['planning', 'in_progress', 'paused', 'completed', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(', ')}`
        });
      }
    }
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: projects[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/plaster/projects/:id
 * Удалить проект
 */
router.delete('/:id', (req, res) => {
  try {
    const index = projects.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Remove associated stages
    projectStages = projectStages.filter(s => s.project_id !== req.params.id);
    
    const deleted = projects.splice(index, 1)[0];
    
    res.json({
      success: true,
      data: deleted
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/projects/:id/stages
 * Получить этапы проекта
 */
router.get('/:id/stages', (req, res) => {
  try {
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const stages = projectStages
      .filter(s => s.project_id === req.params.id)
      .sort((a, b) => a.stage_order - b.stage_order);
    
    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/projects/:id/stages/:stageId
 * Обновить этап проекта
 */
router.put('/:id/stages/:stageId', (req, res) => {
  try {
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const stageIndex = projectStages.findIndex(
      s => s.id === req.params.stageId && s.project_id === req.params.id
    );
    
    if (stageIndex === -1) {
      return res.status(404).json({ success: false, error: 'Stage not found' });
    }
    
    const allowedUpdates = [
      'status', 'actual_start', 'actual_end', 'progress_percent', 'notes'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate progress_percent
    if (updates.progress_percent !== undefined) {
      const progress = Number(updates.progress_percent);
      if (progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          error: 'progress_percent must be between 0 and 100'
        });
      }
      updates.progress_percent = progress;
      
      // Auto-update status based on progress
      if (progress === 100) {
        updates.status = 'completed';
        if (!updates.actual_end) {
          updates.actual_end = new Date().toISOString().split('T')[0];
        }
      } else if (progress > 0 && projectStages[stageIndex].status === 'pending') {
        updates.status = 'in_progress';
        if (!updates.actual_start) {
          updates.actual_start = new Date().toISOString().split('T')[0];
        }
      }
    }
    
    projectStages[stageIndex] = {
      ...projectStages[stageIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: projectStages[stageIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/projects/stats/summary
 * Получить статистику по проектам
 */
router.get('/stats/summary', (req, res) => {
  try {
    const stats = {
      total: projects.length,
      by_status: {
        planning: projects.filter(p => p.status === 'planning').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        paused: projects.filter(p => p.status === 'paused').length,
        completed: projects.filter(p => p.status === 'completed').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length
      },
      total_area_sqm: projects.reduce((sum, p) => sum + p.area_sqm, 0),
      total_budget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      overdue: projects.filter(p => 
        p.deadline && 
        new Date(p.deadline) < new Date() && 
        !['completed', 'cancelled'].includes(p.status)
      ).length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions

function calculateProjectProgress(projectId) {
  const stages = projectStages.filter(s => s.project_id === projectId);
  if (stages.length === 0) return 0;
  
  const totalProgress = stages.reduce((sum, s) => sum + (s.progress_percent || 0), 0);
  return Math.round(totalProgress / stages.length);
}

function createDefaultStages(projectId) {
  const defaultStages = [
    { type: 'preparation', name: 'Подготовка поверхности', order: 1 },
    { type: 'priming', name: 'Грунтовка', order: 2 },
    { type: 'beacon_setup', name: 'Установка маяков', order: 3 },
    { type: 'application', name: 'Нанесение штукатурки', order: 4 },
    { type: 'leveling_stage', name: 'Выравнивание', order: 5 },
    { type: 'finishing', name: 'Финишная отделка', order: 6 }
  ];
  
  for (const stage of defaultStages) {
    projectStages.push({
      id: uuidv4(),
      project_id: projectId,
      stage_type: stage.type,
      stage_name: stage.name,
      stage_order: stage.order,
      status: 'pending',
      planned_start: null,
      planned_end: null,
      actual_start: null,
      actual_end: null,
      area_sqm: null,
      progress_percent: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// Export for testing
export { projects, projectStages };
export default router;
