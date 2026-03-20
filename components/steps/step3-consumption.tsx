'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Activity, Zap, Clock, Calendar, MousePointer2, Info, Eraser } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const residentialProfile = [
  { time: '00:00', value: 0.5 },
  { time: '04:00', value: 0.4 },
  { time: '08:00', value: 2.5 },
  { time: '12:00', value: 1.8 },
  { time: '16:00', value: 2.0 },
  { time: '20:00', value: 3.5 },
  { time: '23:59', value: 1.0 },
];

const commercialProfile = [
  { time: '00:00', value: 0.8 },
  { time: '04:00', value: 0.8 },
  { time: '08:00', value: 4.5 },
  { time: '12:00', value: 5.5 },
  { time: '16:00', value: 5.0 },
  { time: '20:00', value: 1.5 },
  { time: '23:59', value: 0.8 },
];

const industrialProfile = [
  { time: '00:00', value: 3.0 },
  { time: '04:00', value: 3.0 },
  { time: '08:00', value: 6.0 },
  { time: '12:00', value: 6.5 },
  { time: '16:00', value: 6.0 },
  { time: '20:00', value: 4.0 },
  { time: '23:59', value: 3.0 },
];

function InteractiveCustomChart({ 
  data, 
  onChange 
}: { 
  data: number[], 
  onChange: (index: number, value: number) => void 
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 800;
  const height = 300;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(5, ...data) * 1.2;

  const getCoords = (index: number, value: number) => {
    const x = margin.left + (index / 23) * chartWidth;
    const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - CTM.e) / CTM.a;
    const y = (clientY - CTM.f) / CTM.d;

    // Find closest index
    const relativeX = x - margin.left;
    const index = Math.round((relativeX / chartWidth) * 23);
    
    if (index >= 0 && index < 24) {
      const relativeY = chartHeight - (y - margin.top);
      const value = Math.max(0, (relativeY / chartHeight) * maxValue);
      onChange(index, Number(value.toFixed(2)));
      setDragIndex(index);
    }
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setDragIndex(null);
  };

  const points = data.map((v, i) => getCoords(i, v));
  const pathData = points.reduce((acc, p, i) => 
    acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
  
  const areaData = pathData + ` L ${points[23].x} ${margin.top + chartHeight} L ${points[0].x} ${margin.top + chartHeight} Z`;

  return (
    <div className="relative w-full h-full select-none touch-none">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
      >
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line 
            key={p}
            x1={margin.left}
            y1={margin.top + chartHeight * p}
            x2={margin.left + chartWidth}
            y2={margin.top + chartHeight * p}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeDasharray="4 4"
          />
        ))}

        {/* X-Axis Labels */}
        {[0, 4, 8, 12, 16, 20, 23].map((i) => {
          const { x } = getCoords(i, 0);
          return (
            <text 
              key={i}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="text-[12px] fill-slate-500 font-medium"
            >
              {i.toString().padStart(2, '0')}:00
            </text>
          );
        })}

        {/* Y-Axis Labels */}
        {[0, 0.5, 1].map((p) => {
          const val = (maxValue * (1 - p)).toFixed(1);
          return (
            <text 
              key={p}
              x={margin.left - 10}
              y={margin.top + chartHeight * p + 4}
              textAnchor="end"
              className="text-[12px] fill-slate-500 font-medium"
            >
              {val}
            </text>
          );
        })}

        {/* Area */}
        <path 
          d={areaData}
          className="fill-emerald-500/20"
        />

        {/* Line */}
        <path 
          d={pathData}
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points/Handles */}
        {points.map((p, i) => (
          <circle 
            key={i}
            cx={p.x}
            cy={p.y}
            r={dragIndex === i ? 6 : 4}
            className={`${dragIndex === i ? 'fill-emerald-400' : 'fill-emerald-500'} transition-all`}
          />
        ))}

        {/* Hover/Drag Indicator */}
        {dragIndex !== null && (
          <g>
            <rect 
              x={points[dragIndex].x - 30}
              y={points[dragIndex].y - 35}
              width="60"
              height="25"
              rx="4"
              className="fill-slate-900 dark:fill-slate-100"
            />
            <text 
              x={points[dragIndex].x}
              y={points[dragIndex].y - 18}
              textAnchor="middle"
              className="text-[12px] font-bold fill-white dark:fill-slate-900"
            >
              {data[dragIndex]} кВт
            </text>
          </g>
        )}
      </svg>
      
      <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
        <MousePointer2 className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Тягніть лінію для зміни</span>
      </div>
    </div>
  );
}

export function Step3Consumption({
  consumption,
  setConsumption
}: {
  consumption: { annual: number, profileType: string, customProfile: number[] },
  setConsumption: React.Dispatch<React.SetStateAction<{ annual: number, profileType: string, customProfile: number[] }>>
}) {
  const getProfileData = () => {
    if (consumption.profileType === 'custom') {
      return consumption.customProfile.map((val, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        value: Number(val.toFixed(2))
      }));
    }

    // Scale the profile based on annual consumption
    // This is a simplified scaling for visualization purposes
    const scaleFactor = consumption.annual / 12000; 
    
    let baseProfile = residentialProfile;
    if (consumption.profileType === 'commercial') baseProfile = commercialProfile;
    if (consumption.profileType === 'industrial') baseProfile = industrialProfile;

    return baseProfile.map(point => ({
      ...point,
      value: Number((point.value * scaleFactor).toFixed(2))
    }));
  };

  const handleCustomProfileChange = (index: number, value: number) => {
    const newProfile = [...consumption.customProfile];
    newProfile[index] = value;
    const newAnnual = Math.round(newProfile.reduce((a, b) => a + b, 0) * 365);
    setConsumption(prev => ({ ...prev, customProfile: newProfile, annual: newAnnual }));
  };

  const chartData = getProfileData();
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Профіль споживання</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Вкажіть річне споживання та оберіть типовий графік навантаження або створіть власний.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl hover:z-20 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Річне споживання
              </h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-64 p-3 text-xs leading-relaxed text-white bg-slate-900 dark:bg-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 dark:border-slate-600">
                  Загальна кількість електроенергії, яку ви споживаєте за рік. Можна знайти в квитанціях за останні 12 місяців.
                  <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={consumption.annual}
                  onChange={(e) => {
                    const newAnnual = Number(e.target.value);
                    if (consumption.profileType === 'custom') {
                      // Scale custom profile to match new annual
                      const scale = newAnnual / consumption.annual;
                      const newProfile = consumption.customProfile.map(v => v * scale);
                      setConsumption(prev => ({ ...prev, annual: newAnnual, customProfile: newProfile }));
                    } else {
                      setConsumption(prev => ({ ...prev, annual: newAnnual }));
                    }
                  }}
                  className="block w-full pl-4 pr-16 py-3 text-xl font-bold font-mono border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-medium">кВт·год</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Приблизно {(consumption.annual / 12).toFixed(0)} кВт·год на місяць
              </p>
            </div>
          </div>

          <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl hover:z-20 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Тип графіка навантаження
              </h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-64 p-3 text-xs leading-relaxed text-white bg-slate-900 dark:bg-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 dark:border-slate-600">
                  Визначає, як саме ви використовуєте енергію протягом доби. Це критично для розрахунку ємності акумуляторів та самоспоживання.
                  <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                consumption.profileType === 'residential' 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="profile" 
                  value="residential" 
                  checked={consumption.profileType === 'residential'}
                  onChange={() => setConsumption(prev => ({ ...prev, profileType: 'residential' }))}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Побутовий (Житловий)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Піки вранці та ввечері.</p>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                consumption.profileType === 'commercial' 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="profile" 
                  value="commercial" 
                  checked={consumption.profileType === 'commercial'}
                  onChange={() => setConsumption(prev => ({ ...prev, profileType: 'commercial' }))}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Комерційний (Офіс)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Пік вдень (9:00 - 18:00).</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                consumption.profileType === 'industrial' 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="profile" 
                  value="industrial" 
                  checked={consumption.profileType === 'industrial'}
                  onChange={() => setConsumption(prev => ({ ...prev, profileType: 'industrial' }))}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Промисловий (Виробництво)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Рівномірне навантаження або змінні піки.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                consumption.profileType === 'custom' 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30'
              }`}>
                <input 
                  type="radio" 
                  name="profile" 
                  value="custom" 
                  checked={consumption.profileType === 'custom'}
                  onChange={() => setConsumption(prev => ({ ...prev, profileType: 'custom' }))}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Створити власноруч</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Вкажіть споживання для кожної години.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Chart & Custom Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Добовий графік споживання (Типовий день)
              </h3>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Потужність (кВт)
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              {consumption.profileType === 'custom' ? (
                <InteractiveCustomChart 
                  data={consumption.customProfile} 
                  onChange={handleCustomProfileChange} 
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} кВт`, 'Споживання']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="кВт"
                      stroke="#10B981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {consumption.profileType === 'custom' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Ручне введення навантаження (кВт)
                </h3>
                <button 
                  onClick={() => setConsumption(prev => ({ ...prev, customProfile: Array(24).fill(0) }))}
                  className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Стерти все
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {consumption.customProfile.map((val, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block text-center">
                      {i.toString().padStart(2, '0')}:00
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={val}
                      onChange={(e) => handleCustomProfileChange(i, Number(e.target.value))}
                      className="w-full p-2 text-center text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
