'use client';

import React, { useRef, useState } from 'react';
import { FileText, Download, Share2, Mail, CheckCircle2, FileJson, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SystemConfig } from '../dashboard';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export function Step5Report({ 
  config, 
  equipment, 
  consumption, 
  location,
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
  consumption: { annual: number, profileType: string, customProfile: number[] },
  location: { address: string, coordinates: [number, number], installationSite: string },
  climateData: { solar: number, wind: number, precipitation: number }
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Generate slightly dynamic data based on inputs
  const monthlyData = Array.from({ length: 12 }).map((_, i) => {
    const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
    
    // Advanced Solar Calculation
    const solarDistribution = [0.04, 0.06, 0.09, 0.11, 0.13, 0.14, 0.14, 0.12, 0.09, 0.05, 0.02, 0.01];
    const tiltEfficiency = Math.cos((equipment.solarTilt - 35) * Math.PI / 180);
    const azimuthEfficiency = Math.cos((equipment.solarAzimuth - 180) * Math.PI / 180);
    
    const monthlyTemps = [-2, 0, 5, 12, 18, 22, 25, 24, 18, 11, 4, 0];
    const cellTemp = monthlyTemps[i] + 25;
    const tempLoss = cellTemp > 25 ? (cellTemp - 25) * (equipment.solarTempCoeffPmax / 100) : 0;
    
    const solarEfficiency = Math.max(0.1, tiltEfficiency * azimuthEfficiency * (1 - equipment.solarLosses / 100) * (1 + tempLoss));
    const solarGen = config.solar ? Math.round(equipment.solar * climateData.solar * solarDistribution[i] * solarEfficiency) : 0;
    
    // Advanced Wind Calculation
    const windDistribution = [1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.8, 0.8, 0.9, 1.0, 1.3, 1.4];
    const heightModifier = Math.log(equipment.windHubHeight / 0.1) / Math.log(10 / 0.1);
    const localWindSpeed = climateData.wind * heightModifier * windDistribution[i];
    
    const rho = 1.225;
    const sweptArea = Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2);
    const bladesModifier = equipment.windBladesCount === 3 ? 1 : 0.95;
    const pitchModifier = Math.max(0.5, 1 - Math.abs(equipment.windBladePitch) * 0.015);
    
    const windPowerKw = (0.5 * rho * sweptArea * Math.pow(localWindSpeed, 3) * equipment.windCp * bladesModifier * pitchModifier) / 1000;
    const windGen = config.wind ? Math.round(windPowerKw * 730 * equipment.windCount) : 0;
    
    // Advanced Hydro Calculation
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

  const totalGen = monthlyData.reduce((acc, curr) => acc + curr.solar + curr.wind + curr.hydro, 0);
  const totalCons = monthlyData.reduce((acc, curr) => acc + curr.consumption, 0);
  
  const autonomyPercent = Math.min(100, Math.round((totalGen / totalCons) * 100));
  const savings = Math.round(Math.min(totalGen, totalCons) * 4.32);
  const co2Reduction = (totalGen * 0.4 / 1000).toFixed(1);
  
  const capex = (config.solar ? equipment.solarPanelsCount * (equipment.solarPanelPrice || 320) : 0) + 
                (config.wind ? equipment.windCount * (Math.PI * Math.pow(equipment.windRotorDiameter / 2, 2)) * 300 : 0) + 
                (config.hydro ? equipment.hydroCount * (equipment.hydroRunnerDiameter * 10000) : 0) + 
                (config.battery ? equipment.battery * 400 : 0);
                
  const discountRate = 0.08;
  const projectLife = 20;
  const opexPercent = 0.02;
  const degradationFactor = 1 - (equipment.solarDegradation / 100);
  
  let npvCost = capex;
  let npvGen = 0;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(degradationFactor, year - 1);
    const annualOpex = capex * opexPercent;
    
    npvCost += annualOpex / Math.pow(1 + discountRate, year);
    npvGen += annualGen / Math.pow(1 + discountRate, year);
  }
  
  const lcoe = npvGen > 0 ? (npvCost / npvGen).toFixed(2) : '0.00';
                
  let paybackYears = 0;
  let cumulativeCashFlow = -capex;
  
  for (let year = 1; year <= projectLife; year++) {
    const annualGen = totalGen * Math.pow(degradationFactor, year - 1);
    const annualSavings = Math.min(annualGen, totalCons) * 4.32;
    const annualOpex = capex * opexPercent;
    const netCashFlow = annualSavings - annualOpex;
    
    cumulativeCashFlow += netCashFlow;
    
    if (cumulativeCashFlow >= 0) {
      paybackYears = year - 1 + (cumulativeCashFlow - netCashFlow) / -netCashFlow;
      break;
    }
  }
  
  const payback = paybackYears > 0 ? paybackYears.toFixed(1) : '>20';

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // html-to-image works better with elements that are actually in the DOM and visible
      // but positioned off-screen
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('EnergyMix_Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Помилка при генерації PDF. Спробуйте ще раз.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Параметр', 'Значення'];
    const rows = [
      ['Локація', `"${location.address}"`],
      ['Координати', `"${location.coordinates[0]}, ${location.coordinates[1]}"`],
      ['Місце установки', `"${location.installationSite || 'Не вказано'}"`],
      ['Сонячні панелі (кВт)', config.solar ? equipment.solar : 0],
      ...(config.solar ? [
        ['Кількість панелей (шт)', equipment.solarPanelsCount],
        ['Потужність панелі (Вт)', equipment.solarPanelPower],
        ['Ціна панелі ($)', equipment.solarPanelPrice || 320],
        ['Кут нахилу СЕС (°)', equipment.solarTilt],
        ['Азимут СЕС (°)', equipment.solarAzimuth],
        ['Втрати СЕС (%)', equipment.solarLosses],
        ['Довжина модуля (мм)', equipment.solarPanelLength],
        ['Ширина модуля (мм)', equipment.solarPanelWidth],
        ['Тип комірки', equipment.solarCellType],
        ['Темп. коефіцієнт (%/°C)', equipment.solarTempCoeffPmax],
        ['Деградація (%/рік)', equipment.solarDegradation]
      ] : []),
      ['Вітрові турбіни (Діаметр ротора, м)', config.wind ? equipment.windRotorDiameter : 0],
      ...(config.wind ? [
        ['Кількість турбін (шт)', equipment.windCount],
        ['Висота щогли ВЕС (м)', equipment.windHubHeight],
        ['TSR ВЕС', equipment.windTsr],
        ['Коефіцієнт потужності Cp', equipment.windCp]
      ] : []),
      ['Малі ГЕС (Діаметр колеса, м)', config.hydro ? equipment.hydroRunnerDiameter : 0],
      ...(config.hydro ? [
        ['Кількість турбін (шт)', equipment.hydroCount],
        ['Тип турбіни', equipment.hydroTurbineType],
        ['Перепад висот ГЕС (м)', equipment.hydroHead],
        ['Витрата води ГЕС (л/с)', equipment.hydroFlow],
        ['Екологічний стік (л/с)', equipment.hydroResidualFlow],
        ['Довжина труби (м)', equipment.hydroPenstockLength],
        ['Діаметр труби (м)', equipment.hydroPenstockDiameter],
        ['Матеріал труби', equipment.hydroPenstockMaterial]
      ] : []),
      ['Акумулятори (кВт·год)', config.battery ? equipment.battery : 0],
      ...(config.battery ? [
        ['Кількість модулів (шт)', equipment.batteryModulesCount],
        ['Ємність 1 модуля (кВт·год)', equipment.batteryModuleCapacity],
        ['Глибина розряду АКБ (%)', equipment.batteryDod]
      ] : []),
      ['Річне споживання (кВт·год)', consumption.annual],
      ['Тип профілю', 
        consumption.profileType === 'residential' ? 'Побутовий' : 
        consumption.profileType === 'commercial' ? 'Комерційний' : 
        consumption.profileType === 'industrial' ? 'Промисловий' : 'Власний графік'
      ],
      ['---', '---'],
      ['Річна генерація (кВт·год)', totalGen],
      ['Автономність (%)', autonomyPercent],
      ['Економія за рік (₴)', savings],
      ['Зниження CO2 (тонн/рік)', co2Reduction],
      ['Капітальні витрати CAPEX ($)', capex],
      ['LCOE (₴/кВт·год)', lcoe],
      ['Термін окупності (роки)', payback]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "EnergyMix_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Розрахунок завершено!</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg">
          Ваш проект гібридної системи відновлюваної енергетики успішно згенеровано. Ви можете завантажити детальний звіт або поділитися ним.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Export Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-emerald-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Детальний PDF Звіт</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1">
              Повний документ з графіками, технічними специфікаціями, фінансовою моделлю та рекомендаціями.
            </p>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-70"
            >
              {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isGeneratingPDF ? 'Генерація...' : 'Завантажити PDF'}
            </button>
          </div>
        </div>

        {/* Data Export Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <FileJson className="w-7 h-7 text-blue-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Експорт Даних</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1">
              Завантажте сирі дані розрахунків у форматі CSV або JSON для подальшого аналізу.
            </p>
            
            <button 
              onClick={handleDownloadCSV}
              className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Завантажити CSV
            </button>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Share2 className="w-5 h-5" />
          Поділитися посиланням
        </button>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Mail className="w-5 h-5" />
          Відправити на email
        </button>
      </div>

      {/* Hidden Report Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', overflow: 'hidden' }}>
        <div ref={reportRef} style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '800px', fontFamily: 'sans-serif' }}>
          
          {/* PAGE 1 */}
          <div style={{ width: '800px', minHeight: '1131.4px', padding: '48px', boxSizing: 'border-box', position: 'relative' }}>
            <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>EnergyMix UA</h1>
                <p style={{ fontSize: '20px', color: '#64748b', margin: 0 }}>Звіт гібридної енергосистеми</p>
              </div>
              <div style={{ textAlign: 'right', color: '#64748b' }}>
                <p style={{ margin: 0 }}>Дата: {new Date().toLocaleDateString('uk-UA')}</p>
              </div>
            </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#059669' }}>1. Локація проекту</h2>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 8px 0' }}><span style={{ fontWeight: 'bold' }}>Адреса:</span> {location.address}</p>
              <p style={{ margin: '0 0 8px 0' }}><span style={{ fontWeight: 'bold' }}>Координати:</span> {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</p>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Місце установки:</span> {location.installationSite || 'Не вказано'}</p>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#059669' }}>2. Конфігурація обладнання</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Джерело</th>
                  <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Статус</th>
                  <th style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Потужність</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Сонячні панелі</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{config.solar ? 'Увімкнено' : 'Вимкнено'}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    {config.solar ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{equipment.solar} кВт</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Кількість панелей: {equipment.solarPanelsCount} шт, Ціна панелі: {equipment.solarPanelPrice || 320}$, Нахил: {equipment.solarTilt}°, Азимут: {equipment.solarAzimuth}°, Втрати: {equipment.solarLosses}%
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Вітрові турбіни</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{config.wind ? 'Увімкнено' : 'Вимкнено'}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    {config.wind ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{equipment.windCount} шт, {equipment.windRotorDiameter} м (Діаметр ротора)</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Висота щогли: {equipment.windHubHeight} м, TSR: {equipment.windTsr}, Cp: {equipment.windCp}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Малі ГЕС</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{config.hydro ? 'Увімкнено' : 'Вимкнено'}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    {config.hydro ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{equipment.hydroCount} шт, {equipment.hydroRunnerDiameter} м (Діаметр колеса)</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Тип: {equipment.hydroTurbineType}, Напір: {equipment.hydroHead} м, Витрата: {equipment.hydroFlow} л/с
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Акумулятори</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{config.battery ? 'Увімкнено' : 'Вимкнено'}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    {config.battery ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{equipment.battery} кВт·год</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Кількість модулів: {equipment.batteryModulesCount} шт, Глибина розряду: {equipment.batteryDod}%
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#059669' }}>3. Профіль споживання</h2>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 8px 0' }}><span style={{ fontWeight: 'bold' }}>Річне споживання:</span> {consumption.annual.toLocaleString()} кВт·год</p>
              <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Тип профілю:</span> {consumption.profileType === 'residential' ? 'Побутовий (Житловий)' : consumption.profileType === 'commercial' ? 'Комерційний (Офіс)' : 'Промисловий (Виробництво)'}</p>
            </div>
          </div>
        </div>

        {/* PAGE 2 */}
        <div style={{ width: '800px', minHeight: '1131.4px', padding: '48px', boxSizing: 'border-box', position: 'relative', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#059669' }}>4. Результати розрахунку</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0f172a' }}>Енергетичні показники</h3>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Річна генерація:</span>
                  <span style={{ fontWeight: 'bold' }}>{totalGen.toLocaleString()} кВт·год</span>
                </p>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Річне споживання:</span>
                  <span style={{ fontWeight: 'bold' }}>{totalCons.toLocaleString()} кВт·год</span>
                </p>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Автономність:</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>{autonomyPercent}%</span>
                </p>
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Зниження CO₂:</span>
                  <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{co2Reduction} тонн/рік</span>
                </p>
              </div>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0f172a' }}>Економічні показники</h3>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Капітальні витрати (CAPEX):</span>
                  <span style={{ fontWeight: 'bold' }}>${capex.toLocaleString()}</span>
                </p>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Економія за рік:</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>{savings.toLocaleString()} ₴</span>
                </p>
                <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>LCOE (Вартість енергії):</span>
                  <span style={{ fontWeight: 'bold' }}>{lcoe} ₴/кВт·год</span>
                </p>
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Термін окупності:</span>
                  <span style={{ fontWeight: 'bold', color: '#d97706' }}>{payback} років</span>
                </p>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '48px', left: '48px', right: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            <p style={{ margin: '0 0 4px 0' }}>Згенеровано автоматично системою EnergyMix UA</p>
            <p style={{ margin: 0 }}>Цей звіт є попередньою оцінкою і не замінює професійного інженерного розрахунку.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}