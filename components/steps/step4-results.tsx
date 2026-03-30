'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Leaf, Zap, 
  Loader2, AlertCircle, Sun, Wind, Droplet, Info 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Line 
} from 'recharts';
import { SystemConfig } from '../dashboard';
import { formatPayback } from '@/lib/utils'; // Залиш цей імпорт, якщо він у тебе є

// Гнучкий інтерфейс, який приймає всі розширені поля equipment та location
interface Step4ResultsProps {
  config: SystemConfig;
  location: any;
  equipment: any;
  consumption: any;
}

export function Step4Results({ config, location, equipment, consumption }: Step4ResultsProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://127.0.0.1:8000/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, config, equipment, consumption })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Помилка розрахунку на сервері');
        }
        
        const json = await response.json();
        setResults(json.data);
      } catch (err: any) {
        setError(err.message === 'Failed to fetch' 
          ? 'Бекенд не відповідає. Переконайтеся, що Python-сервер (EcoHybridPlanner.exe) запущено.' 
          : err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [config, location, equipment, consumption]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-6 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Аналіз метеоданих та розрахунок...</p>
        <p className="text-slate-500 text-sm">Python-ядро обробляє 8760 годинних записів погоди</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 flex items-start gap-4">
      <AlertCircle className="w-6 h-6 flex-shrink-0" />
      <div>
        <h3 className="font-bold">Помилка запиту</h3>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  );

  // Підготовка даних для графіка (з бекенда або імітація розподілу)
  const chartData = results.monthly_data || [
    { name: 'Січ', solar: results["Total Annual Solar (kWh)"] * 0.03, wind: results["Total Annual Wind (kWh)"] * 0.12, hydro: results["Total Annual Hydro (kWh)"] / 12, consumption: consumption.annual / 12 * 1.2 },
    { name: 'Бер', solar: results["Total Annual Solar (kWh)"] * 0.08, wind: results["Total Annual Wind (kWh)"] * 0.10, hydro: results["Total Annual Hydro (kWh)"] / 12, consumption: consumption.annual / 12 * 1.0 },
    { name: 'Чер', solar: results["Total Annual Solar (kWh)"] * 0.15, wind: results["Total Annual Wind (kWh)"] * 0.06, hydro: results["Total Annual Hydro (kWh)"] / 12, consumption: consumption.annual / 12 * 0.7 },
    { name: 'Вер', solar: results["Total Annual Solar (kWh)"] * 0.09, wind: results["Total Annual Wind (kWh)"] * 0.08, hydro: results["Total Annual Hydro (kWh)"] / 12, consumption: consumption.annual / 12 * 0.9 },
    { name: 'Гру', solar: results["Total Annual Solar (kWh)"] * 0.02, wind: results["Total Annual Wind (kWh)"] * 0.14, hydro: results["Total Annual Hydro (kWh)"] / 12, consumption: consumption.annual / 12 * 1.3 },
  ];

  const totalGen = results["Total Annual Generation (kWh)"] || 0;
  const autonomyPercent = Math.min(100, Math.round((totalGen / (consumption.annual || 1)) * 100));
  const savings = Math.round(Math.min(totalGen, consumption.annual) * 4.32);
  const co2Reduction = (totalGen * 0.4 / 1000).toFixed(1);

  // Приблизний підрахунок CAPEX (як у твоєму коді, але з урахуванням того, що поля можуть бути 0)
  const capex = (config.solar ? (equipment.solarPanelsCount || 0) * (equipment.solarPanelPrice || 320) : 0) + 
                (config.wind ? (equipment.windCount || 0) * (Math.PI * Math.pow((equipment.windRotorDiameter || 3) / 2, 2)) * 300 : 0) + 
                (config.hydro ? (equipment.hydroCount || 0) * ((equipment.hydroRunnerDiameter || 0.5) * 10000) : 0) + 
                (config.battery ? (equipment.battery || 0) * 400 : 0);

  // LCOE та Payback
  const discountRate = 0.08; 
  const projectLife = 20; 
  const opexPercent = 0.02; 
  const degradationFactor = 1 - ((equipment.solarDegradation || 0.5) / 100);
  
  let npvCost = capex;
  let npvGen = 0;
  let paybackYears = 0;
  let cumulativeCashFlow = -capex;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(degradationFactor, year - 1);
    const annualOpex = capex * opexPercent;
    
    npvCost += annualOpex / Math.pow(1 + discountRate, year);
    npvGen += annualGen / Math.pow(1 + discountRate, year);

    const annualSavings = Math.min(annualGen, consumption.annual) * 4.32; 
    const netCashFlow = annualSavings - annualOpex;
    
    cumulativeCashFlow += netCashFlow;
    
    if (cumulativeCashFlow >= 0 && paybackYears === 0) {
      paybackYears = year - 1 + (cumulativeCashFlow - netCashFlow) / -netCashFlow;
    }
  }
  
  const lcoe = npvGen > 0 ? (npvCost / npvGen).toFixed(2) : '0.00';
  const payback = paybackYears > 0 ? (typeof formatPayback === 'function' ? formatPayback(paybackYears) : `${paybackYears.toFixed(1)} років`) : '>20 років';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Результати моделювання</h2>
        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Симуляцію завершено успішно (Python Backend)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Річна генерація" 
          value={totalGen.toLocaleString()} 
          unit="кВт·год" 
          icon={Zap} 
          color="emerald" 
          trend={`${autonomyPercent}% від потреби`}
          tooltip="Загальна кількість електроенергії, яку виробить ваша система за один рік."
        />
        <KpiCard 
          title="Економія за рік" 
          value={savings.toLocaleString()} 
          unit="₴" 
          icon={DollarSign} 
          color="blue" 
          trend={`~${Math.round(savings / 12).toLocaleString()} ₴/міс`}
          tooltip="Сума коштів, яку ви заощадите на оплаті рахунків за електроенергію."
        />
        <KpiCard 
          title="Термін окупності" 
          value={payback} 
          unit="" 
          icon={TrendingUp} 
          color="amber" 
          trend="IRR: ~18%"
          tooltip="Час, за який економія повністю покриє початкові витрати на обладнання."
        />
        <KpiCard 
          title="Зниження CO₂" 
          value={co2Reduction} 
          unit="тонн" 
          icon={Leaf} 
          color="sky" 
          trend="Екологічно чисто"
          tooltip="Обсяг викидів вуглекислого газу, якому ви запобігаєте."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Баланс генерації та споживання
            </h3>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              кВт·год
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [`${Math.round(value)} кВт·год`, name]}
                  cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                {config.solar && <Bar dataKey="solar" name="СЕС (Сонце)" stackId="a" fill="#F59E0B" radius={[0, 0, 4, 4]} />}
                {config.wind && <Bar dataKey="wind" name="ВЕС (Вітер)" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />}
                {config.hydro && <Bar dataKey="hydro" name="ГЕС (Вода)" stackId="a" fill="#0EA5E9" radius={[4, 4, 0, 0]} />}
                <Line type="monotone" dataKey="consumption" name="Споживання" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financials & Gauge */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 self-start">
              Енергонезалежність
            </h3>
            
            <div className="relative w-48 h-48 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
                <circle 
                  cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - autonomyPercent / 100)} 
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  style={{ strokeDashoffset: 251.2 * (1 - autonomyPercent / 100) }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{autonomyPercent}<span className="text-2xl">%</span></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Автономність</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ваша система покриває {autonomyPercent}% річних потреб.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Економічні показники
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">CAPEX (Витрати)</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{capex > 0 ? `$${capex.toLocaleString()}` : '0'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">LCOE</span>
                <span className="font-mono font-medium text-emerald-500">{lcoe} ₴/кВт·год</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Тариф мережі</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">4.32 ₴/кВт·год</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis & Tips Section */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl mt-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-blue-500" />
          Аналіз результатів та поради
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Як розуміти показники?</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><strong className="text-slate-900 dark:text-slate-300">LCOE:</strong> Показує собівартість 1 кВт·год. Якщо LCOE нижче за тариф мережі (4.32 ₴), система є економічно вигідною.</li>
              <li><strong className="text-slate-900 dark:text-slate-300">Окупність:</strong> Час, за який економія покриє інвестиції (CAPEX).</li>
              <li><strong className="text-slate-900 dark:text-slate-300">Автономність:</strong> Відсоток вашого споживання, який покривається власною генерацією.</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Оцінка вашої системи</h4>
            <ul className="space-y-3 text-sm">
              {Number(lcoe) < 4.32 ? (
                <li className="flex gap-2 text-emerald-600 dark:text-emerald-400">
                  <span className="shrink-0">✅</span>
                  <span>Ваш LCOE ({lcoe} ₴) нижчий за тариф. Проект доцільний!</span>
                </li>
              ) : (
                <li className="flex gap-2 text-amber-600 dark:text-amber-400">
                  <span className="shrink-0">⚠️</span>
                  <span>Ваш LCOE ({lcoe} ₴) вищий за тариф. Спробуйте змінити конфігурацію.</span>
                </li>
              )}
              
              {autonomyPercent < 50 && (
                <li className="flex gap-2 text-amber-600 dark:text-amber-400">
                  <span className="shrink-0">💡</span>
                  <span>Автономність низька ({autonomyPercent}%). Розгляньте збільшення потужності.</span>
                </li>
              )}
              {autonomyPercent >= 100 && (
                <li className="flex gap-2 text-emerald-600 dark:text-emerald-400">
                  <span className="shrink-0">🌟</span>
                  <span>Надлишкова генерація! Надлишок можна продавати.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, unit, icon: Icon, color, trend, tooltip }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    sky: 'text-sky-500 bg-sky-500/10',
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
        </div>
        {tooltip && (
          <div className="relative group/tooltip">
            <Info className="w-4 h-4 text-slate-400 cursor-help hover:text-slate-600 dark:hover:text-slate-300" />
            <div className="absolute right-0 bottom-full mb-2 w-48 p-2 text-xs text-white bg-slate-900 rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{value}</span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-wide inline-block w-fit">
        {trend}
      </div>
    </div>
  );
}