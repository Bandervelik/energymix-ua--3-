'use client';

import React, { useState } from 'react';
import { Activity, Zap, Clock, Calendar } from 'lucide-react';
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

export function Step3Consumption({
  consumption,
  setConsumption
}: {
  consumption: { annual: number, profileType: string },
  setConsumption: React.Dispatch<React.SetStateAction<{ annual: number, profileType: string }>>
}) {
  const getProfileData = () => {
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

  const chartData = getProfileData();
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Профіль споживання</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Вкажіть річне споживання та оберіть типовий графік навантаження для точного розрахунку.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Річне споживання
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={consumption.annual}
                  onChange={(e) => setConsumption(prev => ({ ...prev, annual: Number(e.target.value) }))}
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

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              Тип графіка навантаження
            </h3>
            
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
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col">
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
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
