import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Імпортуємо класи з твого розрахункового ядра
from engine import HybridSimulator, SolarPanel, WindTurbine, MicroHydro

app = FastAPI()

# 1. Налаштування CORS (Критично важливо для зв'язку з Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Дозволяє запити з будь-якого джерела (для розробки)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Pydantic моделі (Точно повторюють структуру стейтів з твого dashboard.tsx)
class LocationData(BaseModel):
    address: str
    coordinates: List[float]  # [latitude, longitude]

class ConfigData(BaseModel):
    solar: bool
    wind: bool
    hydro: bool
    battery: bool

class EquipmentData(BaseModel):
    solar: float
    solarTilt: float
    solarAzimuth: float
    solarLosses: float
    wind: float
    windHubHeight: int
    hydro: float
    hydroHead: float
    hydroFlow: float
    battery: float
    batteryDod: float

class ConsumptionData(BaseModel):
    annual: float
    profileType: str

class SimulationRequest(BaseModel):
    location: LocationData
    config: ConfigData
    equipment: EquipmentData
    consumption: ConsumptionData


# 3. Головний API-маршрут для розрахунку
@app.post("/api/simulate")
async def run_simulation(req: SimulationRequest):
    try:
        # Витягуємо координати
        lat = req.location.coordinates[0]
        lon = req.location.coordinates[1]
        
        # Переводимо річне споживання (наприклад, 12000) у середнє годинне, як того вимагає engine.py
        hourly_consumption = req.consumption.annual / 8760.0
        
        sources = []
        
        # Якщо сонячні панелі увімкнені в конфігурації
        if req.config.solar:
            # Твій engine.py очікує площу в м². На фронтенді ти задаєш потужність у кВт.
            # Приблизна формула: 1 кВт = 5 м² (при 20% ефективності)
            area = req.equipment.solar * 5.0
            
            # Перетворюємо відсоток втрат з фронтенду (наприклад, 14%) у performance_ratio (0.86)
            performance = 1.0 - (req.equipment.solarLosses / 100.0)
            
            sources.append(SolarPanel(
                area_m2=area, 
                efficiency=0.20, 
                performance_ratio=performance
            ))
            
        # Якщо вітряк увімкнений
        if req.config.wind:
            hub_height = req.equipment.windHubHeight
            # engine.py викидає помилку, якщо висота не 10 або 100.
            # Оскільки на фронтенді за замовчуванням стоїть 15, "округлюємо" це значення для API погоди.
            if hub_height not in [10, 100]:
                hub_height = 10 if hub_height < 55 else 100
                
            sources.append(WindTurbine(
                rated_power_kw=req.equipment.wind,
                cut_in_speed=3.0, 
                rated_speed=10.0, 
                cut_out_speed=25.0, 
                hub_height=hub_height
            ))
            
        # Якщо мікроГЕС увімкнена
        if req.config.hydro:
            sources.append(MicroHydro(
                head_m=req.equipment.hydroHead,
                flow_l_s=req.equipment.hydroFlow,
                efficiency=0.80
            ))
            
        # Створюємо симулятор і передаємо йому всі підготовлені дані
        simulator = HybridSimulator(
            sources=sources,
            latitude=lat,
            longitude=lon,
            hourly_consumption_kwh=hourly_consumption
        )
        
        # Запускаємо ядро (воно скачає погоду з Open-Meteo і проведе розрахунок)
        results = simulator.run_simulation()
        
        # Відправляємо результати назад у React
        return {"status": "success", "data": results}
        
    except Exception as e:
        # Якщо сталася помилка (наприклад, Open-Meteo недоступний), повертаємо 500 статус
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Запускаємо через об'єкт app, а не через рядок "main:app"
    uvicorn.run(app, host="127.0.0.1", port=8000)