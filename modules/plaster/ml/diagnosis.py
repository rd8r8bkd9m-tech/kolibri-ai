"""
Kolibri PLASTER Module - AI Diagnosis
Анализ фото дефектов штукатурки с использованием компьютерного зрения

Интегрируется с Kolibri Core для децимального анализа изображений
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum


class DefectType(Enum):
    """Типы дефектов штукатурки"""
    CRACK = "crack"
    CHIP = "chip"
    UNEVENNESS = "unevenness"
    DELAMINATION = "delamination"
    EFFLORESCENCE = "efflorescence"
    MOLD = "mold"
    BUBBLE = "bubble"
    SCRATCH = "scratch"


class Severity(Enum):
    """Уровни серьезности дефекта"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class DetectedDefect:
    """Обнаруженный дефект"""
    defect_type: str
    severity: str
    confidence: float
    bounding_box: Dict[str, float]  # x, y, width, height (normalized 0-1)
    area_estimate_sqm: Optional[float]
    repair_recommendation: str
    estimated_repair_cost: float


@dataclass
class DiagnosisResult:
    """Результат диагностики"""
    photo_id: str
    analyzed_at: str
    model_version: str
    processing_time_ms: int
    defects: List[DetectedDefect]
    overall_condition: str  # good, fair, poor, critical
    summary: str
    recommendations: List[str]


class PlasterDiagnosisAI:
    """
    AI модель для диагностики дефектов штукатурки
    
    В production версии использует:
    - TensorFlow/PyTorch для CNN классификации
    - OpenCV для предобработки изображений
    - Kolibri Core для децимального кодирования
    
    Текущая версия - симуляция для демонстрации API
    """
    
    MODEL_VERSION = "1.0.0-demo"
    
    # Справочник по ремонту дефектов
    REPAIR_GUIDE = {
        DefectType.CRACK.value: {
            "method": "Расшить трещину V-образно, прогрунтовать, заполнить ремонтной смесью",
            "materials": ["Грунтовка глубокого проникновения", "Ремонтная шпаклевка", "Серпянка"],
            "cost_per_meter": 300.0  # RUB/метр трещины
        },
        DefectType.CHIP.value: {
            "method": "Зачистить место скола, прогрунтовать, зашпаклевать в 2-3 слоя",
            "materials": ["Грунтовка", "Финишная шпаклевка"],
            "cost_per_unit": 150.0
        },
        DefectType.UNEVENNESS.value: {
            "method": "Шлифовка неровных участков или нанесение выравнивающего слоя",
            "materials": ["Наждачная бумага P100-P180", "Финишная штукатурка"],
            "cost_per_sqm": 200.0
        },
        DefectType.DELAMINATION.value: {
            "method": "Удалить отслоившийся слой, обработать грунтовкой, нанести штукатурку заново",
            "materials": ["Грунтовка Бетоконтакт", "Штукатурная смесь", "Армирующая сетка"],
            "cost_per_sqm": 800.0
        },
        DefectType.EFFLORESCENCE.value: {
            "method": "Удалить высолы щеткой, обработать нейтрализатором, загрунтовать",
            "materials": ["Нейтрализатор высолов", "Гидрофобизатор"],
            "cost_per_sqm": 250.0
        },
        DefectType.MOLD.value: {
            "method": "Удалить пораженный слой, обработать антисептиком, устранить причину влажности",
            "materials": ["Антисептик", "Противогрибковая грунтовка", "Штукатурка"],
            "cost_per_sqm": 1000.0
        },
        DefectType.BUBBLE.value: {
            "method": "Вскрыть пузырь, зачистить, прогрунтовать, зашпаклевать",
            "materials": ["Грунтовка", "Шпаклевка"],
            "cost_per_unit": 100.0
        },
        DefectType.SCRATCH.value: {
            "method": "Зашпаклевать царапину, отшлифовать",
            "materials": ["Финишная шпаклевка"],
            "cost_per_unit": 50.0
        }
    }
    
    # Пороги серьезности по типам дефектов
    SEVERITY_THRESHOLDS = {
        DefectType.CRACK.value: {"low": 0.3, "medium": 0.5, "high": 0.7, "critical": 0.85},
        DefectType.DELAMINATION.value: {"low": 0.2, "medium": 0.4, "high": 0.6, "critical": 0.75},
        DefectType.MOLD.value: {"low": 0.1, "medium": 0.3, "high": 0.5, "critical": 0.65},
    }
    
    def __init__(self, use_kolibri_encoding: bool = True):
        """
        Инициализация модели
        
        Args:
            use_kolibri_encoding: использовать Kolibri децимальное кодирование
        """
        self.use_kolibri = use_kolibri_encoding
        self._model_loaded = False
        
    def load_model(self) -> bool:
        """Загрузка ML модели (симуляция)"""
        # В production: загрузка TensorFlow/PyTorch модели
        self._model_loaded = True
        return True
    
    def preprocess_image(self, image_path: str) -> Optional[bytes]:
        """
        Предобработка изображения
        
        Args:
            image_path: путь к изображению
            
        Returns:
            Обработанные данные изображения
        """
        # В production:
        # 1. Загрузка изображения через OpenCV
        # 2. Нормализация размера (640x480 или 1280x720)
        # 3. Цветовая коррекция
        # 4. Если use_kolibri: конвертация в децимальные импульсы
        return b"preprocessed_image_data"
    
    def analyze(self, image_path: str, project_id: str = None) -> DiagnosisResult:
        """
        Анализ изображения на наличие дефектов
        
        Args:
            image_path: путь к изображению
            project_id: ID проекта для контекста
            
        Returns:
            DiagnosisResult с найденными дефектами
        """
        start_time = datetime.now()
        
        if not self._model_loaded:
            self.load_model()
        
        # Предобработка
        processed = self.preprocess_image(image_path)
        
        # В production: вызов нейросети для детекции
        # Симуляция обнаружения дефектов
        defects = self._simulate_detection()
        
        # Генерация рекомендаций
        recommendations = self._generate_recommendations(defects)
        
        # Определение общего состояния
        overall = self._assess_overall_condition(defects)
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return DiagnosisResult(
            photo_id=f"photo_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            analyzed_at=datetime.now().isoformat(),
            model_version=self.MODEL_VERSION,
            processing_time_ms=processing_time,
            defects=defects,
            overall_condition=overall,
            summary=self._generate_summary(defects, overall),
            recommendations=recommendations
        )
    
    def _simulate_detection(self) -> List[DetectedDefect]:
        """Симуляция детекции дефектов (для демо)"""
        defects = []
        
        # Случайное количество дефектов (0-3)
        num_defects = random.randint(0, 3)
        
        for i in range(num_defects):
            defect_type = random.choice(list(DefectType)).value
            
            # Генерация bounding box
            x = random.uniform(0.1, 0.7)
            y = random.uniform(0.1, 0.7)
            w = random.uniform(0.05, 0.25)
            h = random.uniform(0.05, 0.25)
            
            # Определение серьезности
            confidence = random.uniform(0.65, 0.98)
            severity = self._determine_severity(defect_type, confidence)
            
            # Оценка площади (в м²)
            area = random.uniform(0.01, 0.5) if defect_type in ['delamination', 'unevenness', 'mold'] else None
            
            # Расчет стоимости ремонта
            repair_cost = self._calculate_repair_cost(defect_type, area, severity)
            
            defects.append(DetectedDefect(
                defect_type=defect_type,
                severity=severity,
                confidence=round(confidence, 3),
                bounding_box={"x": round(x, 3), "y": round(y, 3), "width": round(w, 3), "height": round(h, 3)},
                area_estimate_sqm=round(area, 3) if area else None,
                repair_recommendation=self.REPAIR_GUIDE.get(defect_type, {}).get("method", "Требуется осмотр специалиста"),
                estimated_repair_cost=round(repair_cost, 2)
            ))
        
        return defects
    
    def _determine_severity(self, defect_type: str, confidence: float) -> str:
        """Определение серьезности дефекта"""
        thresholds = self.SEVERITY_THRESHOLDS.get(defect_type, {
            "low": 0.3, "medium": 0.5, "high": 0.7, "critical": 0.85
        })
        
        if confidence >= thresholds["critical"]:
            return Severity.CRITICAL.value
        elif confidence >= thresholds["high"]:
            return Severity.HIGH.value
        elif confidence >= thresholds["medium"]:
            return Severity.MEDIUM.value
        else:
            return Severity.LOW.value
    
    def _calculate_repair_cost(self, defect_type: str, area: Optional[float], severity: str) -> float:
        """Расчет примерной стоимости ремонта"""
        guide = self.REPAIR_GUIDE.get(defect_type, {})
        
        base_cost = 0
        if "cost_per_sqm" in guide:
            base_cost = guide["cost_per_sqm"] * (area or 0.1)
        elif "cost_per_meter" in guide:
            base_cost = guide["cost_per_meter"] * random.uniform(0.5, 2.0)  # симуляция длины
        elif "cost_per_unit" in guide:
            base_cost = guide["cost_per_unit"]
        else:
            base_cost = 200.0
        
        # Множитель серьезности
        severity_multipliers = {
            "low": 1.0,
            "medium": 1.3,
            "high": 1.6,
            "critical": 2.0
        }
        
        return base_cost * severity_multipliers.get(severity, 1.0)
    
    def _assess_overall_condition(self, defects: List[DetectedDefect]) -> str:
        """Оценка общего состояния поверхности"""
        if not defects:
            return "good"
        
        critical_count = sum(1 for d in defects if d.severity == "critical")
        high_count = sum(1 for d in defects if d.severity == "high")
        
        if critical_count > 0:
            return "critical"
        elif high_count >= 2 or len(defects) >= 4:
            return "poor"
        elif len(defects) >= 2:
            return "fair"
        else:
            return "good"
    
    def _generate_summary(self, defects: List[DetectedDefect], overall: str) -> str:
        """Генерация текстового описания"""
        if not defects:
            return "Дефектов не обнаружено. Поверхность в хорошем состоянии."
        
        condition_text = {
            "good": "удовлетворительном",
            "fair": "требующем внимания",
            "poor": "неудовлетворительном",
            "critical": "критическом"
        }
        
        defect_names = {
            "crack": "трещина",
            "chip": "скол", 
            "unevenness": "неровность",
            "delamination": "отслоение",
            "efflorescence": "высолы",
            "mold": "плесень",
            "bubble": "вздутие",
            "scratch": "царапина"
        }
        
        defect_list = ", ".join([defect_names.get(d.defect_type, d.defect_type) for d in defects])
        total_cost = sum(d.estimated_repair_cost for d in defects)
        
        return (f"Обнаружено {len(defects)} дефект(ов): {defect_list}. "
                f"Поверхность в {condition_text.get(overall, 'неизвестном')} состоянии. "
                f"Примерная стоимость ремонта: {total_cost:.0f} руб.")
    
    def _generate_recommendations(self, defects: List[DetectedDefect]) -> List[str]:
        """Генерация рекомендаций"""
        recommendations = []
        
        if not defects:
            recommendations.append("Продолжайте соблюдать технологию нанесения")
            recommendations.append("Проводите регулярный осмотр поверхности")
            return recommendations
        
        # Приоритизация критических дефектов
        critical = [d for d in defects if d.severity == "critical"]
        if critical:
            recommendations.append("СРОЧНО: Устраните критические дефекты перед продолжением работ")
        
        # Рекомендации по типам дефектов
        defect_types = set(d.defect_type for d in defects)
        
        if "delamination" in defect_types:
            recommendations.append("Проверьте адгезию на соседних участках")
            recommendations.append("Убедитесь в правильной подготовке основания")
        
        if "crack" in defect_types:
            recommendations.append("Проверьте наличие подвижек основания")
            recommendations.append("Используйте армирующую сетку при ремонте")
        
        if "mold" in defect_types:
            recommendations.append("ВАЖНО: Устраните источник влаги")
            recommendations.append("Обеспечьте вентиляцию помещения")
        
        if "efflorescence" in defect_types:
            recommendations.append("Проверьте гидроизоляцию основания")
        
        # Общие рекомендации
        recommendations.append("Задокументируйте все дефекты фото до и после ремонта")
        
        return recommendations[:5]  # Максимум 5 рекомендаций
    
    def to_dict(self, result: DiagnosisResult) -> Dict:
        """Конвертация результата в словарь"""
        return {
            "photo_id": result.photo_id,
            "analyzed_at": result.analyzed_at,
            "model_version": result.model_version,
            "processing_time_ms": result.processing_time_ms,
            "defects": [asdict(d) for d in result.defects],
            "overall_condition": result.overall_condition,
            "summary": result.summary,
            "recommendations": result.recommendations
        }


# API функции для интеграции
def analyze_photo(image_path: str, project_id: str = None) -> Dict:
    """
    Главная функция для анализа фото
    
    Args:
        image_path: путь к изображению
        project_id: ID проекта
        
    Returns:
        Результат анализа в формате JSON
    """
    ai = PlasterDiagnosisAI()
    result = ai.analyze(image_path, project_id)
    return ai.to_dict(result)


def batch_analyze(image_paths: List[str], project_id: str = None) -> List[Dict]:
    """
    Пакетный анализ нескольких фото
    
    Args:
        image_paths: список путей к изображениям
        project_id: ID проекта
        
    Returns:
        Список результатов анализа
    """
    ai = PlasterDiagnosisAI()
    results = []
    
    for path in image_paths:
        result = ai.analyze(path, project_id)
        results.append(ai.to_dict(result))
    
    return results


def get_repair_guide(defect_type: str) -> Dict:
    """
    Получить руководство по ремонту для типа дефекта
    
    Args:
        defect_type: тип дефекта
        
    Returns:
        Информация о методе ремонта
    """
    return PlasterDiagnosisAI.REPAIR_GUIDE.get(defect_type, {
        "method": "Требуется осмотр специалиста",
        "materials": [],
        "cost_per_unit": 0
    })


if __name__ == "__main__":
    # Демонстрация работы модуля
    print("Kolibri PLASTER - AI Diagnosis Module")
    print("=" * 50)
    
    # Анализ тестового изображения
    result = analyze_photo("/test/image.jpg", "project_001")
    
    print("\nРезультат анализа:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Пакетный анализ
    print("\n" + "=" * 50)
    print("Пакетный анализ:")
    
    batch_results = batch_analyze([
        "/test/image1.jpg",
        "/test/image2.jpg",
        "/test/image3.jpg"
    ], "project_001")
    
    for i, res in enumerate(batch_results):
        print(f"\nИзображение {i + 1}:")
        print(f"  Состояние: {res['overall_condition']}")
        print(f"  Дефектов: {len(res['defects'])}")
        print(f"  {res['summary']}")
