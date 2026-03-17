'use client';

import { Banknote, RotateCcw, Tag, CircleCheckBig } from 'lucide-react';
import { BUSINESS, InspectionStatus, InspectionResult } from '@/lib/mockData';

interface Props {
  orderCount: number;
  salesLimit: number;
  inspectionStatus: InspectionStatus;
  inspectionResult: InspectionResult | null;
}

function formatKRW(amount: number) {
  return amount.toLocaleString('ko-KR') + '원';
}


export default function RiskMetricsPanel({ orderCount, salesLimit, inspectionStatus, inspectionResult }: Props) {
  const isFailed = inspectionStatus === 'failed';
  const isPassed = inspectionStatus === 'passed';
  const isPartial = inspectionStatus === 'partial';

  const passedQty    = isPartial && inspectionResult ? Math.min(orderCount, inspectionResult.passedQty) : isPassed ? orderCount : 0;
  const failedQty    = isPartial && inspectionResult ? Math.max(0, orderCount - inspectionResult.passedQty) : isFailed ? orderCount : 0;
  const hasRefund    = isFailed || (isPartial && failedQty > 0);
  const hasRemaining = isPassed || (isPartial && passedQty > 0);

  const metrics = [
    {
      label: '예약금 총액',
      value: formatKRW(orderCount * BUSINESS.deposit),
      sub: `${orderCount.toLocaleString()}건 × ${BUSINESS.deposit.toLocaleString()}원`,
      active: true,
      tone: 'neutral',
      Icon: Banknote,
    },
    {
      label: '환불 예상액',
      value: hasRefund ? formatKRW(failedQty * BUSINESS.deposit) : '—',
      sub: hasRefund ? `${failedQty.toLocaleString()}건 환불 처리 예정` : '검역 합격 시 해당 없음',
      active: hasRefund,
      tone: 'danger',
      Icon: RotateCcw,
    },
    {
      label: '불합격 보상 쿠폰 비용',
      value: hasRefund ? formatKRW(Math.round(failedQty * BUSINESS.regularPrice * BUSINESS.couponDiscount)) : '—',
      sub: hasRefund ? `${failedQty.toLocaleString()}건 × ${(BUSINESS.couponDiscount * 100).toFixed(0)}% 쿠폰` : '불합격 시 해당',
      active: hasRefund,
      tone: 'warning',
      Icon: Tag,
    },
    {
      label: '잔금 수령 예상',
      value: hasRemaining ? formatKRW(passedQty * BUSINESS.remaining) : '—',
      sub: hasRemaining
        ? `${passedQty.toLocaleString()}건 × ${BUSINESS.remaining.toLocaleString()}원`
        : '검역 합격 후 자동 결제',
      active: hasRemaining,
      tone: 'success',
      Icon: CircleCheckBig,
    },
  ] as const;

  const toneStyles = {
    neutral: { card: 'bg-slate-50 border-slate-200', icon: 'text-slate-500', value: 'text-slate-900', label: 'text-slate-500', sub: 'text-slate-400' },
    danger:  { card: 'bg-rose-50 border-rose-200',   icon: 'text-rose-400',  value: 'text-rose-700',  label: 'text-rose-500',  sub: 'text-rose-400' },
    warning: { card: 'bg-amber-50 border-amber-200', icon: 'text-amber-400', value: 'text-amber-700', label: 'text-amber-500', sub: 'text-amber-400' },
    success: { card: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-500', value: 'text-emerald-700', label: 'text-emerald-600', sub: 'text-emerald-400' },
  };

  const inactiveStyles = {
    card: 'bg-white border-gray-100', icon: 'text-gray-300', value: 'text-gray-300', label: 'text-gray-400', sub: 'text-gray-300',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 mb-4">수익 및 비용</h2>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, sub, active, tone, Icon }) => {
          const s = active ? toneStyles[tone] : inactiveStyles;
          return (
            <div key={label} className={`rounded-xl border p-4 transition-all ${s.card}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium tracking-wide ${s.label}`}>{label}</span>
                <Icon size={15} className={s.icon} strokeWidth={1.8} />
              </div>
              <p className={`text-xl font-semibold tabular-nums ${s.value}`}>{value}</p>
              <p className={`text-xs mt-1 ${s.sub}`}>{sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}