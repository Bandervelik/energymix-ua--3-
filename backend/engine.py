import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class EnergySource(ABC):
    """Abstract base class for all renewable energy sources."""
    
    @abstractmethod
    def calculate_generation(self, weather_hour: Dict[str, Any]) -> float:
        """
        Calculate energy generation for a single hour.
        :param weather_hour: Dictionary containing weather data for the hour.
        :return: Generated energy in kWh.
        """
        pass

class SolarPanel(EnergySource):
    """Solar Photovoltaic Panel energy source."""
    
    def __init__(self, area_m2: float, efficiency: float, performance_ratio: float = 0.85):
        self.area_m2 = area_m2
        self.efficiency = efficiency
        self.performance_ratio = performance_ratio

    def calculate_generation(self, weather_hour: Dict[str, Any]) -> float:
        # GHI (Global Horizontal Irradiance) in W/m^2
        ghi_w_m2 = weather_hour.get('global_horizontal_irradiance', 0.0)
        energy_kwh = (ghi_w_m2 * self.area_m2 * self.efficiency * self.performance_ratio) / 1000.0
        return energy_kwh

class WindTurbine(EnergySource):
    """Wind Turbine energy source."""
    
    def __init__(self, rated_power_kw: float, cut_in_speed: float, rated_speed: float, cut_out_speed: float, hub_height: int):
        self.rated_power_kw = rated_power_kw
        self.cut_in_speed = cut_in_speed
        self.rated_speed = rated_speed
        self.cut_out_speed = cut_out_speed
        if hub_height not in [10, 100]:
            raise ValueError("Hub height must be 10 or 100 meters to match API data.")
        self.hub_height = hub_height

    def calculate_generation(self, weather_hour: Dict[str, Any]) -> float:
        speed_key = f'wind_speed_{self.hub_height}m'
        speed = weather_hour.get(speed_key, 0.0)

        if speed < self.cut_in_speed or speed > self.cut_out_speed:
            return 0.0
        elif self.cut_in_speed <= speed < self.rated_speed:
            # Simplified cubic interpolation for the power curve
            return self.rated_power_kw * (((speed - self.cut_in_speed) / (self.rated_speed - self.cut_in_speed)) ** 3)
        else:
            # Between rated_speed and cut_out_speed
            return self.rated_power_kw

class MicroHydro(EnergySource):
    """Micro Hydroelectric energy source."""
    
    def __init__(self, head_m: float, flow_l_s: float, efficiency: float = 0.80):
        self.head_m = head_m
        self.flow_l_s = flow_l_s
        self.efficiency = efficiency
        
        # Calculate constant base power in kW
        # Power_kW = (efficiency * density(1000 kg/m3) * gravity(9.81 m/s2) * head_m * flow_m3_s) / 1000
        flow_m3_s = self.flow_l_s / 1000.0
        self.power_kw = (self.efficiency * 1000 * 9.81 * self.head_m * flow_m3_s) / 1000.0

    def calculate_generation(self, weather_hour: Dict[str, Any]) -> float:
        # Generates constant power 24/7, so hourly energy (kWh) equals power (kW) * 1h
        return self.power_kw

class HybridSimulator:
    """Simulator to run the hybrid energy system over a full year."""
    
    def __init__(self, sources: List[EnergySource], latitude: float, longitude: float, hourly_consumption_kwh: float):
        self.sources = sources
        self.latitude = latitude
        self.longitude = longitude
        self.hourly_consumption_kwh = hourly_consumption_kwh

    def fetch_weather_data(self) -> List[Dict[str, Any]]:
        """Fetches historical weather data from Open-Meteo API."""
        url = "https://archive-api.open-meteo.com/v1/archive"
        
        # Note: Open-Meteo uses 'shortwave_radiation' for GHI
        params = {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "hourly": "shortwave_radiation,wind_speed_10m,wind_speed_100m",
            "timezone": "auto"
        }
        
        print(f"Fetching weather data for Lat: {self.latitude}, Lon: {self.longitude}...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        hourly_data = data.get("hourly", {})
        times = hourly_data.get("time", [])
        
        # Map shortwave_radiation to global_horizontal_irradiance as requested
        ghi = hourly_data.get("shortwave_radiation", [])
        ws10 = hourly_data.get("wind_speed_10m", [])
        ws100 = hourly_data.get("wind_speed_100m", [])

        weather_hours = []
        for i in range(len(times)):
            weather_hours.append({
                "time": times[i],
                "global_horizontal_irradiance": ghi[i] if ghi[i] is not None else 0.0,
                "wind_speed_10m": ws10[i] if ws10[i] is not None else 0.0,
                "wind_speed_100m": ws100[i] if ws100[i] is not None else 0.0,
            })
            
        print(f"Successfully fetched {len(weather_hours)} hours of data.")
        return weather_hours

    def run_simulation(self) -> Dict[str, float]:
        """Runs the hourly simulation and returns an annual summary."""
        weather_data = self.fetch_weather_data()
        
        total_solar = 0.0
        total_wind = 0.0
        total_hydro = 0.0
        total_generation = 0.0
        total_net_energy = 0.0

        for hour_data in weather_data:
            hour_solar = 0.0
            hour_wind = 0.0
            hour_hydro = 0.0

            # Calculate generation for each source
            for source in self.sources:
                gen = source.calculate_generation(hour_data)
                if isinstance(source, SolarPanel):
                    hour_solar += gen
                elif isinstance(source, WindTurbine):
                    hour_wind += gen
                elif isinstance(source, MicroHydro):
                    hour_hydro += gen

            hour_total = hour_solar + hour_wind + hour_hydro
            hour_net = hour_total - self.hourly_consumption_kwh

            # Accumulate annual totals
            total_solar += hour_solar
            total_wind += hour_wind
            total_hydro += hour_hydro
            total_generation += hour_total
            total_net_energy += hour_net

        return {
            "Total Annual Solar (kWh)": round(total_solar, 2),
            "Total Annual Wind (kWh)": round(total_wind, 2),
            "Total Annual Hydro (kWh)": round(total_hydro, 2),
            "Total Annual Generation (kWh)": round(total_generation, 2),
            "Total Net Energy (kWh)": round(total_net_energy, 2)
        }

if __name__ == "__main__":
    # Dummy coordinates for Uzhhorod, Ukraine
    LATITUDE = 48.62
    LONGITUDE = 22.28
    HOURLY_CONSUMPTION = 2.5  # kWh per hour (approx 21,900 kWh/year)

    # Instantiate energy sources
    solar_array = SolarPanel(area_m2=50.0, efficiency=0.20, performance_ratio=0.85)
    wind_turbine = WindTurbine(rated_power_kw=10.0, cut_in_speed=3.0, rated_speed=10.0, cut_out_speed=25.0, hub_height=10)
    micro_hydro = MicroHydro(head_m=5.0, flow_l_s=50.0, efficiency=0.80)

    sources = [solar_array, wind_turbine, micro_hydro]

    # Initialize and run simulator
    simulator = HybridSimulator(
        sources=sources, 
        latitude=LATITUDE, 
        longitude=LONGITUDE, 
        hourly_consumption_kwh=HOURLY_CONSUMPTION
    )
    
    try:
        results = simulator.run_simulation()
        print("\n--- Simulation Results (2025) ---")
        for key, value in results.items():
            print(f"{key}: {value:,.2f}")
    except Exception as e:
        print(f"Simulation failed: {e}")
