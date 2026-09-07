import React from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { X, CheckCircle2, AlertCircle, Award, Trophy, Info } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toasts, removeToast } = useWeBet();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-[8px] border shadow-2xl backdrop-blur-md flex items-start space-x-3 transition-all duration-300 animate-in slide-in-from-bottom-2 ${
            toast.type === 'bet_won'
              ? 'bg-[#181111] border-[#FFD700] text-white redline-glow'
              : toast.type === 'success'
              ? 'bg-[#0E1712] border-[#10B981] text-white'
              : toast.type === 'warning'
              ? 'bg-[#1C1608] border-[#F59E0B] text-white'
              : 'bg-[#131314] border-[#26262B] text-white'
          }`}
        >
          <div className="shrink-0 pt-0.5">
            {toast.type === 'bet_won' ? (
              <Trophy className="w-5 h-5 text-[#FFD700] animate-bounce" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
            ) : (
              <Info className="w-5 h-5 text-[#3B82F6]" />
            )}
          </div>

          <div className="flex-1 text-xs">
            <div className="font-bold leading-tight mb-0.5">{toast.title}</div>
            <div className="text-[#D1D5DB] leading-normal">{toast.message}</div>
            <div className="text-[10px] text-[#6B7280] mt-1 font-mono">{toast.timestamp}</div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#9CA3AF] hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
