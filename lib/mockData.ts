export type InspectionStatus = 'pending' | 'in-progress' | 'passed' | 'partial' | 'failed';

export interface InspectionResult {
  declaredQty: number;  // 신고 수량
  passedQty: number;    // 실제 통과 수량
}

export interface OrderHistoryEntry {
  time: string;
  orders: number;
}

export interface DashboardData {
  inspectionStatus: InspectionStatus;
  orderCount: number;
  salesLimit: number;
  isEmergencyStopped: boolean;
  orderHistory: OrderHistoryEntry[];
}

// 비즈니스 상수
export const BUSINESS = {
  regularPrice: 5000,
  preOrderPrice: 4500,   // 10% 할인
  deposit: 2000,         // 선결제 예약금
  remaining: 2500,       // 검역 합격 후 잔금
  discountRate: 0.1,
  couponDiscount: 0.1,
} as const;

// 시간대별 자연스러운 주문 패턴 (0시~23시 기준 기대치, 시간당 건수)
export const HOURLY_BASE = [
   50,  30,  20,  15,  20,  80,   // 0~5시: 새벽 거의 없음
  200, 450, 780, 900, 950, 980,   // 6~11시: 출근 후 급증
  850, 920, 880, 960, 980, 1000,  // 12~17시: 점심·오후 피크
  900, 820, 700, 550, 350, 150,   // 18~23시: 저녁 이후 감소
];

// 12시간을 1시간 단위 12포인트로 생성
export const generateOrderHistory = (): OrderHistoryEntry[] => {
  const now = new Date();
  now.setMinutes(0, 0, 0);

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now);
    d.setHours(d.getHours() - (11 - i));
    const hour = d.getHours();
    const base = HOURLY_BASE[hour];
    const noise = base * 0.2;
    const orders = Math.max(1, Math.round(base + (Math.random() * noise * 2 - noise)));
    return {
      time: `${String(hour).padStart(2, '0')}시`,
      orders,
    };
  });
};

export const
  INITIAL_DATA: DashboardData = {
  inspectionStatus: 'in-progress',
  orderCount: 7270,
  salesLimit: 10000,
  isEmergencyStopped: false,
  orderHistory: generateOrderHistory(),
};