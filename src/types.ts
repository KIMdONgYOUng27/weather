export type WeatherProvider = 'open-meteo' | 'openweathermap';

export interface LocationInfo {
  lat: number;
  lng: number;
  name: string;
  country: string;
  region?: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  weatherDescription: string;
  weatherCategory: 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  humidity: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // km
  precipitationProbability: number; // %
  precipitation: number; // mm
  sunrise: string;
  sunset: string;
  isDay: boolean;
  timestamp: number;
}

export interface HourlyForecast {
  time: string; // e.g. "14:00"
  fullTime: string;
  temp: number;
  weatherCode: number;
  weatherDescription: string;
  weatherCategory: 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  precipitationProbability: number; // %
  precipitation: number; // mm
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  weatherDescription: string;
  weatherCategory: 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  precipitationProbability: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface AirQuality {
  aqi: number; // 1 (좋음) ~ 5 (매우 나쁨)
  aqiText: '매우 좋음' | '좋음' | '보통' | '나쁨' | '매우 나쁨';
  aqiColor: string;
  pm2_5: number; // 초미세먼지 μg/m³
  pm10: number; // 미세먼지 μg/m³
  pm25Status: '좋음' | '보통' | '나쁨' | '매우 나쁨';
  pm10Status: '좋음' | '보통' | '나쁨' | '매우 나쁨';
  co?: number;
  no2?: number;
  o3?: number;
  so2?: number;
}

export interface WeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  airQuality?: AirQuality;
  provider: WeatherProvider;
  updatedAt: string;
}

export interface WeatherSettings {
  provider: WeatherProvider;
  openWeatherApiKey: string;
  unit: 'celsius' | 'fahrenheit';
}

export interface PresetLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
}
