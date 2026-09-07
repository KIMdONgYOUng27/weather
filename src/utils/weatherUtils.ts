import { AirQuality, CurrentWeather, DailyForecast, HourlyForecast } from '../types';

export function parseWmoWeather(code: number, isDay: boolean = true): {
  description: string;
  category: CurrentWeather['weatherCategory'];
} {
  switch (code) {
    case 0:
      return { description: isDay ? '맑음' : '쾌청한 밤', category: 'clear' };
    case 1:
      return { description: isDay ? '대체로 맑음' : '대체로 맑음', category: 'clear' };
    case 2:
      return { description: '구름 조금', category: 'partly-cloudy' };
    case 3:
      return { description: '흐림', category: 'cloudy' };
    case 45:
      return { description: '안개', category: 'fog' };
    case 48:
      return { description: '짙은 안개(빙무)', category: 'fog' };
    case 51:
      return { description: '약한 이슬비', category: 'drizzle' };
    case 53:
      return { description: '이슬비', category: 'drizzle' };
    case 55:
      return { description: '강한 이슬비', category: 'drizzle' };
    case 56:
    case 57:
      return { description: '어는 이슬비', category: 'drizzle' };
    case 61:
      return { description: '약한 비', category: 'rain' };
    case 63:
      return { description: '보통 비', category: 'rain' };
    case 65:
      return { description: '강한 비', category: 'rain' };
    case 66:
    case 67:
      return { description: '어는 비', category: 'rain' };
    case 71:
      return { description: '약한 눈', category: 'snow' };
    case 73:
      return { description: '보통 눈', category: 'snow' };
    case 75:
      return { description: '폭설', category: 'snow' };
    case 77:
      return { description: '싸락눈', category: 'snow' };
    case 80:
      return { description: '약한 소나기', category: 'rain' };
    case 81:
      return { description: '소나기', category: 'rain' };
    case 82:
      return { description: '폭우성 소나기', category: 'rain' };
    case 85:
      return { description: '약한 소낙눈', category: 'snow' };
    case 86:
      return { description: '강한 소낙눈', category: 'snow' };
    case 95:
      return { description: '뇌우', category: 'thunderstorm' };
    case 96:
    case 99:
      return { description: '우박을 동반한 뇌우', category: 'thunderstorm' };
    default:
      return { description: '맑음', category: 'clear' };
  }
}

export function parseOpenWeatherIconToCategory(iconCode: string): CurrentWeather['weatherCategory'] {
  if (iconCode.startsWith('01')) return 'clear';
  if (iconCode.startsWith('02')) return 'partly-cloudy';
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) return 'cloudy';
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return 'rain';
  if (iconCode.startsWith('11')) return 'thunderstorm';
  if (iconCode.startsWith('13')) return 'snow';
  if (iconCode.startsWith('50')) return 'fog';
  return 'partly-cloudy';
}

export function convertTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): number {
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

export function getWindDirectionText(deg: number): string {
  const directions = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index] || '북';
}

export function getUvIndexDescription(uv: number): { text: string; color: string } {
  if (uv < 3) return { text: '낮음', color: 'text-emerald-400' };
  if (uv < 6) return { text: '보통', color: 'text-yellow-400' };
  if (uv < 8) return { text: '높음', color: 'text-amber-500' };
  if (uv < 11) return { text: '매우 높음', color: 'text-orange-500' };
  return { text: '위험', color: 'text-rose-500' };
}

export function evaluateAirQuality(pm2_5: number, pm10: number): AirQuality {
  // 대한민국 환경부 기준 (초미세먼지 PM2.5: 0-15 좋음, 16-35 보통, 36-75 나쁨, 76+ 매우나쁨)
  // (미세먼지 PM10: 0-30 좋음, 31-80 보통, 81-150 나쁨, 151+ 매우나쁨)
  let pm25Status: AirQuality['pm25Status'] = '좋음';
  if (pm2_5 > 75) pm25Status = '매우 나쁨';
  else if (pm2_5 > 35) pm25Status = '나쁨';
  else if (pm2_5 > 15) pm25Status = '보통';

  let pm10Status: AirQuality['pm10Status'] = '좋음';
  if (pm10 > 150) pm10Status = '매우 나쁨';
  else if (pm10 > 80) pm10Status = '나쁨';
  else if (pm10 > 30) pm10Status = '보통';

  // Overall AQI
  let aqi = 1;
  let aqiText: AirQuality['aqiText'] = '좋음';
  let aqiColor = 'text-emerald-400';

  if (pm25Status === '매우 나쁨' || pm10Status === '매우 나쁨') {
    aqi = 5;
    aqiText = '매우 나쁨';
    aqiColor = 'text-rose-500';
  } else if (pm25Status === '나쁨' || pm10Status === '나쁨') {
    aqi = 4;
    aqiText = '나쁨';
    aqiColor = 'text-amber-500';
  } else if (pm25Status === '보통' || pm10Status === '보통') {
    aqi = 3;
    aqiText = '보통';
    aqiColor = 'text-yellow-400';
  } else if (pm2_5 <= 8 && pm10 <= 15) {
    aqi = 1;
    aqiText = '매우 좋음';
    aqiColor = 'text-teal-300';
  }

  return {
    aqi,
    aqiText,
    aqiColor,
    pm2_5: Math.round(pm2_5 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    pm25Status,
    pm10Status,
  };
}

export function getClothingAdvice(temp: number, weatherCategory: string): {
  headline: string;
  recommendation: string;
  items: string[];
} {
  let headline = '';
  let recommendation = '';
  let items: string[] = [];

  if (temp >= 28) {
    headline = '무더운 날씨, 시원하고 가벼운 옷차림';
    recommendation = '자외선 차단제와 수분 섭취를 잊지 마세요.';
    items = ['민소매', '반팔 티셔츠', '린넨 셔츠', '반바지', '선글라스'];
  } else if (temp >= 23) {
    headline = '따뜻하고 쾌적한 초여름 날씨';
    recommendation = '통기성이 좋은 얇은 셔츠나 반팔이 좋습니다.';
    items = ['반팔', '얇은 셔츠', '면바지', '슬랙스'];
  } else if (temp >= 20) {
    headline = '선선하고 쾌적한 날씨';
    recommendation = '가벼운 긴팔이나 카디건을 챙기면 좋습니다.';
    items = ['긴팔 티셔츠', '얇은 가디건', '청바지', '블라우스'];
  } else if (temp >= 17) {
    headline = '살짝 쌀쌀함이 느껴지는 날씨';
    recommendation = '아침저녁 일교차에 대비해 겉옷을 준비하세요.';
    items = ['맨투맨', '후드티', '니트', '바람막이', '슬랙스'];
  } else if (temp >= 12) {
    headline = '일교차가 큰 쌀쌀한 가을/봄 날씨';
    recommendation = '자켓이나 트렌치코트 등 외투 착용을 추천합니다.';
    items = ['자켓', '트렌치코트', '야상', '니트', '스타킹/기모바지'];
  } else if (temp >= 9) {
    headline = '찬 기운이 맴도는 날씨';
    recommendation = '도톰한 점퍼나 코트로 보온을 유지하세요.';
    items = ['도톰한 코트', '가죽자켓', '니트', '레깅스'];
  } else if (temp >= 5) {
    headline = '쌀쌀한 초겨울 추위';
    recommendation = '히트텍, 울 코트, 경량 패딩 착용을 권장합니다.';
    items = ['울 코트', '경량 패딩', '기모 이너', '목도리'];
  } else {
    headline = '한파 주의, 든든한 방한복 필수';
    recommendation = '롱패딩과 장갑, 목도리로 체온 손실을 막으세요.';
    items = ['두꺼운 롱패딩', '목도리', '장갑', '방한모자', '기모의류'];
  }

  if (weatherCategory === 'rain' || weatherCategory === 'drizzle' || weatherCategory === 'thunderstorm') {
    items.unshift('우산 / 우비');
  } else if (weatherCategory === 'snow') {
    items.unshift('방수 신발 / 부츠');
  }

  return { headline, recommendation, items };
}
