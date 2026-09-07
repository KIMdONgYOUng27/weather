import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Info,
  Shirt,
  Sparkles,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
} from 'lucide-react';
import { WeatherData, WeatherSettings } from '../types';
import { convertTemp, getClothingAdvice, getUvIndexDescription, getWindDirectionText } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface WeatherDashboardProps {
  weather: WeatherData;
  settings: WeatherSettings;
  fallbackNotice?: string;
  onOpenSettings: () => void;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  weather,
  settings,
  fallbackNotice,
  onOpenSettings,
}) => {
  const { current, location, hourly, daily, airQuality, provider, updatedAt } = weather;
  const unit = settings.unit;
  const unitSymbol = unit === 'celsius' ? '°C' : '°F';

  const curTemp = convertTemp(current.temp, unit);
  const feelsLike = convertTemp(current.feelsLike, unit);
  const tempMin = convertTemp(current.tempMin, unit);
  const tempMax = convertTemp(current.tempMax, unit);

  const uvInfo = getUvIndexDescription(current.uvIndex);
  const windDir = getWindDirectionText(current.windDirection);
  const clothing = getClothingAdvice(current.temp, current.weatherCategory);

  return (
    <div id="weather-dashboard-root" className="flex flex-col gap-6 w-full text-slate-100">
      {/* 알림 메시지 (OpenWeatherMap API 오류 시 등) */}
      {fallbackNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{fallbackNotice}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="ml-2 underline text-amber-300 hover:text-amber-100 cursor-pointer"
            >
              API 키 재설정하기
            </button>
          </div>
        </div>
      )}

      {/* 1. 메인 현재 날씨 카드 */}
      <div
        id="current-weather-hero-card"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950/90 border border-slate-700/70 shadow-2xl backdrop-blur-md"
      >
        {/* 장식용 은은한 조명 효과 */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* 상단: 지역명 & 갱신시각 & 제공자 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="current-location-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {location.name}
                </h2>
                {location.country && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {location.country}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                위도: {location.lat.toFixed(4)}° · 경도: {location.lng.toFixed(4)}°
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-medium">
                {provider === 'openweathermap' ? 'OpenWeatherMap API' : 'Open-Meteo Precision API'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {updatedAt} 기준
              </span>
            </div>
          </div>

          {/* 중앙: 대형 기온 및 날씨 아이콘 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
            <div className="flex items-center gap-6">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
                <WeatherIcon category={current.weatherCategory} isDay={current.isDay} className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <div>
                <div className="flex items-baseline">
                  <span id="current-temperature-display" className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                    {curTemp}
                  </span>
                  <span className="text-2xl sm:text-3xl font-light text-slate-400 ml-1">
                    {unitSymbol}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base sm:text-lg font-semibold text-slate-100">
                    {current.weatherDescription}
                  </span>
                  <span className="text-xs text-slate-400">
                    (체감 {feelsLike}{unitSymbol})
                  </span>
                </div>
              </div>
            </div>

            {/* 최저/최고 및 강수 확률 미니 칩 */}
            <div className="flex flex-wrap sm:flex-col gap-2.5 sm:items-end justify-start sm:justify-center">
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs">
                <div className="flex items-center text-blue-400 gap-1 font-semibold">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>최저 {tempMin}{unitSymbol}</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center text-rose-400 gap-1 font-semibold">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>최고 {tempMax}{unitSymbol}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-medium">
                <Umbrella className="w-3.5 h-3.5" />
                <span>강수 확률 {Math.round(current.precipitationProbability)}%</span>
              </div>
            </div>
          </div>

          {/* 하단: 핵심 기상 지표 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>습도</span>
              </div>
              <span className="text-base font-bold text-white font-mono">{current.humidity}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>풍속 / 풍향</span>
              </div>
              <span className="text-base font-bold text-white font-mono">
                {current.windSpeed} <span className="text-xs font-normal text-slate-400">km/h</span> ({windDir})
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>자외선 지수</span>
              </div>
              <span className={`text-base font-bold font-mono ${uvInfo.color}`}>
                {current.uvIndex} <span className="text-xs font-normal">({uvInfo.text})</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>기압</span>
              </div>
              <span className="text-base font-bold text-white font-mono">
                {Math.round(current.pressure)} <span className="text-xs font-normal text-slate-400">hPa</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>가시거리</span>
              </div>
              <span className="text-base font-bold text-white font-mono">
                {current.visibility} <span className="text-xs font-normal text-slate-400">km</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                <span>일출 / 일몰</span>
              </div>
              <span className="text-xs font-semibold text-white font-mono">
                {current.sunrise} / {current.sunset}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 시간별 예보 (24시간) 가로 스크롤 카드 */}
      <div id="hourly-forecast-card" className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>시간별 예보 (24시간)</span>
          </h3>
          <span className="text-xs text-slate-400">기온 및 강수확률</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {hourly.map((h, i) => {
            const hTemp = convertTemp(h.temp, unit);
            return (
              <div
                key={`${h.time}-${i}`}
                className="flex flex-col items-center justify-between min-w-[72px] p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-colors shrink-0 gap-2"
              >
                <span className="text-xs text-slate-400 font-mono">
                  {i === 0 ? '지금' : h.time}
                </span>
                <WeatherIcon category={h.weatherCategory} isDay={h.isDay} className="w-7 h-7" />
                <span className="text-sm font-bold text-white font-mono">
                  {hTemp}{unitSymbol}
                </span>

                {h.precipitationProbability > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                    {h.precipitationProbability}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">
                    0%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 2컬럼 레이아웃: 주간 예보 & (대기질 + 옷차림 추천) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주간 예보 (7-Day Forecast) */}
        <div id="weekly-forecast-card" className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>주간 예보</span>
              </h3>
              <span className="text-xs text-slate-400">최저 / 최고 기온</span>
            </div>

            <div className="flex flex-col divide-y divide-slate-800/80">
              {daily.map((d, i) => {
                const dMin = convertTemp(d.tempMin, unit);
                const dMax = convertTemp(d.tempMax, unit);
                return (
                  <div key={d.date} className="flex items-center justify-between py-3 gap-3">
                    <div className="w-16">
                      <span className={`text-sm ${i === 0 ? 'font-bold text-cyan-400' : 'font-medium text-slate-200'}`}>
                        {d.dayOfWeek}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <WeatherIcon category={d.weatherCategory} isDay={true} className="w-5 h-5 shrink-0" />
                      <span className="text-xs text-slate-400 truncate max-w-[90px] sm:max-w-[130px]">
                        {d.weatherDescription}
                      </span>
                    </div>

                    {d.precipitationProbability > 0 && (
                      <span className="text-xs text-cyan-400 font-medium w-12 text-right">
                        {d.precipitationProbability}%
                      </span>
                    )}

                    <div className="flex items-center gap-3 w-28 justify-end text-xs font-mono">
                      <span className="text-blue-400 font-medium">{dMin}°</span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500 rounded-full" />
                      </div>
                      <span className="text-rose-400 font-bold">{dMax}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 대기질 & 옷차림 추천 복합 카드 */}
        <div className="flex flex-col gap-6">
          {/* 대기질 (Air Quality) */}
          <div id="air-quality-card" className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>대기질 및 미세먼지</span>
              </h3>
              {airQuality && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  airQuality.aqi <= 2 ? 'bg-emerald-500/20 text-emerald-300' :
                  airQuality.aqi === 3 ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  통합 상태: {airQuality.aqiText}
                </span>
              )}
            </div>

            {airQuality ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-xs text-slate-400">초미세먼지 (PM2.5)</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-black text-white font-mono">{airQuality.pm2_5}</span>
                    <span className="text-xs text-slate-400">μg/m³</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-md ${
                    airQuality.pm25Status === '좋음' ? 'bg-teal-500/20 text-teal-300' :
                    airQuality.pm25Status === '보통' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {airQuality.pm25Status}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-xs text-slate-400">미세먼지 (PM10)</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-black text-white font-mono">{airQuality.pm10}</span>
                    <span className="text-xs text-slate-400">μg/m³</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-md ${
                    airQuality.pm10Status === '좋음' ? 'bg-teal-500/20 text-teal-300' :
                    airQuality.pm10Status === '보통' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {airQuality.pm10Status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">해당 지역의 대기질 데이터를 불러올 수 없습니다.</p>
            )}
          </div>

          {/* 오늘 날씨 맞춤 옷차림 팁 */}
          <div id="clothing-recommendation-card" className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">날씨 맞춤 옷차림 제안</h3>
            </div>
            <p className="text-sm font-semibold text-cyan-300 mb-1">{clothing.headline}</p>
            <p className="text-xs text-slate-400 mb-3">{clothing.recommendation}</p>

            <div className="flex flex-wrap gap-1.5">
              {clothing.items.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
