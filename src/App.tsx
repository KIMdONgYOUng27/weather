import React, { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MapComponent } from './components/MapComponent';
import { WeatherDashboard } from './components/WeatherDashboard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SavedLocations } from './components/SavedLocations';
import { LocationInfo, WeatherData, WeatherSettings } from './types';
import { fetchWeatherData, reverseGeocode } from './services/weatherService';
import { AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'weather_app_settings';
const STORAGE_KEY_SAVED_LOCS = 'weather_app_saved_locations';

export default function App() {
  // 1. 설정 상태 (로컬 스토리지 연동)
  const [settings, setSettings] = useState<WeatherSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to read settings from storage', e);
    }
    return {
      provider: 'open-meteo',
      openWeatherApiKey: (import.meta as any).env?.VITE_OPENWEATHER_API_KEY || '',
      unit: 'celsius',
    };
  });

  // 2. 관심 지역 목록
  const [savedLocations, setSavedLocations] = useState<LocationInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_LOCS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read saved locations', e);
    }
    return [
      { lat: 37.5665, lng: 126.978, name: '서울', country: '대한민국' },
      { lat: 33.4996, lng: 126.5312, name: '제주도', country: '대한민국' },
      { lat: 35.1796, lng: 129.0756, name: '부산', country: '대한민국' },
    ];
  });

  // 3. 현재 선택된 위치 (기본값: 서울)
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo>({
    lat: 37.5665,
    lng: 126.978,
    name: '서울',
    country: '대한민국',
  });

  // 4. 날씨 데이터 및 통신 상태
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | undefined>();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // 설정 저장 핸들러
  const handleSaveSettings = (newSettings: WeatherSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Storage write error', e);
    }
  };

  // 섭씨 / 화씨 토글
  const handleToggleUnit = () => {
    const newUnit = settings.unit === 'celsius' ? 'fahrenheit' : 'celsius';
    const updated = { ...settings, unit: newUnit };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // 관심 지역 저장/해제 토글
  const handleToggleSaveLocation = (loc: LocationInfo) => {
    setSavedLocations((prev) => {
      const exists = prev.some(
        (item) =>
          Math.abs(item.lat - loc.lat) < 0.01 && Math.abs(item.lng - loc.lng) < 0.01
      );
      let nextList: LocationInfo[];
      if (exists) {
        nextList = prev.filter(
          (item) =>
            Math.abs(item.lat - loc.lat) >= 0.01 || Math.abs(item.lng - loc.lng) >= 0.01
        );
      } else {
        nextList = [...prev, loc];
      }
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_LOCS, JSON.stringify(nextList));
      } catch (e) {
        console.error(e);
      }
      return nextList;
    });
  };

  // 날씨 데이터 가져오기 함수
  const loadWeatherData = useCallback(
    async (loc: LocationInfo) => {
      setIsLoading(true);
      setError(null);
      setFallbackNotice(undefined);

      try {
        const res = await fetchWeatherData(loc.lat, loc.lng, settings, loc);
        setWeatherData(res.data);
        setSelectedLocation(res.data.location);
        if (res.fallbackNotice) {
          setFallbackNotice(res.fallbackNotice);
        }
      } catch (err: any) {
        console.error('Weather load error:', err);
        setError(err.message || '날씨 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [settings]
  );

  // 위치 선택 처리 (지도 클릭 또는 검색 또는 프리셋 클릭)
  const handleSelectLocation = async (
    lat: number,
    lng: number,
    name?: string,
    country?: string
  ) => {
    let locInfo: LocationInfo;
    if (name) {
      locInfo = { lat, lng, name, country: country || '' };
    } else {
      // 이름이 없으면 역지오코딩 비동기 수행
      const geo = await reverseGeocode(lat, lng);
      locInfo = { lat, lng, name: geo.name, country: geo.country, region: geo.region };
    }
    setSelectedLocation(locInfo);
    loadWeatherData(locInfo);
  };

  // 초기 로딩 및 설정 변경 시 날씨 재로딩
  useEffect(() => {
    loadWeatherData(selectedLocation);
  }, [settings.provider, settings.openWeatherApiKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* 상단 통합 헤더 */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onToggleUnit={handleToggleUnit}
        onSelectLocation={handleSelectLocation}
        currentLocationName={selectedLocation.name}
      />

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {/* 관심 지역 북마크 바 */}
        <SavedLocations
          savedList={savedLocations}
          currentLocation={selectedLocation}
          onSelect={(loc) => {
            setSelectedLocation(loc);
            loadWeatherData(loc);
          }}
          onToggleSave={handleToggleSaveLocation}
        />

        {/* 대시보드 2단 레이아웃 (좌측: 인터랙티브 지도 / 우측: 실시간 날씨 데이터) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측: 인터랙티브 지도 (화면 절반 또는 반응형 배치) */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                위치 선택 지도
              </span>
              <span className="text-[11px] text-slate-400">
                원하는 지점을 클릭하세요
              </span>
            </div>

            <div className="h-[380px] sm:h-[440px] lg:h-[calc(100vh-190px)] min-h-[380px] w-full">
              <MapComponent
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* 우측: 날씨 대시보드 (상세 데이터 카드) */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-5">
            {error ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-center flex flex-col items-center gap-4">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">날씨 데이터를 가져올 수 없습니다</h3>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadWeatherData(selectedLocation)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 시도하기</span>
                </button>
              </div>
            ) : weatherData ? (
              <WeatherDashboard
                weather={weatherData}
                settings={settings}
                fallbackNotice={fallbackNotice}
                onOpenSettings={() => setIsApiKeyModalOpen(true)}
              />
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center gap-3 min-h-[400px]">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">날씨 정보를 수신하고 있습니다...</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="w-full border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400 mt-auto">
        <p>
          인터랙티브 날씨 지도 대시보드 · Open-Meteo & OpenWeatherMap API 지원 · OpenStreetMap 제공
        </p>
      </footer>

      {/* API 키 설정 및 비개발자 가이드 모달 */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
