'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { generateOrderHistory, OrderHistoryEntry, HOURLY_BASE } from '@/lib/mockData';

function getCurrentSlotKey() {
  const h = new Date().getHours();
  return `${String(h).padStart(2, '0')}시`;
}

export default function OrderInflowGraph({ orderCount }: { orderCount: number }) {
  const [data, setData] = useState<OrderHistoryEntry[]>([]);

  useEffect(() => {
    setData(generateOrderHistory());

    const interval = setInterval(() => {
      const now = new Date();
      const slotKey = getCurrentSlotKey();
      const hour = now.getHours();
      const base = HOURLY_BASE[hour];
      const noise = base * 0.2;
      const newOrders = Math.max(1, Math.round(base + (Math.random() * noise * 2 - noise)));

      setData((prev) => {
        const lastSlot = prev[prev.length - 1];

        // 현재 슬롯이 마지막 슬롯과 같으면 → 마지막 포인트 값만 갱신
        if (lastSlot?.time === slotKey || lastSlot?.time === '') {
          return prev.map((d, i) =>
            i === prev.length - 1 ? { ...d, orders: newOrders } : d
          );
        }

        // 30분 슬롯이 바뀌었으면 → 새 슬롯 추가하고 맨 앞 제거
        const newEntry: OrderHistoryEntry = { time: slotKey, orders: newOrders };
        return [...prev.slice(1), newEntry];
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const total = data.reduce((sum, d) => sum + d.orders, 0);
  const peak  = data.length ? Math.max(...data.map((d) => d.orders)) : 0;
  const avg   = data.length ? Math.round(total / data.length) : 0;

  const stats = [
    { label: '12시간 누적', value: `${orderCount.toLocaleString()}건` },
    { label: '최고',        value: `${peak}건/시` },
    { label: '평균',        value: `${avg}건/시` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-500">주문 속도 모니터링</h2>
          <p className="text-xs text-gray-400 mt-1">급증 감지 시 긴급 중단 타이밍 확인</p>
        </div>
        <div className="flex gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-semibold text-slate-700 tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                color: '#334155',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              formatter={(v) => [`${v}건`, '주문']}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#orderGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}