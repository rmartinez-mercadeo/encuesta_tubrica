import { SurveyData, ProcessedMetrics } from './types';

export function processSurveyData(rawData: any[]): ProcessedMetrics {
  const uniqueRows = rawData.filter(row => row['Submission ID'] && String(row['Submission ID']).trim() !== '');
  const totalResponses = uniqueRows.length;

  const metrics: ProcessedMetrics = {
    totalResponses: totalResponses,
    avgSales: { pvc: 0, ppr: 0, cpvc: 0 },
    brandFrequency: { pvc: {}, ppr: {}, cpvc: {} },
    salesRanges: { pvc: {}, ppr: {}, cpvc: {} },
    topSellingBrands: { pvc: {}, ppr: {}, cpvc: {} },
    reasons: { pvc: {}, ppr: {}, cpvc: {} },
    pprColorPreference: {},
  };

  if (totalResponses === 0) return metrics;

  uniqueRows.forEach((row) => {
    // Normalizar datos: Convertir a número y manejar posibles nulos
    const pvcVal = parseFloat(String(row.V_PVC || 0).replace(/[^0-9.]/g, ''));
    const pprVal = parseFloat(String(row.V_PPR || 0).replace(/[^0-9.]/g, ''));
    const cpvcVal = parseFloat(String(row.V_CPVC || 0).replace(/[^0-9.]/g, ''));

    metrics.avgSales.pvc += isNaN(pvcVal) ? 0 : pvcVal;
    metrics.avgSales.ppr += isNaN(pprVal) ? 0 : pprVal;
    metrics.avgSales.cpvc += isNaN(cpvcVal) ? 0 : cpvcVal;

    // Procesamiento de valores múltiples (Comas)
    const processMultivalue = (field: any, target: Record<string, number>) => {
      if (!field || typeof field !== 'string') return;
      field.split(',').forEach((val) => {
        const item = val.trim();
        if (item && item !== '0') {
          target[item] = (target[item] || 0) + 1;
        }
      });
    };

    processMultivalue(row.M_PVC, metrics.brandFrequency.pvc);
    processMultivalue(row.M_PPR, metrics.brandFrequency.ppr);
    processMultivalue(row.M_CPVC, metrics.brandFrequency.cpvc);

    const addCount = (val: any, target: Record<string, number>) => {
      const cleaned = String(val || '').trim();
      if (cleaned && cleaned !== '' && cleaned !== '0') {
        target[cleaned] = (target[cleaned] || 0) + 1;
      }
    };

    addCount(row.RV_PVC, metrics.salesRanges.pvc);
    addCount(row.RV_PPR, metrics.salesRanges.ppr);
    addCount(row.RV_CPVC, metrics.salesRanges.cpvc);

    addCount(row.MV_PVC, metrics.topSellingBrands.pvc);
    addCount(row.MV_PPR, metrics.topSellingBrands.ppr);
    addCount(row.MV_CPVC, metrics.topSellingBrands.cpvc);

    processMultivalue(row.Motivo_PVC, metrics.reasons.pvc);
    processMultivalue(row.Motivo_PPR, metrics.reasons.ppr);
    processMultivalue(row.Motivo_CPVC, metrics.reasons.cpvc);

    addCount(row['Color PPR'], metrics.pprColorPreference);
  });

  metrics.avgSales.pvc /= totalResponses;
  metrics.avgSales.ppr /= totalResponses;
  metrics.avgSales.cpvc /= totalResponses;

  return metrics;
}

export function getReasonsForBrand(data: any[], material: 'PVC' | 'PPR' | 'CPVC', brandName: string): Record<string, number> {
  const result: Record<string, number> = {};
  const brandField = `MV_${material}`;
  const reasonField = `Motivo_${material}`;

  data.forEach(row => {
    if (String(row[brandField]).trim() === brandName) {
      const reasons = String(row[reasonField] || '');
      reasons.split(',').forEach(r => {
        const item = r.trim();
        if (item && item !== '0') {
          result[item] = (result[item] || 0) + 1;
        }
      });
    }
  });

  return result;
}

export function formatForChart(record: Record<string, number>): { name: string; value: number }[] {
  return Object.entries(record)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
