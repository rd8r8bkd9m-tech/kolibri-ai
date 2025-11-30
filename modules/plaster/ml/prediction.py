"""
Kolibri PLASTER Module - ML Prediction
Прогнозирование сроков завершения, рисков и оптимизация ресурсов

Использует исторические данные и текущий прогресс для ML предсказаний
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import math


class RiskLevel(Enum):
    """Уровни риска"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskCategory(Enum):
    """Категории рисков"""
    SCHEDULE = "schedule"        # Риски сроков
    BUDGET = "budget"            # Бюджетные риски
    QUALITY = "quality"          # Риски качества
    RESOURCE = "resource"        # Ресурсные риски
    WEATHER = "weather"          # Погодные риски


@dataclass
class PredictionInput:
    """Входные данные для прогноза"""
    project_id: str
    area_sqm: float
    plaster_type: str
    current_progress_percent: float
    days_elapsed: int
    workers_count: int
    avg_productivity_sqm_day: float
    defects_count: int
    budget_spent_percent: float
    is_indoor: bool = True


@dataclass
class CompletionPrediction:
    """Прогноз завершения"""
    predicted_completion_date: str
    days_remaining: int
    confidence_interval_days: Tuple[int, int]  # min, max
    completion_probability: float  # вероятность завершения в срок
    current_pace: str  # ahead, on_track, behind


@dataclass
class RiskAssessment:
    """Оценка рисков"""
    risk_category: str
    risk_level: str
    probability: float  # 0-1
    impact: str  # low, medium, high
    description: str
    mitigation: str


@dataclass
class ResourceOptimization:
    """Рекомендации по оптимизации ресурсов"""
    recommended_workers: int
    optimal_daily_target_sqm: float
    suggested_shifts: str  # single, double
    material_buffer_percent: float
    estimated_savings: float


@dataclass
class PredictionResult:
    """Результат прогнозирования"""
    project_id: str
    predicted_at: str
    model_version: str
    input_summary: Dict
    completion: CompletionPrediction
    risks: List[RiskAssessment]
    optimization: ResourceOptimization
    overall_health: str  # excellent, good, warning, critical
    recommendations: List[str]


class PlasterPredictionML:
    """
    ML модель для прогнозирования параметров проекта
    
    В production использует:
    - Регрессионные модели для сроков
    - Классификаторы для оценки рисков
    - Оптимизационные алгоритмы для ресурсов
    
    Текущая версия - эвристический алгоритм для демонстрации
    """
    
    MODEL_VERSION = "1.0.0-demo"
    
    # Базовые параметры производительности (м²/день на одного рабочего)
    BASE_PRODUCTIVITY = {
        "leveling": 18,
        "decorative": 12,
        "finish": 25,
        "gypsum": 22,
        "cement": 15,
        "standard": 20
    }
    
    # Множители сложности
    COMPLEXITY_FACTORS = {
        "residential": 1.0,
        "commercial": 0.9,
        "industrial": 0.85,
        "office": 0.95
    }
    
    # Весовые коэффициенты для рисков
    RISK_WEIGHTS = {
        "schedule": 0.3,
        "budget": 0.25,
        "quality": 0.25,
        "resource": 0.15,
        "weather": 0.05
    }
    
    def __init__(self, historical_data: Optional[List[Dict]] = None):
        """
        Инициализация модели
        
        Args:
            historical_data: исторические данные для обучения
        """
        self.historical_data = historical_data or []
        self._model_trained = False
    
    def train(self, training_data: List[Dict]) -> bool:
        """
        Обучение модели на исторических данных
        
        Args:
            training_data: обучающие данные
            
        Returns:
            True если обучение успешно
        """
        # В production: обучение scikit-learn/XGBoost модели
        self.historical_data.extend(training_data)
        self._model_trained = True
        return True
    
    def predict(self, input_data: PredictionInput) -> PredictionResult:
        """
        Генерация прогноза для проекта
        
        Args:
            input_data: входные данные проекта
            
        Returns:
            PredictionResult с прогнозами и рекомендациями
        """
        # Прогноз завершения
        completion = self._predict_completion(input_data)
        
        # Оценка рисков
        risks = self._assess_risks(input_data, completion)
        
        # Оптимизация ресурсов
        optimization = self._optimize_resources(input_data, completion)
        
        # Общая оценка
        overall_health = self._calculate_overall_health(completion, risks)
        
        # Генерация рекомендаций
        recommendations = self._generate_recommendations(
            input_data, completion, risks, optimization
        )
        
        return PredictionResult(
            project_id=input_data.project_id,
            predicted_at=datetime.now().isoformat(),
            model_version=self.MODEL_VERSION,
            input_summary={
                "area_sqm": input_data.area_sqm,
                "progress_percent": input_data.current_progress_percent,
                "days_elapsed": input_data.days_elapsed,
                "workers": input_data.workers_count
            },
            completion=completion,
            risks=risks,
            optimization=optimization,
            overall_health=overall_health,
            recommendations=recommendations
        )
    
    def _predict_completion(self, input_data: PredictionInput) -> CompletionPrediction:
        """Прогноз даты завершения"""
        # Базовая производительность для типа штукатурки
        base_prod = self.BASE_PRODUCTIVITY.get(input_data.plaster_type, 20)
        
        # Корректировка на фактическую производительность
        if input_data.avg_productivity_sqm_day > 0:
            actual_prod = input_data.avg_productivity_sqm_day
            productivity_factor = actual_prod / base_prod
        else:
            productivity_factor = 1.0
            actual_prod = base_prod
        
        # Оставшаяся площадь
        remaining_area = input_data.area_sqm * (100 - input_data.current_progress_percent) / 100
        
        # Прогноз дней до завершения
        daily_output = actual_prod * input_data.workers_count
        
        if daily_output > 0:
            days_remaining = math.ceil(remaining_area / daily_output)
        else:
            days_remaining = 999  # Неопределено
        
        # Доверительный интервал (±20% для демо)
        interval_min = max(1, int(days_remaining * 0.8))
        interval_max = int(days_remaining * 1.4)
        
        # Добавляем буфер на дефекты
        defect_buffer = input_data.defects_count * 0.5  # 0.5 дня на каждый дефект
        days_remaining = int(days_remaining + defect_buffer)
        
        # Дата завершения
        completion_date = datetime.now() + timedelta(days=days_remaining)
        
        # Определение темпа
        expected_progress = (input_data.days_elapsed / (input_data.days_elapsed + days_remaining)) * 100
        if input_data.current_progress_percent > expected_progress + 5:
            pace = "ahead"
            completion_probability = 0.85
        elif input_data.current_progress_percent < expected_progress - 10:
            pace = "behind"
            completion_probability = 0.55
        else:
            pace = "on_track"
            completion_probability = 0.75
        
        return CompletionPrediction(
            predicted_completion_date=completion_date.strftime("%Y-%m-%d"),
            days_remaining=days_remaining,
            confidence_interval_days=(interval_min, interval_max),
            completion_probability=completion_probability,
            current_pace=pace
        )
    
    def _assess_risks(
        self, 
        input_data: PredictionInput, 
        completion: CompletionPrediction
    ) -> List[RiskAssessment]:
        """Оценка рисков проекта"""
        risks = []
        
        # Риск сроков
        if completion.current_pace == "behind":
            risks.append(RiskAssessment(
                risk_category=RiskCategory.SCHEDULE.value,
                risk_level=RiskLevel.HIGH.value,
                probability=0.7,
                impact="high",
                description="Проект отстает от графика",
                mitigation="Увеличить количество рабочих или рабочие часы"
            ))
        elif completion.current_pace == "on_track":
            risks.append(RiskAssessment(
                risk_category=RiskCategory.SCHEDULE.value,
                risk_level=RiskLevel.MEDIUM.value,
                probability=0.3,
                impact="medium",
                description="Небольшой запас по срокам",
                mitigation="Поддерживать текущий темп работы"
            ))
        
        # Бюджетный риск
        expected_budget_progress = input_data.current_progress_percent
        budget_variance = input_data.budget_spent_percent - expected_budget_progress
        
        if budget_variance > 15:
            risks.append(RiskAssessment(
                risk_category=RiskCategory.BUDGET.value,
                risk_level=RiskLevel.HIGH.value,
                probability=0.8,
                impact="high",
                description=f"Перерасход бюджета: {budget_variance:.1f}% от ожидаемого",
                mitigation="Пересмотреть расходы, найти более выгодных поставщиков"
            ))
        elif budget_variance > 5:
            risks.append(RiskAssessment(
                risk_category=RiskCategory.BUDGET.value,
                risk_level=RiskLevel.MEDIUM.value,
                probability=0.5,
                impact="medium",
                description=f"Умеренное превышение бюджета: {budget_variance:.1f}%",
                mitigation="Контролировать расход материалов"
            ))
        
        # Риск качества
        defects_per_progress = (
            input_data.defects_count / max(input_data.current_progress_percent, 1) * 100
        )
        
        if defects_per_progress > 5:
            risks.append(RiskAssessment(
                risk_category=RiskCategory.QUALITY.value,
                risk_level=RiskLevel.CRITICAL.value,
                probability=0.9,
                impact="high",
                description="Высокий уровень дефектов",
                mitigation="Остановить работы, провести анализ причин, обучить рабочих"
            ))
        elif defects_per_progress > 2:
            risks.append(RiskAssessment(
                risk_category=RiskCategory.QUALITY.value,
                risk_level=RiskLevel.MEDIUM.value,
                probability=0.6,
                impact="medium",
                description="Умеренное количество дефектов",
                mitigation="Усилить контроль качества на каждом этапе"
            ))
        
        # Ресурсный риск
        if input_data.workers_count < 2 and input_data.area_sqm > 100:
            risks.append(RiskAssessment(
                risk_category=RiskCategory.RESOURCE.value,
                risk_level=RiskLevel.MEDIUM.value,
                probability=0.6,
                impact="medium",
                description="Недостаточно рабочих для объема работ",
                mitigation="Привлечь дополнительных работников"
            ))
        
        # Погодный риск (для наружных работ)
        if not input_data.is_indoor:
            # Симуляция погодного риска (в production - интеграция с погодным API)
            risks.append(RiskAssessment(
                risk_category=RiskCategory.WEATHER.value,
                risk_level=RiskLevel.MEDIUM.value,
                probability=0.4,
                impact="medium",
                description="Возможны погодные задержки (наружные работы)",
                mitigation="Иметь резервный план на случай непогоды"
            ))
        
        return risks
    
    def _optimize_resources(
        self, 
        input_data: PredictionInput,
        completion: CompletionPrediction
    ) -> ResourceOptimization:
        """Оптимизация распределения ресурсов"""
        base_prod = self.BASE_PRODUCTIVITY.get(input_data.plaster_type, 20)
        remaining_area = input_data.area_sqm * (100 - input_data.current_progress_percent) / 100
        
        # Оптимальное количество рабочих
        # Формула: площадь / (дни * производительность)
        target_days = max(completion.days_remaining, 5)  # минимум 5 дней
        optimal_workers = math.ceil(remaining_area / (target_days * base_prod))
        optimal_workers = max(1, min(optimal_workers, 10))  # от 1 до 10 рабочих
        
        # Оптимальная дневная норма
        optimal_daily = remaining_area / target_days
        
        # Режим работы
        if optimal_workers > 4 or target_days < 7:
            shifts = "double"  # Двухсменный режим
        else:
            shifts = "single"
        
        # Буфер материалов
        if completion.current_pace == "behind":
            material_buffer = 15.0  # 15% запас
        else:
            material_buffer = 10.0  # 10% запас
        
        # Расчет экономии
        current_cost = input_data.workers_count * completion.days_remaining * 2500  # 2500 руб/день
        optimal_cost = optimal_workers * target_days * 2500
        savings = max(0, current_cost - optimal_cost)
        
        return ResourceOptimization(
            recommended_workers=optimal_workers,
            optimal_daily_target_sqm=round(optimal_daily, 1),
            suggested_shifts=shifts,
            material_buffer_percent=material_buffer,
            estimated_savings=round(savings, 0)
        )
    
    def _calculate_overall_health(
        self, 
        completion: CompletionPrediction, 
        risks: List[RiskAssessment]
    ) -> str:
        """Расчет общего состояния проекта"""
        # Подсчет критических и высоких рисков
        critical_risks = sum(1 for r in risks if r.risk_level == "critical")
        high_risks = sum(1 for r in risks if r.risk_level == "high")
        
        if critical_risks > 0:
            return "critical"
        elif high_risks >= 2 or completion.current_pace == "behind":
            return "warning"
        elif high_risks == 1 or completion.completion_probability < 0.7:
            return "good"
        else:
            return "excellent"
    
    def _generate_recommendations(
        self,
        input_data: PredictionInput,
        completion: CompletionPrediction,
        risks: List[RiskAssessment],
        optimization: ResourceOptimization
    ) -> List[str]:
        """Генерация рекомендаций"""
        recommendations = []
        
        # По темпу работ
        if completion.current_pace == "behind":
            recommendations.append(
                f"Рекомендуется увеличить бригаду до {optimization.recommended_workers} человек"
            )
            recommendations.append(
                f"Дневная норма должна составлять {optimization.optimal_daily_target_sqm} м²"
            )
        elif completion.current_pace == "ahead":
            recommendations.append(
                "Отличный темп! Поддерживайте качество работы"
            )
        
        # По рискам
        critical_risks = [r for r in risks if r.risk_level in ["critical", "high"]]
        for risk in critical_risks[:2]:  # Топ 2 риска
            recommendations.append(f"⚠️ {risk.mitigation}")
        
        # По оптимизации
        if optimization.estimated_savings > 0:
            recommendations.append(
                f"Потенциальная экономия при оптимизации: {optimization.estimated_savings:.0f} руб."
            )
        
        if optimization.suggested_shifts == "double":
            recommendations.append(
                "Рассмотрите двухсменный режим работы для ускорения"
            )
        
        # Общие рекомендации
        if input_data.defects_count > 0:
            recommendations.append(
                "Устраните выявленные дефекты до перехода к следующему этапу"
            )
        
        recommendations.append(
            f"Запас материалов рекомендуется держать на уровне {optimization.material_buffer_percent:.0f}%"
        )
        
        return recommendations[:6]  # Максимум 6 рекомендаций
    
    def to_dict(self, result: PredictionResult) -> Dict:
        """Конвертация результата в словарь"""
        return {
            "project_id": result.project_id,
            "predicted_at": result.predicted_at,
            "model_version": result.model_version,
            "input_summary": result.input_summary,
            "completion": {
                "predicted_completion_date": result.completion.predicted_completion_date,
                "days_remaining": result.completion.days_remaining,
                "confidence_interval_days": list(result.completion.confidence_interval_days),
                "completion_probability": result.completion.completion_probability,
                "current_pace": result.completion.current_pace
            },
            "risks": [asdict(r) for r in result.risks],
            "optimization": asdict(result.optimization),
            "overall_health": result.overall_health,
            "recommendations": result.recommendations
        }


# API функции для интеграции
def predict_completion(
    project_id: str,
    area_sqm: float,
    plaster_type: str = "standard",
    current_progress: float = 0,
    days_elapsed: int = 0,
    workers_count: int = 2,
    productivity: float = 20,
    defects: int = 0,
    budget_spent: float = 0,
    is_indoor: bool = True
) -> Dict:
    """
    Прогноз завершения проекта
    
    Args:
        project_id: ID проекта
        area_sqm: площадь в м²
        plaster_type: тип штукатурки
        current_progress: текущий прогресс в %
        days_elapsed: прошедших дней
        workers_count: количество рабочих
        productivity: средняя производительность м²/день
        defects: количество дефектов
        budget_spent: израсходовано бюджета в %
        is_indoor: внутренние работы
        
    Returns:
        Результат прогноза
    """
    ml = PlasterPredictionML()
    
    input_data = PredictionInput(
        project_id=project_id,
        area_sqm=area_sqm,
        plaster_type=plaster_type,
        current_progress_percent=current_progress,
        days_elapsed=days_elapsed,
        workers_count=workers_count,
        avg_productivity_sqm_day=productivity,
        defects_count=defects,
        budget_spent_percent=budget_spent,
        is_indoor=is_indoor
    )
    
    result = ml.predict(input_data)
    return ml.to_dict(result)


def assess_project_risks(
    project_id: str,
    progress: float,
    days_elapsed: int,
    budget_spent: float,
    defects: int
) -> List[Dict]:
    """
    Быстрая оценка рисков проекта
    
    Returns:
        Список выявленных рисков
    """
    result = predict_completion(
        project_id=project_id,
        area_sqm=100,  # Default
        current_progress=progress,
        days_elapsed=days_elapsed,
        budget_spent=budget_spent,
        defects=defects
    )
    
    return result.get("risks", [])


def get_optimization_suggestions(
    area_sqm: float,
    current_workers: int,
    days_remaining: int,
    plaster_type: str = "standard"
) -> Dict:
    """
    Рекомендации по оптимизации ресурсов
    
    Returns:
        Словарь с рекомендациями
    """
    ml = PlasterPredictionML()
    
    input_data = PredictionInput(
        project_id="optimization_request",
        area_sqm=area_sqm,
        plaster_type=plaster_type,
        current_progress_percent=0,
        days_elapsed=0,
        workers_count=current_workers,
        avg_productivity_sqm_day=20,
        defects_count=0,
        budget_spent_percent=0,
        is_indoor=True
    )
    
    completion = CompletionPrediction(
        predicted_completion_date=(datetime.now() + timedelta(days=days_remaining)).strftime("%Y-%m-%d"),
        days_remaining=days_remaining,
        confidence_interval_days=(days_remaining - 2, days_remaining + 5),
        completion_probability=0.75,
        current_pace="on_track"
    )
    
    optimization = ml._optimize_resources(input_data, completion)
    return asdict(optimization)


if __name__ == "__main__":
    # Демонстрация работы модуля
    print("Kolibri PLASTER - ML Prediction Module")
    print("=" * 50)
    
    # Прогноз для тестового проекта
    result = predict_completion(
        project_id="project_demo_001",
        area_sqm=150,
        plaster_type="leveling",
        current_progress=35,
        days_elapsed=7,
        workers_count=3,
        productivity=18,
        defects=2,
        budget_spent=40,
        is_indoor=True
    )
    
    print("\nПрогноз проекта:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Рекомендации по оптимизации
    print("\n" + "=" * 50)
    print("Оптимизация ресурсов:")
    
    opt = get_optimization_suggestions(
        area_sqm=200,
        current_workers=2,
        days_remaining=15,
        plaster_type="decorative"
    )
    
    print(json.dumps(opt, ensure_ascii=False, indent=2))
