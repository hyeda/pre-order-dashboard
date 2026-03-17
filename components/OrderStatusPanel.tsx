'use client';

import { TriangleAlert, AlertCircle, Siren } from 'lucide-react';

interface Props {
  orderCount: number;
  salesLimit: number;
  isEmergencyStopped: boolean;
}

const THRESHOLDS = [
  { at: 100, label: '100% 도달 — 판매 한도 소진, 신규 주문 차단됨', color: 'bg-rose-100 border-rose-400 text-rose-800', Icon: Siren },
  { at: 95, label: '95% 도달 — 한도 소진 임박', color: 'bg-rose-50 border-rose-300 text-rose-700', Icon: Siren },
  { at: 90, label: '90% 도달 — 판매 한도를 확인하세요', color: 'bg-orange-50 border-orange-300 text-orange-700', Icon: AlertCircle },
  { at: 80, label: '80% 도달 — 주문이 빠르게 증가하고 있습니다', color: 'bg-amber-50 border-amber-300 text-amber-700', Icon: TriangleAlert },
];

export default function OrderStatusPanel({ orderCount, salesLimit, isEmergencyStopped }: Props) {
  const remaining = salesLimit - orderCount;
  const fillRate  = Math.min((orderCount / salesLimit) * 100, 100);

  const activeAlert = THRESHOLDS.find(t => fillRate >= t.at) ?? null;

  const barColor =
    fillRate >= 95 ? 'bg-rose-500' :
    fillRate >= 90 ? 'bg-orange-500' :
    fillRate >= 80 ? 'bg-amber-400' :
    'bg-blue-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-500">주문 현황</h2>
        {isEmergencyStopped && (
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5">
            판매 중단
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{orderCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1.5">선주문 수</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{salesLimit.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1.5">판매 한도</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-semibold tabular-nums ${remaining <= 50 ? 'text-rose-600' : 'text-slate-900'}`}>
            {remaining.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">남은 수량</p>
        </div>
      </div>

      {/* 달성률 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="font-medium text-slate-600">판매 달성률</span>
          <span className={`font-bold tabular-nums text-sm ${
            fillRate >= 95 ? 'text-rose-600' :
            fillRate >= 90 ? 'text-orange-500' :
            fillRate >= 80 ? 'text-amber-500' :
            'text-slate-700'
          }`}>{fillRate.toFixed(1)}%</span>
        </div>

        {/* 바 + 마커 */}
        <div className="relative">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${fillRate}%` }}
            />
          </div>
          {/* 임계점 마커 */}
          {[80, 90, 95].map((t) => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${t}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`w-0.5 h-3 ${fillRate >= t ? 'bg-white/60' : 'bg-gray-300'}`} />
            </div>
          ))}
        </div>

        {/* 마커 레이블 */}
        <div className="relative h-4 mt-1">
          {[80, 90, 95].map((t) => (
            <span
              key={t}
              className={`absolute text-[10px] tabular-nums transform -translate-x-1/2 ${fillRate >= t ? 'text-gray-400' : 'text-gray-300'}`}
              style={{ left: `${t}%` }}
            >
              {t}%
            </span>
          ))}
        </div>
      </div>

      {/* 임계점 알림 배너 */}
      {activeAlert && (
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${activeAlert.color}`}>
          <activeAlert.Icon size={15} strokeWidth={2} className="shrink-0" />
          {activeAlert.label}
        </div>
      )}
    </div>
  );
}