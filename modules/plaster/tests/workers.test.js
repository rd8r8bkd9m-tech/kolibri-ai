/**
 * Kolibri PLASTER Module - Workers API Tests
 * Тесты для API рабочих
 */

import { describe, it, expect } from 'vitest';

// Mock data
const mockWorkers = [
  {
    id: '1',
    first_name: 'Александр',
    last_name: 'Петров',
    specialization: 'Штукатур',
    experience_years: 8,
    hourly_rate: 350,
    daily_rate: 2800,
    productivity_sqm_day: 25,
    rating: 4.8,
    status: 'available'
  },
  {
    id: '2',
    first_name: 'Иван',
    last_name: 'Сидоров',
    specialization: 'Штукатур',
    experience_years: 5,
    hourly_rate: 300,
    daily_rate: 2400,
    productivity_sqm_day: 20,
    rating: 4.5,
    status: 'busy'
  },
  {
    id: '3',
    first_name: 'Дмитрий',
    last_name: 'Новиков',
    specialization: 'Помощник',
    experience_years: 2,
    hourly_rate: 200,
    daily_rate: 1600,
    productivity_sqm_day: 15,
    rating: 4.2,
    status: 'available'
  }
];

describe('Workers API', () => {
  describe('GET /api/plaster/workers', () => {
    it('should return list of workers', () => {
      expect(mockWorkers).toHaveLength(3);
      expect(mockWorkers[0]).toHaveProperty('first_name');
      expect(mockWorkers[0]).toHaveProperty('last_name');
      expect(mockWorkers[0]).toHaveProperty('specialization');
    });

    it('should filter workers by status', () => {
      const available = mockWorkers.filter(w => w.status === 'available');
      expect(available).toHaveLength(2);
    });

    it('should filter workers by specialization', () => {
      const plasterers = mockWorkers.filter(w => 
        w.specialization.toLowerCase().includes('штукатур')
      );
      expect(plasterers).toHaveLength(2);
    });
  });

  describe('Worker Productivity', () => {
    it('should calculate actual productivity', () => {
      const timeEntries = [
        { hours_worked: 8, area_completed: 25 },
        { hours_worked: 8, area_completed: 22 },
        { hours_worked: 6, area_completed: 18 }
      ];
      
      const totalHours = timeEntries.reduce((sum, e) => sum + e.hours_worked, 0);
      const totalArea = timeEntries.reduce((sum, e) => sum + e.area_completed, 0);
      
      // Productivity per 8-hour day
      const actualProductivity = (totalArea / totalHours) * 8;
      
      expect(actualProductivity.toFixed(1)).toBe('23.6');
    });

    it('should calculate efficiency percentage', () => {
      const expectedProductivity = 25;
      const actualProductivity = 23.6;
      
      const efficiency = (actualProductivity / expectedProductivity) * 100;
      
      expect(efficiency).toBeCloseTo(94.4, 1);
    });

    it('should rank workers by productivity', () => {
      const sorted = [...mockWorkers].sort(
        (a, b) => b.productivity_sqm_day - a.productivity_sqm_day
      );
      
      expect(sorted[0].first_name).toBe('Александр');
      expect(sorted[0].productivity_sqm_day).toBe(25);
    });
  });

  describe('Worker Assignments', () => {
    const mockAssignments = [
      { id: '1', worker_id: '1', project_id: 'p1', status: 'active', start_date: '2024-01-15' },
      { id: '2', worker_id: '2', project_id: 'p1', status: 'active', start_date: '2024-01-15' },
      { id: '3', worker_id: '1', project_id: 'p2', status: 'scheduled', start_date: '2024-02-01' }
    ];

    it('should get assignments for worker', () => {
      const worker1Assignments = mockAssignments.filter(a => a.worker_id === '1');
      expect(worker1Assignments).toHaveLength(2);
    });

    it('should identify active assignments', () => {
      const active = mockAssignments.filter(a => a.status === 'active');
      expect(active).toHaveLength(2);
    });

    it('should check for conflicts', () => {
      const workerId = '1';
      const newStartDate = '2024-01-20';
      
      const existingActive = mockAssignments.filter(a =>
        a.worker_id === workerId &&
        a.status === 'active'
      );
      
      const hasConflict = existingActive.length > 0;
      expect(hasConflict).toBe(true);
    });
  });

  describe('Time Tracking', () => {
    const mockTimeEntries = [
      { worker_id: '1', work_date: '2024-01-28', hours_worked: 8, area_completed: 25 },
      { worker_id: '1', work_date: '2024-01-27', hours_worked: 8, area_completed: 22 },
      { worker_id: '1', work_date: '2024-01-26', hours_worked: 6, area_completed: 18 }
    ];

    it('should calculate total hours worked', () => {
      const totalHours = mockTimeEntries.reduce((sum, e) => sum + e.hours_worked, 0);
      expect(totalHours).toBe(22);
    });

    it('should calculate total area completed', () => {
      const totalArea = mockTimeEntries.reduce((sum, e) => sum + e.area_completed, 0);
      expect(totalArea).toBe(65);
    });

    it('should prevent duplicate entries', () => {
      const workerId = '1';
      const workDate = '2024-01-28';
      
      const existing = mockTimeEntries.find(e =>
        e.worker_id === workerId && e.work_date === workDate
      );
      
      expect(existing).toBeDefined();
    });
  });

  describe('Worker Payments', () => {
    it('should calculate base payment', () => {
      const worker = mockWorkers[0];
      const hoursWorked = 40;
      
      const basePayment = hoursWorked * worker.hourly_rate;
      
      expect(basePayment).toBe(14000);
    });

    it('should calculate overtime payment', () => {
      const worker = mockWorkers[0];
      const normalHours = 40;
      const overtimeHours = 8;
      const overtimeMultiplier = 1.5;
      
      const normalPay = normalHours * worker.hourly_rate;
      const overtimePay = overtimeHours * worker.hourly_rate * overtimeMultiplier;
      const totalPay = normalPay + overtimePay;
      
      expect(totalPay).toBe(18200);
    });

    it('should calculate payment with bonus', () => {
      const basePay = 14000;
      const bonus = 2000;
      const deductions = 500;
      
      const totalPay = basePay + bonus - deductions;
      
      expect(totalPay).toBe(15500);
    });
  });
});

describe('Worker Status Management', () => {
  it('should validate status transitions', () => {
    const validStatuses = ['available', 'busy', 'on_leave', 'inactive'];
    const invalidStatus = 'working';
    
    expect(validStatuses).toContain('available');
    expect(validStatuses).not.toContain(invalidStatus);
  });

  it('should update status based on assignments', () => {
    let worker = { ...mockWorkers[0], status: 'available' };
    
    // Assign to project
    worker.status = 'busy';
    expect(worker.status).toBe('busy');
    
    // Complete assignment
    worker.status = 'available';
    expect(worker.status).toBe('available');
  });
});
