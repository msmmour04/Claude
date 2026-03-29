import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Polyline } from 'react-native-svg';

const SparklineChart = ({
  data = [],
  width = 60,
  height = 30,
  color = '#007AFF',
  filled = false,
  strokeWidth = 1.5,
}) => {
  const points = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const coords = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + (1 - (val - min) / range) * chartHeight;
      return { x, y };
    });

    return coords;
  }, [data, width, height]);

  const polylinePoints = useMemo(() => {
    if (!points) return '';
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }, [points]);

  const fillPath = useMemo(() => {
    if (!points || points.length < 2) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = height;

    let d = `M ${firstX} ${bottomY} `;
    d += `L ${points[0].x} ${points[0].y} `;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += `C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y} `;
    }
    d += `L ${lastX} ${bottomY} Z`;
    return d;
  }, [points, height]);

  const smoothPath = useMemo(() => {
    if (!points || points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  if (!points) return <View style={{ width, height }} />;

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {filled && (
        <Path
          d={fillPath}
          fill={`url(#${gradientId})`}
        />
      )}
      <Path
        d={smoothPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default SparklineChart;
