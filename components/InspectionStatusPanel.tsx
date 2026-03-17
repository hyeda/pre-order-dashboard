'use client';

import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import { InspectionStatus, InspectionResult } from '@/lib/mockData';

interface Props {
  status: InspectionStatus;
  orderCount: number;
  salesLimit: number;
  inspectionResult: InspectionResult | null;
  onPartialConfirm: (qty: number) => void;
}

const STATUS_CONFIG: Record<InspectionStatus, { label: string; color: string; bg: string; border: string; description: string; updatedAt: string }> = {
  pending:       { label: '대기중',    color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   description: '검역 신청 전 대기 상태',                          updatedAt: '관세청 API — 수신 대기 중' },
  'in-progress': { label: '진행중',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    description: '현재 검역 심사 진행 중',                          updatedAt: '관세청 API — 오늘 09:14 수신' },
  passed:        { label: '합격',      color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', description: '검역 합격 — 잔금 자동 결제 진행',                 updatedAt: '관세청 API — 오늘 14:32 수신' },
  partial:       { label: '부분 합격', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   description: '일부 수량 합격 — 통과 수량만큼 잔금 결제, 초과 주문건 환불 진행', updatedAt: '직접 입력 - 오늘 14:32' },
  failed:        { label: '불합격',    color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    description: '검역 불합격 — 예약금 환불 + 쿠폰 발행 진행 중',   updatedAt: '관세청 API — 오늘 14:32 수신' },
};

// Mock: 오늘 09:14 접수, 3영업일 후 18:00 예상 완료
const SUBMITTED_AT = new Date();
SUBMITTED_AT.setHours(9, 14, 0, 0);

const EXPECTED_AT = new Date(SUBMITTED_AT);
EXPECTED_AT.setDate(EXPECTED_AT.getDate() + 3);
EXPECTED_AT.setHours(18, 0, 0, 0);

function formatCountdown(ms: number) {
  if (ms <= 0) return { d: 0, h: '00', m: '00' };
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = String(Math.floor((totalMin % 1440) / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return { d, h, m };
}

export default function InspectionStatusPanel({ status, orderCount, salesLimit, inspectionResult, onPartialConfirm }: Props) {
  const c = STATUS_CONFIG[status];
  const isFailed = status === 'failed';
  const isPartial = status === 'partial';
  const isPassed = status === 'passed';
  const isInProgress = status === 'in-progress';

  const [showPartialInput, setShowPartialInput] = useState(false);
  const [partialQtyInput, setPartialQtyInput] = useState('');

  const handlePartialConfirm = () => {
    const qty = parseInt(partialQtyInput, 10);
    if (isNaN(qty) || qty <= 0 || qty >= salesLimit) return;
    onPartialConfirm(qty);
    setShowPartialInput(false);
    setPartialQtyInput('');
  };

  // 카운트다운 (1분 단위)
  const [remaining, setRemaining] = useState(() => EXPECTED_AT.getTime() - Date.now());
  useEffect(() => {
    if (!isInProgress) return;
    const t = setInterval(() => setRemaining(EXPECTED_AT.getTime() - Date.now()), 60000);
    return () => clearInterval(t);
  }, [isInProgress]);
  const cd = formatCountdown(remaining);

  // 불합격 시 환불·쿠폰 진행률
  const refundFailed = isFailed ? Math.floor(orderCount * 0.008) : 0;
  const [refundDone, setRefundDone] = useState(0);
  const [couponDone, setCouponDone] = useState(0);
  useEffect(() => {
    if (!isFailed) return;
    const t = setInterval(() => {
      setRefundDone((p) => Math.min(p + Math.floor(Math.random() * 30) + 10, orderCount));
      setCouponDone((p) => Math.min(p + Math.floor(Math.random() * 20) + 5, orderCount));
    }, 3000);
    return () => clearInterval(t);
  }, [isFailed, orderCount]);

  const displayRefund = isFailed ? refundDone : 0;
  const displayCoupon = isFailed ? couponDone : 0;
  const refundRate = orderCount > 0 ? (displayRefund / orderCount) * 100 : 0;
  const couponRate = orderCount > 0 ? (displayCoupon / orderCount) * 100 : 0;

  const submittedStr = `${SUBMITTED_AT.getMonth() + 1}/${SUBMITTED_AT.getDate()} ${String(SUBMITTED_AT.getHours()).padStart(2,'0')}:${String(SUBMITTED_AT.getMinutes()).padStart(2,'0')}`;
  const expectedStr  = `${EXPECTED_AT.getMonth() + 1}/${EXPECTED_AT.getDate()} 18:00`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-500">검역 상태</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <Wifi size={12} className="text-emerald-400" />
          자동 수신
        </span>
      </div>

      <div className={`rounded-xl border px-5 py-4 ${c.bg} ${c.border}`}>
        <p className={`text-2xl font-semibold tabular-nums ${c.color}`}>{c.label}</p>
        <p className={`text-sm mt-1.5 ${c.color} opacity-75`}>{c.description}</p>
        <p className="text-xs text-gray-400 mt-3">{c.updatedAt}</p>

        {isPartial && inspectionResult && (
          <div className={`mt-4 pt-4 border-t ${c.border}`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-amber-600 font-medium mb-0.5">신고 수량</p>
                <p className="text-xl font-bold tabular-nums text-amber-700">{inspectionResult.declaredQty.toLocaleString()}<span className="text-sm font-normal ml-0.5">개</span></p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-0.5">실제 통과 수량</p>
                <p className="text-xl font-bold tabular-nums text-emerald-700">{inspectionResult.passedQty.toLocaleString()}<span className="text-sm font-normal ml-0.5">개</span></p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${(inspectionResult.passedQty / inspectionResult.declaredQty) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-xs text-gray-400">
                  통과율 {((inspectionResult.passedQty / inspectionResult.declaredQty) * 100).toFixed(1)}%
                </p>
                <p className={`text-xs font-medium ${orderCount > inspectionResult.passedQty ? 'text-rose-500' : 'text-gray-400'}`}>
                  · 초과 주문건 {Math.max(0, orderCount - inspectionResult.passedQty).toLocaleString()}건 환불 처리
                </p>
              </div>
            </div>
          </div>
        )}

        {isPassed && (
          <div className={`mt-4 pt-4 border-t ${c.border}`}>
            {!showPartialInput ? (
              <button
                onClick={() => { setShowPartialInput(true); setPartialQtyInput(String(Math.floor(salesLimit * 0.75))); }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-amber-600 bg-amber-100 hover:text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
              >
                실제 통과 수량 다를 경우 → 부분합격으로 수정
              </button>
            ) : (
              <div>
                <p className="text-xs text-amber-700 font-medium mb-2">실제 통과 수량 입력</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={partialQtyInput}
                    onChange={(e) => setPartialQtyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePartialConfirm(); if (e.key === 'Escape') setShowPartialInput(false); }}
                    className="text-sm w-28 px-3 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 tabular-nums"
                    placeholder="수량 입력"
                    autoFocus
                  />
                  <span className="text-xs text-amber-600">개</span>
                  <button onClick={handlePartialConfirm} className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all">확인</button>
                  <button onClick={() => setShowPartialInput(false)} className="text-xs px-2 py-1.5 text-gray-400 hover:text-gray-600 transition-all">취소</button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">신고 수량 {salesLimit.toLocaleString()}개 미만으로 입력</p>
              </div>
            )}
          </div>
        )}

        {isInProgress && (
          <div className={`mt-4 pt-4 border-t ${c.border}`}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-blue-600 font-medium">예상 심사 완료까지</span>
              <span className="text-xs text-gray-400">{submittedStr} 접수</span>
            </div>
            <div className="flex items-end gap-1">
              {cd.d > 0 && (
                <>
                  <span className="text-2xl font-bold tabular-nums text-blue-700">{cd.d}</span>
                  <span className="text-sm text-blue-500 mb-0.5 mr-1.5">일</span>
                </>
              )}
              <span className="text-2xl font-bold tabular-nums text-blue-700">{cd.h}</span>
              <span className="text-sm text-blue-400 mb-0.5 mx-0.5">시간</span>
              <span className="text-2xl font-bold tabular-nums text-blue-700">{cd.m}</span>
              <span className="text-sm text-blue-400 mb-0.5 ml-0.5">분</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">예상 완료 {expectedStr} · 3영업일 기준</p>
          </div>
        )}
      </div>

      {/* 불합격: 환불·쿠폰 진행 현황 */}
      {isFailed && (
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">예약금 환불 현황</span>
              <span className="tabular-nums text-rose-600 font-semibold">
                {displayRefund.toLocaleString()} / {orderCount.toLocaleString()}건
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${refundRate}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">{refundRate >= 100 ? '완료' : `처리 중 · ${refundRate.toFixed(1)}%`}</p>
              {refundFailed > 0 && (
                <span className="text-[10px] font-medium text-orange-500">
                  실패 {refundFailed.toLocaleString()}건 · CS 인계 필요
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">쿠폰 발행 현황</span>
              <span className="tabular-nums text-amber-600 font-semibold">
                {displayCoupon.toLocaleString()} / {orderCount.toLocaleString()}장
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${couponRate}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{couponRate >= 100 ? '완료' : `발행 중 · ${couponRate.toFixed(1)}%`}</p>
          </div>
        </div>
      )}
    </div>
  );
}