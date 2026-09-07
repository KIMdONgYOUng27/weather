import { LocationInfo, WeatherData, WeatherSettings, CurrentWeather, HourlyForecast, DailyForecast, AirQuality } from '../types';
import { evaluateAirQuality, parseOpenWeatherIconToCategory, parseWmoWeather } from '../utils/weatherUtils';

// 한국어 요일 변환
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 역지오코딩: 위도/경도로부터 한국어 장소명 추출
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; country: string; region?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherMapDashboardApp/1.0',
      },
    });
    if (!res.ok) throw new Error('Nominatim reverse geocode failed');
    const data = await res.json();
    const address = data.address || {};

    const country = address.country || '';
    const state = address.state || address.province || address.region || '';
    const city = address.city || address.county || address.town || address.village || address.district || '';
    const suburb = address.suburb || address.neighbourhood || address.borough || address.quarter || '';

    let placeName = '';
    if (city && suburb) {
      placeName = `${city} ${suburb}`;
    } else if (city) {
      placeName = city;
    } else if (state) {
      placeName = state;
    } else if (data.name) {
      placeName = data.name;
    } else {
      placeName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
    }

    return {
      name: placeName,
      country: country,
      region: state || country,
    };
  } catch (err) {
    console.warn('Reverse geocode fallback:', err);
    return {
      name: `선택 지역 (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      country: '',
      region: '',
    };
  }
}

/**
 * 장소 검색: 키워드로 위도/경도 목록 검색
 */
export async function searchLocations(query: string): Promise<LocationInfo[]> {
  if (!query.trim()) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=ko`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherMapDashboardApp/1.0',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => {
      const parts = item.display_name.split(',').map((p: string) => p.trim());
      const mainName = parts[0] || item.name;
      const country = parts[parts.length - 1] || '';
      const region = parts.length > 2 ? parts.slice(1, -1).slice(0, 2).join(', ') : '';

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: mainName,
        country: country,
        region: region,
      };
    });
  } catch (err) {
    console.error('Search locations error:', err);
    return [];
  }
}

/**
 * OpenWeatherMap API 키 유효성 테스트
 */
export async function testOpenWeatherApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey.trim()) {
    return { success: false, message: 'API 키를 입력해주세요.' };
  }
  try {
    const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=37.5665&lon=126.9780&appid=${apiKey.trim()}&units=metric&lang=kr`;
    const res = await fetch(testUrl);
    if (res.status === 401) {
      return { success: false, message: '유효하지 않은 API 키입니다 (인증 실패 401). 키를 확인해주세요. (신규 발급 키는 활성화까지 최대 10~30분 소요될 수 있습니다)' };
    }
    if (!res.ok) {
      return { success: false, message: `오류가 발생했습니다 (코드: ${res.status}).` };
    }
    const data = await res.json();
    return { success: true, message: `연결 성공! (${data.name || '서울'} 날씨 데이터 수신 확인됨)` };
  } catch (err: any) {
    return { success: false, message: `네트워크 연결에 실패했습니다: ${err.message || '알 수 없는 오류'}` };
  }
}

/**
 * Open-Meteo 기상 데이터 수신 (API 키 불필요, 고정밀 글로벌 기상망)
 */
async function fetchOpenMeteoWeather(lat: number, lng: number, location: LocationInfo): Promise<WeatherData> {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,european_aqi&timezone=auto`;

  const [forecastRes, aqiRes] = await Promise.all([
    fetch(forecastUrl),
    fetch(airQualityUrl).catch(() => null),
  ]);

  if (!forecastRes.ok) {
    throw new Error(`Open-Meteo 기상 데이터를 가져오지 못했습니다 (${forecastRes.status})`);
  }

  const fData = await forecastRes.json();
  let aqiData: any = null;
  if (aqiRes && aqiRes.ok) {
    aqiData = await aqiRes.json().catch(() => null);
  }

  const currentRaw = fData.current;
  const dailyRaw = fData.daily;
  const hourlyRaw = fData.hourly;

  const isDay = currentRaw.is_day === 1;
  const weatherParsed = parseWmoWeather(currentRaw.weather_code, isDay);

  const todaySunrise = dailyRaw.sunrise?.[0] ? dailyRaw.sunrise[0].split('T')[1] : '06:00';
  const todaySunset = dailyRaw.sunset?.[0] ? dailyRaw.sunset[0].split('T')[1] : '18:30';

  const current: CurrentWeather = {
    temp: currentRaw.temperature_2m,
    feelsLike: currentRaw.apparent_temperature,
    tempMin: dailyRaw.temperature_2m_min?.[0] ?? currentRaw.temperature_2m - 3,
    tempMax: dailyRaw.temperature_2m_max?.[0] ?? currentRaw.temperature_2m + 4,
    weatherCode: currentRaw.weather_code,
    weatherDescription: weatherParsed.description,
    weatherCategory: weatherParsed.category,
    humidity: currentRaw.relative_humidity_2m,
    windSpeed: currentRaw.wind_speed_10m,
    windDirection: currentRaw.wind_direction_10m,
    pressure: currentRaw.surface_pressure,
    uvIndex: dailyRaw.uv_index_max?.[0] ?? 3,
    visibility: 10,
    precipitationProbability: dailyRaw.precipitation_probability_max?.[0] ?? 0,
    precipitation: currentRaw.precipitation ?? 0,
    sunrise: todaySunrise,
    sunset: todaySunset,
    isDay,
    timestamp: Date.now(),
  };

  // 시간별 예보 가공 (현재 시간 이후 24시간)
  const hourly: HourlyForecast[] = [];
  const nowHourIso = new Date().toISOString().slice(0, 13);
  let startIndex = 0;
  if (hourlyRaw.time && hourlyRaw.time.length > 0) {
    const idx = hourlyRaw.time.findIndex((t: string) => t >= nowHourIso);
    startIndex = idx !== -1 ? idx : 0;
  }

  for (let i = startIndex; i < Math.min(startIndex + 24, hourlyRaw.time.length); i++) {
    const timeStr = hourlyRaw.time[i];
    const hourLabel = timeStr.split('T')[1]?.slice(0, 5) || '00:00';
    const hCode = hourlyRaw.weather_code[i];
    const hIsDay = hourlyRaw.is_day?.[i] === 1;
    const hParsed = parseWmoWeather(hCode, hIsDay);

    hourly.push({
      time: hourLabel,
      fullTime: timeStr,
      temp: hourlyRaw.temperature_2m[i],
      weatherCode: hCode,
      weatherDescription: hParsed.description,
      weatherCategory: hParsed.category,
      precipitationProbability: hourlyRaw.precipitation_probability?.[i] ?? 0,
      precipitation: hourlyRaw.precipitation?.[i] ?? 0,
      isDay: hIsDay,
    });
  }

  // 주간 예보 (7일)
  const daily: DailyForecast[] = [];
  const dayCount = Math.min(7, dailyRaw.time?.length || 0);
  for (let i = 0; i < dayCount; i++) {
    const dateStr = dailyRaw.time[i];
    const dateObj = new Date(dateStr);
    const dayOfWeek = i === 0 ? '오늘' : i === 1 ? '내일' : `${DAYS_KO[dateObj.getDay()]}요일`;
    const dCode = dailyRaw.weather_code[i];
    const dParsed = parseWmoWeather(dCode, true);

    daily.push({
      date: dateStr,
      dayOfWeek,
      tempMin: dailyRaw.temperature_2m_min[i],
      tempMax: dailyRaw.temperature_2m_max[i],
      weatherCode: dCode,
      weatherDescription: dParsed.description,
      weatherCategory: dParsed.category,
      precipitationProbability: dailyRaw.precipitation_probability_max?.[i] ?? 0,
      uvIndexMax: dailyRaw.uv_index_max?.[i] ?? 3,
      sunrise: dailyRaw.sunrise?.[i]?.split('T')[1] || '06:00',
      sunset: dailyRaw.sunset?.[i]?.split('T')[1] || '18:30',
    });
  }

  // 대기질 가공
  let airQuality: AirQuality | undefined;
  if (aqiData?.current) {
    const pm25 = aqiData.current.pm2_5 ?? 15;
    const pm10 = aqiData.current.pm10 ?? 25;
    airQuality = evaluateAirQuality(pm25, pm10);
    airQuality.co = aqiData.current.carbon_monoxide;
    airQuality.no2 = aqiData.current.nitrogen_dioxide;
    airQuality.o3 = aqiData.current.ozone;
    airQuality.so2 = aqiData.current.sulphur_dioxide;
  } else {
    // 기본 모의 안전치
    airQuality = evaluateAirQuality(14, 28);
  }

  return {
    location,
    current,
    hourly,
    daily,
    airQuality,
    provider: 'open-meteo',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * OpenWeatherMap API 기상 데이터 수신 (사용자 발급 API 키 활용)
 */
async function fetchOpenWeatherMapData(lat: number, lng: number, apiKey: string, location: LocationInfo): Promise<WeatherData> {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey.trim()}&units=metric&lang=kr`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey.trim()}&units=metric&lang=kr`;
  const airPollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey.trim()}`;

  const [cRes, fRes, aqiRes] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl),
    fetch(airPollutionUrl).catch(() => null),
  ]);

  if (!cRes.ok || !fRes.ok) {
    const errData = await cRes.json().catch(() => ({}));
    throw new Error(errData.message || 'OpenWeatherMap API 호출 실패');
  }

  const cData = await cRes.json();
  const fData = await fRes.json();
  let aqiData: any = null;
  if (aqiRes && aqiRes.ok) {
    aqiData = await aqiRes.json().catch(() => null);
  }

  const weatherMain = cData.weather?.[0] || {};
  const icon = weatherMain.icon || '01d';
  const isDay = icon.includes('d');
  const category = parseOpenWeatherIconToCategory(icon);

  const sunrise = new Date(cData.sys.sunrise * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const sunset = new Date(cData.sys.sunset * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const current: CurrentWeather = {
    temp: cData.main.temp,
    feelsLike: cData.main.feels_like,
    tempMin: cData.main.temp_min,
    tempMax: cData.main.temp_max,
    weatherCode: weatherMain.id,
    weatherDescription: weatherMain.description || '맑음',
    weatherCategory: category,
    humidity: cData.main.humidity,
    windSpeed: Math.round(cData.wind.speed * 3.6), // m/s -> km/h
    windDirection: cData.wind.deg || 0,
    pressure: cData.main.pressure,
    uvIndex: 4,
    visibility: (cData.visibility || 10000) / 1000,
    precipitationProbability: (fData.list?.[0]?.pop ?? 0) * 100,
    precipitation: cData.rain?.['1h'] || cData.snow?.['1h'] || 0,
    sunrise,
    sunset,
    isDay,
    timestamp: Date.now(),
  };

  // 시간별 예보 (3시간 간격 8개 -> 24시간)
  const hourly: HourlyForecast[] = (fData.list || []).slice(0, 8).map((item: any) => {
    const d = new Date(item.dt * 1000);
    const itemIcon = item.weather?.[0]?.icon || '01d';
    const itemCategory = parseOpenWeatherIconToCategory(itemIcon);
    return {
      time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      fullTime: item.dt_txt,
      temp: item.main.temp,
      weatherCode: item.weather?.[0]?.id || 800,
      weatherDescription: item.weather?.[0]?.description || '',
      weatherCategory: itemCategory,
      precipitationProbability: Math.round((item.pop || 0) * 100),
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
      isDay: itemIcon.includes('d'),
    };
  });

  // 일별 예보 묶기 (5일 예보)
  const dailyMap: { [dateStr: string]: any[] } = {};
  (fData.list || []).forEach((item: any) => {
    const dateStr = item.dt_txt.split(' ')[0];
    if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
    dailyMap[dateStr].push(item);
  });

  const dailyDates = Object.keys(dailyMap).slice(0, 5);
  const daily: DailyForecast[] = dailyDates.map((dateStr, idx) => {
    const items = dailyMap[dateStr];
    let tMin = 999;
    let tMax = -999;
    let maxPop = 0;
    items.forEach((it) => {
      if (it.main.temp_min < tMin) tMin = it.main.temp_min;
      if (it.main.temp_max > tMax) tMax = it.main.temp_max;
      if (it.pop > maxPop) maxPop = it.pop;
    });

    const midItem = items[Math.floor(items.length / 2)] || items[0];
    const dIcon = midItem.weather?.[0]?.icon || '01d';
    const dCategory = parseOpenWeatherIconToCategory(dIcon);
    const dateObj = new Date(dateStr);
    const dayOfWeek = idx === 0 ? '오늘' : idx === 1 ? '내일' : `${DAYS_KO[dateObj.getDay()]}요일`;

    return {
      date: dateStr,
      dayOfWeek,
      tempMin: Math.round(tMin),
      tempMax: Math.round(tMax),
      weatherCode: midItem.weather?.[0]?.id || 800,
      weatherDescription: midItem.weather?.[0]?.description || '',
      weatherCategory: dCategory,
      precipitationProbability: Math.round(maxPop * 100),
      uvIndexMax: 4,
      sunrise,
      sunset,
    };
  });

  // 대기질
  let airQuality: AirQuality | undefined;
  if (aqiData?.list?.[0]?.components) {
    const comps = aqiData.list[0].components;
    airQuality = evaluateAirQuality(comps.pm2_5 || 12, comps.pm10 || 22);
    airQuality.co = comps.co;
    airQuality.no2 = comps.no2;
    airQuality.o3 = comps.o3;
    airQuality.so2 = comps.so2;
  }

  return {
    location: {
      ...location,
      name: cData.name || location.name,
      country: cData.sys?.country || location.country,
    },
    current,
    hourly,
    daily,
    airQuality,
    provider: 'openweathermap',
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * 종합 날씨 데이터 가져오기: 설정(Provider/API키)에 따라 유연하게 실행
 */
export async function fetchWeatherData(
  lat: number,
  lng: number,
  settings: WeatherSettings,
  knownLocation?: LocationInfo
): Promise<{ data: WeatherData; fallbackNotice?: string }> {
  // 1. 위치 정보 확인 (없으면 역지오코딩)
  let loc = knownLocation;
  if (!loc || !loc.name) {
    const geo = await reverseGeocode(lat, lng);
    loc = {
      lat,
      lng,
      name: geo.name,
      country: geo.country,
      region: geo.region,
    };
  }

  // 2. OpenWeatherMap 요청인 경우
  if (settings.provider === 'openweathermap' && settings.openWeatherApiKey.trim()) {
    try {
      const data = await fetchOpenWeatherMapData(lat, lng, settings.openWeatherApiKey.trim(), loc);
      return { data };
    } catch (err: any) {
      console.warn('OpenWeatherMap API error, falling back to Open-Meteo:', err);
      const fallbackData = await fetchOpenMeteoWeather(lat, lng, loc);
      return {
        data: fallbackData,
        fallbackNotice: `입력하신 OpenWeatherMap API 키 호출 중 오류(${err.message || '인증/호출 실패'})가 발생하여 무료 Open-Meteo 엔진으로 자동 전환되었습니다.`,
      };
    }
  }

  // 3. 기본값: 무료 Open-Meteo 엔진
  const data = await fetchOpenMeteoWeather(lat, lng, loc);
  return { data };
}
