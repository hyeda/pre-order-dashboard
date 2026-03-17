'use client';

interface Props {
  salesLimit: number;
  orderCount: number;
  onChange: (limit: number) => void;
}

const PRESETS = [5000, 7000, 8000, 10000, 12000];

export default function SalesLimitSlider({ salesLimit, orderCount, onChange }: Props) {
  const MIN = Math.ceil(orderCount / 50) * 50;
  const MAX = 15000;

  const handleChange = (val: number) => {
    if (val < MIN) return;
    onChange(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-500">판매 한도 설정</h2>
      </div>

      <div className="flex items-baseline gap-1.5 mb-5">
        <span className="text-4xl font-semibold tabular-nums text-slate-900">{salesLimit.toLocaleString()}</span>
        <span className="text-sm text-gray-400">개</span>
      </div>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={50}
        value={salesLimit}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-slate-700"
      />
      <div className="flex justify-between text-xs text-gray-300 mt-1.5 mb-5">
        <span>{MIN.toLocaleString()}</span>
        <span>{MAX.toLocaleString()}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => {
          const disabled = p < MIN;
          return (
            <button
              key={p}
              onClick={() => !disabled && onChange(p)}
              disabled={disabled}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${disabled
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                  : salesLimit === p
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-slate-400 hover:text-slate-700'
                }`}
            >
              {p.toLocaleString()}
            </button>
          );
        })}
      </div>
    </div>
  );
}