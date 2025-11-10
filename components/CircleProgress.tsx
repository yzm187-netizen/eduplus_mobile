import React from 'react';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  trackColor?: string;
  progressColor?: string;
};

export default function CircleProgress({
  size = 48,
  strokeWidth = 6,
  progress,
  trackColor = '#E5E7EB',
  progressColor = '#F97316',
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress || 0));
  const dashoffset = circumference * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={trackColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={progressColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
