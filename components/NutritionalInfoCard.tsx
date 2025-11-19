import React from 'react';
import { DetailedNutritionalInfo } from '../types';

interface NutritionalInfoCardProps {
    info: DetailedNutritionalInfo;
}

const MacroPill: React.FC<{label: string, value: number, unit: string, color: string}> = ({ label, value, unit, color }) => (
    <div className={`text-center p-2 rounded-lg ${color}`}>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-lg font-bold">{value.toFixed(1)}{unit}</div>
    </div>
);

const NutritionalInfoCard: React.FC<NutritionalInfoCardProps> = ({ info }) => {
    return (
        <div className="bg-gray-600/50 rounded-lg p-3 mt-2 text-white">
            <h4 className="font-bold text-md mb-2 text-center">{info.foodName}</h4>
            <p className="text-xs text-gray-300 text-center mb-3">Valores por {info.servingSize}</p>
            
            <div className="text-center mb-4">
                <span className="text-3xl font-bold">{Math.round(info.calories)}</span>
                <span className="text-sm text-gray-300"> kcal</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-white">
                <MacroPill label="Proteína" value={info.protein} unit="g" color="bg-red-500/50" />
                <MacroPill label="Carbs" value={info.carbs} unit="g" color="bg-green-500/50" />
                <MacroPill label="Gordura" value={info.fat} unit="g" color="bg-yellow-500/50" />
            </div>

            {(info.vitamins?.length > 0 || info.minerals?.length > 0) && (
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                    <div>
                        {info.vitamins?.length > 0 && <h5 className="font-semibold text-white mb-1">Vitaminas</h5>}
                        <ul className="list-disc list-inside">
                            {info.vitamins.map(v => <li key={v.name}>{v.name}: {v.amount}</li>)}
                        </ul>
                    </div>
                     <div>
                        {info.minerals?.length > 0 && <h5 className="font-semibold text-white mb-1">Minerais</h5>}
                        <ul className="list-disc list-inside">
                            {info.minerals.map(m => <li key={m.name}>{m.name}: {m.amount}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionalInfoCard;
