import React, { useState, useEffect } from 'react';

/**
 * MaterialCalculator Component
 * Калькулятор материалов для штукатурных работ
 */

interface MaterialRequirement {
  material_id: string;
  material_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface CalculationResult {
  input: {
    area_sqm: number;
    plaster_type: string;
    thickness_mm: number;
  };
  requirements: MaterialRequirement[];
  summary: {
    total_materials_cost: number;
    items_count: number;
  };
}

interface MaterialCalculatorProps {
  onCalculate?: (result: CalculationResult) => void;
  onAddToProject?: (requirements: MaterialRequirement[]) => void;
  initialArea?: number;
  apiEndpoint?: string;
}

const plasterTypes = [
  { id: 'leveling', name: 'Выравнивающая', description: 'Основное выравнивание поверхности' },
  { id: 'decorative', name: 'Декоративная', description: 'Декоративное покрытие' },
  { id: 'finish', name: 'Финишная', description: 'Финишная отделка под покраску' },
  { id: 'gypsum', name: 'Гипсовая', description: 'Для внутренних работ' },
  { id: 'cement', name: 'Цементная', description: 'Для влажных помещений' },
];

export const MaterialCalculator: React.FC<MaterialCalculatorProps> = ({
  onCalculate,
  onAddToProject,
  initialArea = 0,
  apiEndpoint = '/api/plaster/materials/calculate',
}) => {
  const [area, setArea] = useState<number>(initialArea);
  const [plasterType, setPlasterType] = useState<string>('leveling');
  const [thickness, setThickness] = useState<number>(10);
  const [includeAll, setIncludeAll] = useState<boolean>(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Quick presets
  const areaPresets = [20, 50, 100, 200, 500];
  const thicknessPresets = [5, 10, 15, 20, 30];

  const handleCalculate = async () => {
    if (area <= 0) {
      setError('Введите площадь больше 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo, simulate API call
      const mockResult = simulateCalculation(area, plasterType, thickness, includeAll);
      setResult(mockResult);
      onCalculate?.(mockResult);
    } catch (err) {
      setError('Ошибка при расчете');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plaster': return '🏗️';
      case 'primer': return '🎨';
      case 'mesh': return '🕸️';
      case 'beacon': return '📍';
      default: return '📦';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'plaster': return 'Штукатурка';
      case 'primer': return 'Грунтовка';
      case 'mesh': return 'Сетка';
      case 'beacon': return 'Маяки';
      default: return category;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Калькулятор материалов</h2>
        <p className="text-indigo-100 text-sm">Рассчитайте необходимое количество материалов</p>
      </div>

      {/* Input Form */}
      <div className="p-6 space-y-6">
        {/* Area Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Площадь (м²)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={area || ''}
              onChange={(e) => setArea(Number(e.target.value))}
              placeholder="Введите площадь"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
              min="1"
              max="10000"
            />
            <span className="flex items-center px-4 bg-gray-100 rounded-lg text-gray-600">м²</span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 mt-2">
            {areaPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setArea(preset)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  area === preset
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Plaster Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип штукатурки
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {plasterTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setPlasterType(type.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  plasterType === type.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800">{type.name}</div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Thickness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Толщина слоя (мм)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              min="2"
              max="50"
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-16 text-center font-bold text-indigo-600 text-lg">{thickness} мм</span>
          </div>
          <div className="flex justify-between mt-1">
            {thicknessPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setThickness(preset)}
                className={`text-xs ${
                  thickness === preset ? 'text-indigo-600 font-bold' : 'text-gray-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Include All Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeAll"
            checked={includeAll}
            onChange={(e) => setIncludeAll(e.target.checked)}
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor="includeAll" className="text-sm text-gray-700">
            Включить инструменты и расходники
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={loading || area <= 0}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Расчет...
            </span>
          ) : (
            'Рассчитать'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="border-t bg-gray-50 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Результат расчета</h3>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Площадь</div>
              <div className="text-xl font-bold text-gray-800">{result.input.area_sqm} м²</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Толщина</div>
              <div className="text-xl font-bold text-gray-800">{result.input.thickness_mm} мм</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Итого</div>
              <div className="text-xl font-bold text-indigo-600">
                {formatCurrency(result.summary.total_materials_cost)}
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="space-y-2">
            {result.requirements.map((item, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <div className="font-medium text-gray-800">{item.material_name}</div>
                    <div className="text-sm text-gray-500">
                      {getCategoryName(item.category)} • {formatCurrency(item.unit_price)}/{item.unit}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">
                    {item.quantity} {item.unit}
                  </div>
                  <div className="text-sm text-indigo-600 font-medium">
                    {formatCurrency(item.total_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add to Project Button */}
          {onAddToProject && (
            <button
              onClick={() => onAddToProject(result.requirements)}
              className="w-full mt-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Добавить в проект
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Simulation function for demo (replace with actual API call in production)
function simulateCalculation(
  area: number,
  plasterType: string,
  thickness: number,
  includeAll: boolean
): CalculationResult {
  const basePrices: Record<string, number> = {
    leveling: 450,
    decorative: 1200,
    finish: 550,
    gypsum: 420,
    cement: 380,
  };

  const consumptionRates: Record<string, number> = {
    leveling: 0.85,
    decorative: 0.6,
    finish: 0.5,
    gypsum: 0.9,
    cement: 1.2,
  };

  const requirements: MaterialRequirement[] = [];
  
  // Plaster
  const plasterQty = Math.ceil(area * consumptionRates[plasterType] * (thickness / 10) / 30);
  requirements.push({
    material_id: `plaster_${plasterType}`,
    material_name: `Штукатурка ${plasterType === 'leveling' ? 'выравнивающая' : plasterType === 'gypsum' ? 'гипсовая' : plasterType === 'cement' ? 'цементная' : plasterType === 'decorative' ? 'декоративная' : 'финишная'} 30кг`,
    category: 'plaster',
    quantity: plasterQty,
    unit: 'мешок',
    unit_price: basePrices[plasterType],
    total_price: plasterQty * basePrices[plasterType],
  });

  // Primer
  const primerQty = Math.ceil(area / 50);
  requirements.push({
    material_id: 'primer_deep',
    material_name: 'Грунтовка глубокого проникновения 10л',
    category: 'primer',
    quantity: primerQty,
    unit: 'канистра',
    unit_price: 450,
    total_price: primerQty * 450,
  });

  // Mesh (for complex types)
  if (['leveling', 'cement'].includes(plasterType)) {
    const meshQty = Math.ceil(area / 50);
    requirements.push({
      material_id: 'mesh_fiberglass',
      material_name: 'Сетка армирующая 50м',
      category: 'mesh',
      quantity: meshQty,
      unit: 'рулон',
      unit_price: 950,
      total_price: meshQty * 950,
    });
  }

  // Beacons
  if (['leveling', 'gypsum', 'cement'].includes(plasterType)) {
    const beaconQty = Math.ceil(area * 0.5);
    requirements.push({
      material_id: 'beacon_10mm',
      material_name: 'Маяк штукатурный 10мм 3м',
      category: 'beacon',
      quantity: beaconQty,
      unit: 'шт',
      unit_price: 48,
      total_price: beaconQty * 48,
    });
  }

  const totalCost = requirements.reduce((sum, r) => sum + r.total_price, 0);

  return {
    input: {
      area_sqm: area,
      plaster_type: plasterType,
      thickness_mm: thickness,
    },
    requirements,
    summary: {
      total_materials_cost: totalCost,
      items_count: requirements.length,
    },
  };
}

export default MaterialCalculator;
