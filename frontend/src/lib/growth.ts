export const GROWTH_THRESHOLDS = [0, 50, 100, 250, 500, 1000] as const;
export const GROWTH_STAGE_LABELS = [
  "Seedling",
  "Sprout",
  "Sapling",
  "Tree",
  "Ancient Tree",
] as const;

export const MAX_GROWTH_STAGE = GROWTH_STAGE_LABELS.length;
export const MAX_GROWTH_POINTS =
  GROWTH_THRESHOLDS[GROWTH_THRESHOLDS.length - 1];

export function clampGrowthStage(stage: number): number {
  return Math.min(MAX_GROWTH_STAGE, Math.max(1, Math.floor(stage)));
}

export function getGrowthStageLabel(stage: number): string {
  return (
    GROWTH_STAGE_LABELS[clampGrowthStage(stage) - 1] ?? GROWTH_STAGE_LABELS[0]
  );
}

export function getGrowthThresholdRange(stage: number) {
  const safeStage = clampGrowthStage(stage);
  const currentThreshold = GROWTH_THRESHOLDS[safeStage - 1] ?? 0;
  const nextThreshold = GROWTH_THRESHOLDS[safeStage] ?? MAX_GROWTH_POINTS;

  return {
    currentThreshold,
    nextThreshold,
  };
}

export function getGrowthProgress(
  growthPoints: number,
  growthStage: number,
): number {
  const safeStage = clampGrowthStage(growthStage);

  if (safeStage >= MAX_GROWTH_STAGE) {
    return 100;
  }

  const { currentThreshold, nextThreshold } =
    getGrowthThresholdRange(safeStage);
  const thresholdSpan = Math.max(1, nextThreshold - currentThreshold);
  const boundedPoints = Math.min(MAX_GROWTH_POINTS, Math.max(0, growthPoints));

  return Math.min(
    100,
    Math.max(0, ((boundedPoints - currentThreshold) / thresholdSpan) * 100),
  );
}
