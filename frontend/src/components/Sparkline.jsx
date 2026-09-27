import React, { useMemo } from 'react';

const getPath = (data, width, height) => {
  if (data.length === 0) return "";
  const min = Math.min(...data, 0);
  let max = Math.max(...data, 0);
  if (min === max) max += 1;
  const range = max - min;

  // تغییر مهم: اضافه کردن پدینگ داخلی برای اینکه ضخامت خط بریده نشود
  const paddingY = 4; // 4 پیکسل فاصله از بالا و پایین
  const usableHeight = height - (paddingY * 2);

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    
    // محاسبه دقیق Y:
    // نمودار بین (paddingY) تا (height - paddingY) رسم می‌شود
    const normalizedVal = (val - min) / range; // عددی بین 0 تا 1
    const y = (height - paddingY) - (normalizedVal * usableHeight);
    
    return [x, y];
  });

  return points.reduce((acc, [x, y], i, arr) => {
    if (i === 0) return `M ${x},${y}`;
    const [x0, y0] = arr[i - 1];
    const [x1, y1] = [x, y];
    // تنظیم نرمی نمودار
    const controlPointX = (x1 - x0) * 0.35;
    return `${acc} C ${x0 + controlPointX},${y0} ${x1 - controlPointX},${y1} ${x1},${y1}`;
  }, "");
};

const Sparkline = ({ data = [], color = "#10b981" }) => {
  // ابعاد viewBox
  const width = 100;
  const height = 45; // کمی ارتفاع را بیشتر کردم تا جا بازتر باشد

  const { pathD, fillD } = useMemo(() => {
    if (!data || data.length < 2) return { pathD: "", fillD: "" };
    const d = getPath(data, width, height);
    return {
      pathD: d,
      // بستن ناحیه پر شده به کف نمودار
      fillD: `${d} V ${height} H 0 Z`
    };
  }, [data, height]); // height به وابستگی‌ها اضافه شد

  return (
    // overflow-visible می‌گذاریم تا اگر احیاناً پیکسلی بیرون زد، دیده شود
    // اما چون محاسبات را درست کردیم، نباید بیرون بزند.
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* ناحیه پر شده زیر نمودار */}
      <path d={fillD} fill={`url(#sparkGradient-${color})`} stroke="none" className="transition-[d] duration-500 ease-out" />
      {/* خط اصلی نمودار با ضخامت 2 */}
      <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="transition-[d] duration-500 ease-out" />
    </svg>
  );
};

export default Sparkline;