import React from 'react';
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../../shared/theme';

interface DonationJarProps {
  /** 0..1 — how full the jar appears. Decorative; clamped to a visible range. */
  fillRatio: number;
  size?: number;
}

// Jar inner cavity (in viewBox coordinates) that the liquid fills.
const JAR_TOP = 36;
const JAR_BOTTOM = 118;
const JAR_HEIGHT = JAR_BOTTOM - JAR_TOP;

// A heart centred over the jar, drawn on top of the liquid.
const HEART_PATH =
  'M60 96 C 48 84, 38 77, 38 66 C 38 58, 45 54, 51 56 C 55 58, 58 61, 60 64 C 62 61, 65 58, 69 56 C 75 54, 82 58, 82 66 C 82 77, 72 84, 60 96 Z';

export const DonationJar = ({ fillRatio, size = 160 }: DonationJarProps) => {
  const {
    theme: { colors },
  } = useTheme();

  const clamped = Math.max(0.14, Math.min(1, fillRatio));
  const liquidHeight = JAR_HEIGHT * clamped;
  const liquidY = JAR_BOTTOM - liquidHeight;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 128">
      <Defs>
        <LinearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primarySoft} />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
        <ClipPath id="jarClip">
          <Rect x="24" y={JAR_TOP} width="72" height={JAR_HEIGHT} rx="16" />
        </ClipPath>
      </Defs>

      {/* Liquid, clipped to the jar body. */}
      <G clipPath="url(#jarClip)">
        <Rect x="20" y={liquidY} width="80" height={liquidHeight + 6} fill="url(#donationFill)" />
      </G>

      {/* Heart floating in the jar. */}
      <Path d={HEART_PATH} fill={colors.background} stroke={colors.primary} strokeWidth="2.5" />

      {/* Jar body, lid and rim outlines. */}
      <Rect
        x="24"
        y={JAR_TOP}
        width="72"
        height={JAR_HEIGHT}
        rx="16"
        fill="none"
        stroke={colors.primary}
        strokeWidth="3"
      />
      <Rect x="34" y="22" width="52" height="16" rx="6" fill="none" stroke={colors.primary} strokeWidth="3" />
      <Rect x="46" y="12" width="28" height="12" rx="5" fill="none" stroke={colors.primary} strokeWidth="3" />
    </Svg>
  );
};
