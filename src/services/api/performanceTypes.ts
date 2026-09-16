export type PerformanceRole = {
  id: string | number;
  name: string;
  department?: string;
  description?: string;
};

export type PerformanceKpi = {
  id: string | number;
  name: string;
  description?: string;
  unit?: string;
  weight?: number;
  trackingMode?: string;
  active?: boolean;
};

export type PerformanceTarget = {
  id: string | number;
  roleId: string | number;
  name: string;
  frequency?: string;
  targetValue?: number;
  unit?: string;
  weight?: number;
  status?: string;
  sourceModule?: string;
};

export type PerformanceTargetProgress = PerformanceTarget & {
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  actualValue?: number;
  achievementPercent?: number;
  evidenceAvailable?: boolean;
  evidenceRef?: string;
};
