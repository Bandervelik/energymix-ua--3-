'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Leaf, Zap, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatPayback } from '@/lib/utils';

import { SystemConfig } from '../dashboard';

export function Step4Results({ 
  config, 
  equipment, 
  consumption,
  climateData
}: { 
  config: SystemConfig,
  equipment: { 
    solar: number, solarTilt: number, solarAzimuth: number, solarLosses: number,
    solarPanelPreset: string, solarPanelPower: number, solarPanelPrice: number,
    solarPanelLength: number, solarPanelWidth: number, solarPanelsCount: number, solarCellType: string, solarTempCoeffPmax: number, solarDegradation: number,
    windCount: number, windRotorDiameter: number, windHubHeight: number, windTsr: number, windCp: number,
    windBladesCount: number, windBladePitch: number,
    hydroCount: number, hydroTurbineType: string, hydroRunnerDiameter: number, hydroPenstockLength: number, hydroPenstockDiameter: number, hydroPenstockMaterial: string, hydroResidualFlow: number, hydroHead: number, hydroFlow: number,
    batteryModulesCount: number, batteryModuleCapacity: number, battery: number, batteryDod: number
  },
  consumption: { 
    annual: number, 
    profileType: string, 
    customProfile: number[],
    tariffCategory: string,
    householdTariff: string,
    commercialTariff: string
  },
  climateData: { solar: number, wind: number, precipitation: number }
}) {
  const monthlyData = Array.from({ length: 12 }).map((_, i) => {
    const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    
    const solarDistribution = [0.04, 0.06, 0.09, 0.11, 0.13, 0.14, 0.14, 0.12, 0.09, 0.05, 0.02, 0.01];
    const tiltEfficiency = Math.cos((equipment.solarTilt - 35) * Math.PI / 180);
    const azimuthEfficiency = Math.cos((equipment.solarAzimuth - 180) * Math.PI / 180);
    
    const monthlyTemps = [-2, 0, 5, 12, 18, 22, 25, 24, 18, 11, 4, 0];
    const cellTemp = monthlyTemps[i] + 25;
    const tempLoss = cellTemp > 25 ? (cellTemp - 25) * (equipment.solarTempCoeffPmax / 100) : 0;
    
    const solarEfficiency = Math.max(0.1, tiltEfficiency * azimuthEfficiency * (1 - equipment.solarLosses / 100) * (1 + tempLoss));
    const solarGen = config.solar ? Math.round(equipment.solar * climateData.solar * solarDistribution[i] * solarEfficiency) : 0;
    
    const windDistribution = [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.8, 0.8, 0.9, 1.0, 1.3, 1.4];
    const heightModifier = Math.log(equipment.windHubHeight / 0.1) / Math.log(10 / 0.1);
    const localWindSpeed = climateData.wind * heightModifier * windDistribution[i];
    
    const rho = 1.225;
    const sweptArea = Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2);
    
    const bladesModifier = equipment.windBladesCount === 3 ? 1 : 0.95;
    const pitchModifier = Math.max(0.5, 1 - Math.abs(equipment.windBladePitch) * 0.015);
    
    const windPowerKw = (0.5 * rho * sweptArea * Math.pow(localWindSpeed, 3) * equipment.windCp * bladesModifier * pitchModifier) / 1000;
    const windGen = config.wind ? Math.round(windPowerKw * 730 * equipment.windCount) : 0;
    
    const cValues: Record<string, number> = { pvc: 150, steel: 120, concrete: 100 };
    const cFactor = cValues[equipment.hydroPenstockMaterial] || 120;
    const flowM3s = equipment.hydroFlow / 1000;
    let headLoss = 0;
    if (flowM3s > 0 && equipment.hydroPenstockDiameter > 0) {
      headLoss = 10.67 * equipment.hydroPenstockLength * Math.pow(flowM3s, 1.852) / (Math.pow(cFactor, 1.852) * Math.pow(equipment.hydroPenstockDiameter, 4.87));
    }
    const netHead = Math.max(0, equipment.hydroHead - headLoss);
    
    const usableFlowLps = Math.max(0, equipment.hydroFlow - equipment.hydroResidualFlow);
    const usableFlowM3s = usableFlowLps / 1000;
    
    const turbineEfficiencies: Record<string, number> = { pelton: 0.9, kaplan: 0.92, francis: 0.89 };
    const hydroEfficiency = turbineEfficiencies[equipment.hydroTurbineType] || 0.85;
    
    const hydroPowerKw = (netHead * usableFlowM3s * 9.81 * hydroEfficiency);
    
    const maxPowerByRunner = Math.pow(equipment.hydroRunnerDiameter, 2) * 500;
    const actualHydroKw = Math.min(hydroPowerKw, maxPowerByRunner);
    
    const hydroGen = config.hydro ? Math.round(actualHydroKw * 730 * equipment.hydroCount) : 0;
    
    const baseCons = consumption.annual / 12;
    const consVariation = [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2][i];
    const monthlyCons = Math.round(baseCons * consVariation);

    return {
      name: monthNames[i],
      solar: solarGen,
      wind: windGen,
      hydro: hydroGen,
      consumption: monthlyCons
    };
  });

  const getAverageTariff = () => {
    if (consumption.tariffCategory === 'commercial') {
      switch (consumption.commercialTariff) {
        case 'small': return 5.0;
        case 'medium': return 6.0;
        case 'large': return 7.0;
        default: return 5.0;
      }
    } else {
      const baseTariff = 4.32;
      if (consumption.householdTariff === 'fixed') return baseTariff;
      
      const residentialProfile = [0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 1.0, 2.0, 2.5, 2.0, 1.8, 1.8, 1.8, 1.8, 1.8, 1.9, 2.0, 2.5, 3.0, 3.5, 3.5, 3.0, 2.0, 1.0];
      const commercialProfile = [0.8, 0.8, 0.8, 0.8, 0.8, 1.0, 2.0, 3.5, 4.5, 5.0, 5.5, 5.5, 5.5, 5.5, 5.5, 5.0, 4.5, 3.5, 2.0, 1.5, 1.0, 0.8, 0.8, 0.8];
      const industrialProfile = [3.0, 3.0, 3.0, 3.0, 3.0, 4.0, 5.0, 6.0, 6.0, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.0, 6.0, 5.0, 4.0, 4.0, 3.5, 3.0, 3.0, 3.0];
      
      let profile = consumption.customProfile;
      if (consumption.profileType === 'residential') profile = residentialProfile;
      else if (consumption.profileType === 'commercial') profile = commercialProfile;
      else if (consumption.profileType === 'industrial') profile = industrialProfile;
      
      let totalWeight = 0;
      let weightedTariffSum = 0;
      
      for (let hour = 0; hour < 24; hour++) {
        const weight = profile[hour] || 1;
        totalWeight += weight;
        
        let multiplier = 1;
        if (consumption.householdTariff === 'two-zone') {
          if (hour >= 23 || hour < 7) multiplier = 0.5;
        } else if (consumption.householdTariff === 'three-zone') {
          if (hour >= 23 || hour < 7) multiplier = 0.4;
          else if ((hour >= 8 && hour < 11) || (hour >= 20 && hour < 22)) multiplier = 1.5;
        }
        
        weightedTariffSum += baseTariff * multiplier * weight;
      }
      
      return totalWeight > 0 ? weightedTariffSum / totalWeight : baseTariff;
    }
  };

  const averageTariff = getAverageTariff();

  const totalGen = monthlyData.reduce((acc, curr) => acc + curr.solar + curr.wind + curr.hydro, 0);
  const totalCons = monthlyData.reduce((acc, curr) => acc + curr.consumption, 0);
  
  const autonomyPercent = Math.min(100, Math.round((totalGen / totalCons) * 100));
  const savings = Math.round(Math.min(totalGen, totalCons) * averageTariff);
  const co2Reduction = (totalGen * 0.4 / 1000).toFixed(1);
  
  const capex = (config.solar ? equipment.solarPanelsCount * (equipment.solarPanelPrice || 320) : 0) + 
                (config.wind ? equipment.windCount * (Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2)) * 300 : 0) + 
                (config.hydro ? equipment.hydroCount * (equipment.hydroRunnerDiameter * 10000) : 0) + 
                (config.battery ? equipment.battery * 400 : 0);
                
  const exchangeRate = 41.5;
  const capexUAH = capex * exchangeRate;
                
  const discountRate = 0.08;
  const projectLife = 20;
  const opexPercent = 0.02;
  const degradationFactor = 1 - (equipment.solarDegradation / 100);
  
  let npvCost = capexUAH;
  let npvGen = 0;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(degradationFactor, year - 1);
    const annualOpexUAH = capexUAH * opexPercent;
    
    npvCost += annualOpexUAH / Math.pow(1 + discountRate, year);
    npvGen += annualGen / Math.pow(1 + discountRate, year);
  }
  
  const lcoe = npvGen > 0 ? (npvCost / npvGen).toFixed(2) : '0.00';
                
  let paybackYears = 0;
  let cumulativeCashFlow = -capexUAH;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(degradationFactor, year - 1);
    const annualSavings = Math.min(annualGen, totalCons) * averageTariff;
    const annualOpexUAH = capexUAH * opexPercent;
    const netCashFlow = annualSavings - annualOpexUAH;
    
    cumulativeCashFlow += netCashFlow;
    
    if (cumulativeCashFlow >= 0) {
      paybackYears = year - 1 + (cumulativeCashFlow - netCashFlow) / -netCashFlow;
      break;
    }
  }
  
  const payback = formatPayback(paybackYears);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Результати розрахунку</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Оцінка ефективності, економічної вигоди та екологічного впливу вашої гібридної системи.
        </p>
      </div>

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
          tooltip="Сума коштів, яку ви заощадите на оплаті рахунків за електроенергію за поточним тарифом."
        />
        <KpiCard 
          title="Термін окупності" 
          value={payback} 
          unit="" 
          icon={TrendingUp} 
          color="amber" 
          trend={capexUAH > 0 ? `ROI: ~${Math.round((savings / capexUAH) * 100)}% річних` : ""}
          tooltip="Орієнтовний час, за який економія повністю покриє початкові витрати на обладнання."
        />
        <KpiCard 
          title="Зниження CO₂" 
          value={co2Reduction} 
          unit="тонн/рік" 
          icon={Leaf} 
          color="sky" 
          trend="Екологічно чисто"
          tooltip="Обсяг викидів вуглекислого газу, якому ви запобігаєте, використовуючи відновлювану енергію."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Генерація vs Споживання (Річний профіль)
            </h3>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              кВт·год
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} кВт·год`, name]}
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
              Ваша система покриває {autonomyPercent}% річних потреб в електроенергії.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Економічні показники
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">Капітальні витрати (CAPEX)</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{capex > 0 ? `$${capex.toLocaleString()}` : '0'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-sm text-slate-600 dark:text-slate-400">LCOE (Вартість енергії)</span>
                <span className="font-mono font-medium text-emerald-500">{lcoe} ₴/кВт·год</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Тариф мережі (Поточний)</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{averageTariff.toFixed(2)} ₴/кВт·год</span>
              </div>
            </div>
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
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
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
            <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 text-xs leading-relaxed text-white bg-slate-900 dark:bg-slate-800 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              {tooltip}
              <div className="absolute top-full right-1 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{value}</span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
      <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded-md">
        {trend}
      </div>
    </div>
  );
}
