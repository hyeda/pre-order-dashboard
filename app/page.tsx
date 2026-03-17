'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { OctagonX, Play, AlertTriangle } from 'lucide-react';
import { INITIAL_DATA, InspectionStatus, InspectionResult } from '@/lib/mockData';
import InspectionStatusPanel from '@/components/InspectionStatusPanel';
import OrderStatusPanel from '@/components/OrderStatusPanel';
import RiskMetricsPanel from '@/components/RiskMetricsPanel';
import SalesLimitSlider from '@/components/SalesLimitSlider';
import OrderInflowGraph from '@/components/OrderInflowGraph';

const API_STATUS_LABELS: Partial<Record<InspectionStatus, string>> = {
  pending: '대기중',
  'in-progress': '진행중',
  passed: '합격',
  failed: '불합격',
};

export default function Dashboard() {
  const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus>(INITIAL_DATA.inspectionStatus);
  const [orderCount, setOrderCount] = useState(INITIAL_DATA.orderCount);
  const [salesLimit, setSalesLimit] = useState(INITIAL_DATA.salesLimit);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(INITIAL_DATA.isEmergencyStopped);
  const [confirming, setConfirming] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const handleStatusChange = (s: InspectionStatus) => {
    setInspectionStatus(s);
    if (s === 'passed') {
      setInspectionResult({ declaredQty: salesLimit, passedQty: salesLimit });
    } else if (s === 'failed') {
      setInspectionResult({ declaredQty: salesLimit, passedQty: 0 });
      setIsEmergencyStopped(true);
      toast.error('검역 불합격 — 신규 주문이 자동 차단되었습니다', { duration: 0 });
    } else {
      setInspectionResult(null);
    }
  };

  const handlePartialConfirm = (qty: number) => {
    setInspectionStatus('partial');
    const result = { declaredQty: salesLimit, passedQty: qty };
    setInspectionResult(result);
    if (orderCount >= qty) {
      alerted.current.add(100);
      setIsEmergencyStopped(true);
      toast.error(`실제 통과 수량(${qty.toLocaleString()}개) 도달 — 신규 주문이 자동 차단되었습니다`, { duration: 0 });
    } else {
      toast.warning(`검역 부분 합격 — 통과 수량(${qty.toLocaleString()}개)까지 판매 계속`, { duration: 0 });
    }
  };

  const alerted = useRef<Set<number>>(new Set());

  // 2초마다 증가 (판매 중단 시 정지)
  useEffect(() => {
    if (isEmergencyStopped) return;
    const effectiveLimit = inspectionResult && inspectionStatus === 'partial'
      ? inspectionResult.passedQty
      : salesLimit;
    const interval = setInterval(() => {
      setOrderCount((prev) => {
        if (prev >= effectiveLimit) {
          setIsEmergencyStopped(true);
          return prev;
        }
        const next = Math.min(prev + Math.floor(Math.random() * 50) + 30, effectiveLimit);
        const rate = (next / salesLimit) * 100;
        for (const t of [95, 90, 80]) {
          if (rate >= t && !alerted.current.has(t)) {
            alerted.current.add(t);
            const messages: Record<number, string> = {
              80: '판매 달성률 80% 도달 — 주문이 빠르게 증가하고 있습니다',
              90: '판매 달성률 90% 도달 — 판매 한도를 확인하세요',
              95: '판매 달성률 95% 도달 — 한도 소진 임박',
            };
            const types: Record<number, 'warning' | 'error'> = { 80: 'warning', 90: 'warning', 95: 'error' };
            toast[types[t]](messages[t], { duration: 6000 });
          }
        }
        if (next >= effectiveLimit && !alerted.current.has(100)) {
          alerted.current.add(100);
          const msg = inspectionStatus === 'partial'
            ? `실제 통과 수량(${effectiveLimit.toLocaleString()}개) 도달 — 신규 주문이 자동 차단되었습니다`
            : '판매 한도 도달 — 신규 주문이 자동 차단되었습니다';
          toast.error(msg, { duration: 0 });
          setIsEmergencyStopped(true);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isEmergencyStopped, salesLimit, inspectionStatus, inspectionResult]);

  const cannotResume =
    inspectionStatus === 'failed' ||
    (inspectionStatus === 'partial' && inspectionResult !== null && orderCount >= inspectionResult.passedQty);

  const handleEmergencyClick = () => {
    if (isEmergencyStopped) {
      if (cannotResume) return;
      setIsEmergencyStopped(false);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    } else {
      setIsEmergencyStopped(true);
      setConfirming(false);
    }
  };

  const now = new Date();
  const timeStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">(주)디저트무역 · 선주문 관리 시스템</h1>
            <p className="text-xs text-gray-400 mt-0.5">물류팀 관리자 대시보드</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 시뮬레이션 버튼 */}
            <div className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-400 mr-1">시뮬레이션</span>
              {(Object.keys(API_STATUS_LABELS) as InspectionStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-2 py-1 rounded-md font-medium transition-all
                    ${inspectionStatus === s
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {API_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-400">{timeStr}</span>

            {/* 판매 상태 표시 */}
            <span className={`flex items-center gap-1.5 text-xs font-medium ${isEmergencyStopped ? 'text-rose-500' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isEmergencyStopped ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isEmergencyStopped ? '판매 중단' : '판매 중'}
            </span>
            <button
              onClick={handleEmergencyClick}
              disabled={isEmergencyStopped && cannotResume}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95
                ${isEmergencyStopped && cannotResume
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isEmergencyStopped
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : confirming
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
            >
              {isEmergencyStopped && cannotResume
                ? <><OctagonX size={13} strokeWidth={2.5} /> 재개 불가</>
                : isEmergencyStopped
                  ? <><Play size={13} strokeWidth={2.5} /> 재개</>
                  : confirming
                    ? <><AlertTriangle size={13} strokeWidth={2.5} /> 한 번 더 누르면 즉시 중단됩니다 · 3초 후 자동 취소</>
                  : <><OctagonX size={13} strokeWidth={2.5} /> 긴급 중단</>
              }
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Row 1: 2컬럼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <InspectionStatusPanel
                status={inspectionStatus}
                orderCount={orderCount}
                salesLimit={salesLimit}
                inspectionResult={inspectionResult}
                onPartialConfirm={handlePartialConfirm}
              />
            <RiskMetricsPanel
              orderCount={orderCount}
              salesLimit={salesLimit}
              inspectionStatus={inspectionStatus}
              inspectionResult={inspectionResult}
            />
          </div>
          <div className="flex flex-col gap-6">
            <OrderStatusPanel
              orderCount={orderCount}
              salesLimit={salesLimit}
              isEmergencyStopped={isEmergencyStopped}
            />
            <SalesLimitSlider
              salesLimit={salesLimit}
              orderCount={orderCount}
              onChange={setSalesLimit}
            />
            <OrderInflowGraph orderCount={orderCount} />
          </div>
        </div>
      </main>
    </div>
  );
}