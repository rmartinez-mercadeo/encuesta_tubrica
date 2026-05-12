export interface SurveyData {
  'Submission ID': string;
  'Fecha': string;
  'V_PVC': string | number;
  'V_PPR': string | number;
  'V_CPVC': string | number;
  'M_PVC': string;
  'M_PPR': string;
  'M_CPVC': string;
  'RV_PVC': string;
  'RV_PPR': string;
  'RV_CPVC': string;
  'MV_PVC': string;
  'MV_PPR': string;
  'MV_CPVC': string;
  'Motivo_PVC': string;
  'Motivo_PPR': string;
  'Motivo_CPVC': string;
  'Color PPR': string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface ProcessedMetrics {
  totalResponses: number;
  avgSales: {
    pvc: number;
    ppr: number;
    cpvc: number;
  };
  brandFrequency: {
    pvc: Record<string, number>;
    ppr: Record<string, number>;
    cpvc: Record<string, number>;
  };
  salesRanges: {
    pvc: Record<string, number>;
    ppr: Record<string, number>;
    cpvc: Record<string, number>;
  };
  topSellingBrands: {
    pvc: Record<string, number>;
    ppr: Record<string, number>;
    cpvc: Record<string, number>;
  };
  reasons: {
    pvc: Record<string, number>;
    ppr: Record<string, number>;
    cpvc: Record<string, number>;
  };
  pprColorPreference: Record<string, number>;
}
