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
    solarPanelPreset: string, solarPanelPower: number, solarPanelPrice: number,
    solarPanelLength: number, solarPanelWidth: number, solarPanelsCount: number, solarCellType: string, solarTempCoeffPmax: number, solarDegradation: number,
    windCount: number, windRotorDiameter: number, windHubHeight: number, windTsr: number, windCp: number,
    windBladesCount: number, windBladePitch: number,
    hydroCount: number, hydroTurbineType: string, hydroRunnerDiameter: number, hydroPenstockLength: number, hydroPenstockDiameter: number, hydroPenstockMaterial: string, hydroResidualFlow: number, hydroHead: number, hydroFlow: number,
    batteryModulesCount: number, batteryModuleCapacity: number, battery: number, batteryDod: number
  },
  setEquipment: React.Dispatch<React.SetStateAction<{ 
    solar: number, solarTilt: number, solarAzimuth: number, solarLosses: number,
    solarPanelPreset: string, solarPanelPower: number, solarPanelPrice: number,
    solarPanelLength: number, solarPanelWidth: number, solarPanelsCount: number, solarCellType: string, solarTempCoeffPmax: number, solarDegradation: number,
    windCount: number, windRotorDiameter: number, windHubHeight: number, windTsr: number, windCp: number,
    windBladesCount: number, windBladePitch: number,
    hydroCount: number, hydroTurbineType: string, hydroRunnerDiameter: number, hydroPenstockLength: number, hydroPenstockDiameter: number, hydroPenstockMaterial: string, hydroResidualFlow: number, hydroHead: number, hydroFlow: number,
    batteryModulesCount: number, batteryModuleCapacity: number, battery: number, batteryDod: number
  }>>
}) {
  const toggleConfig = (key: keyof SystemConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const capex = (config.solar ? equipment.solarPanelsCount * (equipment.solarPanelPrice || 320) : 0) + 
                (config.wind ? equipment.windCount * (Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2)) * 300 : 0) +
                (config.hydro ? equipment.hydroCount * (equipment.hydroRunnerDiameter * 10000) : 0) +
                (config.battery ? equipment.battery * 400 : 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Конфігурація обладнання</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Оберіть джерела енергії та налаштуйте їх параметри.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-end min-w-[200px]">
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Орієнтовна вартість</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            ${Math.round(capex).toLocaleString()}
          </span>
        </div>
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
            value={equipment.solarPanelsCount} 
            setValue={(v) => setEquipment(prev => ({ ...prev, solarPanelsCount: v, solar: (v * prev.solarPanelPower) / 1000 }))} 
            unit="шт" 
            max={200}
            step={1}
            mainLabel="Кількість панелей"
            description="Загальна кількість сонячних панелей у вашій системі. Загальна потужність розраховується автоматично."
            itemCost={equipment.solarPanelPrice || 320}
            totalCost={equipment.solarPanelsCount * (equipment.solarPanelPrice || 320)}
            parameters={[
              { label: 'Кут нахилу (°)', value: equipment.solarTilt, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarTilt: v })), min: 0, max: 90, helpText: 'Оптимальний кут для України 30-35°. Можна знайти в проектній документації або виміряти кутоміром.' },
              { label: 'Азимут (°)', value: equipment.solarAzimuth, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarAzimuth: v })), min: 0, max: 360, helpText: '180° - це чистий південь. 90° - схід, 270° - захід. Використовуйте компас у смартфоні.' },
              { label: 'Втрати системи (%)', value: equipment.solarLosses, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarLosses: v })), min: 0, max: 50, helpText: 'Включають втрати в інверторі, кабелях та від пилу. Типове значення 14-18%.' },
            ]}
            advancedFields={[
              ...(equipment.solarPanelPreset === 'custom' ? [
                { label: 'Ціна панелі ($)', value: equipment.solarPanelPrice || 320, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarPanelPrice: v })), min: 10, max: 2000, step: 1, helpText: 'Вартість однієї сонячної панелі.' },
                { label: 'Потужність панелі (Вт)', value: equipment.solarPanelPower, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarPanelPower: v, solar: (prev.solarPanelsCount * v) / 1000 })), min: 100, max: 1000, step: 5, helpText: 'Номінальна потужність однієї панелі.' },
                { label: 'Довжина модуля (мм)', value: equipment.solarPanelLength, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarPanelLength: v })), min: 500, max: 3000, step: 10, helpText: 'Розміри однієї панелі в міліметрах. Вказані в паспорті (Datasheet) панелі.' },
                { label: 'Ширина модуля (мм)', value: equipment.solarPanelWidth, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarPanelWidth: v })), min: 500, max: 2000, step: 10, helpText: 'Розміри однієї панелі в міліметрах. Вказані в паспорті (Datasheet) панелі.' },
                { label: 'Тип комірки', value: equipment.solarCellType, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarCellType: v })), type: 'select' as 'select', options: [{value: 'mono', label: 'Монокристалічні'}, {value: 'poly', label: 'Полікристалічні'}, {value: 'thin-film', label: 'Тонкоплівкові'}], helpText: 'Моно- або полікристалічні. Вказано на етикетці панелі.' },
                { label: 'Темп. коефіцієнт (%/°C)', value: equipment.solarTempCoeffPmax, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarTempCoeffPmax: v })), min: -1, max: 0, step: 0.01, helpText: 'Втрата потужності при нагріванні. Типово -0.3% до -0.5% на градус. Вказано в паспорті.' },
                { label: 'Деградація (%/рік)', value: equipment.solarDegradation, onChange: (v: any) => setEquipment(prev => ({ ...prev, solarDegradation: v })), min: 0, max: 5, step: 0.1, helpText: 'Щорічне зниження ефективності. Типово 0.5% на рік для якісних панелей.' },
              ] : [])
            ]}
          >
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between mt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Модель панелі</label>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                  Загальна потужність: {equipment.solar.toFixed(1)} кВт
                </span>
              </div>
              <select
                value={equipment.solarPanelPreset}
                onChange={(e) => {
                  const preset = e.target.value;
                  if (preset === 'standard-400w') {
                    setEquipment(prev => ({ ...prev, solarPanelPreset: preset, solarPanelPower: 400, solarPanelPrice: 320, solarPanelLength: 1700, solarPanelWidth: 1100, solarCellType: 'mono', solarTempCoeffPmax: -0.35, solarDegradation: 0.5, solar: (prev.solarPanelsCount * 400) / 1000 }));
                  } else if (preset === 'premium-550w') {
                    setEquipment(prev => ({ ...prev, solarPanelPreset: preset, solarPanelPower: 550, solarPanelPrice: 440, solarPanelLength: 2200, solarPanelWidth: 1100, solarCellType: 'mono', solarTempCoeffPmax: -0.30, solarDegradation: 0.4, solar: (prev.solarPanelsCount * 550) / 1000 }));
                  } else {
                    setEquipment(prev => ({ ...prev, solarPanelPreset: preset }));
                  }
                }}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="standard-400w">Стандартна (400 Вт, 1700x1100мм)</option>
                <option value="premium-550w">Преміум (550 Вт, 2200x1100мм)</option>
                <option value="custom">Своя конфігурація</option>
              </select>
            </div>
          </ConfigCard>
        )}
        
        {config.wind && (
          <ConfigCard 
            title="Вітрові турбіни" 
            icon={Wind} 
            color="blue" 
            value={equipment.windCount} 
            setValue={(v) => setEquipment(prev => ({ ...prev, windCount: v }))} 
            unit="шт" 
            max={10}
            step={1}
            mainLabel="Кількість турбін"
            description="Кількість вітрогенераторів у вашій системі."
            itemCost={Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2) * 300}
            totalCost={equipment.windCount * Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2) * 300}
            advancedFields={[
              { label: 'Діаметр ротора (м)', value: equipment.windRotorDiameter, onChange: (v: any) => setEquipment(prev => ({ ...prev, windRotorDiameter: v })), min: 1, max: 50, step: 0.5, helpText: 'Діаметр ротора визначає площу обмітання та кількість енергії, яку може перехопити турбіна.' },
              { label: 'Висота щогли (м)', value: equipment.windHubHeight, onChange: (v: any) => setEquipment(prev => ({ ...prev, windHubHeight: v })), min: 10, max: 100, helpText: 'Висота від землі до центру ротора. Чим вище, тим стабільніший вітер.' },
              { label: 'TSR (Коеф. швидкохідності)', value: equipment.windTsr, onChange: (v: any) => setEquipment(prev => ({ ...prev, windTsr: v })), min: 1, max: 15, step: 0.1, helpText: 'Відношення швидкості кінчика лопаті до швидкості вітру. Для 3-лопатевих типово 6-7.' },
              { label: 'Коефіцієнт потужності (Cp)', value: equipment.windCp, onChange: (v: any) => setEquipment(prev => ({ ...prev, windCp: v })), min: 0.1, max: 0.59, step: 0.01, helpText: 'Ефективність перетворення енергії вітру. Максимум (ліміт Бетца) - 0.59. Типово 0.3-0.45.' },
              { label: 'Кількість лопатей', value: equipment.windBladesCount, onChange: (v: any) => setEquipment(prev => ({ ...prev, windBladesCount: v })), min: 1, max: 12, helpText: 'Кількість лопатей крильчатки. Найбільш поширені 3-лопатеві турбіни.' },
              { label: 'Кут атаки лопаті (°)', value: equipment.windBladePitch, onChange: (v: any) => setEquipment(prev => ({ ...prev, windBladePitch: v })), min: -5, max: 90, step: 0.5, helpText: 'Кут нахилу лопатей відносно площини обертання. Впливає на пусковий момент та ефективність.' },
            ]}
          />
        )}
        
        {config.hydro && (
          <ConfigCard 
            title="Мала ГЕС" 
            icon={Droplet} 
            color="sky" 
            value={equipment.hydroCount} 
            setValue={(v) => setEquipment(prev => ({ ...prev, hydroCount: v }))} 
            unit="шт" 
            max={5}
            step={1}
            mainLabel="Кількість турбін"
            description="Кількість гідротурбін у вашій системі."
            itemCost={equipment.hydroRunnerDiameter * 10000}
            totalCost={equipment.hydroCount * equipment.hydroRunnerDiameter * 10000}
            advancedFields={[
              { label: 'Діаметр колеса (мм)', value: Math.round(equipment.hydroRunnerDiameter * 1000), onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroRunnerDiameter: v / 1000 })), min: 100, max: 5000, step: 10, helpText: 'Діаметр робочого колеса використовується для масштабування гідростанції.' },
              { label: 'Тип турбіни', value: equipment.hydroTurbineType, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroTurbineType: v })), type: 'select' as 'select', options: [{value: 'pelton', label: 'Пелтона'}, {value: 'kaplan', label: 'Каплана'}, {value: 'francis', label: 'Френсіса'}], helpText: 'Пелтона для високого напору, Каплана для низького, Френсіса для середнього.' },
              { label: 'Перепад висот (м)', value: equipment.hydroHead, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroHead: v })), min: 1, max: 500, helpText: 'Вертикальна відстань від місця забору до турбіни. Вимірюється нівеліром або GPS.' },
              { label: 'Витрата води (л/с)', value: equipment.hydroFlow, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroFlow: v })), min: 1, max: 10000, helpText: 'Об\'єм води за секунду. Можна виміряти методом поплавка або заповненням ємності.' },
              { label: 'Екологічний стік (л/с)', value: equipment.hydroResidualFlow, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroResidualFlow: v })), min: 0, max: 1000, helpText: 'Мінімальна кількість води, що має залишатися в річці за законом.' },
              { label: 'Довжина труби (м)', value: equipment.hydroPenstockLength, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroPenstockLength: v })), min: 1, max: 5000, helpText: 'Параметри напірного трубопроводу. Впливають на втрати тиску.' },
              { label: 'Діаметр труби (мм)', value: Math.round(equipment.hydroPenstockDiameter * 1000), onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroPenstockDiameter: v / 1000 })), min: 10, max: 5000, step: 1, helpText: 'Внутрішній діаметр напірного трубопроводу. Впливає на швидкість потоку та втрати на тертя.' },
              { label: 'Матеріал труби', value: equipment.hydroPenstockMaterial, onChange: (v: any) => setEquipment(prev => ({ ...prev, hydroPenstockMaterial: v })), type: 'select' as 'select', options: [{value: 'pvc', label: 'ПВХ'}, {value: 'steel', label: 'Сталь'}, {value: 'concrete', label: 'Бетон'}], helpText: 'Шорсткість матеріалу впливає на тертя води. ПВХ має найменший опір.' },
            ]}
          />
        )}
        
        {config.battery && (
          <ConfigCard 
            title="Акумуляторна система" 
            icon={Battery} 
            color="emerald" 
            value={equipment.batteryModulesCount} 
            setValue={(v) => setEquipment(prev => ({ ...prev, batteryModulesCount: v, battery: v * equipment.batteryModuleCapacity }))} 
            unit="шт" 
            max={40}
            step={1}
            mainLabel="Кількість модулів"
            description="Кількість акумуляторних блоків у системі."
            itemCost={equipment.batteryModuleCapacity * 400}
            totalCost={equipment.battery * 400}
            advancedFields={[
              { label: 'Ємність 1 модуля (кВт·год)', value: equipment.batteryModuleCapacity, onChange: (v: any) => setEquipment(prev => ({ ...prev, batteryModuleCapacity: v, battery: prev.batteryModulesCount * v })), min: 1, max: 20, step: 0.5, helpText: 'Ємність одного акумуляторного блоку.' },
              { label: 'Глибина розряду (%)', value: equipment.batteryDod, onChange: (v: any) => setEquipment(prev => ({ ...prev, batteryDod: v })), min: 10, max: 100, helpText: 'Відсоток ємності, який можна використовувати. Для LiFePO4 типово 80-90%, для свинцевих 50%.' },
            ]}
          >
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Загальна ємність:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{equipment.battery} кВт·год</span>
              </div>
            </div>
          </ConfigCard>
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
  mainLabel = "Потужність",
  step = 1,
  parameters = [],
  advancedFields = [],
  itemCost,
  totalCost,
  children
}: { 
  title: string; 
  icon: any; 
  color: 'amber' | 'blue' | 'sky' | 'emerald'; 
  value: number; 
  setValue: (v: number) => void; 
  unit: string; 
  max: number;
  description: string;
  mainLabel?: string;
  step?: number;
  itemCost?: number;
  totalCost?: number;
  parameters?: { 
    label: string, 
    value: number | string, 
    onChange: (v: any) => void, 
    type?: 'number' | 'select',
    options?: { value: string, label: string }[],
    min?: number, 
    max?: number,
    step?: number,
    helpText?: string
  }[];
  advancedFields?: { 
    label: string, 
    value: number | string, 
    onChange: (v: any) => void, 
    type?: 'number' | 'select',
    options?: { value: string, label: string }[],
    min?: number, 
    max?: number,
    step?: number,
    helpText?: string
  }[];
  children?: React.ReactNode;
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
    <div className="relative group/card bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl flex flex-col gap-6 hover:z-50 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${colorMap[color].split(' ')[1]}`}>
            <Icon className={`w-6 h-6 ${colorMap[color].split(' ')[0]}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Налаштування обладнання</p>
          </div>
        </div>
        {totalCost !== undefined && (
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Загальна вартість</div>
            <div className={`font-mono font-bold text-lg ${colorMap[color].split(' ')[0]}`}>
              ${Math.round(totalCost).toLocaleString()}
            </div>
            {itemCost !== undefined && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                ${Math.round(itemCost).toLocaleString()} / {unit}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {mainLabel}
            </label>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 text-[11px] leading-normal text-white bg-slate-900 dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700">
                {description}
                <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <input 
              type="number" 
              value={value}
              step={step || 1}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (Number.isInteger(step || 1)) {
                  val = Math.round(val);
                }
                setValue(val);
              }}
              className="w-20 text-right font-mono text-xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-none text-slate-900 dark:text-white pb-1"
            />
            <span className="text-slate-500 font-medium">{unit}</span>
          </div>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max={max} 
          step={step || 1}
          value={value}
          onChange={(e) => {
            let val = Number(e.target.value);
            if (Number.isInteger(step || 1)) {
              val = Math.round(val);
            }
            setValue(val);
          }}
          className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${sliderColorMap[color]}`}
        />
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>0 {unit}</span>
          <span>{max} {unit}</span>
        </div>
        
        {itemCost !== undefined && (
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-400">Вартість 1 одиниці:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">${Math.round(itemCost).toLocaleString()}</span>
          </div>
        )}
      </div>

      {children}

      {parameters && parameters.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            Параметри встановлення
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parameters.map((field, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {field.label}
                  </label>
                  {field.helpText && (
                    <div className="group relative">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 cursor-help hover:text-emerald-500 hover:border-emerald-500/50 transition-colors">
                        i
                      </div>
                      <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 text-[11px] leading-normal text-white bg-slate-900 dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700">
                        {field.helpText}
                        <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                      </div>
                    </div>
                  )}
                </div>
                {field.type === 'select' ? (
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="number" 
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {advancedFields && advancedFields.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            Розширені параметри обладнання
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advancedFields.map((field, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {field.label}
                  </label>
                  {field.helpText && (
                    <div className="group relative">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 cursor-help hover:text-emerald-500 hover:border-emerald-500/50 transition-colors">
                        i
                      </div>
                      <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 text-[11px] leading-normal text-white bg-slate-900 dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700">
                        {field.helpText}
                        <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                      </div>
                    </div>
                  )}
                </div>
                {field.type === 'select' ? (
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="number" 
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
