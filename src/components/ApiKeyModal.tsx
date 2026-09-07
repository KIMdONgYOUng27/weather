import React, { useState } from 'react';
import { Check, CheckCircle2, ExternalLink, HelpCircle, KeyRound, Loader2, Sparkles, X, AlertTriangle } from 'lucide-react';
import { WeatherProvider, WeatherSettings } from '../types';
import { testOpenWeatherApiKey } from '../services/weatherService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WeatherSettings;
  onSaveSettings: (newSettings: WeatherSettings) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState<WeatherProvider>(settings.provider);
  const [apiKey, setApiKey] = useState(settings.openWeatherApiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testOpenWeatherApiKey(apiKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      provider,
      openWeatherApiKey: apiKey.trim(),
    });
    onClose();
  };

  const handleResetToFree = () => {
    setProvider('open-meteo');
    setApiKey('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="api-key-modal"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col gap-6"
      >
        {/* 모달 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 pr-8">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">날씨 데이터 API 설정</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              원하는 날씨 데이터 엔진을 선택하고 본인의 API 키를 연동하세요.
            </p>
          </div>
        </div>

        {/* 날씨 데이터 소스 선택 옵션 */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            데이터 소스 선택
          </label>

          {/* 옵션 1: Open-Meteo 무료 모드 */}
          <div
            onClick={() => setProvider('open-meteo')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              provider === 'open-meteo'
                ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
              provider === 'open-meteo' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-500'
            }`}>
              {provider === 'open-meteo' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">무료 고정밀 기상 모드 (Open-Meteo)</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  API 키 불필요 · 추천
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                별도의 가입이나 API 키 발급 없이 즉시 전 세계 어디든 1시간 단위 정밀 예보, 7일 예보, 대기질 지수를 무료로 확인합니다.
              </p>
            </div>
          </div>

          {/* 옵션 2: OpenWeatherMap 커스텀 API 모드 */}
          <div
            onClick={() => setProvider('openweathermap')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
              provider === 'openweathermap'
                ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
              provider === 'openweathermap' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-500'
            }`}>
              {provider === 'openweathermap' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">OpenWeatherMap API 모드</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
                  본인 API 키 사용
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                공식 OpenWeatherMap 서비스에서 발급받은 무료 API 키를 등록하여 글로벌 기상 관측소 데이터를 직접 연동합니다.
              </p>
            </div>
          </div>
        </div>

        {/* OpenWeatherMap API 키 입력 및 가이드 (해당 모드 선택 시 활성화) */}
        {provider === 'openweathermap' && (
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div>
              <label htmlFor="openweather-api-key-input" className="block text-xs font-semibold text-slate-200 mb-1.5">
                OpenWeatherMap API Key
              </label>
              <div className="flex gap-2">
                <input
                  id="openweather-api-key-input"
                  type="text"
                  placeholder="예: a1b2c3d4e5f6789012345678abcdef12"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-sm font-mono text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !apiKey.trim()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>검증 중...</span>
                    </>
                  ) : (
                    <span>연결 테스트</span>
                  )}
                </button>
              </div>

              {/* 테스트 결과 피드백 */}
              {testResult && (
                <div
                  className={`mt-2.5 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* 비개발자를 위한 상세 발급 가이드 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  비개발자를 위한 API 키 1분 발급 가이드
                </span>
                <a
                  href="https://home.openweathermap.org/users/sign_up"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold underline"
                >
                  <span>무료 회원가입 바로가기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-0.5 leading-relaxed">
                <li>
                  <strong className="text-slate-200">OpenWeatherMap</strong> 홈페이지에서 이메일로 무료 계정을 만듭니다.
                </li>
                <li>
                  가입 완료 후 우측 상단 <strong className="text-slate-200">내 계정 이름</strong>을 누르고 <strong className="text-slate-200">'My API Keys'</strong> 탭으로 이동합니다.
                </li>
                <li>
                  기본 생성되어 있는 <strong className="text-slate-200">32자리 Key 값</strong>을 복사하여 위 입력창에 붙여넣고 [연결 테스트]를 누릅니다.
                </li>
              </ol>

              <div className="mt-1 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                ⚠️ 참고: OpenWeatherMap에서 새로 만든 키는 글로벌 서버에 전파되는 데 약 10~30분이 걸릴 수 있습니다. 그동안은 무료 기본 모드를 이용하실 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetToFree}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            기본 무료 모드로 초기화
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              id="save-api-key-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>설정 저장하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
