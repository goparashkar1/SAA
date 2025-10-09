import type { CSSProperties } from "react";

export interface LightSweepSettings {
  angleDeg: number;
  peakOpacity: number;
  activeDurationMs: number;
  idleCycleMinMs: number;
  idleCycleMaxMs: number;
  idleDelayJitterMs: number;
  gradientWidth: number;
  easeFunction: string;
}

type LightSweepCSSVariables = CSSProperties & Record<`--${string}`, string>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const randomBetween = (min: number, max: number) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return min;
  }
  if (min > max) {
    const swappedMin = Math.min(min, max);
    const swappedMax = Math.max(min, max);
    return swappedMin + Math.random() * (swappedMax - swappedMin);
  }
  return min + Math.random() * (max - min);
};

const DEFAULT_SETTINGS: LightSweepSettings = {
  angleDeg: 225,
  peakOpacity: 0.24,
  activeDurationMs: 6000,
  idleCycleMinMs: 15000,
  idleCycleMaxMs: 16000,
  idleDelayJitterMs: 1000,
  gradientWidth: 150,
  easeFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
};

const asMs = (value: number) => `${Math.round(value)}ms`;
const toOpacity = (value: number) => clamp(value, 0, 1).toFixed(3);

export function createLightSweepVars(
  overrides: Partial<LightSweepSettings> = {}
): LightSweepCSSVariables {
  const settings: LightSweepSettings = { ...DEFAULT_SETTINGS, ...overrides };

  const activeDuration = Math.max(3000, settings.activeDurationMs);
  const minCycleBase = Math.max(activeDuration + 3000, settings.idleCycleMinMs);
  const maxCycleBase = Math.max(minCycleBase + 500, settings.idleCycleMaxMs);

  const loopDuration = clamp(
    randomBetween(minCycleBase, maxCycleBase),
    minCycleBase,
    maxCycleBase
  );

  const peakOpacity = clamp(settings.peakOpacity, 0.1, 0.36);
  const gradientWidth = clamp(settings.gradientWidth, 100, 220);
  const gradientStartOpacity = clamp(peakOpacity * 0.35, 0.04, 0.14);
  const gradientEndOpacity = clamp(peakOpacity * 0.28, 0.04, 0.12);

  return {
    "--light-sweep-angle": `${settings.angleDeg}deg`,
    "--light-sweep-peak-opacity": toOpacity(peakOpacity),
    "--light-sweep-gradient-width": `${gradientWidth}%`,
    "--light-sweep-gradient-start-opacity": toOpacity(gradientStartOpacity),
    "--light-sweep-gradient-end-opacity": toOpacity(gradientEndOpacity),
    "--light-sweep-active-duration": asMs(activeDuration),
    "--light-sweep-loop-duration": asMs(loopDuration),
    "--light-sweep-ease-function": settings.easeFunction,
  };
}

export const WIDGET_LIGHT_SWEEP_SETTINGS: Readonly<LightSweepSettings> = Object.freeze({
  angleDeg: 225,
  peakOpacity: 0.3,
  activeDurationMs: 6400,
  idleCycleMinMs: 15000,
  idleCycleMaxMs: 15800,
  idleDelayJitterMs: 900,
  gradientWidth: 170,
  easeFunction: "cubic-bezier(0.42, 0, 0.25, 1)",
});

export const SIDEBAR_LIGHT_SWEEP_SETTINGS: Readonly<LightSweepSettings> = Object.freeze({
  angleDeg: 225,
  peakOpacity: 0.18,
  activeDurationMs: 5200,
  idleCycleMinMs: 15000,
  idleCycleMaxMs: 16000,
  idleDelayJitterMs: 800,
  gradientWidth: 140,
  easeFunction: "cubic-bezier(0.4, 0.05, 0.2, 1)",
});

