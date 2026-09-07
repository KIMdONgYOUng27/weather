import React from 'react';
import { Bookmark, Star, Trash2, MapPin } from 'lucide-react';
import { LocationInfo } from '../types';

interface SavedLocationsProps {
  savedList: LocationInfo[];
  currentLocation: LocationInfo | null;
  onSelect: (loc: LocationInfo) => void;
  onToggleSave: (loc: LocationInfo) => void;
}

export const SavedLocations: React.FC<SavedLocationsProps> = ({
  savedList,
  currentLocation,
  onSelect,
  onToggleSave,
}) => {
  const isCurrentSaved = currentLocation
    ? savedList.some(
        (s) =>
          Math.abs(s.lat - currentLocation.lat) < 0.01 &&
          Math.abs(s.lng - currentLocation.lng) < 0.01
      )
    : false;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>관심 지역:</span>
        </span>

        {savedList.length === 0 ? (
          <span className="text-slate-500 italic">
            자주 확인하는 지역을 북마크해보세요
          </span>
        ) : (
          savedList.map((loc, idx) => (
            <div
              key={`${loc.lat}-${loc.lng}-${idx}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 shrink-0 group hover:border-cyan-500/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelect(loc)}
                className="hover:text-cyan-300 font-medium"
              >
                {loc.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(loc);
                }}
                className="text-slate-500 hover:text-rose-400 p-0.5"
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {currentLocation && (
        <button
          type="button"
          onClick={() => onToggleSave(currentLocation)}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl font-medium transition-all shrink-0 ${
            isCurrentSaved
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
          title={isCurrentSaved ? '관심 지역 해제' : '현재 위치 관심 지역으로 저장'}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              isCurrentSaved ? 'text-amber-400 fill-amber-400' : 'text-slate-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isCurrentSaved ? '저장됨' : '이 장소 저장'}
          </span>
        </button>
      )}
    </div>
  );
};
