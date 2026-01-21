import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Trash2, Calendar, Clock, AlertCircle, Trophy } from 'lucide-react';

export const StatsHistoryView = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen) {
            try {
                const data = JSON.parse(localStorage.getItem('lugemine_history') || '[]');
                // Sort by newest first
                setHistory(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, [isOpen]);

    const clearHistory = () => {
        if (confirm("Kas oled kindel, et soovid kogu ajaloo kustutada?")) {
            localStorage.removeItem('lugemine_history');
            setHistory([]);
        }
    };

    const exportCSV = () => {
        const headers = ["Kuupäev", "Kellaaeg", "Harjutus", "Raskusaste", "Aeg (sek)", "Vigu"];
        const rows = history.map(h => {
            const date = new Date(h.date);
            return [
                date.toLocaleDateString('et-EE'),
                date.toLocaleTimeString('et-EE'),
                h.exerciseTitle,
                h.difficulty,
                (h.duration / 1000).toFixed(1),
                h.mistakes.length
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lugemine_ajalugu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = () => {
        const text = history.map(h => {
            const date = new Date(h.date).toLocaleDateString('et-EE');
            return `${date} - ${h.exerciseTitle} (${h.difficulty}): ${(h.duration / 1000).toFixed(1)}s, ${h.mistakes.length} viga`;
        }).join("\n");

        navigator.clipboard.writeText(text).then(() => alert("Kopeeritud!"));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl h-[80vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Ajalugu
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm whitespace-nowrap">
                        <Download size={16} /> Lae CSV
                    </button>
                    <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium text-sm whitespace-nowrap">
                        <Copy size={16} /> Kopeeri tekst
                    </button>
                    <button onClick={clearHistory} className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-medium text-sm whitespace-nowrap">
                        <Trash2 size={16} /> Kustuta
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">Siin pole veel midagi. Hakka lugema!</div>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                        <Calendar size={12} />
                                        {new Date(item.date).toLocaleDateString('et-EE')}
                                        <Clock size={12} className="ml-2" />
                                        {new Date(item.date).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <h3 className="font-bold text-slate-800">{item.exerciseTitle}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 mt-1 inline-block">
                                        {item.difficulty === 'snail' ? '🐢 Tigu' : item.difficulty === 'rabbit' ? '🐰 Jänes' : '🐯 Tiiger'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Aeg</div>
                                        <div className="font-mono font-bold text-slate-700">{(item.duration / 1000).toFixed(1)}s</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Vigu</div>
                                        <div className={`font-mono font-bold ${item.mistakes.length > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                            {item.mistakes.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};
