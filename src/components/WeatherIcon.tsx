import React from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';
import { CurrentWeather } from '../types';

interface WeatherIconProps {
  category: CurrentWeather['weatherCategory'];
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  category,
  isDay = true,
  className = 'w-6 h-6',
  size,
}) => {
  switch (category) {
    case 'clear':
      return isDay ? (
        <Sun className={`${className} text-amber-400 fill-amber-400/20`} size={size} />
      ) : (
        <Moon className={`${className} text-indigo-300 fill-indigo-300/20`} size={size} />
      );
    case 'partly-cloudy':
      return isDay ? (
        <CloudSun className={`${className} text-amber-300`} size={size} />
      ) : (
        <CloudMoon className={`${className} text-indigo-300`} size={size} />
      );
    case 'cloudy':
      return <Cloud className={`${className} text-slate-400 fill-slate-500/20`} size={size} />;
    case 'fog':
      return <CloudFog className={`${className} text-teal-300`} size={size} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-400`} size={size} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-400 fill-blue-500/20`} size={size} />;
    case 'snow':
      return <CloudSnow className={`${className} text-cyan-200 fill-cyan-200/20`} size={size} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-violet-400 fill-violet-400/20`} size={size} />;
    default:
      return <Sun className={`${className} text-amber-400`} size={size} />;
  }
};
