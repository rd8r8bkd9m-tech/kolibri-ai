/**
 * Kolibri PLASTER Module - Financials API
 * Финансовый учет, сметы, платежи, прибыльность
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL in production)
let estimates = [];
let estimateItems = [];
let payments = [];

/**
 * POST /api/plaster/financials/estimate
 * Создать смету
 */
router.post('/estimate', (req, res) => {
  try {
    const {
      project_id,
      estimate_type,
      materials_cost,
      labor_cost,
      overhead_cost,
      profit_margin,
      currency,
      valid_until,
      notes
    } = req.body;
    
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id is required'
      });
    }
    
    const validTypes = ['preliminary', 'final', 'actual'];
    const type = estimate_type && validTypes.includes(estimate_type) ? estimate_type : 'preliminary';
    
    // Calculate version
    const existingEstimates = estimates.filter(e => e.project_id === project_id);
    const version = existingEstimates.length + 1;
    
    // Calculate total
    const matCost = materials_cost ? Number(materials_cost) : 0;
    const labCost = labor_cost ? Number(labor_cost) : 0;
    const ovhCost = overhead_cost ? Number(overhead_cost) : 0;
    const margin = profit_margin ? Number(profit_margin) : 0;
    const subtotal = matCost + labCost + ovhCost;
    const totalAmount = subtotal + (subtotal * margin / 100);
    
    const estimate = {
      id: uuidv4(),
      project_id,
      estimate_type: type,
      version,
      materials_cost: matCost,
      labor_cost: labCost,
      overhead_cost: ovhCost,
      profit_margin: margin,
      total_amount: totalAmount,
      currency: currency || 'RUB',
      valid_until: valid_until || null,
      approved: false,
      approved_by: null,
      approved_at: null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    estimates.push(estimate);
    
    res.status(201).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/financials/estimates/:projectId
 * Получить сметы проекта
 */
router.get('/estimates/:projectId', (req, res) => {
  try {
    const projectEstimates = estimates
      .filter(e => e.project_id === req.params.projectId)
      .sort((a, b) => b.version - a.version);
    
    // Get items for each estimate
    const enriched = projectEstimates.map(estimate => ({
      ...estimate,
      items: estimateItems.filter(i => i.estimate_id === estimate.id)
    }));
    
    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/financials/estimate/:id/items
 * Добавить позицию в смету
 */
router.post('/estimate/:id/items', (req, res) => {
  try {
    const estimate = estimates.find(e => e.id === req.params.id);
    
    if (!estimate) {
      return res.status(404).json({ success: false, error: 'Estimate not found' });
    }
    
    if (estimate.approved) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify approved estimate'
      });
    }
    
    const { item_type, name, description, quantity, unit, unit_price, category } = req.body;
    
    if (!item_type || !name || !quantity || !unit || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item_type, name, quantity, unit, unit_price'
      });
    }
    
    const validTypes = ['material', 'labor', 'overhead', 'other'];
    if (!validTypes.includes(item_type)) {
      return res.status(400).json({
        success: false,
        error: `item_type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const qty = Number(quantity);
    const price = Number(unit_price);
    
    const item = {
      id: uuidv4(),
      estimate_id: req.params.id,
      item_type,
      name,
      description: description || null,
      quantity: qty,
      unit,
      unit_price: price,
      total_price: qty * price,
      category: category || null,
      created_at: new Date().toISOString()
    };
    
    estimateItems.push(item);
    
    // Recalculate estimate totals
    recalculateEstimate(req.params.id);
    
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/plaster/financials/estimate/:id/approve
 * Утвердить смету
 */
router.put('/estimate/:id/approve', (req, res) => {
  try {
    const index = estimates.findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Estimate not found' });
    }
    
    const { approved_by } = req.body;
    
    estimates[index] = {
      ...estimates[index],
      approved: true,
      approved_by: approved_by || null,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: estimates[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/financials/estimate/generate
 * Автоматическая генерация сметы на основе площади и типа
 */
router.post('/estimate/generate', (req, res) => {
  try {
    const {
      project_id,
      area_sqm,
      plaster_type,
      complexity,
      include_materials,
      include_labor,
      workers_count,
      labor_rate_per_sqm
    } = req.body;
    
    if (!project_id || !area_sqm) {
      return res.status(400).json({
        success: false,
        error: 'project_id and area_sqm are required'
      });
    }
    
    const area = Number(area_sqm);
    
    // Complexity multipliers
    const complexityMultipliers = {
      simple: 1.0,
      standard: 1.2,
      complex: 1.5,
      premium: 2.0
    };
    const multiplier = complexityMultipliers[complexity] || 1.2;
    
    // Plaster type cost per sqm (RUB)
    const plasterCosts = {
      leveling: 350,
      decorative: 550,
      finish: 250,
      gypsum: 400,
      cement: 450
    };
    const baseCost = plasterCosts[plaster_type] || 400;
    
    // Calculate costs
    let materialsCost = 0;
    let laborCost = 0;
    
    if (include_materials !== false) {
      // Materials: base cost * area * complexity
      materialsCost = baseCost * area * multiplier;
    }
    
    if (include_labor !== false) {
      // Labor: rate per sqm or default (600 RUB/sqm)
      const laborRate = labor_rate_per_sqm || 600;
      laborCost = laborRate * area * multiplier;
      
      // Adjust for workers count (more workers = slightly less cost due to efficiency)
      if (workers_count && workers_count > 1) {
        laborCost *= (1 - (workers_count - 1) * 0.02); // 2% discount per additional worker
      }
    }
    
    // Overhead: 10% of materials + labor
    const overheadCost = (materialsCost + laborCost) * 0.10;
    
    // Create estimate
    const version = estimates.filter(e => e.project_id === project_id).length + 1;
    const profitMargin = 15; // Default 15%
    const subtotal = materialsCost + laborCost + overheadCost;
    const totalAmount = subtotal + (subtotal * profitMargin / 100);
    
    const estimate = {
      id: uuidv4(),
      project_id,
      estimate_type: 'preliminary',
      version,
      materials_cost: Math.round(materialsCost),
      labor_cost: Math.round(laborCost),
      overhead_cost: Math.round(overheadCost),
      profit_margin: profitMargin,
      total_amount: Math.round(totalAmount),
      currency: 'RUB',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      approved: false,
      approved_by: null,
      approved_at: null,
      notes: `Авто-расчет: ${area} м², ${plaster_type || 'стандарт'}, сложность: ${complexity || 'standard'}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      calculation_details: {
        area_sqm: area,
        plaster_type: plaster_type || 'standard',
        complexity: complexity || 'standard',
        multiplier,
        base_cost_per_sqm: baseCost,
        workers_count: workers_count || 1
      }
    };
    
    estimates.push(estimate);
    
    res.status(201).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plaster/financials/payment
 * Записать платеж
 */
router.post('/payment', (req, res) => {
  try {
    const {
      project_id,
      payment_type,
      amount,
      currency,
      payment_date,
      payment_method,
      reference_number,
      payer_name,
      recipient_name,
      description
    } = req.body;
    
    if (!project_id || !payment_type || !amount || !payment_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, payment_type, amount, payment_date'
      });
    }
    
    const validTypes = ['advance', 'milestone', 'final', 'refund', 'expense'];
    if (!validTypes.includes(payment_type)) {
      return res.status(400).json({
        success: false,
        error: `payment_type must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const payment = {
      id: uuidv4(),
      project_id,
      payment_type,
      amount: Number(amount),
      currency: currency || 'RUB',
      payment_date,
      payment_method: payment_method || null,
      reference_number: reference_number || null,
      payer_name: payer_name || null,
      recipient_name: recipient_name || null,
      description: description || null,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    payments.push(payment);
    
    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/financials/payments/:projectId
 * Получить платежи проекта
 */
router.get('/payments/:projectId', (req, res) => {
  try {
    const { payment_type, status } = req.query;
    
    let filtered = payments.filter(p => p.project_id === req.params.projectId);
    
    if (payment_type) {
      filtered = filtered.filter(p => p.payment_type === payment_type);
    }
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    // Sort by payment_date descending
    filtered.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    
    // Calculate summary
    const income = filtered
      .filter(p => p.status === 'completed' && p.payment_type !== 'expense' && p.payment_type !== 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const expenses = filtered
      .filter(p => p.status === 'completed' && p.payment_type === 'expense')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const refunds = filtered
      .filter(p => p.status === 'completed' && p.payment_type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
      success: true,
      data: filtered,
      summary: {
        total_income: income,
        total_expenses: expenses,
        total_refunds: refunds,
        net_amount: income - expenses - refunds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/financials/profitability/:projectId
 * Расчет прибыльности проекта
 */
router.get('/profitability/:projectId', (req, res) => {
  try {
    const projectEstimates = estimates.filter(e => e.project_id === req.params.projectId);
    const projectPayments = payments.filter(p => p.project_id === req.params.projectId && p.status === 'completed');
    
    // Get approved estimate or latest
    const approvedEstimate = projectEstimates.find(e => e.approved && e.estimate_type === 'final');
    const latestEstimate = projectEstimates.sort((a, b) => b.version - a.version)[0];
    const estimate = approvedEstimate || latestEstimate;
    
    // Calculate actuals
    const totalReceived = projectPayments
      .filter(p => !['expense', 'refund'].includes(p.payment_type))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalExpenses = projectPayments
      .filter(p => p.payment_type === 'expense')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRefunds = projectPayments
      .filter(p => p.payment_type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const netRevenue = totalReceived - totalRefunds;
    const grossProfit = netRevenue - totalExpenses;
    const profitMarginActual = netRevenue > 0 ? (grossProfit / netRevenue * 100) : 0;
    
    // Comparison with estimate
    const estimatedTotal = estimate?.total_amount || 0;
    const budgetVariance = estimatedTotal > 0 ? ((netRevenue - estimatedTotal) / estimatedTotal * 100) : 0;
    
    res.json({
      success: true,
      data: {
        project_id: req.params.projectId,
        estimated: {
          total: estimate?.total_amount || 0,
          materials: estimate?.materials_cost || 0,
          labor: estimate?.labor_cost || 0,
          overhead: estimate?.overhead_cost || 0,
          profit_margin: estimate?.profit_margin || 0
        },
        actual: {
          total_received: totalReceived,
          total_expenses: totalExpenses,
          total_refunds: totalRefunds,
          net_revenue: netRevenue,
          gross_profit: grossProfit,
          profit_margin: profitMarginActual.toFixed(2)
        },
        analysis: {
          budget_variance_percent: budgetVariance.toFixed(2),
          budget_status: budgetVariance >= 0 ? 'on_track' : 'over_budget',
          payments_received: projectPayments.filter(p => !['expense', 'refund'].includes(p.payment_type)).length,
          completion_percent: estimatedTotal > 0 ? Math.min(100, (totalReceived / estimatedTotal * 100)).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plaster/financials/summary
 * Общая финансовая сводка по всем проектам
 */
router.get('/summary', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let filteredPayments = [...payments];
    
    if (start_date) {
      filteredPayments = filteredPayments.filter(p => p.payment_date >= start_date);
    }
    if (end_date) {
      filteredPayments = filteredPayments.filter(p => p.payment_date <= end_date);
    }
    
    // Group by project
    const projectIds = [...new Set(filteredPayments.map(p => p.project_id))];
    
    const projectSummaries = projectIds.map(projectId => {
      const projectPayments = filteredPayments.filter(p => p.project_id === projectId);
      const income = projectPayments
        .filter(p => p.status === 'completed' && !['expense', 'refund'].includes(p.payment_type))
        .reduce((sum, p) => sum + p.amount, 0);
      const expenses = projectPayments
        .filter(p => p.status === 'completed' && p.payment_type === 'expense')
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        project_id: projectId,
        income,
        expenses,
        profit: income - expenses
      };
    });
    
    // Total summary
    const totalIncome = projectSummaries.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projectSummaries.reduce((sum, p) => sum + p.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;
    
    // Estimates summary
    const approvedEstimates = estimates.filter(e => e.approved);
    const totalEstimated = approvedEstimates.reduce((sum, e) => sum + e.total_amount, 0);
    
    res.json({
      success: true,
      data: {
        period: {
          start_date: start_date || 'all time',
          end_date: end_date || 'now'
        },
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          profit: totalProfit,
          profit_margin: totalIncome > 0 ? (totalProfit / totalIncome * 100).toFixed(2) : 0,
          estimated_total: totalEstimated,
          projects_count: projectIds.length
        },
        by_project: projectSummaries.sort((a, b) => b.profit - a.profit),
        by_payment_type: {
          advance: filteredPayments.filter(p => p.payment_type === 'advance').reduce((sum, p) => sum + p.amount, 0),
          milestone: filteredPayments.filter(p => p.payment_type === 'milestone').reduce((sum, p) => sum + p.amount, 0),
          final: filteredPayments.filter(p => p.payment_type === 'final').reduce((sum, p) => sum + p.amount, 0),
          expense: filteredPayments.filter(p => p.payment_type === 'expense').reduce((sum, p) => sum + p.amount, 0),
          refund: filteredPayments.filter(p => p.payment_type === 'refund').reduce((sum, p) => sum + p.amount, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to recalculate estimate totals
function recalculateEstimate(estimateId) {
  const index = estimates.findIndex(e => e.id === estimateId);
  if (index === -1) return;
  
  const items = estimateItems.filter(i => i.estimate_id === estimateId);
  
  const materialsCost = items
    .filter(i => i.item_type === 'material')
    .reduce((sum, i) => sum + i.total_price, 0);
  
  const laborCost = items
    .filter(i => i.item_type === 'labor')
    .reduce((sum, i) => sum + i.total_price, 0);
  
  const overheadCost = items
    .filter(i => i.item_type === 'overhead')
    .reduce((sum, i) => sum + i.total_price, 0);
  
  const otherCost = items
    .filter(i => i.item_type === 'other')
    .reduce((sum, i) => sum + i.total_price, 0);
  
  const subtotal = materialsCost + laborCost + overheadCost + otherCost;
  const profitMargin = estimates[index].profit_margin || 0;
  const totalAmount = subtotal + (subtotal * profitMargin / 100);
  
  estimates[index] = {
    ...estimates[index],
    materials_cost: materialsCost,
    labor_cost: laborCost,
    overhead_cost: overheadCost + otherCost,
    total_amount: totalAmount,
    updated_at: new Date().toISOString()
  };
}

// Export for testing
export { estimates, estimateItems, payments };
export default router;
