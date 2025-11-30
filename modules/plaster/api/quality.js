/**
 * Kolibri PLASTER Module - Quality Control API
 * Контроль качества, чек-листы, дефекты, фотографии
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL in production)
let qualityChecks = [];
let defects = [];
let photos = [];

// Quality checklist template
const qualityChecklistTemplate = [
  { id: 'evenness', name: 'Ровность поверхности', tolerance: '2mm на 2м', category: 'surface' },
  { id: 'adhesion', name: 'Адгезия', tolerance: '0.3 МПа', category: 'material' },
  { id: 'thickness', name: 'Толщина слоя', tolerance: '±2mm', category: 'surface' },
  { id: 'cracks', name: 'Отсутствие трещин', tolerance: '0', category: 'defect' },
  { id: 'corners', name: 'Прямолинейность углов', tolerance: '3mm на 2м', category: 'surface' },
  { id: 'moisture', name: 'Влажность', tolerance: '<8%', category: 'material' }
];

// Defect types configuration
const defectTypes = [
  { id: 'crack', name: 'Трещина', severity: 'high', repair_method: 'Расшить, прогрунтовать, заделать смесью' },
  { id: 'chip', name: 'Скол', severity: 'medium', repair_method: 'Зачистить, прогрунтовать, зашпаклевать' },
  { id: 'unevenness', name: 'Неровность', severity: 'medium', repair_method: 'Шлифовка или дополнительный слой' },
  { id: 'delamination', name: 'Отслоение', severity: 'critical', repair_method: 'Удалить отслоившийся слой, подготовить поверхность, нанести заново' },
  { id: 'efflorescence', name: 'Высолы', severity: 'medium', repair_method: 'Обработать специальным составом, перекрасить' },
  { id: 'mold', name: 'Плесень', severity: 'critical', repair_method: 'Обработать антисептиком, устранить причину влажности' }
];

/**
 * GET /api/plaster/quality/checklist
 * Получить шаблон чек-листа
 */
router.get('/checklist', (req, res) => {
  try {
    res.json({
      success: true,
      data: qualityChecklistTemplate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/quality/defect-types
 * Получить типы дефектов
 */
router.get('/defect-types', (req, res) => {
  try {
    res.json({
      success: true,
      data: defectTypes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/quality/check
 * Провести проверку качества
 */
router.post('/check', (req, res) => {
  try {
    const {
      project_id,
      stage_id,
      inspector_id,
      evenness_check,
      evenness_deviation,
      adhesion_check,
      adhesion_value,
      thickness_check,
      thickness_value,
      cracks_check,
      cracks_found,
      corners_check,
      corners_deviation,
      moisture_check,
      moisture_percent,
      notes
    } = req.body;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id is required'
      });
    }
    
    // Determine overall pass/fail
    let overallPassed = true;
    const issues = [];
    
    if (evenness_check && evenness_deviation > 2) {
      overallPassed = false;
      issues.push('Ровность не соответствует норме');
    }
    if (adhesion_check && adhesion_value < 0.3) {
      overallPassed = false;
      issues.push('Адгезия ниже допустимого значения');
    }
    if (thickness_check && Math.abs(thickness_value - 10) > 2) {
      overallPassed = false;
      issues.push('Толщина слоя вне допуска');
    }
    if (cracks_check && cracks_found > 0) {
      overallPassed = false;
      issues.push(`Обнаружено трещин: ${cracks_found}`);
    }
    if (corners_check && corners_deviation > 3) {
      overallPassed = false;
      issues.push('Углы не соответствуют норме');
    }
    if (moisture_check && moisture_percent > 8) {
      overallPassed = false;
      issues.push('Влажность выше допустимой');
    }
    
    const check = {
      id: uuidv4(),
      project_id,
      stage_id: stage_id || null,
      check_date: new Date().toISOString(),
      inspector_id: inspector_id || null,
      evenness_check: evenness_check || false,
      evenness_deviation: evenness_deviation ? Number(evenness_deviation) : null,
      adhesion_check: adhesion_check || false,
      adhesion_value: adhesion_value ? Number(adhesion_value) : null,
      thickness_check: thickness_check || false,
      thickness_value: thickness_value ? Number(thickness_value) : null,
      cracks_check: cracks_check || false,
      cracks_found: cracks_found ? Number(cracks_found) : 0,
      corners_check: corners_check || false,
      corners_deviation: corners_deviation ? Number(corners_deviation) : null,
      moisture_check: moisture_check || false,
      moisture_percent: moisture_percent ? Number(moisture_percent) : null,
      overall_passed: overallPassed,
      issues,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    qualityChecks.push(check);
    
    res.status(201).json({
      success: true,
      data: check
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/quality/checks/:projectId
 * Получить проверки качества проекта
 */
router.get('/checks/:projectId', (req, res) => {
  try {
    const checks = qualityChecks
      .filter(c => c.project_id === req.params.projectId)
      .sort((a, b) => new Date(b.check_date) - new Date(a.check_date));
    
    const summary = {
      total_checks: checks.length,
      passed: checks.filter(c => c.overall_passed).length,
      failed: checks.filter(c => !c.overall_passed).length,
      pass_rate: checks.length > 0 
        ? (checks.filter(c => c.overall_passed).length / checks.length * 100).toFixed(1)
        : 0
    };
    
    res.json({
      success: true,
      data: checks,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/quality/defect
 * Зарегистрировать дефект
 */
router.post('/defect', (req, res) => {
  try {
    const {
      project_id,
      stage_id,
      quality_check_id,
      defect_type,
      severity,
      location_description,
      location_x,
      location_y,
      area_sqm,
      ai_detected,
      ai_confidence,
      notes
    } = req.body;
    
    if (!project_id || !defect_type) {
      return res.status(400).json({
        success: false,
        error: 'project_id and defect_type are required'
      });
    }
    
    // Get repair method recommendation
    const defectInfo = defectTypes.find(d => d.id === defect_type);
    const defaultSeverity = defectInfo?.severity || 'medium';
    
    const defect = {
      id: uuidv4(),
      project_id,
      stage_id: stage_id || null,
      quality_check_id: quality_check_id || null,
      defect_type,
      defect_name: defectInfo?.name || defect_type,
      severity: severity || defaultSeverity,
      location_description: location_description || null,
      location_x: location_x ? Number(location_x) : null,
      location_y: location_y ? Number(location_y) : null,
      area_sqm: area_sqm ? Number(area_sqm) : null,
      status: 'detected',
      detected_at: new Date().toISOString(),
      repaired_at: null,
      repair_description: null,
      repair_materials: null,
      repair_cost: null,
      repair_recommendation: defectInfo?.repair_method || null,
      ai_detected: ai_detected || false,
      ai_confidence: ai_confidence ? Number(ai_confidence) : null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    defects.push(defect);
    
    res.status(201).json({
      success: true,
      data: defect
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/quality/defects/:projectId
 * Получить дефекты проекта
 */
router.get('/defects/:projectId', (req, res) => {
  try {
    const { status, severity, defect_type } = req.query;
    
    let filtered = defects.filter(d => d.project_id === req.params.projectId);
    
    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }
    if (severity) {
      filtered = filtered.filter(d => d.severity === severity);
    }
    if (defect_type) {
      filtered = filtered.filter(d => d.defect_type === defect_type);
    }
    
    // Sort by severity and date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.detected_at) - new Date(a.detected_at);
    });
    
    const summary = {
      total: filtered.length,
      by_status: {
        detected: filtered.filter(d => d.status === 'detected').length,
        in_repair: filtered.filter(d => d.status === 'in_repair').length,
        repaired: filtered.filter(d => d.status === 'repaired').length,
        accepted: filtered.filter(d => d.status === 'accepted').length
      },
      by_severity: {
        critical: filtered.filter(d => d.severity === 'critical').length,
        high: filtered.filter(d => d.severity === 'high').length,
        medium: filtered.filter(d => d.severity === 'medium').length,
        low: filtered.filter(d => d.severity === 'low').length
      }
    };
    
    res.json({
      success: true,
      data: filtered,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/quality/defects/:id
 * Обновить дефект (статус, ремонт)
 */
router.put('/defects/:id', (req, res) => {
  try {
    const index = defects.findIndex(d => d.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Defect not found' });
    }
    
    const allowedUpdates = [
      'status', 'repair_description', 'repair_materials', 'repair_cost', 'notes'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate status
    if (updates.status) {
      const validStatuses = ['detected', 'in_repair', 'repaired', 'accepted'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      // Set repaired_at when status changes to repaired
      if (updates.status === 'repaired' && defects[index].status !== 'repaired') {
        updates.repaired_at = new Date().toISOString();
      }
    }
    
    defects[index] = {
      ...defects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: defects[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/quality/photo
 * Загрузить фото (метаданные)
 */
router.post('/photo', (req, res) => {
  try {
    const {
      project_id,
      stage_id,
      defect_id,
      quality_check_id,
      photo_type,
      file_path,
      file_name,
      file_size,
      mime_type,
      location_lat,
      location_lng,
      description
    } = req.body;
    
    if (!project_id || !file_path || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'project_id, file_path, and file_name are required'
      });
    }
    
    const validPhotoTypes = ['before', 'progress', 'after', 'defect', 'quality', 'other'];
    const photoType = photo_type && validPhotoTypes.includes(photo_type) ? photo_type : 'other';
    
    const photo = {
      id: uuidv4(),
      project_id,
      stage_id: stage_id || null,
      defect_id: defect_id || null,
      quality_check_id: quality_check_id || null,
      photo_type: photoType,
      file_path,
      file_name,
      file_size: file_size ? Number(file_size) : null,
      mime_type: mime_type || 'image/jpeg',
      thumbnail_path: null,
      taken_at: new Date().toISOString(),
      uploaded_by: null,
      location_lat: location_lat ? Number(location_lat) : null,
      location_lng: location_lng ? Number(location_lng) : null,
      description: description || null,
      ai_analyzed: false,
      ai_analysis_result: null,
      created_at: new Date().toISOString()
    };
    
    photos.push(photo);
    
    res.status(201).json({
      success: true,
      data: photo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/quality/photos/:projectId
 * Получить фото проекта
 */
router.get('/photos/:projectId', (req, res) => {
  try {
    const { photo_type, stage_id, defect_id } = req.query;
    
    let filtered = photos.filter(p => p.project_id === req.params.projectId);
    
    if (photo_type) {
      filtered = filtered.filter(p => p.photo_type === photo_type);
    }
    if (stage_id) {
      filtered = filtered.filter(p => p.stage_id === stage_id);
    }
    if (defect_id) {
      filtered = filtered.filter(p => p.defect_id === defect_id);
    }
    
    // Sort by taken_at descending
    filtered.sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));
    
    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/quality/photos/:id/analyze
 * Отметить фото как проанализированное AI
 */
router.put('/photos/:id/analyze', (req, res) => {
  try {
    const index = photos.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }
    
    const { analysis_result } = req.body;
    
    photos[index] = {
      ...photos[index],
      ai_analyzed: true,
      ai_analysis_result: analysis_result || {}
    };
    
    res.json({
      success: true,
      data: photos[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/quality/report/:projectId
 * Генерация отчета по качеству проекта
 */
router.get('/report/:projectId', (req, res) => {
  try {
    const projectChecks = qualityChecks.filter(c => c.project_id === req.params.projectId);
    const projectDefects = defects.filter(d => d.project_id === req.params.projectId);
    const projectPhotos = photos.filter(p => p.project_id === req.params.projectId);
    
    const report = {
      project_id: req.params.projectId,
      generated_at: new Date().toISOString(),
      quality_checks: {
        total: projectChecks.length,
        passed: projectChecks.filter(c => c.overall_passed).length,
        failed: projectChecks.filter(c => !c.overall_passed).length,
        pass_rate: projectChecks.length > 0 
          ? (projectChecks.filter(c => c.overall_passed).length / projectChecks.length * 100).toFixed(1) + '%'
          : 'N/A',
        last_check: projectChecks.length > 0 
          ? projectChecks.sort((a, b) => new Date(b.check_date) - new Date(a.check_date))[0]
          : null
      },
      defects: {
        total: projectDefects.length,
        open: projectDefects.filter(d => !['repaired', 'accepted'].includes(d.status)).length,
        repaired: projectDefects.filter(d => d.status === 'repaired').length,
        accepted: projectDefects.filter(d => d.status === 'accepted').length,
        critical_count: projectDefects.filter(d => d.severity === 'critical').length,
        total_repair_cost: projectDefects.reduce((sum, d) => sum + (d.repair_cost || 0), 0),
        ai_detected_count: projectDefects.filter(d => d.ai_detected).length
      },
      documentation: {
        total_photos: projectPhotos.length,
        before_photos: projectPhotos.filter(p => p.photo_type === 'before').length,
        progress_photos: projectPhotos.filter(p => p.photo_type === 'progress').length,
        after_photos: projectPhotos.filter(p => p.photo_type === 'after').length,
        defect_photos: projectPhotos.filter(p => p.photo_type === 'defect').length,
        ai_analyzed: projectPhotos.filter(p => p.ai_analyzed).length
      },
      recommendation: generateRecommendation(projectChecks, projectDefects)
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to generate recommendation
function generateRecommendation(checks, defectsList) {
  const criticalDefects = defectsList.filter(d => d.severity === 'critical' && d.status !== 'accepted');
  const failedChecks = checks.filter(c => !c.overall_passed);
  
  if (criticalDefects.length > 0) {
    return {
      status: 'critical',
      message: 'Обнаружены критические дефекты, требующие немедленного устранения',
      action: 'Устраните критические дефекты перед продолжением работ'
    };
  }
  
  if (failedChecks.length > checks.length * 0.3) {
    return {
      status: 'warning',
      message: 'Высокий процент неуспешных проверок качества',
      action: 'Проведите анализ причин и улучшите технологию работ'
    };
  }
  
  const openDefects = defectsList.filter(d => !['repaired', 'accepted'].includes(d.status));
  if (openDefects.length > 0) {
    return {
      status: 'attention',
      message: `${openDefects.length} дефектов требуют внимания`,
      action: 'Устраните выявленные дефекты'
    };
  }
  
  return {
    status: 'good',
    message: 'Качество работ соответствует стандартам',
    action: 'Продолжайте соблюдать технологию'
  };
}

// Export for testing
export { qualityChecks, defects, photos };
export default router;
