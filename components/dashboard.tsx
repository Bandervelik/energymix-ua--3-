'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, Wind, Droplet, Battery, 
  MapPin, Settings, Activity, BarChart3, FileText,
  Menu, X, Moon, Sun as SunIcon, ChevronRight
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'motion/react';
import { Step1Location } from './steps/step1-location';
import { Step2Equipment } from './steps/step2-equipment';
import { Step3Consumption } from './steps/step3-consumption';
import { Step4Results } from './steps/step4-results';
import { Step5Report } from './steps/step5-report';

export type SystemConfig = {
  solar: boolean;
  wind: boolean;
  hydro: boolean;
  battery: boolean;
};

const steps = [
  { id: 1, title: 'Локація', icon: MapPin },
  { id: 2, title: 'Обладнання', icon: Settings },
  { id: 3, title: 'Споживання', icon: Activity },
  { id: 4, title: 'Результати', icon: BarChart3 },
  { id: 5, title: 'Звіт', icon: FileText },
];

export function Dashboard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [config, setConfig] = useState<SystemConfig>({
    solar: true,
    wind: false,
    hydro: false,
    battery: true,
  });

  // Lifted state for steps
  const [location, setLocation] = useState({
    address: 'Київ, Україна',
    coordinates: [50.4501, 30.5234] as [number, number]
  });
  const [equipment, setEquipment] = useState({
    solar: 10,
    solarTilt: 35,
    solarAzimuth: 180,
    solarLosses: 14,
    wind: 5,
    windHubHeight: 15,
    hydro: 15,
    hydroHead: 10,
    hydroFlow: 25,
    battery: 20,
    batteryDod: 80,
  });
  const [consumption, setConsumption] = useState({
    annual: 12000,
    profileType: 'residential',
  });
  const [climateData, setClimateData] = useState({
    solar: 1150,
    wind: 4.2,
    precipitation: 650,
    isLoading: false
  });

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 5));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500 hidden sm:block">
                EnergyMix UA
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {steps.find(s => s.id === currentStep)?.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stepper Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div 
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      currentStep === step.id 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : currentStep > step.id 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.id}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${currentStep > step.id ? 'bg-emerald-500/50' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
              aria-label="Перемкнути тему"
            >
              {mounted ? (theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : null}
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 1 && <Step1Location location={location} setLocation={setLocation} climateData={climateData} setClimateData={setClimateData} />}
                {currentStep === 2 && <Step2Equipment config={config} setConfig={setConfig} equipment={equipment} setEquipment={setEquipment} />}
                {currentStep === 3 && <Step3Consumption consumption={consumption} setConsumption={setConsumption} />}
                {currentStep === 4 && <Step4Results config={config} equipment={equipment} consumption={consumption} climateData={climateData} />}
                {currentStep === 5 && <Step5Report config={config} equipment={equipment} consumption={consumption} location={location} />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  currentStep === 1 
                    ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
                }`}
              >
                Назад
              </button>
              
              <button
                onClick={nextStep}
                disabled={currentStep === 5}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg ${
                  currentStep === 5
                    ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 shadow-emerald-500/25 hover:shadow-emerald-500/40'
                }`}
              >
                {currentStep === 4 ? 'Згенерувати звіт' : 'Далі'}
                {currentStep !== 5 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
