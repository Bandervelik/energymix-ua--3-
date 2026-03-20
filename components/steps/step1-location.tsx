'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Cloud, Sun, Wind, Droplet, Loader2, Navigation, Info } from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../map-picker'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  ) 
});

export function Step1Location({ 
  location, 
  setLocation,
  climateData,
  setClimateData
}: { 
  location: { address: string, coordinates: [number, number], installationSite: string }, 
  setLocation: React.Dispatch<React.SetStateAction<{ address: string, coordinates: [number, number], installationSite: string }>>,
  climateData: { solar: number, wind: number, precipitation: number, isLoading: boolean },
  setClimateData: React.Dispatch<React.SetStateAction<{ solar: number, wind: number, precipitation: number, isLoading: boolean }>>
}) {
  const [searchQuery, setSearchQuery] = useState(location.address);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isFromSearch = useRef(false);

  // Sync internal search query if location.address changes externally
  useEffect(() => {
    setSearchQuery(location.address);
  }, [location.address]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery && searchQuery !== location.address && showSuggestions) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Network response was not ok: ${res.status}`);
          }
          const data = await res.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setIsSearching(false);
        }
      } else if (!searchQuery) {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, location.address, showSuggestions]);

  // Reverse geocoding when coordinates change (e.g. from map click)
  useEffect(() => {
    if (isFromSearch.current) {
      isFromSearch.current = false;
      return;
    }
    
    const fetchAddress = async () => {
      try {
        const res = await fetch(`/api/geocode?lat=${location.coordinates[0]}&lon=${location.coordinates[1]}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Network response was not ok: ${res.status}`);
        }
        const data = await res.json();
        if (data && data.display_name) {
          setSearchQuery(data.display_name);
          setLocation(prev => ({ ...prev, address: data.display_name }));
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    };
    
    const timeout = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timeout);
  }, [location.coordinates, setLocation]);

  // Fetch climate data when coordinates change
  useEffect(() => {
    const fetchClimate = async () => {
      setClimateData(prev => ({ ...prev, isLoading: true }));
      try {
        const [lat, lon] = location.coordinates;
        // Fetching 2023 data as a full typical year
        const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2023-01-01&end_date=2023-12-31&daily=shortwave_radiation_sum,precipitation_sum,wind_speed_10m_max&timezone=auto`);
        
        if (!res.ok) throw new Error("Failed to fetch climate data");
        
        const data = await res.json();
        
        if (data && data.daily) {
          // shortwave_radiation_sum is in MJ/m². 1 MJ = 0.277778 kWh.
          const solarSumMJ = data.daily.shortwave_radiation_sum.reduce((a: number, b: number) => a + (b || 0), 0);
          const solarKWh = Math.round(solarSumMJ * 0.277778);
          
          const precipSum = Math.round(data.daily.precipitation_sum.reduce((a: number, b: number) => a + (b || 0), 0));
          
          // wind_speed_10m_max is in km/h. Convert to m/s and estimate mean (~50% of max for a rough daily average)
          const windMaxSum = data.daily.wind_speed_10m_max.reduce((a: number, b: number) => a + (b || 0), 0);
          const windDays = data.daily.wind_speed_10m_max.filter((v: number) => v !== null).length || 365;
          const windMeanMs = Number(((windMaxSum / windDays) / 3.6 * 0.5).toFixed(1));
          
          setClimateData({
            solar: solarKWh,
            wind: windMeanMs,
            precipitation: precipSum,
            isLoading: false
          });
        }
      } catch (error) {
        console.error("Climate fetch error:", error);
        setClimateData(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    const timeout = setTimeout(fetchClimate, 1000);
    return () => clearTimeout(timeout);
  }, [location.coordinates, setClimateData]);

  const handleSelectSuggestion = (suggestion: any) => {
    isFromSearch.current = true;
    const newAddress = suggestion.display_name;
    const newCoords: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    
    setSearchQuery(newAddress);
    setLocation(prev => ({ ...prev, address: newAddress, coordinates: newCoords }));
    setShowSuggestions(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Геолокація не підтримується вашим браузером");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        isFromSearch.current = false; // Trigger reverse geocoding
        setLocation(prev => ({
          ...prev,
          coordinates: [position.coords.latitude, position.coords.longitude]
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Не вдалося отримати ваше місцезнаходження. Перевірте дозволи.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Локація об&apos;єкта</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Вкажіть місцезнаходження для отримання точних кліматичних даних (інсоляція, швидкість вітру).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search & Map */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="relative z-10 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl hover:z-20 transition-all duration-200">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Пошук адреси або координат
            </label>
            <div className="relative" ref={wrapperRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Введіть адресу..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                title="Моє місцезнаходження"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
              </button>
              
              {/* Dropdown Suggestions */}
              {showSuggestions && (searchQuery.length > 2) && (
                <div className="absolute z-[500] w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 text-sm text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      Пошук...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <li 
                          key={i}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                          onClick={() => handleSelectSuggestion(s)}
                        >
                          {s.display_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-slate-500 text-center">Нічого не знайдено</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Місце установки (Опціонально)
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 text-xs leading-relaxed text-white bg-slate-900 dark:bg-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 dark:border-slate-600">
                    Вкажіть конкретне місце монтажу (наприклад, &apos;дах будинку&apos;, &apos;наземна конструкція&apos;, &apos;балкон&apos;). Це допоможе точніше оцінити умови затінення та вітрового навантаження.
                    <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Наприклад: балкон, дах гаража, дах будинку..."
                  value={location.installationSite}
                  onChange={(e) => setLocation(prev => ({ ...prev, installationSite: e.target.value }))}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Вкажіть, де саме планується монтаж обладнання.
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm bg-slate-100 dark:bg-slate-800 min-h-[400px] flex-1 z-0">
            <MapPicker 
              coordinates={location.coordinates} 
              setCoordinates={(c) => setLocation({ ...location, coordinates: c })} 
            />
            
            {/* Coordinates Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 pointer-events-none">
              {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-500" />
              Кліматичні дані (Автоматично)
              {climateData.isLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-auto" />}
            </h3>
            
            <div className="space-y-3 relative">
              {climateData.isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] z-10 rounded-xl" />
              )}
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Інсоляція</span>
                </div>
                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                  {climateData.solar.toLocaleString('en-US')} кВт·год/м²
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Сер. швидкість вітру</span>
                </div>
                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                  {climateData.wind} м/с
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-sky-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Опади (річні)</span>
                </div>
                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                  {climateData.precipitation.toLocaleString('en-US')} мм
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
