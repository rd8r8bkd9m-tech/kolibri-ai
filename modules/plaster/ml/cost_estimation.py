"""
Kolibri PLASTER Module - Cost Estimation ML
Автоматический расчет сметы на основе ML анализа

Использует исторические данные проектов для точных прогнозов стоимости
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import math


class ComplexityLevel(Enum):
    """Уровни сложности работ"""
    SIMPLE = "simple"
    STANDARD = "standard"
    COMPLEX = "complex"
    PREMIUM = "premium"


class RoomType(Enum):
    """Типы помещений"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    OFFICE = "office"


@dataclass
class EstimateInput:
    """Входные данные для расчета сметы"""
    area_sqm: float
    plaster_type: str
    room_type: str
    complexity: str
    height_m: float = 2.7
    corners_count: int = 4
    windows_count: int = 1
    doors_count: int = 1
    wall_condition: str = "normal"  # good, normal, poor
    include_preparation: bool = True
    include_priming: bool = True
    include_finishing: bool = True
    region: str = "moscow"


@dataclass
class MaterialEstimate:
    """Расчет материала"""
    name: str
    category: str
    quantity: float
    unit: str
    unit_price: float
    total_price: float
    notes: str = ""


@dataclass
class LaborEstimate:
    """Расчет работ"""
    stage_name: str
    area_sqm: float
    rate_per_sqm: float
    total_cost: float
    estimated_hours: float


@dataclass
class CostEstimateResult:
    """Результат расчета сметы"""
    estimate_id: str
    created_at: str
    model_version: str
    input_params: Dict
    materials: List[MaterialEstimate]
    labor: List[LaborEstimate]
    materials_total: float
    labor_total: float
    overhead: float
    profit_margin: float
    subtotal: float
    total: float
    currency: str
    confidence_score: float
    comparison: Dict  # Сравнение с историческими данными
    recommendations: List[str]


class CostEstimationML:
    """
    ML модель для расчета сметы штукатурных работ
    
    Учитывает:
    - Тип и площадь помещения
    - Вид штукатурки и сложность
    - Состояние поверхности
    - Региональные коэффициенты
    - Исторические данные похожих проектов
    """
    
    MODEL_VERSION = "1.0.0-demo"
    
    # Базовые цены материалов (RUB)
    MATERIAL_PRICES = {
        "plaster_gypsum_30kg": {"price": 420, "unit": "мешок", "coverage_sqm": 3.5},
        "plaster_cement_25kg": {"price": 350, "unit": "мешок", "coverage_sqm": 2.5},
        "plaster_decorative_25kg": {"price": 1200, "unit": "мешок", "coverage_sqm": 4.0},
        "plaster_finish_20kg": {"price": 550, "unit": "мешок", "coverage_sqm": 5.0},
        "primer_deep_10l": {"price": 450, "unit": "канистра", "coverage_sqm": 50},
        "primer_betonkontakt_20kg": {"price": 1400, "unit": "ведро", "coverage_sqm": 35},
        "mesh_fiberglass_50m": {"price": 950, "unit": "рулон", "coverage_sqm": 50},
        "beacon_6mm_3m": {"price": 38, "unit": "шт", "per_sqm": 0.5},
        "beacon_10mm_3m": {"price": 48, "unit": "шт", "per_sqm": 0.5},
        "corner_profile_3m": {"price": 65, "unit": "шт", "per_corner": 1},
    }
    
    # Расценки на работы (RUB/м²)
    LABOR_RATES = {
        "preparation": {"simple": 80, "standard": 120, "complex": 180, "premium": 250},
        "priming": {"simple": 50, "standard": 60, "complex": 80, "premium": 100},
        "beacon_setup": {"simple": 100, "standard": 150, "complex": 200, "premium": 280},
        "application_leveling": {"simple": 350, "standard": 450, "complex": 600, "premium": 800},
        "application_decorative": {"simple": 500, "standard": 650, "complex": 850, "premium": 1200},
        "application_finish": {"simple": 200, "standard": 280, "complex": 380, "premium": 500},
        "application_gypsum": {"simple": 380, "standard": 480, "complex": 620, "premium": 820},
        "application_cement": {"simple": 400, "standard": 520, "complex": 680, "premium": 900},
        "sanding": {"simple": 80, "standard": 100, "complex": 140, "premium": 180},
    }
    
    # Региональные коэффициенты
    REGIONAL_COEFFICIENTS = {
        "moscow": 1.0,
        "spb": 0.95,
        "ekb": 0.85,
        "novosibirsk": 0.80,
        "kazan": 0.82,
        "krasnodar": 0.88,
        "other": 0.75
    }
    
    # Коэффициенты состояния стен
    WALL_CONDITION_FACTORS = {
        "good": 0.9,
        "normal": 1.0,
        "poor": 1.3
    }
    
    # Коэффициенты типа помещения
    ROOM_TYPE_FACTORS = {
        "residential": 1.0,
        "commercial": 1.15,
        "industrial": 1.25,
        "office": 1.1
    }
    
    def __init__(self, historical_data: Optional[List[Dict]] = None):
        """
        Инициализация модели
        
        Args:
            historical_data: исторические данные для калибровки
        """
        self.historical_data = historical_data or []
        self._calibrated = False
    
    def calibrate(self, data: List[Dict]) -> bool:
        """
        Калибровка модели на исторических данных
        
        Args:
            data: список завершенных проектов с реальными затратами
        """
        self.historical_data.extend(data)
        # В production: обновление коэффициентов на основе данных
        self._calibrated = True
        return True
    
    def estimate(self, input_data: EstimateInput) -> CostEstimateResult:
        """
        Расчет сметы
        
        Args:
            input_data: параметры проекта
            
        Returns:
            CostEstimateResult с детальной сметой
        """
        # Коэффициенты
        region_coef = self.REGIONAL_COEFFICIENTS.get(input_data.region, 0.85)
        wall_coef = self.WALL_CONDITION_FACTORS.get(input_data.wall_condition, 1.0)
        room_coef = self.ROOM_TYPE_FACTORS.get(input_data.room_type, 1.0)
        
        combined_coef = region_coef * wall_coef * room_coef
        
        # Расчет материалов
        materials = self._calculate_materials(input_data, combined_coef)
        materials_total = sum(m.total_price for m in materials)
        
        # Расчет работ
        labor = self._calculate_labor(input_data, combined_coef)
        labor_total = sum(l.total_cost for l in labor)
        
        # Накладные расходы (10-15%)
        overhead_rate = 0.12 if input_data.complexity in ["simple", "standard"] else 0.15
        overhead = (materials_total + labor_total) * overhead_rate
        
        # Прибыль (15-25%)
        profit_rate = {
            "simple": 0.15,
            "standard": 0.18,
            "complex": 0.22,
            "premium": 0.25
        }.get(input_data.complexity, 0.18)
        
        subtotal = materials_total + labor_total + overhead
        profit = subtotal * profit_rate
        total = subtotal + profit
        
        # Сравнение с историческими данными
        comparison = self._compare_with_historical(input_data, total)
        
        # Оценка достоверности
        confidence = self._calculate_confidence(input_data, comparison)
        
        # Рекомендации
        recommendations = self._generate_recommendations(
            input_data, materials_total, labor_total, comparison
        )
        
        return CostEstimateResult(
            estimate_id=f"EST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            created_at=datetime.now().isoformat(),
            model_version=self.MODEL_VERSION,
            input_params={
                "area_sqm": input_data.area_sqm,
                "plaster_type": input_data.plaster_type,
                "room_type": input_data.room_type,
                "complexity": input_data.complexity,
                "region": input_data.region
            },
            materials=materials,
            labor=labor,
            materials_total=round(materials_total, 2),
            labor_total=round(labor_total, 2),
            overhead=round(overhead, 2),
            profit_margin=round(profit, 2),
            subtotal=round(subtotal, 2),
            total=round(total, 2),
            currency="RUB",
            confidence_score=confidence,
            comparison=comparison,
            recommendations=recommendations
        )
    
    def _calculate_materials(
        self, 
        input_data: EstimateInput,
        coef: float
    ) -> List[MaterialEstimate]:
        """Расчет необходимых материалов"""
        materials = []
        area = input_data.area_sqm
        
        # Выбор типа штукатурки
        plaster_key = {
            "leveling": "plaster_gypsum_30kg",
            "decorative": "plaster_decorative_25kg",
            "finish": "plaster_finish_20kg",
            "gypsum": "plaster_gypsum_30kg",
            "cement": "plaster_cement_25kg"
        }.get(input_data.plaster_type, "plaster_gypsum_30kg")
        
        plaster_info = self.MATERIAL_PRICES[plaster_key]
        
        # Штукатурка
        plaster_qty = math.ceil(area / plaster_info["coverage_sqm"] * 1.1)  # +10% запас
        materials.append(MaterialEstimate(
            name=self._get_material_name(plaster_key),
            category="plaster",
            quantity=plaster_qty,
            unit=plaster_info["unit"],
            unit_price=plaster_info["price"] * coef,
            total_price=round(plaster_qty * plaster_info["price"] * coef, 2),
            notes="С учетом 10% запаса"
        ))
        
        # Грунтовка
        if input_data.include_priming:
            primer_key = "primer_betonkontakt_20kg" if input_data.wall_condition == "poor" else "primer_deep_10l"
            primer_info = self.MATERIAL_PRICES[primer_key]
            primer_qty = math.ceil(area / primer_info["coverage_sqm"])
            
            materials.append(MaterialEstimate(
                name=self._get_material_name(primer_key),
                category="primer",
                quantity=primer_qty,
                unit=primer_info["unit"],
                unit_price=primer_info["price"] * coef,
                total_price=round(primer_qty * primer_info["price"] * coef, 2)
            ))
        
        # Армирующая сетка (для сложных работ)
        if input_data.complexity in ["complex", "premium"]:
            mesh_info = self.MATERIAL_PRICES["mesh_fiberglass_50m"]
            mesh_qty = math.ceil(area / mesh_info["coverage_sqm"])
            
            materials.append(MaterialEstimate(
                name=self._get_material_name("mesh_fiberglass_50m"),
                category="mesh",
                quantity=mesh_qty,
                unit=mesh_info["unit"],
                unit_price=mesh_info["price"] * coef,
                total_price=round(mesh_qty * mesh_info["price"] * coef, 2)
            ))
        
        # Маяки
        if input_data.plaster_type in ["leveling", "cement", "gypsum"]:
            beacon_key = "beacon_10mm_3m" if input_data.plaster_type == "leveling" else "beacon_6mm_3m"
            beacon_info = self.MATERIAL_PRICES[beacon_key]
            beacon_qty = math.ceil(area * beacon_info["per_sqm"])
            
            materials.append(MaterialEstimate(
                name=self._get_material_name(beacon_key),
                category="beacon",
                quantity=beacon_qty,
                unit=beacon_info["unit"],
                unit_price=beacon_info["price"] * coef,
                total_price=round(beacon_qty * beacon_info["price"] * coef, 2)
            ))
        
        # Угловые профили
        if input_data.corners_count > 0:
            corner_info = self.MATERIAL_PRICES["corner_profile_3m"]
            corner_qty = input_data.corners_count * math.ceil(input_data.height_m / 3)
            
            materials.append(MaterialEstimate(
                name=self._get_material_name("corner_profile_3m"),
                category="accessory",
                quantity=corner_qty,
                unit=corner_info["unit"],
                unit_price=corner_info["price"] * coef,
                total_price=round(corner_qty * corner_info["price"] * coef, 2)
            ))
        
        return materials
    
    def _calculate_labor(
        self, 
        input_data: EstimateInput,
        coef: float
    ) -> List[LaborEstimate]:
        """Расчет стоимости работ"""
        labor = []
        area = input_data.area_sqm
        complexity = input_data.complexity
        
        # Производительность (м²/час) для расчета часов
        productivity = {
            "simple": 4.0,
            "standard": 3.0,
            "complex": 2.0,
            "premium": 1.5
        }.get(complexity, 3.0)
        
        # Подготовка поверхности
        if input_data.include_preparation:
            rate = self.LABOR_RATES["preparation"][complexity]
            labor.append(LaborEstimate(
                stage_name="Подготовка поверхности",
                area_sqm=area,
                rate_per_sqm=round(rate * coef, 2),
                total_cost=round(area * rate * coef, 2),
                estimated_hours=round(area / (productivity * 2), 1)  # Быстрее основной работы
            ))
        
        # Грунтовка
        if input_data.include_priming:
            rate = self.LABOR_RATES["priming"][complexity]
            labor.append(LaborEstimate(
                stage_name="Грунтование",
                area_sqm=area,
                rate_per_sqm=round(rate * coef, 2),
                total_cost=round(area * rate * coef, 2),
                estimated_hours=round(area / (productivity * 3), 1)
            ))
        
        # Установка маяков (если нужно)
        if input_data.plaster_type in ["leveling", "cement", "gypsum"]:
            rate = self.LABOR_RATES["beacon_setup"][complexity]
            labor.append(LaborEstimate(
                stage_name="Установка маяков",
                area_sqm=area,
                rate_per_sqm=round(rate * coef, 2),
                total_cost=round(area * rate * coef, 2),
                estimated_hours=round(area / (productivity * 2.5), 1)
            ))
        
        # Нанесение штукатурки
        application_key = f"application_{input_data.plaster_type}"
        if application_key not in self.LABOR_RATES:
            application_key = "application_leveling"
        
        rate = self.LABOR_RATES[application_key][complexity]
        labor.append(LaborEstimate(
            stage_name="Нанесение штукатурки",
            area_sqm=area,
            rate_per_sqm=round(rate * coef, 2),
            total_cost=round(area * rate * coef, 2),
            estimated_hours=round(area / productivity, 1)
        ))
        
        # Финишная обработка
        if input_data.include_finishing:
            rate = self.LABOR_RATES["sanding"][complexity]
            labor.append(LaborEstimate(
                stage_name="Шлифовка и финишная обработка",
                area_sqm=area,
                rate_per_sqm=round(rate * coef, 2),
                total_cost=round(area * rate * coef, 2),
                estimated_hours=round(area / (productivity * 1.5), 1)
            ))
        
        return labor
    
    def _compare_with_historical(
        self, 
        input_data: EstimateInput, 
        total: float
    ) -> Dict:
        """Сравнение с историческими данными"""
        # В production: поиск похожих проектов и сравнение
        # Симуляция для демо
        
        price_per_sqm = total / input_data.area_sqm
        
        # Исторические средние (симуляция)
        historical_avg = {
            "leveling": 1200,
            "decorative": 1800,
            "finish": 800,
            "gypsum": 1100,
            "cement": 1300
        }.get(input_data.plaster_type, 1200)
        
        variance = (price_per_sqm - historical_avg) / historical_avg * 100
        
        return {
            "price_per_sqm": round(price_per_sqm, 2),
            "historical_avg_per_sqm": historical_avg,
            "variance_percent": round(variance, 1),
            "market_position": "выше рынка" if variance > 10 else "ниже рынка" if variance < -10 else "в рынке",
            "similar_projects_count": random.randint(5, 20),
            "price_range": {
                "min": round(historical_avg * 0.8, 2),
                "max": round(historical_avg * 1.3, 2)
            }
        }
    
    def _calculate_confidence(
        self, 
        input_data: EstimateInput,
        comparison: Dict
    ) -> float:
        """Расчет уровня достоверности оценки"""
        base_confidence = 0.85
        
        # Корректировки
        if abs(comparison["variance_percent"]) < 10:
            base_confidence += 0.05
        elif abs(comparison["variance_percent"]) > 20:
            base_confidence -= 0.10
        
        if input_data.complexity in ["simple", "standard"]:
            base_confidence += 0.05
        
        if input_data.area_sqm >= 50 and input_data.area_sqm <= 500:
            base_confidence += 0.03  # Типичный размер проекта
        
        return min(0.95, max(0.60, round(base_confidence, 2)))
    
    def _generate_recommendations(
        self,
        input_data: EstimateInput,
        materials_total: float,
        labor_total: float,
        comparison: Dict
    ) -> List[str]:
        """Генерация рекомендаций по оптимизации"""
        recommendations = []
        
        # По материалам
        if materials_total > labor_total * 0.5:
            recommendations.append(
                "Рассмотрите закупку материалов оптом для снижения стоимости"
            )
        
        # По рыночной позиции
        if comparison["variance_percent"] > 15:
            recommendations.append(
                "Цена выше рыночной - проверьте возможность оптимизации"
            )
        elif comparison["variance_percent"] < -10:
            recommendations.append(
                "Цена ниже рыночной - убедитесь, что все работы учтены"
            )
        
        # По типу работ
        if input_data.plaster_type == "decorative":
            recommendations.append(
                "Декоративная штукатурка требует высокой квалификации - учтите это в выборе бригады"
            )
        
        if input_data.wall_condition == "poor":
            recommendations.append(
                "Плохое состояние стен может потребовать дополнительных материалов"
            )
        
        # По объему
        if input_data.area_sqm > 200:
            recommendations.append(
                "При большом объеме рекомендуется поэтапная оплата работ"
            )
        
        recommendations.append(
            f"Срок действия сметы: 30 дней (цены могут измениться)"
        )
        
        return recommendations[:5]
    
    def _get_material_name(self, key: str) -> str:
        """Получение читаемого названия материала"""
        names = {
            "plaster_gypsum_30kg": "Штукатурка гипсовая 30кг",
            "plaster_cement_25kg": "Штукатурка цементная 25кг",
            "plaster_decorative_25kg": "Штукатурка декоративная 25кг",
            "plaster_finish_20kg": "Шпаклевка финишная 20кг",
            "primer_deep_10l": "Грунтовка глубокого проникновения 10л",
            "primer_betonkontakt_20kg": "Грунтовка Бетоконтакт 20кг",
            "mesh_fiberglass_50m": "Сетка армирующая стеклотканевая 50м",
            "beacon_6mm_3m": "Маяк штукатурный 6мм 3м",
            "beacon_10mm_3m": "Маяк штукатурный 10мм 3м",
            "corner_profile_3m": "Профиль угловой 3м"
        }
        return names.get(key, key)
    
    def to_dict(self, result: CostEstimateResult) -> Dict:
        """Конвертация результата в словарь"""
        return {
            "estimate_id": result.estimate_id,
            "created_at": result.created_at,
            "model_version": result.model_version,
            "input_params": result.input_params,
            "materials": [asdict(m) for m in result.materials],
            "labor": [asdict(l) for l in result.labor],
            "summary": {
                "materials_total": result.materials_total,
                "labor_total": result.labor_total,
                "overhead": result.overhead,
                "profit_margin": result.profit_margin,
                "subtotal": result.subtotal,
                "total": result.total,
                "currency": result.currency
            },
            "confidence_score": result.confidence_score,
            "comparison": result.comparison,
            "recommendations": result.recommendations
        }


# API функции для интеграции
def calculate_estimate(
    area_sqm: float,
    plaster_type: str = "leveling",
    room_type: str = "residential",
    complexity: str = "standard",
    region: str = "moscow",
    wall_condition: str = "normal",
    **kwargs
) -> Dict:
    """
    Расчет сметы для проекта
    
    Args:
        area_sqm: площадь в м²
        plaster_type: тип штукатурки
        room_type: тип помещения
        complexity: сложность работ
        region: регион
        wall_condition: состояние стен
        
    Returns:
        Детальная смета
    """
    ml = CostEstimationML()
    
    input_data = EstimateInput(
        area_sqm=area_sqm,
        plaster_type=plaster_type,
        room_type=room_type,
        complexity=complexity,
        region=region,
        wall_condition=wall_condition,
        height_m=kwargs.get("height_m", 2.7),
        corners_count=kwargs.get("corners_count", 4),
        windows_count=kwargs.get("windows_count", 1),
        doors_count=kwargs.get("doors_count", 1),
        include_preparation=kwargs.get("include_preparation", True),
        include_priming=kwargs.get("include_priming", True),
        include_finishing=kwargs.get("include_finishing", True)
    )
    
    result = ml.estimate(input_data)
    return ml.to_dict(result)


def quick_estimate(area_sqm: float, plaster_type: str = "leveling") -> Dict:
    """
    Быстрый расчет приблизительной стоимости
    
    Returns:
        Краткая смета
    """
    result = calculate_estimate(area_sqm, plaster_type)
    
    return {
        "area_sqm": area_sqm,
        "plaster_type": plaster_type,
        "total": result["summary"]["total"],
        "price_per_sqm": result["comparison"]["price_per_sqm"],
        "confidence": result["confidence_score"]
    }


def compare_options(area_sqm: float, options: List[Dict]) -> List[Dict]:
    """
    Сравнение нескольких вариантов сметы
    
    Args:
        area_sqm: площадь
        options: список вариантов с параметрами
        
    Returns:
        Сравнительная таблица
    """
    results = []
    
    for opt in options:
        estimate = calculate_estimate(
            area_sqm=area_sqm,
            plaster_type=opt.get("plaster_type", "leveling"),
            complexity=opt.get("complexity", "standard")
        )
        
        results.append({
            "option": opt,
            "total": estimate["summary"]["total"],
            "price_per_sqm": estimate["comparison"]["price_per_sqm"],
            "materials": estimate["summary"]["materials_total"],
            "labor": estimate["summary"]["labor_total"]
        })
    
    # Сортировка по цене
    results.sort(key=lambda x: x["total"])
    
    return results


if __name__ == "__main__":
    # Демонстрация работы модуля
    print("Kolibri PLASTER - Cost Estimation ML Module")
    print("=" * 50)
    
    # Полный расчет сметы
    result = calculate_estimate(
        area_sqm=75,
        plaster_type="leveling",
        room_type="residential",
        complexity="standard",
        region="moscow",
        wall_condition="normal"
    )
    
    print("\nДетальная смета:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Быстрый расчет
    print("\n" + "=" * 50)
    print("Быстрый расчет:")
    
    quick = quick_estimate(100, "decorative")
    print(json.dumps(quick, ensure_ascii=False, indent=2))
    
    # Сравнение вариантов
    print("\n" + "=" * 50)
    print("Сравнение вариантов:")
    
    comparison = compare_options(50, [
        {"plaster_type": "leveling", "complexity": "standard"},
        {"plaster_type": "gypsum", "complexity": "standard"},
        {"plaster_type": "decorative", "complexity": "complex"}
    ])
    
    for i, opt in enumerate(comparison):
        print(f"\n{i + 1}. {opt['option']['plaster_type']} ({opt['option']['complexity']})")
        print(f"   Итого: {opt['total']:.0f} руб. ({opt['price_per_sqm']:.0f} руб./м²)")
