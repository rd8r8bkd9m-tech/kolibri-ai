import React, { useState, useRef } from 'react';

/**
 * PhotoDiagnosis Component
 * AI анализ фото дефектов штукатурки
 */

interface DetectedDefect {
  defect_type: string;
  severity: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  area_estimate_sqm?: number;
  repair_recommendation: string;
  estimated_repair_cost: number;
}

interface DiagnosisResult {
  photo_id: string;
  analyzed_at: string;
  defects: DetectedDefect[];
  overall_condition: string;
  summary: string;
  recommendations: string[];
}

interface PhotoDiagnosisProps {
  projectId?: string;
  onDiagnosisComplete?: (result: DiagnosisResult) => void;
  onSaveDefect?: (defect: DetectedDefect) => void;
  apiEndpoint?: string;
}

const defectTypeLabels: Record<string, string> = {
  crack: 'Трещина',
  chip: 'Скол',
  unevenness: 'Неровность',
  delamination: 'Отслоение',
  efflorescence: 'Высолы',
  mold: 'Плесень',
  bubble: 'Вздутие',
  scratch: 'Царапина',
};

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const severityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const conditionColors: Record<string, string> = {
  good: 'text-green-600',
  fair: 'text-yellow-600',
  poor: 'text-orange-600',
  critical: 'text-red-600',
};

const conditionLabels: Record<string, string> = {
  good: 'Хорошее',
  fair: 'Удовлетворительное',
  poor: 'Плохое',
  critical: 'Критическое',
};

export const PhotoDiagnosis: React.FC<PhotoDiagnosisProps> = ({
  projectId,
  onDiagnosisComplete,
  onSaveDefect,
  apiEndpoint = '/api/plaster/quality/diagnose',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<DetectedDefect | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 10 МБ)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setError('');

    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult = simulateDiagnosis();
      setResult(mockResult);
      onDiagnosisComplete?.(mockResult);
    } catch (err) {
      setError('Ошибка при анализе изображения');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          AI Диагностика дефектов
        </h2>
        <p className="text-purple-100 text-sm">
          Загрузите фото для автоматического анализа
        </p>
      </div>

      <div className="p-6">
        {/* Upload Area */}
        {!selectedImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Перетащите фото или нажмите для выбора
            </h3>
            <p className="text-sm text-gray-500">
              Поддерживаются: JPG, PNG, WEBP (до 10 МБ)
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={selectedImage}
                alt="Uploaded"
                className="w-full rounded-lg shadow-md max-h-[400px] object-contain bg-gray-100"
              />
              
              {/* Defect Overlays */}
              {result && result.defects.map((defect, index) => (
                <div
                  key={index}
                  className={`absolute border-2 ${
                    defect.severity === 'critical' ? 'border-red-500' :
                    defect.severity === 'high' ? 'border-orange-500' :
                    defect.severity === 'medium' ? 'border-yellow-500' :
                    'border-green-500'
                  } rounded cursor-pointer transition-all hover:bg-opacity-30`}
                  style={{
                    left: `${defect.bounding_box.x * 100}%`,
                    top: `${defect.bounding_box.y * 100}%`,
                    width: `${defect.bounding_box.width * 100}%`,
                    height: `${defect.bounding_box.height * 100}%`,
                    backgroundColor: selectedDefect === defect ? 'rgba(255,0,0,0.2)' : 'transparent',
                  }}
                  onClick={() => setSelectedDefect(defect)}
                >
                  <span className={`absolute -top-6 left-0 px-2 py-0.5 text-xs font-bold rounded ${
                    defect.severity === 'critical' ? 'bg-red-500 text-white' :
                    defect.severity === 'high' ? 'bg-orange-500 text-white' :
                    defect.severity === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {defectTypeLabels[defect.defect_type] || defect.defect_type}
                  </span>
                </div>
              ))}

              {/* Change Image Button */}
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
                className="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-lg text-sm hover:bg-white transition-colors"
              >
                ✕ Удалить
              </button>
            </div>

            {/* Analyze Button */}
            {!result && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Анализ изображения...
                  </span>
                ) : (
                  '🔬 Анализировать'
                )}
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Результат анализа</h3>
                <span className={`text-lg font-bold ${conditionColors[result.overall_condition]}`}>
                  {conditionLabels[result.overall_condition]}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{result.summary}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{result.defects.length}</div>
                  <div className="text-sm text-gray-500">Дефектов</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {result.defects.filter(d => ['critical', 'high'].includes(d.severity)).length}
                  </div>
                  <div className="text-sm text-gray-500">Критических</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(result.defects.reduce((sum, d) => sum + d.estimated_repair_cost, 0))}
                  </div>
                  <div className="text-sm text-gray-500">На ремонт</div>
                </div>
              </div>
            </div>

            {/* Defects List */}
            {result.defects.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Обнаруженные дефекты</h3>
                <div className="space-y-3">
                  {result.defects.map((defect, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDefect === defect
                          ? severityColors[defect.severity]
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDefect(defect)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {defectTypeLabels[defect.defect_type] || defect.defect_type}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              severityColors[defect.severity]
                            }`}>
                              {severityLabels[defect.severity]}
                            </span>
                            <span className="text-sm text-gray-500">
                              {(defect.confidence * 100).toFixed(0)}% уверенность
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {defect.repair_recommendation}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-indigo-600">
                            {formatCurrency(defect.estimated_repair_cost)}
                          </div>
                          {defect.area_estimate_sqm && (
                            <div className="text-sm text-gray-500">
                              ~{defect.area_estimate_sqm} м²
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      {onSaveDefect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveDefect(defect);
                          }}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Сохранить в проект
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Рекомендации</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* New Analysis Button */}
            <button
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
                setSelectedDefect(null);
              }}
              className="w-full py-3 border-2 border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              Новый анализ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Simulation function for demo
function simulateDiagnosis(): DiagnosisResult {
  const defectTypes = ['crack', 'chip', 'unevenness', 'delamination', 'efflorescence'];
  const severities = ['low', 'medium', 'high', 'critical'];
  
  const numDefects = Math.floor(Math.random() * 4);
  const defects: DetectedDefect[] = [];

  for (let i = 0; i < numDefects; i++) {
    const defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    defects.push({
      defect_type: defectType,
      severity,
      confidence: 0.7 + Math.random() * 0.28,
      bounding_box: {
        x: 0.1 + Math.random() * 0.5,
        y: 0.1 + Math.random() * 0.5,
        width: 0.1 + Math.random() * 0.2,
        height: 0.1 + Math.random() * 0.2,
      },
      area_estimate_sqm: Math.random() * 0.5,
      repair_recommendation: getRepairRecommendation(defectType),
      estimated_repair_cost: getRepairCost(defectType, severity),
    });
  }

  const overall = defects.some(d => d.severity === 'critical') ? 'critical' :
                  defects.some(d => d.severity === 'high') ? 'poor' :
                  defects.length > 2 ? 'fair' : 'good';

  return {
    photo_id: `photo_${Date.now()}`,
    analyzed_at: new Date().toISOString(),
    defects,
    overall_condition: overall,
    summary: defects.length === 0 
      ? 'Дефектов не обнаружено. Поверхность в хорошем состоянии.'
      : `Обнаружено ${defects.length} дефект(ов). Требуется внимание.`,
    recommendations: [
      'Устраните выявленные дефекты до перехода к следующему этапу',
      'Используйте качественные материалы для ремонта',
      'Задокументируйте все работы',
    ],
  };
}

function getRepairRecommendation(type: string): string {
  const recommendations: Record<string, string> = {
    crack: 'Расшить трещину, прогрунтовать, заполнить ремонтной смесью',
    chip: 'Зачистить место скола, прогрунтовать, зашпаклевать',
    unevenness: 'Шлифовка или нанесение выравнивающего слоя',
    delamination: 'Удалить отслоившийся слой, нанести заново',
    efflorescence: 'Обработать специальным составом',
  };
  return recommendations[type] || 'Требуется осмотр специалиста';
}

function getRepairCost(type: string, severity: string): number {
  const baseCosts: Record<string, number> = {
    crack: 300,
    chip: 150,
    unevenness: 200,
    delamination: 800,
    efflorescence: 250,
  };
  const multipliers: Record<string, number> = {
    low: 1,
    medium: 1.3,
    high: 1.6,
    critical: 2,
  };
  return (baseCosts[type] || 200) * (multipliers[severity] || 1);
}

export default PhotoDiagnosis;
