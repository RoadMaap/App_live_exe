import React, { useMemo, useId } from 'react';

/**
 * Calculates cubic bezier SVG path strings for line stroke and filled area.
 * Incorporates vertical padding to prevent vector clipping on high peaks.
 */
const computeSparklineGeometry = (data, width, height) => {
    if (!data || data.length === 0) return { pathD: "", fillD: "", lastPoint: null, zeroY: null };

    const numericData = data.map(value => Number(value) || 0);
    let min = Math.min(...numericData, 0);
    let max = Math.max(...numericData, 0);
    if (min === max) {
        const scale = Math.max(Math.abs(min), 1);
        min -= scale;
        max += scale;
    }
    const range = max - min;

    // Safety vertical padding to guarantee line stroke visibility
    const paddingY = 5;
    const usableHeight = height - (paddingY * 2);

    const points = numericData.map((val, index) => {
        const x = numericData.length === 1 ? width / 2 : (index / (numericData.length - 1)) * width;
        const normalizedVal = (val - min) / range;
        const y = (height - paddingY) - (normalizedVal * usableHeight);
        return [x, y];
    });

    // Generate smooth cubic bezier curve
    const pathD = points.reduce((acc, [x, y], i, arr) => {
        if (i === 0) return `M ${x},${y}`;
        const [x0, y0] = arr[i - 1];
        const [x1, y1] = [x, y];
        const controlPointX = (x1 - x0) * 0.35;
        return `${acc} C ${x0 + controlPointX},${y0} ${x1 - controlPointX},${y1} ${x1},${y1}`;
    }, "");

    const lastPoint = points[points.length - 1];
    
    // Baseline zero Y position calculation
    const zeroY = min < 0 ? (height - paddingY) - ((0 - min) / range) * usableHeight : null;

    return {
        pathD,
        fillD: `${pathD} V ${height} H 0 Z`,
        lastPoint,
        zeroY
    };
};

/**
 * Sparkline Component
 * Microsoft Fluent 2 financial micro-chart with live pulse telemetry.
 */
const Sparkline = ({ data = [], color = "#107C41" }) => {
    const rawId = useId();
    const gradientId = useMemo(() => `spark-${rawId.replace(/:/g, '')}`, [rawId]);

    const width = 100;
    const height = 24;

    const { pathD, fillD, lastPoint, zeroY } = useMemo(() => {
        if (!data || data.length < 2) {
            return { pathD: "", fillD: "", lastPoint: null, zeroY: null };
        }
        return computeSparklineGeometry(data, width, height);
    }, [data, width, height]);

    if (!pathD) {
        return <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#52525B]">--</div>;
    }

    return (
        <svg 
            className="w-full h-full overflow-visible select-none" 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {/* Surface backdrop gradient matching Fluent 2 palette */}
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="75%" stopColor={color} stopOpacity="0.04" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
            </defs>

            {/* Optional zero baseline reference when balance dips into negative values */}
            {zeroY !== null && (
                <line 
                    x1="0" 
                    y1={zeroY} 
                    x2={width} 
                    y2={zeroY} 
                    stroke="#333333" 
                    strokeDasharray="2 2" 
                    strokeWidth="0.8" 
                    vectorEffect="non-scaling-stroke"
                />
            )}

            {/* Fluid fill region beneath curve */}
            <path 
                d={fillD} 
                fill={`url(#${gradientId})`} 
                stroke="none" 
                className="transition-[d] duration-500 ease-out" 
            />

            {/* Primary stroke line */}
            <path 
                d={pathD} 
                stroke={color} 
                strokeWidth="1.75" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                vectorEffect="non-scaling-stroke" 
                className="transition-[d] duration-500 ease-out" 
            />

            {/* Live endpoint telemetry indicator */}
            {lastPoint && (
                    <g className="transition-transform duration-500 ease-out" transform={`translate(${lastPoint[0]} ${lastPoint[1]})`}>
                    <circle 
                        r="3.5" 
                        fill={color} 
                        className="animate-ping opacity-60" 
                    />
                    <circle 
                        r="2" 
                        fill="#FFFFFF" 
                        stroke={color} 
                        strokeWidth="1" 
                    />
                </g>
            )}
        </svg>
    );
};

export default Sparkline;