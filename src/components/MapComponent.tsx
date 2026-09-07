import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Locate, MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { LocationInfo } from '../types';

interface MapComponentProps {
  selectedLocation: LocationInfo | null;
  onSelectLocation: (lat: number, lng: number, locationName?: string) => void;
  isLoading?: boolean;
}

type MapLayerType = 'dark' | 'standard' | 'satellite';

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedLocation,
  onSelectLocation,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 지도 타일 레이어 URL 정의
  const tileLayers: Record<MapLayerType, { url: string; attribution: string; name: string }> = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      name: '다크 모드',
    },
    standard: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      name: '일반 지도',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      name: '위성 지도',
    },
  };

  // 커스텀 핀 마커 아이콘
  const createCustomMarker = (name?: string) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="absolute w-6 h-6 rounded-full bg-cyan-400/50"></div>
          <div class="relative z-10 w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-xl border-2 border-white text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          ${
            name
              ? `<div class="absolute bottom-full mb-2 px-3 py-1 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                  ${name}
                </div>`
              : ''
          }
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedLocation ? selectedLocation.lat : 37.5665;
    const initialLng = selectedLocation ? selectedLocation.lng : 126.9780;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 10,
      zoomControl: false,
    });

    // 기본 타일 추가
    const layerConf = tileLayers[activeLayer];
    const tileLayer = L.tileLayer(layerConf.url, {
      attribution: layerConf.attribution,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // 클릭 이벤트 등록
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    });

    // 마커 생성
    const marker = L.marker([initialLat, initialLng], {
      icon: createCustomMarker(selectedLocation?.name),
    }).addTo(map);
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 타일 레이어 전환 처리
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const layerConf = tileLayers[activeLayer];
    tileLayerRef.current = L.tileLayer(layerConf.url, {
      attribution: layerConf.attribution,
      maxZoom: 18,
    }).addTo(map);
  }, [activeLayer]);

  // 선택 위치 변경 시 지도 이동 및 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    const map = mapInstanceRef.current;
    const { lat, lng, name } = selectedLocation;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createCustomMarker(name));
    } else {
      markerRef.current = L.marker([lat, lng], {
        icon: createCustomMarker(name),
      }).addTo(map);
    }

    map.flyTo([lat, lng], Math.max(map.getZoom(), 10), {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedLocation?.lat, selectedLocation?.lng, selectedLocation?.name]);

  // 현재 내 GPS 위치 찾기
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보 기능을 지원하지 않습니다.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onSelectLocation(position.coords.latitude, position.coords.longitude, '현재 내 위치');
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 접근 권한을 확인해주세요.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div id="interactive-map-container" className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 지도 영역 */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* 로딩 표시 오버레이 */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-full shadow-xl flex items-center gap-2.5 text-xs text-cyan-300 font-medium">
          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>선택한 지역의 실시간 기상 데이터 분석 중...</span>
        </div>
      )}

      {/* 지도 인터랙션 힌트 배너 */}
      <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-700/60 text-xs text-slate-300 shadow-md">
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span>지도의 원하는 위치를 클릭하면 해당 지역 날씨를 즉시 확인합니다</span>
      </div>

      {/* 우측 상단 컨트롤 버튼 (지도 레이어, 내 위치, 줌) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* 레이어 선택 */}
        <div className="relative">
          <button
            id="map-layer-selector-btn"
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-200 flex items-center justify-center shadow-lg transition-all"
            title="지도 스타일 변경"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-36 py-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col">
              {(['dark', 'standard', 'satellite'] as MapLayerType[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => {
                    setActiveLayer(layer);
                    setShowLayerMenu(false);
                  }}
                  className={`px-3 py-2 text-xs text-left transition-colors flex items-center justify-between ${
                    activeLayer === layer ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{tileLayers[layer].name}</span>
                  {activeLayer === layer && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 내 위치 버튼 */}
        <button
          id="map-current-location-btn"
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-200 flex items-center justify-center shadow-lg transition-all hover:text-cyan-400 disabled:opacity-50"
          title="현재 내 위치로 이동"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* 줌 인/아웃 */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900/90 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors border-b border-slate-800 hover:text-cyan-400"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-colors hover:text-cyan-400"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
