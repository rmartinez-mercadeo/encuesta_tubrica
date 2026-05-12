import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  FileUp, 
  BarChart3, 
  LayoutDashboard, 
  TrendingUp, 
  Users,
  CheckCircle2,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyData, ProcessedMetrics } from './types';
import { processSurveyData, formatForChart, getReasonsForBrand } from './dataProcessor';
import { cn } from './lib/utils';

const COLORS = ['#009EE3', '#66C5EE', '#99D9F5', '#C6C6C6', '#E5E7EB'];

export default function App() {
  const [data, setData] = useState<SurveyData[] | null>(null);
  const [metrics, setMetrics] = useState<ProcessedMetrics | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ title: string, data: any[] } | null>(null);
  
  // Estados para marcas seleccionadas en motivos
  const [selectedPvcBrand, setSelectedPvcBrand] = useState<string>('');
  const [selectedPprBrand, setSelectedPprBrand] = useState<string>('');
  const [selectedCpvcBrand, setSelectedCpvcBrand] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Al cargar nuevas métricas, inicializar con las marcas líderes
  useEffect(() => {
    if (metrics) {
      const topPvc = formatForChart(metrics.topSellingBrands.pvc)[0]?.name || '';
      const topPpr = formatForChart(metrics.topSellingBrands.ppr)[0]?.name || '';
      const topCpvc = formatForChart(metrics.topSellingBrands.cpvc)[0]?.name || '';
      
      setSelectedPvcBrand(topPvc);
      setSelectedPprBrand(topPpr);
      setSelectedCpvcBrand(topCpvc);
    }
  }, [metrics]);

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        let rows = results.data as any[][];
        if (rows.length < 2) return;

        let headerRowIndex = 0;
        if (String(rows[0][0]).startsWith('#')) {
          headerRowIndex = 1;
        }

        const headers = rows[headerRowIndex];
        const dataRows = rows.slice(headerRowIndex + 1);

        const parsedData = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });

        const processed = processSurveyData(parsedData);
        setData(parsedData);
        setMetrics(processed);
      },
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-gray-50 text-[#1D1D1B] py-8 px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reporte de Investigación de Mercado</h1>
              <p className="text-gray-500 font-medium italic">Tuberías y conexiones de presión</p>
            </div>
          </div>
          {data && (
            <button 
              onClick={() => { setData(null); setMetrics(null); }}
              className="flex items-center gap-2 bg-[#009EE3] hover:bg-opacity-90 transition-all px-4 py-2 rounded-lg font-medium text-sm"
              id="btn-nueva-carga"
            >
              <FileUp size={18} />
              Nueva Carga
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 relative">
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div
                id="dropzone"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full max-w-2xl border-3 border-dashed rounded-3xl p-12 flex flex-col items-center gap-6 cursor-pointer transition-all duration-300 bg-white",
                  isDragging ? "border-[#009EE3] bg-blue-50 scale-102" : "border-[#C6C6C6] hover:border-[#009EE3] hover:shadow-xl"
                )}
              >
                <div className="bg-[#009EE3]/10 p-6 rounded-full">
                  <FileUp className="text-[#009EE3]" size={48} />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Cargar datos de encuesta</h2>
                  <p className="text-gray-500">Arrastre su archivo CSV aquí o haga clic para buscar</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  accept=".csv"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* KPIs Principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total de respuestas" 
                  value={metrics?.totalResponses || 0} 
                  icon={<Users className="text-[#009EE3]" />}
                  id="metric-total"
                />
                <MetricCard 
                  title="% Ventas PVC" 
                  value={`${metrics?.avgSales.pvc.toFixed(1)}%`} 
                  icon={<TrendingUp className="text-[#009EE3]" />}
                  id="metric-pvc"
                />
                <MetricCard 
                  title="% Ventas PPR" 
                  value={`${metrics?.avgSales.ppr.toFixed(1)}%`} 
                  icon={<TrendingUp className="text-[#66C5EE]" />}
                  id="metric-ppr"
                />
                <MetricCard 
                  title="% Ventas CPVC" 
                  value={`${metrics?.avgSales.cpvc.toFixed(1)}%`} 
                  icon={<TrendingUp className="text-[#99D9F5]" />}
                  id="metric-cpvc"
                />
              </div>

              {/* Sección de Marcas comercializadas por Material */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg">Marcas comercializadas</h3>
                </div>
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ChartContainer title="PVC" id="chart-pvc">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={formatForChart(metrics?.brandFrequency.pvc || {}).slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={11} width={100} stroke="#1D1D1B" />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="value" name="Total" fill="#009EE3" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#1D1D1B' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                  <ChartContainer title="PPR" id="chart-ppr">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={formatForChart(metrics?.brandFrequency.ppr || {}).slice(0, 5)} >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={11} width={100} stroke="#1D1D1B" />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="value" name="Total" fill="#66C5EE" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#1D1D1B' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                  <ChartContainer title="CPVC" id="chart-cpvc">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={formatForChart(metrics?.brandFrequency.cpvc || {}).slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" fontSize={11} width={100} stroke="#1D1D1B" />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="value" name="Total" fill="#99D9F5" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#1D1D1B' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                </div>
              </div>

              {/* Sección de Rangos de Venta */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="sales-ranges">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg">Distribución por rangos de venta</h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <RangeChart title="PVC" data={formatForChart(metrics?.salesRanges.pvc || {})} color="#009EE3" />
                    <RangeChart title="PPR" data={formatForChart(metrics?.salesRanges.ppr || {})} color="#66C5EE" />
                    <RangeChart title="CPVC" data={formatForChart(metrics?.salesRanges.cpvc || {})} color="#99D9F5" />
                  </div>
                </div>
              </div>

              {/* Marcas Líderes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg">Marcas líderes (más vendidas)</h3>
                </div>
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <LeaderCard 
                    title="PVC" 
                    data={formatForChart(metrics?.topSellingBrands.pvc || {})} 
                    onClick={() => setSelectedTopic({ title: "Todas las marcas vendidas - PVC", data: formatForChart(metrics?.topSellingBrands.pvc || {}) })}
                  />
                  <LeaderCard 
                    title="PPR" 
                    data={formatForChart(metrics?.topSellingBrands.ppr || {})} 
                    onClick={() => setSelectedTopic({ title: "Todas las marcas vendidas - PPR", data: formatForChart(metrics?.topSellingBrands.ppr || {}) })}
                  />
                  <LeaderCard 
                    title="CPVC" 
                    data={formatForChart(metrics?.topSellingBrands.cpvc || {})} 
                    onClick={() => setSelectedTopic({ title: "Todas las marcas vendidas - CPVC", data: formatForChart(metrics?.topSellingBrands.cpvc || {}) })}
                  />
                </div>
              </div>

              {/* Análisis de Motivos - DINÁMICO */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" id="analysis-reasons">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-lg">Por qué es la marca más vendida (Análisis por marca)</h3>
                  <p className="text-xs text-gray-500 italic">Seleccione una marca para ver sus motivos específicos</p>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    <ReasonPanel 
                      title="PVC" 
                      brandOptions={formatForChart(metrics?.topSellingBrands.pvc || {})} 
                      selectedBrand={selectedPvcBrand}
                      onSelect={(b) => setSelectedPvcBrand(b)}
                      reasons={formatForChart(getReasonsForBrand(data || [], 'PVC', selectedPvcBrand))}
                    />
                    <ReasonPanel 
                      title="PPR" 
                      brandOptions={formatForChart(metrics?.topSellingBrands.ppr || {})} 
                      selectedBrand={selectedPprBrand}
                      onSelect={(b) => setSelectedPprBrand(b)}
                      reasons={formatForChart(getReasonsForBrand(data || [], 'PPR', selectedPprBrand))}
                    />
                    <ReasonPanel 
                      title="CPVC" 
                      brandOptions={formatForChart(metrics?.topSellingBrands.cpvc || {})} 
                      selectedBrand={selectedCpvcBrand}
                      onSelect={(b) => setSelectedCpvcBrand(b)}
                      reasons={formatForChart(getReasonsForBrand(data || [], 'CPVC', selectedCpvcBrand))}
                    />
                  </div>
                </div>
              </div>

              {/* Preferencia de Color PPR con Conteo Visible */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-12" id="color-pref">
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-bold mb-6">Preferencia de color de capa interna (PPR)</h3>
                  <div className="space-y-6">
                    {formatForChart(metrics?.pprColorPreference || {}).map((item, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-[#1D1D1B]">{item.name}</span>
                          <span className="text-xs font-bold text-[#009EE3]">{item.value} respuestas ({((item.value / metrics!.totalResponses) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / metrics!.totalResponses) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-[#009EE3] h-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-64 h-64 shrink-0">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatForChart(metrics?.pprColorPreference || {})}
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {formatForChart(metrics?.pprColorPreference || {}).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Detalle de Marcas */}
        <AnimatePresence>
          {selectedTopic && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
              >
                <div className="bg-[#009EE3] p-6 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight">{selectedTopic.title}</h3>
                  <button onClick={() => setSelectedTopic(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {selectedTopic.data.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 flex items-center justify-center bg-[#009EE3]/10 text-[#009EE3] rounded-lg text-xs font-bold">#{i+1}</span>
                          <span className="font-bold text-[#1D1D1B]">{item.name}</span>
                        </div>
                        <span className="bg-gray-100 text-[#1D1D1B] px-4 py-1.5 rounded-full text-sm font-bold">
                          {item.value} menciones
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end">
                   <button 
                    onClick={() => setSelectedTopic(null)}
                    className="bg-[#009EE3] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all shadow-lg shadow-blue-200"
                   >
                     Cerrar
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ReasonPanel({ title, brandOptions, selectedBrand, onSelect, reasons }: { title: string, brandOptions: any[], selectedBrand: string, onSelect: (b: string) => void, reasons: any[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4 border-b-2 border-[#009EE3] pb-2">
        <h4 className="font-black text-[#009EE3] text-[11px] uppercase tracking-[0.2em]">{title}</h4>
      </div>
      
      <div className="relative mb-6">
        <select 
          value={selectedBrand} 
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-[#1D1D1B] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009EE3]/20"
        >
          {brandOptions.map((b, i) => (
            <option key={i} value={b.name}>{b.name}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Filter size={12} className="text-[#C6C6C6]" />
        </div>
      </div>

      <ul className="space-y-6">
        {reasons.length > 0 ? reasons.map((item, i) => (
          <li key={i} className="flex justify-between items-start gap-4 group">
            <div className="flex gap-3">
              <span className="text-[#1D1D1B] font-bold text-[11px] leading-5">{item.name}</span>
            </div>
            <span className="text-[10px] font-black text-[#009EE3] bg-blue-50 px-2 py-1 rounded">
              {item.value}
            </span>
          </li>
        )) : (
          <li className="text-gray-400 text-[11px] italic">No hay motivos registrados para esta marca.</li>
        )}
      </ul>
    </div>
  );
}

function RangeChart({ title, data, color }: { title: string, data: any[], color: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-black text-gray-400 text-[11px] uppercase tracking-[0.2em] border-b pb-2">{title}</h4>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" name="Total" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, id }: { title: string; value: string | number; icon: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-xs font-bold tracking-widest">{title}</span>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <span className="text-3xl font-black text-[#1D1D1B] tracking-tight">{value}</span>
    </div>
  );
}

function ChartContainer({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] text-gray-400">
        <BarChart3 size={16} className="text-[#009EE3]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function LeaderCard({ title, data, onClick }: { title: string, data: any[], onClick: () => void }) {
  const top = data[0];
  return (
    <div 
      onClick={onClick}
      className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-[#009EE3] hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} className="text-[#009EE3]" />
      </div>
      <h4 className="text-gray-400 text-[11px] font-black mb-8 uppercase tracking-[0.2em]">{title}</h4>
      <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
        <TrendingUp className="text-[#009EE3]" size={48} />
      </div>
      <div className="space-y-1">
        <span className="text-2xl font-black text-[#1D1D1B] block">{top?.name || 'N/A'}</span>
        <span className="text-[#009EE3] text-xs font-bold bg-[#009EE3]/10 px-4 py-1.5 rounded-full inline-block mt-2">
          {top?.value || 0} menciones
        </span>
      </div>
    </div>
  );
}

