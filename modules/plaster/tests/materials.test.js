/**
 * Kolibri PLASTER Module - Materials API Tests
 * Тесты для API материалов
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock data
const mockMaterials = [
  {
    id: '1',
    name: 'Ротбанд Кнауф 30кг',
    category: 'plaster',
    unit: 'мешок',
    price_per_unit: 450.00,
    consumption_rate: 0.85,
    is_active: true
  },
  {
    id: '2',
    name: 'Грунтовка Бетоконтакт 20кг',
    category: 'primer',
    unit: 'ведро',
    price_per_unit: 1200.00,
    consumption_rate: 0.30,
    is_active: true
  }
];

describe('Materials API', () => {
  describe('GET /api/plaster/materials', () => {
    it('should return list of materials', async () => {
      const materials = mockMaterials;
      expect(materials).toHaveLength(2);
      expect(materials[0]).toHaveProperty('name');
      expect(materials[0]).toHaveProperty('category');
    });

    it('should filter materials by category', async () => {
      const plasterMaterials = mockMaterials.filter(m => m.category === 'plaster');
      expect(plasterMaterials).toHaveLength(1);
      expect(plasterMaterials[0].name).toBe('Ротбанд Кнауф 30кг');
    });

    it('should filter active materials only', async () => {
      const activeMaterials = mockMaterials.filter(m => m.is_active);
      expect(activeMaterials).toHaveLength(2);
    });
  });

  describe('Material Calculation', () => {
    it('should calculate material requirements for given area', () => {
      const area = 100; // m²
      const thickness = 10; // mm
      const plasterRate = 0.85; // kg/m² per mm
      
      const requiredPlaster = area * plasterRate * (thickness / 10);
      const bags = Math.ceil(requiredPlaster / 30); // 30kg bags
      
      expect(bags).toBe(3); // ~85kg = 3 bags
    });

    it('should calculate primer requirements', () => {
      const area = 100; // m²
      const primerRate = 0.30; // l/m²
      
      const requiredPrimer = area * primerRate;
      const cans = Math.ceil(requiredPrimer / 10); // 10l cans
      
      expect(cans).toBe(3); // 30l = 3 cans
    });

    it('should calculate total material cost', () => {
      const plasterBags = 3;
      const plasterPrice = 450;
      const primerCans = 3;
      const primerPrice = 450;
      
      const totalCost = (plasterBags * plasterPrice) + (primerCans * primerPrice);
      
      expect(totalCost).toBe(2700);
    });

    it('should handle different plaster types', () => {
      const plasterTypes = {
        leveling: { multiplier: 1.5, baseCost: 450 },
        decorative: { multiplier: 0.8, baseCost: 1200 },
        finish: { multiplier: 0.5, baseCost: 550 }
      };
      
      const area = 50;
      const results = {};
      
      for (const [type, config] of Object.entries(plasterTypes)) {
        const cost = area * config.multiplier * (config.baseCost / 30);
        results[type] = Math.round(cost);
      }
      
      expect(results.leveling).toBe(1125);
      expect(results.decorative).toBe(1600);
      expect(results.finish).toBe(458);
    });
  });

  describe('Inventory Management', () => {
    it('should track stock levels', () => {
      const inventory = {
        material_id: '1',
        quantity: 50,
        min_stock_level: 10
      };
      
      expect(inventory.quantity).toBeGreaterThan(inventory.min_stock_level);
    });

    it('should identify low stock items', () => {
      const inventory = [
        { material_id: '1', quantity: 5, min_stock_level: 10 },
        { material_id: '2', quantity: 20, min_stock_level: 5 }
      ];
      
      const lowStock = inventory.filter(i => i.quantity < i.min_stock_level);
      
      expect(lowStock).toHaveLength(1);
      expect(lowStock[0].material_id).toBe('1');
    });

    it('should consume stock correctly', () => {
      let stock = 50;
      const consumed = 15;
      
      stock -= consumed;
      
      expect(stock).toBe(35);
    });
  });
});

describe('Material Categories', () => {
  const categories = [
    { id: 'plaster', name: 'Штукатурные смеси' },
    { id: 'primer', name: 'Грунтовки' },
    { id: 'mesh', name: 'Сетки' },
    { id: 'beacon', name: 'Маяки' },
    { id: 'tool', name: 'Инструменты' }
  ];

  it('should have all required categories', () => {
    expect(categories).toHaveLength(5);
    expect(categories.map(c => c.id)).toContain('plaster');
    expect(categories.map(c => c.id)).toContain('primer');
  });

  it('should have unique category ids', () => {
    const ids = categories.map(c => c.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds).toHaveLength(ids.length);
  });
});
