
import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, DailyLog, BodyCompositionLog, MacroGoals } from '../types';
import { calculateBodyComposition } from '../utils/calculations';
import ProgressLineChart from './charts/ProgressLineChart';
import BodyCompositionLineChart from './charts/BodyCompositionLineChart';
import { LogoIcon } from './Icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintableReportProps {
    profile: UserProfile;
    logs: Record<string, DailyLog>;
    history: BodyCompositionLog[];
    macroGoals: MacroGoals;
    onClose: () => void;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ profile, logs, history, macroGoals, onClose }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [scale, setScale] = useState(1);
    
    // Auto-scale logic for mobile view
    useEffect(() => {
        const handleResize = () => {
            const A4_WIDTH_PX = 794; // 210mm @ 96 DPI approx
            const padding = 32; // 2rem total horizontal padding
            const screenWidth = window.innerWidth;
            
            if (screenWidth < A4_WIDTH_PX + padding) {
                const newScale = (screenWidth - padding) / A4_WIDTH_PX;
                setScale(newScale);
            } else {
                setScale(1);
            }
        };

        handleResize(); // Initial calculation
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ordena do mais recente para o mais antigo
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
    
    // Seleciona apenas o Mais Recente e o Mais Antigo (Primeiro registro)
    const historyToDisplay = [];
    if (sortedHistory.length > 0) {
        historyToDisplay.push(sortedHistory[0]); // O mais recente (Atual)
        if (sortedHistory.length > 1) {
            historyToDisplay.push(sortedHistory[sortedHistory.length - 1]); // O mais antigo (Inicial)
        }
    }

    const currentWeight = profile.currentWeight || profile.weight;
    const currentStats = calculateBodyComposition({ ...profile, weight: currentWeight });
    
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        if (logs[dateString]) {
            last7Days.push({ date: dateString, ...logs[dateString] });
        }
    }

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);

        // Store current scale and reset to 1 for capture to ensure high quality PDF
        const currentScale = scale;
        setScale(1);

        // Allow DOM to update layout before capturing
        setTimeout(async () => {
            try {
                if (!reportRef.current) return;

                const canvas = await html2canvas(reportRef.current, {
                    scale: 2, // High resolution
                    useCORS: true,
                    logging: false,
                    windowWidth: 850, // Force window width to ensure media queries/layout match A4
                    width: 794, // Force exact A4 width capture
                    x: 0,
                    y: 0
                });

                const imgData = canvas.toDataURL('image/png');
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Relatorio_MacroTracker_${profile.name.replace(/\s+/g, '_')}.pdf`);
            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                alert("Houve um erro ao gerar o PDF. Tente novamente.");
            } finally {
                // Restore scale for user viewing
                setScale(currentScale);
                setIsGenerating(false);
            }
        }, 100);
    };

    const InfoCard = ({ label, value, subLabel, colorClass }: { label: string, value: string, subLabel?: string, colorClass: string }) => (
        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-0.5">{label}</p>
            <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
            {subLabel && <p className="text-[10px] text-gray-400 leading-none">{subLabel}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-black font-sans overflow-x-hidden">
            {/* Control Bar */}
            <div className="fixed top-0 left-0 right-0 bg-gray-800 p-4 flex justify-between items-center shadow-lg z-50 border-b border-gray-700 print:hidden">
                <span className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                    <LogoIcon className="w-6 h-6 text-blue-500" />
                    <span className="hidden sm:inline">Visualização de Impressão (A4)</span>
                    <span className="sm:hidden">Relatório PDF</span>
                </span>
                <div className="flex gap-2 sm:gap-4">
                     <button 
                        onClick={onClose}
                        className="px-3 py-2 sm:px-4 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                        disabled={isGenerating}
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={isGenerating}
                        className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span className="hidden sm:inline">Gerando...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                <span>Baixar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Container Centralizado com Scale Transform */}
            <div className="mt-20 mb-10 w-full flex justify-center print:m-0 print:p-0 overflow-hidden">
                <div 
                    style={{ 
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        // Altura ajustada para compensar o espaço branco criado pelo scale
                        height: scale < 1 ? `calc(297mm * ${scale})` : 'auto',
                        width: '210mm' // Largura fixa do container para simular o A4
                    }}
                    className="shrink-0 transition-transform duration-300 ease-out"
                >
                    {/* 
                        A4 Size Wrapper 
                        Width: 210mm
                        Min-Height: 297mm 
                    */}
                    <div 
                        ref={reportRef}
                        className="bg-white shadow-2xl p-[10mm]"
                        style={{ 
                            width: '210mm', 
                            minHeight: '297mm',
                            margin: '0 auto',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-blue-600 pb-3 mb-4">
                            <div className="flex items-center gap-3">
                                <LogoIcon className="w-10 h-10 text-blue-600" />
                                <div>
                                    <h1 className="text-xl font-bold text-black uppercase tracking-tight">Relatório de Performance</h1>
                                    <p className="text-xs text-gray-500">Macro Tracker Analysis</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold text-black">{profile.name}</h2>
                                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* Section 1: Dashboard Stats */}
                        <section className="mb-6">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                                Resumo Atual
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                <InfoCard label="Peso Atual" value={`${currentWeight} kg`} colorClass="text-black" />
                                <InfoCard label="Gordura (BF)" value={`${currentStats.fatPercentage.toFixed(1)}%`} subLabel="Estimado" colorClass="text-black" />
                                <InfoCard label="Massa Magra" value={`${currentStats.lbm.toFixed(1)} kg`} colorClass="text-black" />
                                <InfoCard label="Meta Calórica" value={`${macroGoals.calories}`} subLabel="kcal / dia" colorClass="text-black" />
                            </div>
                        </section>

                        {/* Section 2: Charts - Stacked Vertically */}
                        <div className="flex flex-col gap-4 mb-6">
                             {/* Progress Chart */}
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-full">
                                <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase text-center">Consumo (Últimos 7 Dias)</h3>
                                <div className="h-48">
                                    <ProgressLineChart logs={logs} theme="light" />
                                </div>
                            </div>

                            {/* Body Comp Chart */}
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-full">
                                <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase text-center">Evolução Corporal</h3>
                                {history.length > 1 ? (
                                     <div className="h-48">
                                        <BodyCompositionLineChart history={history} theme="light" />
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-400 text-xs italic">
                                        Histórico insuficiente.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Detailed History Table (First and Last Only) */}
                        <section className="mb-6">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-green-600 rounded-full"></span>
                                Comparativo (Início vs. Atual)
                            </h3>
                            
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="p-2">Ref.</th>
                                            <th className="p-2">Data</th>
                                            <th className="p-2 text-right">Peso</th>
                                            <th className="p-2 text-right">BF %</th>
                                            <th className="p-2 text-right">M. Magra</th>
                                            <th className="p-2 text-right">M. Gorda</th>
                                            <th className="p-2 text-right">Medidas (P/C/Q)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {historyToDisplay.map((h, i) => ( 
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-1.5 font-bold text-black">
                                                    {i === 0 ? 'ATUAL' : 'INÍCIO'}
                                                </td>
                                                <td className="p-1.5 font-medium text-black">{new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                <td className="p-1.5 text-right text-black">{h.weight} kg</td>
                                                <td className="p-1.5 text-right text-black font-bold">{h.fatPercentage.toFixed(1)}%</td>
                                                <td className="p-1.5 text-right text-black">{h.lbm.toFixed(1)} kg</td>
                                                <td className="p-1.5 text-right text-black">{(h.weight - h.lbm).toFixed(1)} kg</td>
                                                <td className="p-1.5 text-right text-black">
                                                    {h.neck} / {h.waist} {h.hip ? `/ ${h.hip}` : ''} cm
                                                </td>
                                            </tr>
                                        ))}
                                        {sortedHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-4 text-center text-gray-500 italic">Nenhum registro de medidas encontrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                         {/* Section 4: Food Log Table */}
                         <section className="mb-4">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                                Diário Alimentar (Últimos 7 Dias)
                            </h3>
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2 text-right">Calorias</th>
                                            <th className="p-2 text-right">Proteínas</th>
                                            <th className="p-2 text-right">Carboidratos</th>
                                            <th className="p-2 text-right">Gorduras</th>
                                            <th className="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {last7Days.slice(0, 7).map((log, i) => { // Limit to 7 days
                                            const percent = (log.calories / macroGoals.calories) * 100;
                                            let statusColor = "bg-gray-100 text-gray-600";
                                            if(percent >= 90 && percent <= 110) statusColor = "bg-green-100 text-green-700";
                                            else if (percent > 110) statusColor = "bg-red-100 text-red-700";
                                            else if (percent < 80) statusColor = "bg-yellow-100 text-yellow-700";

                                            return (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-1.5 font-medium text-black">{new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                    <td className="p-1.5 text-right font-bold text-black">{log.calories.toFixed(0)} kcal</td>
                                                    <td className="p-1.5 text-right text-black">{log.protein.toFixed(1)}g</td>
                                                    <td className="p-1.5 text-right text-black">{log.carbs.toFixed(1)}g</td>
                                                    <td className="p-1.5 text-right text-black">{log.fat.toFixed(1)}g</td>
                                                    <td className="p-1.5 text-center">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                                                            {percent.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {last7Days.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-gray-500 italic">Nenhum registro alimentar encontrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        
                        <div className="mt-auto pt-1 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400">
                            <p>Macro Tracker &copy; {new Date().getFullYear()}</p>
                            <p>Visite: <a>yancarvalhodev.com.br</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableReport;
