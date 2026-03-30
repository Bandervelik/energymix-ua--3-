import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List

import threading
import time
import os
import sys
import webview  # Нова бібліотека для нативного вікна
from fastapi.staticfiles import StaticFiles

from engine import HybridSimulator, SolarPanel, WindTurbine, MicroHydro

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Оновлені Pydantic моделі (без Deprecation Warnings)
class LocationData(BaseModel):
    model_config = ConfigDict(extra='allow')
    address: str
    coordinates: List[float]

class ConfigData(BaseModel):
    model_config = ConfigDict(extra='allow')
    solar: bool
    wind: bool
    hydro: bool
    battery: bool

class EquipmentData(BaseModel):
    model_config = ConfigDict(extra='allow')
    solar: float = 0.0
    solarLosses: float = 14.0
    wind: float = 0.0
    windHubHeight: float = 15.0
    hydro: float = 0.0
    hydroHead: float = 10.0
    hydroFlow: float = 25.0
    battery: float = 0.0

class ConsumptionData(BaseModel):
    model_config = ConfigDict(extra='allow')
    annual: float
    profileType: str

class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra='allow')
    location: LocationData
    config: ConfigData
    equipment: EquipmentData
    consumption: ConsumptionData


@app.post("/api/simulate")
async def run_simulation(req: SimulationRequest):
    try:
        lat = req.location.coordinates[0]
        lon = req.location.coordinates[1]
        
        hourly_consumption = req.consumption.annual / 8760.0
        sources = []
        
        if req.config.solar:
            area = req.equipment.solar * 5.0
            performance = 1.0 - (req.equipment.solarLosses / 100.0)
            sources.append(SolarPanel(
                area_m2=area, 
                efficiency=0.20, 
                performance_ratio=performance
            ))
            
        if req.config.wind:
            hub_height = int(req.equipment.windHubHeight)
            if hub_height not in [10, 100]:
                hub_height = 10 if hub_height < 55 else 100
                
            sources.append(WindTurbine(
                rated_power_kw=req.equipment.wind,
                cut_in_speed=3.0, 
                rated_speed=10.0, 
                cut_out_speed=25.0, 
                hub_height=hub_height
            ))
            
        if req.config.hydro:
            sources.append(MicroHydro(
                head_m=req.equipment.hydroHead,
                flow_l_s=req.equipment.hydroFlow,
                efficiency=0.80
            ))
            
        simulator = HybridSimulator(
            sources=sources,
            latitude=lat,
            longitude=lon,
            hourly_consumption_kwh=hourly_consumption
        )
        
        results = simulator.run_simulation()
        return {"status": "success", "data": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- БЛОК ДЛЯ НАТИВНОГО ВІКНА ---
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

out_dir = os.path.join(base_path, "out")

if os.path.exists(out_dir):
    app.mount("/", StaticFiles(directory=out_dir, html=True), name="frontend")
else:
    print(f"ПОПЕРЕДЖЕННЯ: Папку фронтенду не знайдено за адресою {out_dir}")

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    # Запускаємо сервер FastAPI у фоновому потоці
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Даємо серверу секунду на запуск
    time.sleep(1)
    
    # Створюємо і відкриваємо красиве нативне вікно програми
    window = webview.create_window(
        title='EnergyMix UA - EcoHybridPlanner', 
        url='http://127.0.0.1:8000',
        width=1280,
        height=800,
        min_size=(1024, 768),
        background_color='#0f172a' # Темний фон під час завантаження
    )
    
    # Запускаємо головний цикл вікна
    webview.start()