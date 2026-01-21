import React from 'react';
import { X, Trophy, Zap, Turtle, Rabbit } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose, difficulty, setDifficulty }) => {
    if (!isOpen) return null;

    const levels = [
        { id: 'snail', label: 'Tigu (Rahulik)', icon: Turtle, color: 'text-green-500', bg: 'bg-green-100' },
        { id: 'rabbit', label: 'Jänes (Keskmine)', icon: Rabbit, color: 'text-blue-500', bg: 'bg-blue-100' },
        { id: 'tiger', label: 'Tiiger (Kiire)', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-100' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Seaded</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-3">
                    <p className="text-slate-500 mb-2 font-medium">Vali kiirus:</p>
                    {levels.map((level) => {
                        const Icon = level.icon;
                        const isSelected = difficulty === level.id;
                        return (
                            <button
                                key={level.id}
                                onClick={() => setDifficulty(level.id)}
                                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all border-2
                  ${isSelected
                                        ? `border-${level.color.split('-')[1]}-500 ${level.bg}`
                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${level.bg} ${level.color}`}>
                                    <Icon size={24} />
                                </div>
                                <span className={`font-bold text-lg ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {level.label}
                                </span>
                                {isSelected && (
                                    <div className="ml-auto text-green-500">
                                        <Trophy size={20} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
