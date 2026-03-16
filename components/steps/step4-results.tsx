'use client';

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Leaf, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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
    wind: number, windHubHeight: number,
    hydro: number, hydroHead: number, hydroFlow: number,
    battery: number, batteryDod: number
  },
  consumption: { annual: number, profileType: string },
  climateData: { solar: number, wind: number, precipitation: number }
}) {
  // Generate slightly dynamic data based on inputs
  const monthlyData = Array.from({ length: 12 }).map((_, i) => {
    const monthNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
    
    // Advanced Solar Calculation
    // Base factor * (1 - losses) * tilt/azimuth efficiency modifier
    // Use actual climate data for solar (kWh/m2/year) distributed across months
    const solarDistribution = [0.04, 0.06, 0.09, 0.11, 0.13, 0.14, 0.14, 0.12, 0.09, 0.05, 0.02, 0.01];
    const tiltEfficiency = Math.cos((equipment.solarTilt - 35) * Math.PI / 180); // Optimal tilt ~35
    const azimuthEfficiency = Math.cos((equipment.solarAzimuth - 180) * Math.PI / 180); // Optimal south ~180
    const solarEfficiency = Math.max(0.1, tiltEfficiency * azimuthEfficiency * (1 - equipment.solarLosses / 100));
    // solar (kW) * climateData.solar (kWh/kWp/year approx) * distribution * efficiency
    const solarGen = config.solar ? Math.round(equipment.solar * climateData.solar * solarDistribution[i] * solarEfficiency) : 0;
    
    // Advanced Wind Calculation
    // Base factor * height modifier (logarithmic wind profile approximation)
    const windDistribution = [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.8, 0.8, 0.9, 1.0, 1.3, 1.4];
    const heightModifier = Math.log(equipment.windHubHeight / 0.1) / Math.log(10 / 0.1); // Assuming 10m reference
    // Rough approximation: Power is proportional to cube of wind speed. 
    // We use climateData.wind (m/s) as a base.
    const windPowerFactor = Math.pow(climateData.wind / 5, 3); // Normalized to 5m/s
    const windGen = config.wind ? Math.round(equipment.wind * 150 * windDistribution[i] * heightModifier * Math.min(2, windPowerFactor)) : 0;
    
    // Advanced Hydro Calculation
    // Power = Head * Flow * Gravity * Efficiency
    const hydroEfficiency = 0.8; // Assumed 80%
    const hydroPowerKw = (equipment.hydroHead * (equipment.hydroFlow / 1000) * 9.81 * hydroEfficiency);
    // Cap at installed capacity
    const actualHydroKw = Math.min(equipment.hydro, hydroPowerKw);
    const hydroGen = config.hydro ? Math.round(actualHydroKw * 730) : 0; // 730 hours/month
    
    // Distribute annual consumption roughly across months
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

  const totalGen = monthlyData.reduce((acc, curr) => acc + curr.solar + curr.wind + curr.hydro, 0);
  const totalCons = monthlyData.reduce((acc, curr) => acc + curr.consumption, 0);
  
  const autonomyPercent = Math.min(100, Math.round((totalGen / totalCons) * 100));
  const savings = Math.round(Math.min(totalGen, totalCons) * 4.32);
  const co2Reduction = (totalGen * 0.4 / 1000).toFixed(1); // roughly 0.4 kg CO2 per kWh
  
  const capex = (config.solar ? equipment.solar * 800 : 0) + 
                (config.wind ? equipment.wind * 1200 : 0) + 
                (config.hydro ? equipment.hydro * 2000 : 0) + 
                (config.battery ? equipment.battery * 400 : 0);
                
  // Advanced LCOE Calculation
  const discountRate = 0.08; // 8%
  const projectLife = 20; // years
  const opexPercent = 0.02; // 2% of CAPEX annually
  
  let npvCost = capex;
  let npvGen = 0;
  
  for (let year = 1; year <= projectLife; year++) {
    // Assume 0.5% degradation per year for generation
    const annualGen = totalGen * Math.pow(0.995, year - 1);
    const annualOpex = capex * opexPercent;
    
    npvCost += annualOpex / Math.pow(1 + discountRate, year);
    npvGen += annualGen / Math.pow(1 + discountRate, year);
  }
  
  const lcoe = npvGen > 0 ? (npvCost / npvGen).toFixed(2) : '0.00';
                
  // Advanced Payback Calculation
  let paybackYears = 0;
  let cumulativeCashFlow = -capex;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(0.995, year - 1);
    const annualSavings = Math.min(annualGen, totalCons) * 4.32; // Assuming 4.32 UAH/kWh tariff
    const annualOpex = capex * opexPercent;
    const netCashFlow = annualSavings - annualOpex;
    
    cumulativeCashFlow += netCashFlow;
    
    if (cumulativeCashFlow >= 0) {
      // Interpolate exact year
      paybackYears = year - 1 + (cumulativeCashFlow - netCashFlow) / -netCashFlow;
      break;
    }
  }
  
  const payback = paybackYears > 0 ? paybackYears.toFixed(1) : '>20';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Результати розрахунку</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Оцінка ефективності, економічної вигоди та екологічного впливу вашої гібридної системи.
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
        />
        <KpiCard 
          title="Економія за рік" 
          value={savings.toLocaleString()} 
          unit="₴" 
          icon={DollarSign} 
          color="blue" 
          trend={`~${Math.round(savings / 12).toLocaleString()} ₴/міс`}
        />
        <KpiCard 
          title="Термін окупності" 
          value={payback} 
          unit="роки" 
          icon={TrendingUp} 
          color="amber" 
          trend="IRR: ~18%"
        />
        <KpiCard 
          title="Зниження CO₂" 
          value={co2Reduction} 
          unit="тонн/рік" 
          icon={Leaf} 
          color="sky" 
          trend="Екологічно чисто"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Генерація vs Споживання (Річний профіль)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
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
            
            {/* Custom Circular Gauge */}
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
                <span className="font-mono font-medium text-slate-900 dark:text-white">4.32 ₴/кВт·год</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, unit, icon: Icon, color, trend }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    sky: 'text-sky-500 bg-sky-500/10',
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
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
