// Deterministic RTX 3080 10GB clock/power model + safety rules for the OC lab.
// MODEL, NOT MEASUREMENT: every projected number is labelled projected_* and is only a
// pre-flight ordering aid. Truth order stays operator report > target output > this file.
// Anchors come from MASTER.md objective.stockBaseline (Superposition 1080p Extreme 8717,
// FPS avg 65.20, dmon peaks 201W / mclk 9501 / pclk 1935 / GPU temp 39-81C).

export type Baseline = {
  coreMHz: number;      // dmon pclk peak at stock
  mclkMHz: number;      // dmon mclk peak at stock (memory clock, NOT transfer rate)
  powerLimitW: number;  // card default power limit - UNVERIFIED until nvidia-smi -q -d POWER is pasted
  referenceW: number;   // board draw at stock core under the graphics meter
  score: number;        // Superposition 1080p Extreme score
  fpsAvg: number;
  tempIdleC: number;
  tempMaxC: number;
};

export const STOCK: Baseline = {
  coreMHz: 1935,
  mclkMHz: 9501,
  powerLimitW: 320,
  referenceW: 320,
  score: 8717,
  fpsAvg: 65.2,
  tempIdleC: 39,
  tempMaxC: 81,
};

// Recipe caps: docs/oc-3080-gwe-recipe.md (core +150 / mem +700 hard ceiling, 83C stop rule).
export const LIMITS = {
  coreOffsetMax: 150,
  coreOffsetWarn: 120,
  memOffsetMax: 700,
  memOffsetWarn: 500,
  powerPctMin: 60,
  powerPctMax: 100,     // >100 requires the step-4 PSU gate (--allow-pl-raise)
  tempStopC: 83,
};

// Power grows superlinearly with clock; clock recovers sublinearly when the limit trips.
const POWER_EXP = 1.35;
// A clock offset shifts the V/F curve, so part of it survives even when the board is pinned at the
// power limit (the normal Ampere case in Superposition). 0.7 is the modelled capture fraction.
const OFFSET_CAPTURE_WHEN_LIMITED = 0.7;
// Superposition 1080p Extreme is core-bound with a real memory tail.
const CORE_WEIGHT = 0.75;
const MEM_WEIGHT = 0.25;
// nvidia-settings GPUMemoryTransferRateOffset is a TRANSFER RATE offset: 2 MHz rate = 1 MHz clock.
export const MEM_OFFSET_TO_CLOCK = 0.5;

export type Point = {
  coreOffset: number;   // nvidia-settings GPUGraphicsClockOffset[3], MHz
  memOffset: number;    // nvidia-settings GPUMemoryTransferRateOffset[3], MHz of transfer rate
  powerPct: number;     // percent of the card default power limit (the Linux "undervolt" knob)
};

export type Projection = Point & {
  powerLimitW: number;
  requestedCoreMHz: number;
  projectedCoreMHz: number;
  projectedMemClkMHz: number;
  projectedWatts: number;
  projectedScore: number;
  projectedFpsAvg: number;
  projectedTempC: number;
  projectedScorePerWatt: number;
  deltaScorePct: number;
  deltaWattPct: number;
  powerLimited: boolean;
  bandPct: number;      // model uncertainty band
};

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function project(point: Point, base: Baseline = STOCK): Projection {
  const requestedCore = base.coreMHz + point.coreOffset;
  const memClk = base.mclkMHz + point.memOffset * MEM_OFFSET_TO_CLOCK;
  const powerLimitW = round((base.powerLimitW * point.powerPct) / 100, 1);
  const demandW = base.referenceW * (requestedCore / base.coreMHz) ** POWER_EXP;
  const limited = demandW > powerLimitW;
  // Not limited: the requested clock stands. Limited: the board falls back to the clock the power
  // budget sustains, keeping the captured share of the offset.
  const sustainedCore = base.coreMHz * (powerLimitW / base.referenceW) ** (1 / POWER_EXP);
  // A power-limited board can never exceed the clock it would run unlimited.
  const coreMHz = limited ? Math.min(requestedCore, sustainedCore + point.coreOffset * OFFSET_CAPTURE_WHEN_LIMITED) : requestedCore;
  const watts = limited ? powerLimitW : demandW;
  const perf = (coreMHz / base.coreMHz) ** CORE_WEIGHT * (memClk / base.mclkMHz) ** MEM_WEIGHT;
  const score = base.score * perf;
  const tempC = base.tempIdleC + (base.tempMaxC - base.tempIdleC) * (watts / base.referenceW) ** 0.8;
  return {
    ...point,
    powerLimitW,
    requestedCoreMHz: round(requestedCore, 0),
    projectedCoreMHz: round(coreMHz, 0),
    projectedMemClkMHz: round(memClk, 0),
    projectedWatts: round(watts, 1),
    projectedScore: Math.round(score),
    projectedFpsAvg: round(base.fpsAvg * perf, 2),
    projectedTempC: round(tempC, 1),
    projectedScorePerWatt: round(score / watts, 2),
    deltaScorePct: round(((score - base.score) / base.score) * 100, 2),
    deltaWattPct: round(((watts - base.referenceW) / base.referenceW) * 100, 2),
    powerLimited: limited,
    bandPct: 3,
  };
}

export type Verdict = { ok: boolean; errors: string[]; warnings: string[] };

export function validate(point: Point, allowPlRaise: boolean, base: Baseline = STOCK): Verdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!Number.isFinite(point.coreOffset) || !Number.isFinite(point.memOffset) || !Number.isFinite(point.powerPct)) {
    errors.push('non-numeric knob value');
    return { ok: false, errors, warnings };
  }
  if (point.coreOffset < 0) warnings.push('negative core offset: downclock, valid but not an OC step');
  if (point.coreOffset > LIMITS.coreOffsetMax) errors.push(`core offset ${point.coreOffset} exceeds recipe hard cap +${LIMITS.coreOffsetMax}`);
  else if (point.coreOffset > LIMITS.coreOffsetWarn) warnings.push(`core offset ${point.coreOffset} is past recipe step 3 (+${LIMITS.coreOffsetWarn}); a week of daily use is the gate`);
  if (point.memOffset > LIMITS.memOffsetMax) errors.push(`memory offset ${point.memOffset} exceeds recipe hard cap +${LIMITS.memOffsetMax} (GDDR6X heat)`);
  else if (point.memOffset > LIMITS.memOffsetWarn) warnings.push(`memory offset ${point.memOffset} is past recipe step 3 (+${LIMITS.memOffsetWarn})`);
  if (point.powerPct > LIMITS.powerPctMax && !allowPlRaise) errors.push('power limit above 100% needs the step-4 gate: PSU plug count + brand confirmed, then --allow-pl-raise');
  if (point.powerPct < LIMITS.powerPctMin) errors.push(`power limit ${point.powerPct}% below the ${LIMITS.powerPctMin}% floor: clocks collapse and the run stops being comparable`);
  const p = project(point, base);
  if (p.projectedTempC > LIMITS.tempStopC) warnings.push(`projected ${p.projectedTempC}C is at/over the ${LIMITS.tempStopC}C stop rule; abort the run if dmon confirms it`);
  return { ok: errors.length === 0, errors, warnings };
}

export function parseRange(spec: string, name: string): number[] {
  const parts = spec.split(':').map((x) => Number(x.trim()));
  if (parts.some((x) => !Number.isFinite(x))) throw new Error(`bad ${name} range: ${spec} (want min:max:step or a single number)`);
  if (parts.length === 1) return [parts[0]];
  if (parts.length !== 3) throw new Error(`bad ${name} range: ${spec} (want min:max:step)`);
  const [min, max, step] = parts;
  if (step <= 0) throw new Error(`bad ${name} step: ${step}`);
  const out: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

export function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((x) => x.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

export function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

export function stepId(point: Point): string {
  const sign = point.coreOffset < 0 ? 'm' : 'p';
  return `c${sign}${Math.abs(point.coreOffset)}-m${point.memOffset}-pl${point.powerPct}`;
}
