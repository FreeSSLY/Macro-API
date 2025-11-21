import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile, DailyLog, MacroGoals, BodyCompositionLog } from '../types';

interface ReportData {
    profile: UserProfile;
    selectedDate: string;
    logs: Record<string, DailyLog>;
    history: BodyCompositionLog[];
    macroGoals: MacroGoals;
    progressChartImage?: string;
    bodyCompChartImage?: string;
}

// Helper to add footer with page numbers
const addFooter = (doc: jsPDF) => {
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
};

export const generate = async (data: ReportData) => {
    const { profile, selectedDate, logs, history, macroGoals, progressChartImage, bodyCompChartImage } = data;

    const doc = new jsPDF('p', 'pt', 'a4');
    const today = new Date().toLocaleDateString('pt-BR');
    const selectedLog = logs[selectedDate] || { foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    doc.setFont('helvetica');

    // --- Page 1: Cover ---
    doc.setFontSize(24);
    doc.text('Macro Tracker AI', doc.internal.pageSize.getWidth() / 2, 120, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Relatório de Acompanhamento Nutricional', doc.internal.pageSize.getWidth() / 2, 160, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(profile.name, doc.internal.pageSize.getWidth() / 2, 350, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Data de Geração: ${today}`, doc.internal.pageSize.getWidth() / 2, 500, { align: 'center' });
    
    // --- Page 2: Profile Info ---
    doc.addPage();
    doc.setFontSize(18);
    doc.text('1. Informações do Perfil', 40, 60);

    const bodyMeasurements = [
        ['Pescoço (cm)', profile.neck.toFixed(1)],
        ['Cintura (cm)', profile.waist.toFixed(1)],
    ];
    if (profile.sex === 'female') {
        bodyMeasurements.push(['Quadril (cm)', profile.hip.toFixed(1)]);
    }

    autoTable(doc, {
        startY: 80,
        theme: 'grid',
        body: [
            { content: 'Dados Pessoais e Medidas', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [44, 62, 80] } },
            ['Nome', profile.name],
            ['Idade', `${profile.age} anos`],
            ['Sexo', profile.sex === 'male' ? 'Masculino' : 'Feminino'],
            ['Altura', `${profile.height} cm`],
            ['Peso Atual', `${profile.currentWeight || profile.weight} kg`],
            ...bodyMeasurements,
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 150 }, 1: { cellWidth: 'auto' } },
    });
    
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 30,
        theme: 'grid',
        body: [
            { content: 'Metas Nutricionais', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [44, 62, 80] } },
            ['Calorias (kcal)', macroGoals.calories.toFixed(0)],
            ['Proteínas (g)', macroGoals.protein.toFixed(1)],
            ['Carboidratos (g)', macroGoals.carbs.toFixed(1)],
            ['Gorduras (g)', macroGoals.fat.toFixed(1)],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 150 }, 1: { cellWidth: 'auto' } },
    });

    // --- Page 3: Daily Log ---
    doc.addPage();
    doc.setFontSize(18);
    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');
    doc.text(`2. Resumo do Dia: ${formattedDate}`, 40, 60);

    autoTable(doc, {
        startY: 80,
        head: [['Métrica', 'Consumido', 'Meta']],
        body: [
            ['Calorias (kcal)', selectedLog.calories.toFixed(0), macroGoals.calories.toFixed(0)],
            ['Proteínas (g)', selectedLog.protein.toFixed(1), macroGoals.protein.toFixed(1)],
            ['Carboidratos (g)', selectedLog.carbs.toFixed(1), macroGoals.carbs.toFixed(1)],
            ['Gorduras (g)', selectedLog.fat.toFixed(1), macroGoals.fat.toFixed(1)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
    });
    
    if (selectedLog.foods.length > 0) {
        doc.setFontSize(14);
        doc.text('Alimentos Registrados', 40, (doc as any).lastAutoTable.finalY + 40);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 60,
            head: [['Alimento', 'Kcal', 'P (g)', 'C (g)', 'F (g)']],
            body: selectedLog.foods.map(f => [f.name, f.calories.toFixed(0), f.protein.toFixed(1), f.carbs.toFixed(1), f.fat.toFixed(1)]),
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 }, 4: { cellWidth: 50 } },
        });
    } else {
        doc.setFontSize(12);
        doc.text('Nenhum alimento registrado neste dia.', 40, (doc as any).lastAutoTable.finalY + 40);
    }
    
    // --- Page 4: Progress Chart ---
    if (progressChartImage) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text('3. Progresso dos Últimos 7 Dias', 40, 60);
        const imgProps = doc.getImageProperties(progressChartImage);
        const imgWidth = 515; // A4 width (595pt) - margins (40+40)
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(progressChartImage, 'PNG', 40, 80, imgWidth, imgHeight);
    }
    
    // --- Page 5: Body Composition ---
    if (history.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text('4. Análise de Composição Corporal', 40, 60);
        
        let tableStartY = 80;
        if (bodyCompChartImage) {
             const imgProps = doc.getImageProperties(bodyCompChartImage);
             const imgWidth = 515;
             const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
             doc.addImage(bodyCompChartImage, 'PNG', 40, 80, imgWidth, imgHeight);
             tableStartY = 80 + imgHeight + 40;
        }

        doc.setFontSize(14);
        doc.text('Histórico de Medidas', 40, tableStartY);

        autoTable(doc, {
            startY: tableStartY + 20,
            head: [['Data', 'Peso (kg)', 'BF %', 'Massa Magra (kg)', 'Massa Gorda (kg)']],
            body: history.map(h => [
                new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                h.weight.toFixed(1),
                h.fatPercentage.toFixed(1),
                h.lbm.toFixed(1),
                (h.weight - h.lbm).toFixed(1)
            ]),
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
        });
    }

    // --- Finalize ---
    addFooter(doc);
    doc.save(`Relatorio_MacroTracker_${profile.name.replace(/\s/g, '_')}_${selectedDate}.pdf`);
};
