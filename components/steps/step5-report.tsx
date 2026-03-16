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
  location 
}: { 
  config: SystemConfig,
  equipment: { 
    solar: number, solarTilt: number, solarAzimuth: number, solarLosses: number,
    wind: number, windHubHeight: number,
    hydro: number, hydroHead: number, hydroFlow: number,
    battery: number, batteryDod: number
  },
  consumption: { annual: number, profileType: string },
  location: { address: string, coordinates: [number, number] }
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
      ['Сонячні панелі (кВт)', config.solar ? equipment.solar : 0],
      ...(config.solar ? [
        ['Кут нахилу СЕС (°)', equipment.solarTilt],
        ['Азимут СЕС (°)', equipment.solarAzimuth],
        ['Втрати СЕС (%)', equipment.solarLosses]
      ] : []),
      ['Вітрові турбіни (кВт)', config.wind ? equipment.wind : 0],
      ...(config.wind ? [
        ['Висота щогли ВЕС (м)', equipment.windHubHeight]
      ] : []),
      ['Малі ГЕС (кВт)', config.hydro ? equipment.hydro : 0],
      ...(config.hydro ? [
        ['Перепад висот ГЕС (м)', equipment.hydroHead],
        ['Витрата води ГЕС (л/с)', equipment.hydroFlow]
      ] : []),
      ['Акумулятори (кВт·год)', config.battery ? equipment.battery : 0],
      ...(config.battery ? [
        ['Глибина розряду АКБ (%)', equipment.batteryDod]
      ] : []),
      ['Річне споживання (кВт·год)', consumption.annual],
      ['Тип профілю', consumption.profileType === 'residential' ? 'Побутовий' : consumption.profileType === 'commercial' ? 'Комерційний' : 'Промисловий']
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
        <div ref={reportRef} style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '48px', width: '800px', fontFamily: 'sans-serif' }}>
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
              <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Координати:</span> {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</p>
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
                          Нахил: {equipment.solarTilt}°, Азимут: {equipment.solarAzimuth}°, Втрати: {equipment.solarLosses}%
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
                        <div style={{ fontWeight: 'bold' }}>{equipment.wind} кВт</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Висота щогли: {equipment.windHubHeight} м
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
                        <div style={{ fontWeight: 'bold' }}>{equipment.hydro} кВт</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Напір: {equipment.hydroHead} м, Витрата: {equipment.hydroFlow} л/с
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
                          Глибина розряду: {equipment.batteryDod}%
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

          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            <p style={{ margin: '0 0 4px 0' }}>Згенеровано автоматично системою EnergyMix UA</p>
            <p style={{ margin: 0 }}>Цей звіт є попередньою оцінкою і не замінює професійного інженерного розрахунку.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
