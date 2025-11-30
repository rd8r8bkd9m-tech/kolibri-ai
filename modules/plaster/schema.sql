-- Kolibri PLASTER Module Database Schema
-- PostgreSQL 14+
-- Схема базы данных для модуля управления штукатурными работами

-- Create schema
CREATE SCHEMA IF NOT EXISTS plaster;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROJECTS (Проекты)
-- ============================================

CREATE TABLE plaster.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    area_sqm DECIMAL(10, 2) NOT NULL CHECK (area_sqm > 0),
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('residential', 'commercial', 'industrial', 'office')),
    plaster_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'paused', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    deadline DATE,
    budget DECIMAL(12, 2) CHECK (budget >= 0),
    client_name VARCHAR(255),
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_projects_status ON plaster.projects(status);
CREATE INDEX idx_projects_deadline ON plaster.projects(deadline);
CREATE INDEX idx_projects_created_at ON plaster.projects(created_at DESC);

-- ============================================
-- PROJECT STAGES (Этапы работ)
-- ============================================

CREATE TABLE plaster.project_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_type VARCHAR(50) NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,
    area_sqm DECIMAL(10, 2),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stages_project ON plaster.project_stages(project_id);
CREATE INDEX idx_stages_status ON plaster.project_stages(status);

-- ============================================
-- MATERIALS (Материалы)
-- ============================================

CREATE TABLE plaster.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(100) NOT NULL CHECK (category IN ('plaster', 'primer', 'mesh', 'beacon', 'tool', 'accessory', 'other')),
    unit VARCHAR(20) NOT NULL,
    price_per_unit DECIMAL(10, 2) CHECK (price_per_unit >= 0),
    consumption_rate DECIMAL(10, 4) COMMENT 'кг/м² или единиц/м²',
    supplier VARCHAR(255),
    supplier_contact TEXT,
    min_stock_level DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_category ON plaster.materials(category);
CREATE INDEX idx_materials_active ON plaster.materials(is_active);

-- ============================================
-- INVENTORY (Склад)
-- ============================================

CREATE TABLE plaster.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES plaster.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    location VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    last_restocked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, location, batch_number)
);

CREATE INDEX idx_inventory_material ON plaster.inventory(material_id);
CREATE INDEX idx_inventory_expiry ON plaster.inventory(expiry_date);

-- ============================================
-- PROJECT MATERIALS (Материалы проекта)
-- ============================================

CREATE TABLE plaster.project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES plaster.materials(id) ON DELETE RESTRICT,
    planned_quantity DECIMAL(10, 2) NOT NULL CHECK (planned_quantity >= 0),
    actual_quantity DECIMAL(10, 2) DEFAULT 0 CHECK (actual_quantity >= 0),
    unit_price DECIMAL(10, 2) CHECK (unit_price >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_materials_project ON plaster.project_materials(project_id);
CREATE INDEX idx_project_materials_material ON plaster.project_materials(material_id);

-- ============================================
-- WORKERS (Рабочие)
-- ============================================

CREATE TABLE plaster.workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    specialization VARCHAR(100),
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    hourly_rate DECIMAL(10, 2) CHECK (hourly_rate >= 0),
    daily_rate DECIMAL(10, 2) CHECK (daily_rate >= 0),
    productivity_sqm_day DECIMAL(10, 2) DEFAULT 20 CHECK (productivity_sqm_day > 0),
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'on_leave', 'inactive')),
    passport_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workers_status ON plaster.workers(status);
CREATE INDEX idx_workers_specialization ON plaster.workers(specialization);

-- ============================================
-- WORKER ASSIGNMENTS (Назначение рабочих)
-- ============================================

CREATE TABLE plaster.worker_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES plaster.project_stages(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES plaster.workers(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'worker',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_project ON plaster.worker_assignments(project_id);
CREATE INDEX idx_assignments_worker ON plaster.worker_assignments(worker_id);
CREATE INDEX idx_assignments_dates ON plaster.worker_assignments(start_date, end_date);

-- ============================================
-- TIME TRACKING (Учет времени)
-- ============================================

CREATE TABLE plaster.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES plaster.workers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES plaster.project_stages(id) ON DELETE SET NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(4, 2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
    area_completed DECIMAL(10, 2) CHECK (area_completed >= 0),
    overtime_hours DECIMAL(4, 2) DEFAULT 0 CHECK (overtime_hours >= 0),
    notes TEXT,
    approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_worker ON plaster.time_entries(worker_id);
CREATE INDEX idx_time_project ON plaster.time_entries(project_id);
CREATE INDEX idx_time_date ON plaster.time_entries(work_date);

-- ============================================
-- QUALITY CHECKS (Контроль качества)
-- ============================================

CREATE TABLE plaster.quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES plaster.project_stages(id) ON DELETE SET NULL,
    check_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    inspector_id UUID REFERENCES plaster.workers(id) ON DELETE SET NULL,
    evenness_check BOOLEAN DEFAULT false,
    evenness_deviation DECIMAL(5, 2),
    adhesion_check BOOLEAN DEFAULT false,
    adhesion_value DECIMAL(5, 2),
    thickness_check BOOLEAN DEFAULT false,
    thickness_value DECIMAL(5, 2),
    cracks_check BOOLEAN DEFAULT false,
    cracks_found INTEGER DEFAULT 0,
    corners_check BOOLEAN DEFAULT false,
    corners_deviation DECIMAL(5, 2),
    moisture_check BOOLEAN DEFAULT false,
    moisture_percent DECIMAL(5, 2),
    overall_passed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quality_project ON plaster.quality_checks(project_id);
CREATE INDEX idx_quality_date ON plaster.quality_checks(check_date);

-- ============================================
-- DEFECTS (Дефекты)
-- ============================================

CREATE TABLE plaster.defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES plaster.project_stages(id) ON DELETE SET NULL,
    quality_check_id UUID REFERENCES plaster.quality_checks(id) ON DELETE SET NULL,
    defect_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    location_description TEXT,
    location_x DECIMAL(10, 4),
    location_y DECIMAL(10, 4),
    area_sqm DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'detected' CHECK (status IN ('detected', 'in_repair', 'repaired', 'accepted')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    repaired_at TIMESTAMP WITH TIME ZONE,
    repair_description TEXT,
    repair_materials TEXT,
    repair_cost DECIMAL(10, 2),
    ai_detected BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(5, 4),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_defects_project ON plaster.defects(project_id);
CREATE INDEX idx_defects_type ON plaster.defects(defect_type);
CREATE INDEX idx_defects_status ON plaster.defects(status);

-- ============================================
-- PHOTOS (Фотографии)
-- ============================================

CREATE TABLE plaster.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES plaster.project_stages(id) ON DELETE SET NULL,
    defect_id UUID REFERENCES plaster.defects(id) ON DELETE SET NULL,
    quality_check_id UUID REFERENCES plaster.quality_checks(id) ON DELETE SET NULL,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('before', 'progress', 'after', 'defect', 'quality', 'other')),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    thumbnail_path TEXT,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    description TEXT,
    ai_analyzed BOOLEAN DEFAULT false,
    ai_analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_project ON plaster.photos(project_id);
CREATE INDEX idx_photos_type ON plaster.photos(photo_type);
CREATE INDEX idx_photos_ai ON plaster.photos(ai_analyzed);

-- ============================================
-- ESTIMATES (Сметы)
-- ============================================

CREATE TABLE plaster.estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    estimate_type VARCHAR(50) DEFAULT 'preliminary' CHECK (estimate_type IN ('preliminary', 'final', 'actual')),
    version INTEGER DEFAULT 1,
    materials_cost DECIMAL(12, 2) DEFAULT 0 CHECK (materials_cost >= 0),
    labor_cost DECIMAL(12, 2) DEFAULT 0 CHECK (labor_cost >= 0),
    overhead_cost DECIMAL(12, 2) DEFAULT 0 CHECK (overhead_cost >= 0),
    profit_margin DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) GENERATED ALWAYS AS (materials_cost + labor_cost + overhead_cost + (materials_cost + labor_cost + overhead_cost) * profit_margin / 100) STORED,
    currency VARCHAR(3) DEFAULT 'RUB',
    valid_until DATE,
    approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estimates_project ON plaster.estimates(project_id);
CREATE INDEX idx_estimates_type ON plaster.estimates(estimate_type);

-- ============================================
-- ESTIMATE ITEMS (Позиции сметы)
-- ============================================

CREATE TABLE plaster.estimate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES plaster.estimates(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('material', 'labor', 'overhead', 'other')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estimate_items_estimate ON plaster.estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_type ON plaster.estimate_items(item_type);

-- ============================================
-- PAYMENTS (Платежи)
-- ============================================

CREATE TABLE plaster.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('advance', 'milestone', 'final', 'refund', 'expense')),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    payer_name VARCHAR(255),
    recipient_name VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_project ON plaster.payments(project_id);
CREATE INDEX idx_payments_date ON plaster.payments(payment_date);
CREATE INDEX idx_payments_status ON plaster.payments(status);

-- ============================================
-- WORKER PAYMENTS (Зарплаты)
-- ============================================

CREATE TABLE plaster.worker_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES plaster.workers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES plaster.projects(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked DECIMAL(6, 2) DEFAULT 0 CHECK (hours_worked >= 0),
    area_completed DECIMAL(10, 2) DEFAULT 0 CHECK (area_completed >= 0),
    base_amount DECIMAL(10, 2) NOT NULL CHECK (base_amount >= 0),
    bonus_amount DECIMAL(10, 2) DEFAULT 0 CHECK (bonus_amount >= 0),
    deductions DECIMAL(10, 2) DEFAULT 0 CHECK (deductions >= 0),
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (base_amount + bonus_amount - deductions) STORED,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'calculated' CHECK (status IN ('calculated', 'approved', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_worker_payments_worker ON plaster.worker_payments(worker_id);
CREATE INDEX idx_worker_payments_period ON plaster.worker_payments(period_start, period_end);
CREATE INDEX idx_worker_payments_status ON plaster.worker_payments(status);

-- ============================================
-- AI ANALYSIS RESULTS (Результаты AI анализа)
-- ============================================

CREATE TABLE plaster.ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID REFERENCES plaster.photos(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('defect_detection', 'progress_estimation', 'quality_assessment', 'material_recognition')),
    model_version VARCHAR(50),
    input_data JSONB,
    result_data JSONB NOT NULL,
    confidence_score DECIMAL(5, 4),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_analysis_project ON plaster.ai_analysis(project_id);
CREATE INDEX idx_ai_analysis_type ON plaster.ai_analysis(analysis_type);
CREATE INDEX idx_ai_analysis_photo ON plaster.ai_analysis(photo_id);

-- ============================================
-- PREDICTIONS (ML Прогнозы)
-- ============================================

CREATE TABLE plaster.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('completion_date', 'risk_assessment', 'resource_optimization', 'cost_forecast')),
    model_version VARCHAR(50),
    input_features JSONB,
    predicted_value JSONB NOT NULL,
    confidence_interval JSONB,
    accuracy_score DECIMAL(5, 4),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_project ON plaster.predictions(project_id);
CREATE INDEX idx_predictions_type ON plaster.predictions(prediction_type);

-- ============================================
-- AUDIT LOG (Журнал изменений)
-- ============================================

CREATE TABLE plaster.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON plaster.audit_log(table_name);
CREATE INDEX idx_audit_record ON plaster.audit_log(record_id);
CREATE INDEX idx_audit_created ON plaster.audit_log(created_at DESC);

-- ============================================
-- WARRANTY (Гарантия)
-- ============================================

CREATE TABLE plaster.warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES plaster.projects(id) ON DELETE CASCADE,
    warranty_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    terms TEXT,
    coverage_details TEXT,
    exclusions TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed', 'void')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_warranty_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_warranties_project ON plaster.warranties(project_id);
CREATE INDEX idx_warranties_status ON plaster.warranties(status);
CREATE INDEX idx_warranties_end ON plaster.warranties(end_date);

-- ============================================
-- FUNCTIONS (Функции)
-- ============================================

-- Calculate project progress
CREATE OR REPLACE FUNCTION plaster.calculate_project_progress(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_stages INTEGER;
    completed_stages INTEGER;
    weighted_progress DECIMAL;
BEGIN
    SELECT COUNT(*), SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)
    INTO total_stages, completed_stages
    FROM plaster.project_stages
    WHERE project_id = p_project_id;
    
    IF total_stages = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COALESCE(AVG(progress_percent), 0)
    INTO weighted_progress
    FROM plaster.project_stages
    WHERE project_id = p_project_id;
    
    RETURN ROUND(weighted_progress);
END;
$$ LANGUAGE plpgsql;

-- Calculate material requirements
CREATE OR REPLACE FUNCTION plaster.calculate_material_requirements(
    p_area_sqm DECIMAL,
    p_plaster_type VARCHAR,
    p_thickness_mm DECIMAL DEFAULT NULL
)
RETURNS TABLE(
    material_name VARCHAR,
    required_quantity DECIMAL,
    unit VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name,
        ROUND(p_area_sqm * m.consumption_rate * COALESCE(p_thickness_mm, 10), 2),
        m.unit
    FROM plaster.materials m
    WHERE m.category = 'plaster' AND m.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION plaster.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'plaster' 
             AND table_name NOT IN ('audit_log', 'photos', 'ai_analysis', 'predictions')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_timestamp ON plaster.%I;
            CREATE TRIGGER update_timestamp BEFORE UPDATE ON plaster.%I
            FOR EACH ROW EXECUTE FUNCTION plaster.update_timestamp();
        ', t, t);
    END LOOP;
END;
$$;

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION plaster.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO plaster.audit_log (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO plaster.audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO plaster.audit_log (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS (Представления)
-- ============================================

-- Project summary view
CREATE OR REPLACE VIEW plaster.v_project_summary AS
SELECT 
    p.id,
    p.name,
    p.address,
    p.area_sqm,
    p.room_type,
    p.plaster_type,
    p.status,
    p.start_date,
    p.deadline,
    p.budget,
    plaster.calculate_project_progress(p.id) as progress_percent,
    (SELECT COUNT(*) FROM plaster.project_stages WHERE project_id = p.id) as total_stages,
    (SELECT COUNT(*) FROM plaster.project_stages WHERE project_id = p.id AND status = 'completed') as completed_stages,
    (SELECT COUNT(*) FROM plaster.worker_assignments WHERE project_id = p.id AND status = 'active') as active_workers,
    (SELECT COUNT(*) FROM plaster.defects WHERE project_id = p.id AND status NOT IN ('repaired', 'accepted')) as open_defects,
    (SELECT COALESCE(SUM(total_amount), 0) FROM plaster.estimates WHERE project_id = p.id AND estimate_type = 'final' AND approved = true) as estimated_cost,
    (SELECT COALESCE(SUM(amount), 0) FROM plaster.payments WHERE project_id = p.id AND status = 'completed' AND payment_type != 'expense') as total_received,
    (SELECT COALESCE(SUM(amount), 0) FROM plaster.payments WHERE project_id = p.id AND status = 'completed' AND payment_type = 'expense') as total_expenses
FROM plaster.projects p;

-- Worker productivity view
CREATE OR REPLACE VIEW plaster.v_worker_productivity AS
SELECT 
    w.id,
    w.first_name || ' ' || w.last_name as full_name,
    w.specialization,
    w.productivity_sqm_day as expected_productivity,
    COALESCE(AVG(te.area_completed / NULLIF(te.hours_worked, 0) * 8), 0) as actual_productivity,
    COALESCE(SUM(te.hours_worked), 0) as total_hours,
    COALESCE(SUM(te.area_completed), 0) as total_area,
    COUNT(DISTINCT te.project_id) as projects_count,
    w.rating
FROM plaster.workers w
LEFT JOIN plaster.time_entries te ON w.id = te.worker_id
GROUP BY w.id, w.first_name, w.last_name, w.specialization, w.productivity_sqm_day, w.rating;

-- Material inventory view
CREATE OR REPLACE VIEW plaster.v_material_inventory AS
SELECT 
    m.id as material_id,
    m.name,
    m.category,
    m.unit,
    m.price_per_unit,
    m.min_stock_level,
    COALESCE(SUM(i.quantity), 0) as current_stock,
    CASE 
        WHEN COALESCE(SUM(i.quantity), 0) < m.min_stock_level THEN 'low'
        WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'out_of_stock'
        ELSE 'normal'
    END as stock_status,
    MIN(i.expiry_date) as nearest_expiry
FROM plaster.materials m
LEFT JOIN plaster.inventory i ON m.id = i.material_id
WHERE m.is_active = true
GROUP BY m.id, m.name, m.category, m.unit, m.price_per_unit, m.min_stock_level;

-- ============================================
-- SAMPLE DATA (Тестовые данные)
-- ============================================

-- Insert sample materials
INSERT INTO plaster.materials (name, name_en, category, unit, price_per_unit, consumption_rate, supplier, description) VALUES
('Ротбанд Кнауф 30кг', 'Rotband Knauf 30kg', 'plaster', 'мешок', 450.00, 0.85, 'СтройМаркет', 'Гипсовая штукатурка универсальная'),
('Волма Слой 30кг', 'Volma Layer 30kg', 'plaster', 'мешок', 380.00, 0.90, 'СтройМаркет', 'Гипсовая штукатурка для внутренних работ'),
('Церезит CT 29 25кг', 'Ceresit CT 29 25kg', 'plaster', 'мешок', 520.00, 1.50, 'СтройМастер', 'Цементная штукатурка для влажных помещений'),
('Грунтовка Бетоконтакт 20кг', 'Primer Betonkontakt 20kg', 'primer', 'ведро', 1200.00, 0.30, 'СтройМаркет', 'Грунтовка для гладких поверхностей'),
('Грунтовка универсальная 10л', 'Universal Primer 10l', 'primer', 'канистра', 450.00, 0.15, 'СтройМаркет', 'Универсальная грунтовка глубокого проникновения'),
('Сетка штукатурная 50м', 'Plaster mesh 50m', 'mesh', 'рулон', 850.00, 0.02, 'СтройОпт', 'Стеклосетка для армирования'),
('Маяк штукатурный 6мм 3м', 'Beacon 6mm 3m', 'beacon', 'шт', 35.00, 0.50, 'СтройОпт', 'Маяк оцинкованный'),
('Маяк штукатурный 10мм 3м', 'Beacon 10mm 3m', 'beacon', 'шт', 45.00, 0.50, 'СтройОпт', 'Маяк оцинкованный для толстого слоя'),
('Правило алюминиевое 2м', 'Aluminum rule 2m', 'tool', 'шт', 650.00, NULL, 'СтройИнструмент', 'Правило h-образное'),
('Шпатель 450мм', 'Spatula 450mm', 'tool', 'шт', 280.00, NULL, 'СтройИнструмент', 'Широкий шпатель из нержавеющей стали');

-- Insert sample workers
INSERT INTO plaster.workers (first_name, last_name, phone, specialization, experience_years, hourly_rate, daily_rate, productivity_sqm_day, rating) VALUES
('Александр', 'Петров', '+7-999-111-2233', 'Штукатур', 8, 350.00, 2800.00, 25.00, 4.8),
('Иван', 'Сидоров', '+7-999-222-3344', 'Штукатур', 5, 300.00, 2400.00, 20.00, 4.5),
('Михаил', 'Козлов', '+7-999-333-4455', 'Штукатур-маляр', 10, 400.00, 3200.00, 30.00, 4.9),
('Дмитрий', 'Новиков', '+7-999-444-5566', 'Помощник', 2, 200.00, 1600.00, 15.00, 4.2),
('Сергей', 'Морозов', '+7-999-555-6677', 'Штукатур', 6, 320.00, 2560.00, 22.00, 4.6);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON SCHEMA plaster TO kolibri_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA plaster TO kolibri_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA plaster TO kolibri_app;
