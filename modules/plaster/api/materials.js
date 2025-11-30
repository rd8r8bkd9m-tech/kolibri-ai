/**
 * Kolibri PLASTER Module - Materials API
 * Управление материалами и калькуляция
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL in production)
let materials = [
  {
    id: uuidv4(),
    name: 'Ротбанд Кнауф 30кг',
    name_en: 'Rotband Knauf 30kg',
    category: 'plaster',
    unit: 'мешок',
    price_per_unit: 450.00,
    consumption_rate: 0.85,
    supplier: 'СтройМаркет',
    supplier_contact: '+7-495-123-4567',
    min_stock_level: 10,
    description: 'Гипсовая штукатурка универсальная',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Волма Слой 30кг',
    name_en: 'Volma Layer 30kg',
    category: 'plaster',
    unit: 'мешок',
    price_per_unit: 380.00,
    consumption_rate: 0.90,
    supplier: 'СтройМаркет',
    supplier_contact: '+7-495-123-4567',
    min_stock_level: 10,
    description: 'Гипсовая штукатурка для внутренних работ',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Грунтовка Бетоконтакт 20кг',
    name_en: 'Primer Betonkontakt 20kg',
    category: 'primer',
    unit: 'ведро',
    price_per_unit: 1200.00,
    consumption_rate: 0.30,
    supplier: 'СтройМаркет',
    supplier_contact: '+7-495-123-4567',
    min_stock_level: 5,
    description: 'Грунтовка для гладких поверхностей',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Сетка штукатурная 50м',
    name_en: 'Plaster mesh 50m',
    category: 'mesh',
    unit: 'рулон',
    price_per_unit: 850.00,
    consumption_rate: 0.02,
    supplier: 'СтройОпт',
    supplier_contact: '+7-495-987-6543',
    min_stock_level: 3,
    description: 'Стеклосетка для армирования',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Маяк штукатурный 6мм 3м',
    name_en: 'Beacon 6mm 3m',
    category: 'beacon',
    unit: 'шт',
    price_per_unit: 35.00,
    consumption_rate: 0.50,
    supplier: 'СтройОпт',
    supplier_contact: '+7-495-987-6543',
    min_stock_level: 50,
    description: 'Маяк оцинкованный',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let inventory = [];
let projectMaterials = [];

/**
 * GET /api/plaster/materials
 * Получить список материалов
 */
router.get('/', (req, res) => {
  try {
    const { category, active_only = 'true' } = req.query;
    
    let filtered = [...materials];
    
    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }
    
    if (active_only === 'true') {
      filtered = filtered.filter(m => m.is_active);
    }
    
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
 * GET /api/plaster/materials/:id
 * Получить материал по ID
 */
router.get('/:id', (req, res) => {
  try {
    const material = materials.find(m => m.id === req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    
    // Get inventory for this material
    const stock = inventory
      .filter(i => i.material_id === material.id)
      .reduce((sum, i) => sum + i.quantity, 0);
    
    res.json({
      success: true,
      data: {
        ...material,
        current_stock: stock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/materials
 * Добавить материал
 */
router.post('/', (req, res) => {
  try {
    const {
      name,
      name_en,
      category,
      unit,
      price_per_unit,
      consumption_rate,
      supplier,
      supplier_contact,
      min_stock_level,
      description
    } = req.body;
    
    // Validation
    if (!name || !category || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category, unit'
      });
    }
    
    const validCategories = ['plaster', 'primer', 'mesh', 'beacon', 'tool', 'accessory', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `category must be one of: ${validCategories.join(', ')}`
      });
    }
    
    const material = {
      id: uuidv4(),
      name,
      name_en: name_en || null,
      category,
      unit,
      price_per_unit: price_per_unit ? Number(price_per_unit) : 0,
      consumption_rate: consumption_rate ? Number(consumption_rate) : null,
      supplier: supplier || null,
      supplier_contact: supplier_contact || null,
      min_stock_level: min_stock_level ? Number(min_stock_level) : 0,
      description: description || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    materials.push(material);
    
    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/materials/:id
 * Обновить материал
 */
router.put('/:id', (req, res) => {
  try {
    const index = materials.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    
    const allowedUpdates = [
      'name', 'name_en', 'category', 'unit', 'price_per_unit',
      'consumption_rate', 'supplier', 'supplier_contact',
      'min_stock_level', 'description', 'is_active'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    materials[index] = {
      ...materials[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: materials[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/materials/calculate
 * Калькулятор материалов (м² → кг/единицы)
 */
router.post('/calculate', (req, res) => {
  try {
    const { area_sqm, plaster_type, thickness_mm = 10, include_all = false } = req.body;
    
    if (!area_sqm || area_sqm <= 0) {
      return res.status(400).json({
        success: false,
        error: 'area_sqm is required and must be greater than 0'
      });
    }
    
    // Define consumption multipliers for different plaster types
    const plasterMultipliers = {
      leveling: 1.5,
      decorative: 0.8,
      finish: 0.5,
      gypsum: 1.0,
      cement: 1.8
    };
    
    const multiplier = plasterMultipliers[plaster_type] || 1.0;
    const adjustedArea = Number(area_sqm);
    const thickness = Number(thickness_mm);
    
    // Calculate requirements for each material
    const requirements = [];
    const activeMaterials = materials.filter(m => m.is_active);
    
    for (const material of activeMaterials) {
      // Skip if no consumption rate or if not including all and not essential
      if (!material.consumption_rate) continue;
      if (!include_all && !['plaster', 'primer', 'mesh', 'beacon'].includes(material.category)) continue;
      
      let quantity = 0;
      
      switch (material.category) {
        case 'plaster':
          // кг/м² при толщине 10мм × площадь × поправка на толщину × поправка на тип
          quantity = material.consumption_rate * adjustedArea * (thickness / 10) * multiplier;
          // Convert to bags (30kg standard)
          quantity = Math.ceil(quantity / 30);
          break;
        case 'primer':
          // Грунтовка: л/м² × площадь
          quantity = Math.ceil(material.consumption_rate * adjustedArea);
          break;
        case 'mesh':
          // Сетка: рулоны на площадь (с запасом 10%)
          quantity = Math.ceil((adjustedArea * 1.1) / 50); // 50м² в рулоне
          break;
        case 'beacon':
          // Маяки: шаг 1м, высота стены ~2.5м
          quantity = Math.ceil(adjustedArea / 2.5); // примерно 1 маяк на 2.5 м²
          break;
        default:
          quantity = Math.ceil(material.consumption_rate * adjustedArea);
      }
      
      if (quantity > 0) {
        requirements.push({
          material_id: material.id,
          material_name: material.name,
          category: material.category,
          quantity: quantity,
          unit: material.unit,
          unit_price: material.price_per_unit,
          total_price: quantity * material.price_per_unit
        });
      }
    }
    
    // Calculate totals
    const totalMaterialsCost = requirements.reduce((sum, r) => sum + r.total_price, 0);
    
    res.json({
      success: true,
      data: {
        input: {
          area_sqm: adjustedArea,
          plaster_type: plaster_type || 'standard',
          thickness_mm: thickness
        },
        requirements,
        summary: {
          total_materials_cost: totalMaterialsCost,
          items_count: requirements.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/inventory
 * Получить остатки на складе
 */
router.get('/inventory/list', (req, res) => {
  try {
    const { low_stock_only = 'false' } = req.query;
    
    // Aggregate inventory by material
    const inventoryMap = new Map();
    
    for (const item of inventory) {
      const existing = inventoryMap.get(item.material_id) || { quantity: 0, locations: [] };
      existing.quantity += item.quantity;
      existing.locations.push({
        location: item.location,
        quantity: item.quantity,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date
      });
      inventoryMap.set(item.material_id, existing);
    }
    
    // Combine with material info
    let result = materials.filter(m => m.is_active).map(material => {
      const inv = inventoryMap.get(material.id) || { quantity: 0, locations: [] };
      return {
        material_id: material.id,
        material_name: material.name,
        category: material.category,
        unit: material.unit,
        current_stock: inv.quantity,
        min_stock_level: material.min_stock_level,
        stock_status: inv.quantity === 0 ? 'out_of_stock' : 
                      inv.quantity < material.min_stock_level ? 'low' : 'normal',
        locations: inv.locations
      };
    });
    
    if (low_stock_only === 'true') {
      result = result.filter(r => r.stock_status !== 'normal');
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/inventory/add
 * Добавить поступление на склад
 */
router.post('/inventory/add', (req, res) => {
  try {
    const {
      material_id,
      quantity,
      location,
      batch_number,
      expiry_date
    } = req.body;
    
    if (!material_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'material_id and quantity (> 0) are required'
      });
    }
    
    const material = materials.find(m => m.id === material_id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    
    const inventoryItem = {
      id: uuidv4(),
      material_id,
      quantity: Number(quantity),
      location: location || 'Основной склад',
      batch_number: batch_number || null,
      expiry_date: expiry_date || null,
      last_restocked: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    inventory.push(inventoryItem);
    
    res.status(201).json({
      success: true,
      data: {
        ...inventoryItem,
        material_name: material.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/inventory/consume
 * Списать материалы со склада
 */
router.post('/inventory/consume', (req, res) => {
  try {
    const { material_id, quantity, project_id, notes } = req.body;
    
    if (!material_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'material_id and quantity (> 0) are required'
      });
    }
    
    // Calculate total available
    const availableItems = inventory.filter(i => i.material_id === material_id);
    const totalAvailable = availableItems.reduce((sum, i) => sum + i.quantity, 0);
    
    if (totalAvailable < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`
      });
    }
    
    // Consume from inventory (FIFO)
    let remaining = Number(quantity);
    for (const item of availableItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
      if (remaining <= 0) break;
      
      if (item.quantity <= remaining) {
        remaining -= item.quantity;
        const idx = inventory.findIndex(i => i.id === item.id);
        inventory.splice(idx, 1);
      } else {
        item.quantity -= remaining;
        item.updated_at = new Date().toISOString();
        remaining = 0;
      }
    }
    
    // Record consumption for project
    if (project_id) {
      const material = materials.find(m => m.id === material_id);
      projectMaterials.push({
        id: uuidv4(),
        project_id,
        material_id,
        quantity: Number(quantity),
        unit_price: material?.price_per_unit || 0,
        notes: notes || null,
        consumed_at: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        material_id,
        quantity_consumed: Number(quantity),
        remaining_stock: totalAvailable - Number(quantity),
        project_id: project_id || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/materials/categories
 * Получить список категорий материалов
 */
router.get('/categories/list', (req, res) => {
  try {
    const categories = [
      { id: 'plaster', name: 'Штукатурные смеси', name_en: 'Plaster Mixes' },
      { id: 'primer', name: 'Грунтовки', name_en: 'Primers' },
      { id: 'mesh', name: 'Сетки', name_en: 'Meshes' },
      { id: 'beacon', name: 'Маяки', name_en: 'Beacons' },
      { id: 'tool', name: 'Инструменты', name_en: 'Tools' },
      { id: 'accessory', name: 'Расходники', name_en: 'Accessories' },
      { id: 'other', name: 'Прочее', name_en: 'Other' }
    ];
    
    // Add counts
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      materials_count: materials.filter(m => m.category === cat.id && m.is_active).length
    }));
    
    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for testing
export { materials, inventory, projectMaterials };
export default router;
