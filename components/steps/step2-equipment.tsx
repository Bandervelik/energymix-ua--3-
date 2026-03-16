'use client';

import React, { useState } from 'react';
import { Sun, Wind, Droplet, Battery, Info, Settings } from 'lucide-react';
import { SystemConfig } from '../dashboard';

export function Step2Equipment({ 
  config, 
  setConfig,
  equipment, 
  setEquipment 
}: { 
  config: SystemConfig,
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>,
  equipment: { 
    solar: number, solarTilt: number, solarAzimuth: number, solarLosses: number,
    wind: number, windHubHeight: number,
    hydro: number, hydroHead: number, hydroFlow: number,
    battery: number, batteryDod: number
  },
  setEquipment: React.Dispatch<React.SetStateAction<{ 
    solar: number, solarTilt: number, solarAzimuth: number, solarLosses: number,
    wind: number, windHubHeight: number,
    hydro: number, hydroHead: number, hydroFlow: number,
    battery: number, batteryDod: number
  }>>
}) {
  const toggleConfig = (key: keyof SystemConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Конфігурація обладнання</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Оберіть джерела енергії та налаштуйте їх параметри.
          </p>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${showAdvanced ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAdvanced ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pro Режим</span>
        </label>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
          Джерела енергії
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ConfigToggle 
            active={config.solar} 
            onClick={() => toggleConfig('solar')} 
            icon={Sun} 
            label="Сонячні панелі" 
            color="text-amber-500"
            bgActive="bg-amber-500/10 border-amber-500/50"
          />
          <ConfigToggle 
            active={config.wind} 
            onClick={() => toggleConfig('wind')} 
            icon={Wind} 
            label="Вітрові турбіни" 
            color="text-blue-500"
            bgActive="bg-blue-500/10 border-blue-500/50"
          />
          <ConfigToggle 
            active={config.hydro} 
            onClick={() => toggleConfig('hydro')} 
            icon={Droplet} 
            label="Малі ГЕС" 
            color="text-sky-500"
            bgActive="bg-sky-500/10 border-sky-500/50"
          />
          <ConfigToggle 
            active={config.battery} 
            onClick={() => toggleConfig('battery')} 
            icon={Battery} 
            label="Акумулятори" 
            color="text-emerald-500"
            bgActive="bg-emerald-500/10 border-emerald-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.solar && (
          <ConfigCard 
            title="Сонячні панелі" 
            icon={Sun} 
            color="amber" 
            value={equipment.solar} 
            setValue={(v) => setEquipment(prev => ({ ...prev, solar: v }))} 
            unit="кВт" 
            max={100}
            description="Загальна встановлена потужність фотоелектричної системи."
            showAdvanced={showAdvanced}
            advancedFields={[
              { label: 'Кут нахилу (°)', value: equipment.solarTilt, onChange: (v) => setEquipment(prev => ({ ...prev, solarTilt: v })), min: 0, max: 90 },
              { label: 'Азимут (°)', value: equipment.solarAzimuth, onChange: (v) => setEquipment(prev => ({ ...prev, solarAzimuth: v })), min: 0, max: 360 },
              { label: 'Втрати системи (%)', value: equipment.solarLosses, onChange: (v) => setEquipment(prev => ({ ...prev, solarLosses: v })), min: 0, max: 50 },
            ]}
          />
        )}
        
        {config.wind && (
          <ConfigCard 
            title="Вітрові турбіни" 
            icon={Wind} 
            color="blue" 
            value={equipment.wind} 
            setValue={(v) => setEquipment(prev => ({ ...prev, wind: v }))} 
            unit="кВт" 
            max={50}
            description="Номінальна потужність вітрогенератора."
            showAdvanced={showAdvanced}
            advancedFields={[
              { label: 'Висота щогли (м)', value: equipment.windHubHeight, onChange: (v) => setEquipment(prev => ({ ...prev, windHubHeight: v })), min: 10, max: 100 },
            ]}
          />
        )}
        
        {config.hydro && (
          <ConfigCard 
            title="Мала ГЕС" 
            icon={Droplet} 
            color="sky" 
            value={equipment.hydro} 
            setValue={(v) => setEquipment(prev => ({ ...prev, hydro: v }))} 
            unit="кВт" 
            max={200}
            description="Очікувана потужність гідротурбіни."
            showAdvanced={showAdvanced}
            advancedFields={[
              { label: 'Перепад висот (м)', value: equipment.hydroHead, onChange: (v) => setEquipment(prev => ({ ...prev, hydroHead: v })), min: 1, max: 100 },
              { label: 'Витрата води (л/с)', value: equipment.hydroFlow, onChange: (v) => setEquipment(prev => ({ ...prev, hydroFlow: v })), min: 1, max: 1000 },
            ]}
          />
        )}
        
        {config.battery && (
          <ConfigCard 
            title="Акумуляторна система" 
            icon={Battery} 
            color="emerald" 
            value={equipment.battery} 
            setValue={(v) => setEquipment(prev => ({ ...prev, battery: v }))} 
            unit="кВт·год" 
            max={100}
            description="Корисна ємність системи зберігання енергії (BESS)."
            showAdvanced={showAdvanced}
            advancedFields={[
              { label: 'Глибина розряду (%)', value: equipment.batteryDod, onChange: (v) => setEquipment(prev => ({ ...prev, batteryDod: v })), min: 10, max: 100 },
            ]}
          />
        )}
        
        {!config.solar && !config.wind && !config.hydro && !config.battery && (
          <div className="col-span-full p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Будь ласка, оберіть хоча б одне джерело енергії вище.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigToggle({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  color,
  bgActive 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  color: string;
  bgActive: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
        active 
          ? bgActive
          : 'border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${active ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-white dark:bg-slate-800'}`}>
          <Icon className={`w-5 h-5 ${active ? color : 'text-slate-400 dark:text-slate-500'}`} />
        </div>
        <span className={`font-medium ${active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
          {label}
        </span>
      </div>
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        active ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'
      }`}>
        {active && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
    </button>
  );
}

function ConfigCard({ 
  title, 
  icon: Icon, 
  color, 
  value, 
  setValue, 
  unit, 
  max,
  description,
  showAdvanced = false,
  advancedFields = []
}: { 
  title: string; 
  icon: any; 
  color: 'amber' | 'blue' | 'sky' | 'emerald'; 
  value: number; 
  setValue: (v: number) => void; 
  unit: string; 
  max: number;
  description: string;
  showAdvanced?: boolean;
  advancedFields?: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }[];
}) {
  const colorMap = {
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 focus:ring-amber-500',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 focus:ring-blue-500',
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20 focus:ring-sky-500',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 focus:ring-emerald-500',
  };
  
  const sliderColorMap = {
    amber: 'accent-amber-500',
    blue: 'accent-blue-500',
    sky: 'accent-sky-500',
    emerald: 'accent-emerald-500',
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${colorMap[color].split(' ')[1]}`}>
            <Icon className={`w-6 h-6 ${colorMap[color].split(' ')[0]}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Налаштування потужності</p>
          </div>
        </div>
        <div className="group relative">
          <Info className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
          <div className="absolute right-0 w-48 p-2 mt-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {description}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Потужність
          </label>
          <div className="flex items-baseline gap-1">
            <input 
              type="number" 
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-20 text-right font-mono text-xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-white pb-1"
            />
            <span className="text-slate-500 font-medium">{unit}</span>
          </div>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max={max} 
          step="0.5"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${sliderColorMap[color]}`}
        />
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>0 {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Модель / Тип (Опціонально)
        </label>
        <select className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
          <option value="">Стандартна модель (Усереднені дані)</option>
          <option value="premium">Преміум (Висока ефективність)</option>
          <option value="budget">Бюджетна (Оптимальна ціна)</option>
        </select>
      </div>

      {showAdvanced && advancedFields.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            Розширені параметри
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advancedFields.map((field, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {field.label}
                </label>
                <input 
                  type="number" 
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  min={field.min}
                  max={field.max}
                  className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
