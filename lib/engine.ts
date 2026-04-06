export interface WeatherHour {
  time: string;
  global_horizontal_irradiance: number;
  wind_speed_10m: number;
  wind_speed_100m: number;
  [key: string]: any;
}

export interface EnergySource {
  calculateGeneration(weatherHour: WeatherHour): number;
}

export class SolarPanel implements EnergySource {
  constructor(
    public areaM2: number,
    public efficiency: number,
    public performanceRatio: number = 0.85
  ) {}

  calculateGeneration(weatherHour: WeatherHour): number {
    // GHI (Global Horizontal Irradiance) in W/m^2
    const ghiWm2 = weatherHour.global_horizontal_irradiance || 0.0;
    const energyKwh = (ghiWm2 * this.areaM2 * this.efficiency * this.performanceRatio) / 1000.0;
    return energyKwh;
  }
}

export class WindTurbine implements EnergySource {
  constructor(
    public ratedPowerKw: number,
    public cutInSpeed: number,
    public ratedSpeed: number,
    public cutOutSpeed: number,
    public hubHeight: 10 | 100
  ) {
    if (hubHeight !== 10 && hubHeight !== 100) {
      throw new Error("Hub height must be 10 or 100 meters to match API data.");
    }
  }

  calculateGeneration(weatherHour: WeatherHour): number {
    const speedKey = `wind_speed_${this.hubHeight}m` as keyof WeatherHour;
    const speed = (weatherHour[speedKey] as number) || 0.0;

    if (speed < this.cutInSpeed || speed > this.cutOutSpeed) {
      return 0.0;
    } else if (speed >= this.cutInSpeed && speed < this.ratedSpeed) {
      // Simplified cubic interpolation for the power curve
      return this.ratedPowerKw * Math.pow((speed - this.cutInSpeed) / (this.ratedSpeed - this.cutInSpeed), 3);
    } else {
      // Between rated_speed and cut_out_speed
      return this.ratedPowerKw;
    }
  }
}

export class MicroHydro implements EnergySource {
  public powerKw: number;

  constructor(
    public headM: number,
    public flowLs: number,
    public efficiency: number = 0.80
  ) {
    // Calculate constant base power in kW
    // Power_kW = (efficiency * density(1000 kg/m3) * gravity(9.81 m/s2) * head_m * flow_m3_s) / 1000
    const flowM3s = this.flowLs / 1000.0;
    this.powerKw = (this.efficiency * 1000 * 9.81 * this.headM * flowM3s) / 1000.0;
  }

  calculateGeneration(weatherHour: WeatherHour): number {
    // Generates constant power 24/7, so hourly energy (kWh) equals power (kW) * 1h
    return this.powerKw;
  }
}

export class HybridSimulator {
  constructor(
    public sources: EnergySource[],
    public latitude: number,
    public longitude: number,
    public hourlyConsumptionKwh: number
  ) {}

  async fetchWeatherData(): Promise<WeatherHour[]> {
    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.searchParams.append("latitude", this.latitude.toString());
    url.searchParams.append("longitude", this.longitude.toString());
    url.searchParams.append("start_date", "2025-01-01");
    url.searchParams.append("end_date", "2025-12-31");
    url.searchParams.append("hourly", "shortwave_radiation,wind_speed_10m,wind_speed_100m");
    url.searchParams.append("timezone", "auto");

    console.log(`Fetching weather data for Lat: ${this.latitude}, Lon: ${this.longitude}...`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data = await response.json();
    const hourlyData = data.hourly || {};
    const times = hourlyData.time || [];
    const ghi = hourlyData.shortwave_radiation || [];
    const ws10 = hourlyData.wind_speed_10m || [];
    const ws100 = hourlyData.wind_speed_100m || [];

    const weatherHours: WeatherHour[] = [];
    for (let i = 0; i < times.length; i++) {
      weatherHours.push({
        time: times[i],
        global_horizontal_irradiance: ghi[i] !== null ? ghi[i] : 0.0,
        wind_speed_10m: ws10[i] !== null ? ws10[i] : 0.0,
        wind_speed_100m: ws100[i] !== null ? ws100[i] : 0.0,
      });
    }

    console.log(`Successfully fetched ${weatherHours.length} hours of data.`);
    return weatherHours;
  }

  async runSimulation(): Promise<Record<string, number>> {
    const weatherData = await this.fetchWeatherData();

    let totalSolar = 0.0;
    let totalWind = 0.0;
    let totalHydro = 0.0;
    let totalGeneration = 0.0;
    let totalNetEnergy = 0.0;

    for (const hourData of weatherData) {
      let hourSolar = 0.0;
      let hourWind = 0.0;
      let hourHydro = 0.0;

      for (const source of this.sources) {
        const gen = source.calculateGeneration(hourData);
        if (source instanceof SolarPanel) {
          hourSolar += gen;
        } else if (source instanceof WindTurbine) {
          hourWind += gen;
        } else if (source instanceof MicroHydro) {
          hourHydro += gen;
        }
      }

      const hourTotal = hourSolar + hourWind + hourHydro;
      const hourNet = hourTotal - this.hourlyConsumptionKwh;

      totalSolar += hourSolar;
      totalWind += hourWind;
      totalHydro += hourHydro;
      totalGeneration += hourTotal;
      totalNetEnergy += hourNet;
    }

    return {
      "Total Annual Solar (kWh)": Number(totalSolar.toFixed(2)),
      "Total Annual Wind (kWh)": Number(totalWind.toFixed(2)),
      "Total Annual Hydro (kWh)": Number(totalHydro.toFixed(2)),
      "Total Annual Generation (kWh)": Number(totalGeneration.toFixed(2)),
      "Total Net Energy (kWh)": Number(totalNetEnergy.toFixed(2))
    };
  }
}
