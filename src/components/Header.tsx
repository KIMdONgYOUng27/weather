import React, { useEffect, useRef, useState } from 'react';
import { CloudSun, KeyRound, MapPin, Search, Sparkles, X, Loader2 } from 'lucide-react';
import { LocationInfo, PresetLocation, WeatherSettings } from '../types';
import { PRESET_LOCATIONS } from '../data/presetLocations';
import { searchLocations } from '../services/weatherService';

interface HeaderProps {
  settings: WeatherSettings;
  onOpenSettings: () => void;
  onToggleUnit: () => void;
  onSelectLocation: (lat: number, lng: number, name: string, country?: string) => void;
  currentLocationName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onToggleUnit,
  onSelectLocation,
  currentLocationName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 검색 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 디바운싱
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(val);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  const handleSelectResult = (item: LocationInfo) => {
    onSelectLocation(item.lat, item.lng, item.name, item.country);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSelectPreset = (preset: PresetLocation) => {
    onSelectLocation(preset.lat, preset.lng, preset.name, preset.country);
  };

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col gap-3">
        {/* 상단 1열: 로고, 검색창, 단위 토글, API 설정 버튼 */}
        <div className="flex items-center justify-between gap-3">
          {/* 앱 타이틀 및 로고 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
              <CloudSun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>날씨 지도 대시보드</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                지도를 클릭하여 전 세계 날씨를 확인하세요
              </p>
            </div>
          </div>

          {/* 중앙: 장소 검색창 */}
          <div ref={dropdownRef} className="relative flex-1 max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="global-location-search-input"
                type="text"
                placeholder="도시, 구/동, 명소 검색 (예: 강남, 제주, 도쿄, 파리)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 검색 결과 드롭다운 */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>장소 검색 중...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.lat}-${item.lng}-${idx}`}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-800/80 flex items-center gap-2.5 text-slate-200 transition-colors border-b border-slate-800/50 last:border-none"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div className="flex-1 truncate">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="text-slate-400 ml-1.5">{item.region || item.country}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    일치하는 장소를 찾을 수 없습니다.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 우측 컨트롤: 단위 토글 & API 설정 버튼 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 섭씨/화씨 토글 */}
            <button
              id="temp-unit-toggle-btn"
              type="button"
              onClick={onToggleUnit}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono font-bold text-cyan-300 transition-colors"
              title="섭씨/화씨 단위 변경"
            >
              {settings.unit === 'celsius' ? '°C' : '°F'}
            </button>

            {/* API 설정 모달 열기 버튼 */}
            <button
              id="open-api-key-modal-btn"
              type="button"
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                settings.provider === 'openweathermap' && settings.openWeatherApiKey
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="날씨 API 설정 및 키 연동 가이드"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">API 설정</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                settings.provider === 'openweathermap' && settings.openWeatherApiKey ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
            </button>
          </div>
        </div>

        {/* 2열: 인기/추천 도시 퀵 칩 버튼들 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <span className="text-slate-400 shrink-0 mr-1 text-[11px] font-medium hidden sm:inline">
            주요 도시 바로가기:
          </span>
          {PRESET_LOCATIONS.map((preset) => {
            const isSelected = currentLocationName === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
