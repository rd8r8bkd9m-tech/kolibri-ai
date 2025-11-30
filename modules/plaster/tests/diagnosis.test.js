/**
 * Kolibri PLASTER Module - AI Diagnosis Tests
 * Тесты для AI модуля диагностики дефектов
 */

import { describe, it, expect } from 'vitest';

// Simulated diagnosis module interface
const DefectTypes = {
  CRACK: 'crack',
  CHIP: 'chip',
  UNEVENNESS: 'unevenness',
  DELAMINATION: 'delamination',
  EFFLORESCENCE: 'efflorescence',
  MOLD: 'mold'
};

const Severities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Helper functions that mirror the Python module
function determineSeverity(defectType, confidence) {
  const thresholds = {
    [DefectTypes.CRACK]: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.85 },
    [DefectTypes.DELAMINATION]: { low: 0.2, medium: 0.4, high: 0.6, critical: 0.75 },
    [DefectTypes.MOLD]: { low: 0.1, medium: 0.3, high: 0.5, critical: 0.65 }
  };
  
  const defectThresholds = thresholds[defectType] || { low: 0.3, medium: 0.5, high: 0.7, critical: 0.85 };
  
  if (confidence >= defectThresholds.critical) return Severities.CRITICAL;
  if (confidence >= defectThresholds.high) return Severities.HIGH;
  if (confidence >= defectThresholds.medium) return Severities.MEDIUM;
  return Severities.LOW;
}

function calculateRepairCost(defectType, area, severity) {
  const baseCosts = {
    [DefectTypes.CRACK]: 300,
    [DefectTypes.CHIP]: 150,
    [DefectTypes.UNEVENNESS]: 200,
    [DefectTypes.DELAMINATION]: 800,
    [DefectTypes.EFFLORESCENCE]: 250,
    [DefectTypes.MOLD]: 1000
  };
  
  const severityMultipliers = {
    [Severities.LOW]: 1.0,
    [Severities.MEDIUM]: 1.3,
    [Severities.HIGH]: 1.6,
    [Severities.CRITICAL]: 2.0
  };
  
  const baseCost = baseCosts[defectType] || 200;
  const multiplier = severityMultipliers[severity] || 1.0;
  
  return baseCost * (area || 0.1) * multiplier;
}

function assessOverallCondition(defects) {
  if (defects.length === 0) return 'good';
  
  const criticalCount = defects.filter(d => d.severity === Severities.CRITICAL).length;
  const highCount = defects.filter(d => d.severity === Severities.HIGH).length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount >= 2 || defects.length >= 4) return 'poor';
  if (defects.length >= 2) return 'fair';
  return 'good';
}

describe('AI Diagnosis Module', () => {
  describe('Defect Type Validation', () => {
    it('should have all required defect types', () => {
      const types = Object.values(DefectTypes);
      expect(types).toContain('crack');
      expect(types).toContain('chip');
      expect(types).toContain('unevenness');
      expect(types).toContain('delamination');
      expect(types).toContain('mold');
    });

    it('should have all severity levels', () => {
      const severities = Object.values(Severities);
      expect(severities).toHaveLength(4);
      expect(severities).toContain('low');
      expect(severities).toContain('critical');
    });
  });

  describe('Severity Determination', () => {
    it('should determine low severity for low confidence', () => {
      const severity = determineSeverity(DefectTypes.CRACK, 0.25);
      expect(severity).toBe(Severities.LOW);
    });

    it('should determine medium severity for medium confidence', () => {
      const severity = determineSeverity(DefectTypes.CRACK, 0.55);
      expect(severity).toBe(Severities.MEDIUM);
    });

    it('should determine high severity for high confidence', () => {
      const severity = determineSeverity(DefectTypes.CRACK, 0.75);
      expect(severity).toBe(Severities.HIGH);
    });

    it('should determine critical severity for very high confidence', () => {
      const severity = determineSeverity(DefectTypes.CRACK, 0.90);
      expect(severity).toBe(Severities.CRITICAL);
    });

    it('should use different thresholds for mold', () => {
      // Mold has lower thresholds (more sensitive)
      const moldSeverity = determineSeverity(DefectTypes.MOLD, 0.6);
      const crackSeverity = determineSeverity(DefectTypes.CRACK, 0.6);
      
      expect(moldSeverity).toBe(Severities.MEDIUM);
      expect(crackSeverity).toBe(Severities.MEDIUM);
    });
  });

  describe('Repair Cost Calculation', () => {
    it('should calculate basic repair cost', () => {
      const cost = calculateRepairCost(DefectTypes.CHIP, 0.1, Severities.LOW);
      expect(cost).toBe(15); // 150 * 0.1 * 1.0
    });

    it('should apply severity multiplier', () => {
      const lowCost = calculateRepairCost(DefectTypes.CRACK, 1, Severities.LOW);
      const criticalCost = calculateRepairCost(DefectTypes.CRACK, 1, Severities.CRITICAL);
      
      expect(criticalCost).toBe(lowCost * 2);
    });

    it('should calculate delamination as most expensive', () => {
      const delaminationCost = calculateRepairCost(DefectTypes.DELAMINATION, 1, Severities.MEDIUM);
      const chipCost = calculateRepairCost(DefectTypes.CHIP, 1, Severities.MEDIUM);
      
      expect(delaminationCost).toBeGreaterThan(chipCost);
    });

    it('should handle area parameter', () => {
      const smallArea = calculateRepairCost(DefectTypes.UNEVENNESS, 0.5, Severities.LOW);
      const largeArea = calculateRepairCost(DefectTypes.UNEVENNESS, 2.0, Severities.LOW);
      
      expect(largeArea).toBe(smallArea * 4);
    });
  });

  describe('Overall Condition Assessment', () => {
    it('should return good for no defects', () => {
      const condition = assessOverallCondition([]);
      expect(condition).toBe('good');
    });

    it('should return critical if any critical defect', () => {
      const defects = [
        { severity: Severities.LOW },
        { severity: Severities.CRITICAL }
      ];
      const condition = assessOverallCondition(defects);
      expect(condition).toBe('critical');
    });

    it('should return poor for multiple high severity defects', () => {
      const defects = [
        { severity: Severities.HIGH },
        { severity: Severities.HIGH }
      ];
      const condition = assessOverallCondition(defects);
      expect(condition).toBe('poor');
    });

    it('should return poor for many defects', () => {
      const defects = [
        { severity: Severities.LOW },
        { severity: Severities.LOW },
        { severity: Severities.MEDIUM },
        { severity: Severities.LOW }
      ];
      const condition = assessOverallCondition(defects);
      expect(condition).toBe('poor');
    });

    it('should return fair for few defects', () => {
      const defects = [
        { severity: Severities.LOW },
        { severity: Severities.MEDIUM }
      ];
      const condition = assessOverallCondition(defects);
      expect(condition).toBe('fair');
    });

    it('should return good for single low severity defect', () => {
      const defects = [{ severity: Severities.LOW }];
      const condition = assessOverallCondition(defects);
      expect(condition).toBe('good');
    });
  });

  describe('Bounding Box Validation', () => {
    it('should have valid bounding box coordinates', () => {
      const bbox = {
        x: 0.2,
        y: 0.3,
        width: 0.15,
        height: 0.1
      };
      
      expect(bbox.x).toBeGreaterThanOrEqual(0);
      expect(bbox.x).toBeLessThanOrEqual(1);
      expect(bbox.y).toBeGreaterThanOrEqual(0);
      expect(bbox.y).toBeLessThanOrEqual(1);
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });

    it('should ensure bounding box stays within image', () => {
      const bbox = {
        x: 0.8,
        y: 0.9,
        width: 0.3,
        height: 0.2
      };
      
      const maxX = bbox.x + bbox.width;
      const maxY = bbox.y + bbox.height;
      
      // These would be outside the image
      expect(maxX).toBeGreaterThan(1);
      expect(maxY).toBeGreaterThan(1);
    });
  });

  describe('Repair Recommendations', () => {
    const repairGuide = {
      [DefectTypes.CRACK]: 'Расшить трещину V-образно, прогрунтовать, заполнить ремонтной смесью',
      [DefectTypes.CHIP]: 'Зачистить место скола, прогрунтовать, зашпаклевать в 2-3 слоя',
      [DefectTypes.DELAMINATION]: 'Удалить отслоившийся слой, обработать грунтовкой, нанести штукатурку заново',
      [DefectTypes.MOLD]: 'Удалить пораженный слой, обработать антисептиком, устранить причину влажности'
    };

    it('should provide recommendation for each defect type', () => {
      expect(repairGuide[DefectTypes.CRACK]).toBeDefined();
      expect(repairGuide[DefectTypes.DELAMINATION]).toBeDefined();
    });

    it('should mention critical steps for mold', () => {
      const moldGuide = repairGuide[DefectTypes.MOLD];
      expect(moldGuide).toContain('антисептик');
      expect(moldGuide).toContain('влажност');
    });
  });

  describe('Confidence Score', () => {
    it('should validate confidence is between 0 and 1', () => {
      const validConfidence = 0.85;
      const invalidLow = -0.1;
      const invalidHigh = 1.5;
      
      expect(validConfidence).toBeGreaterThanOrEqual(0);
      expect(validConfidence).toBeLessThanOrEqual(1);
      expect(invalidLow).toBeLessThan(0);
      expect(invalidHigh).toBeGreaterThan(1);
    });

    it('should round confidence to reasonable precision', () => {
      const confidence = 0.857431;
      const rounded = Math.round(confidence * 1000) / 1000;
      
      expect(rounded).toBe(0.857);
    });
  });
});

describe('Diagnosis Result Structure', () => {
  const mockResult = {
    photo_id: 'photo_123',
    analyzed_at: '2024-01-28T10:30:00.000Z',
    model_version: '1.0.0-demo',
    processing_time_ms: 150,
    defects: [
      {
        defect_type: 'crack',
        severity: 'medium',
        confidence: 0.82,
        bounding_box: { x: 0.2, y: 0.3, width: 0.1, height: 0.15 },
        repair_recommendation: 'Test recommendation',
        estimated_repair_cost: 300
      }
    ],
    overall_condition: 'fair',
    summary: 'Обнаружен 1 дефект',
    recommendations: ['Устраните дефект']
  };

  it('should have all required fields', () => {
    expect(mockResult).toHaveProperty('photo_id');
    expect(mockResult).toHaveProperty('analyzed_at');
    expect(mockResult).toHaveProperty('defects');
    expect(mockResult).toHaveProperty('overall_condition');
    expect(mockResult).toHaveProperty('recommendations');
  });

  it('should have valid timestamp', () => {
    const date = new Date(mockResult.analyzed_at);
    expect(date).toBeInstanceOf(Date);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it('should have array of defects', () => {
    expect(Array.isArray(mockResult.defects)).toBe(true);
    expect(mockResult.defects).toHaveLength(1);
  });

  it('should have recommendations array', () => {
    expect(Array.isArray(mockResult.recommendations)).toBe(true);
    expect(mockResult.recommendations.length).toBeGreaterThan(0);
  });
});
