import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { ShieldCheck, X, AlertTriangle, Clock, Lock, HeartHandshake, Check } from 'lucide-react';

interface ResponsibleGamingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleGamingModal: React.FC<ResponsibleGamingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateResponsibleGaming } = useWeBet();
  const [dailyLimit, setDailyLimit] = useState<number>(currentUser.depositLimitDaily || 5000);
  const [weeklyLimit, setWeeklyLimit] = useState<number>(currentUser.depositLimitWeekly || 20000);
  const [selfExclusionDays, setSelfExclusionDays] = useState<number>(0);
  const [sessionLimit, setSessionLimit] = useState<number>(60);
  const [showSaved, setShowSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateResponsibleGaming({
      dailyLimit,
      weeklyLimit,
      selfExclusionDays: selfExclusionDays > 0 ? selfExclusionDays : undefined,
      sessionLimit,
    });
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="responsible-gaming-modal"
        className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-[#232328] flex items-center justify-between bg-[#18181C]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#10B981] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Responsible Gaming Controls</h3>
              <p className="text-xs text-[#9CA3AF]">Player Protection, Limits & Self-Exclusion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-white hover:bg-[#26262B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Daily Deposit Limit */}
          <div className="bg-[#0E0E0F] p-3.5 rounded-[8px] border border-[#232328] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-bold text-white tracking-wider">
                Daily Stake & Deposit Limit
              </label>
              <span className="font-mono font-bold text-[#FFD700] text-sm">{dailyLimit} PTS</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={dailyLimit}
              onChange={e => setDailyLimit(Number(e.target.value))}
              className="w-full accent-[#FF0000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6B7280]">
              <span>500 PTS</span>
              <span>50,000 PTS (High Roller)</span>
            </div>
          </div>

          {/* Weekly Limit */}
          <div className="bg-[#0E0E0F] p-3.5 rounded-[8px] border border-[#232328] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-bold text-white tracking-wider">
                Weekly Maximum Limit
              </label>
              <span className="font-mono font-bold text-[#FFD700] text-sm">{weeklyLimit} PTS</span>
            </div>
            <input
              type="range"
              min="1000"
              max="150000"
              step="1000"
              value={weeklyLimit}
              onChange={e => setWeeklyLimit(Number(e.target.value))}
              className="w-full accent-[#FF0000] cursor-pointer"
            />
          </div>

          {/* Self-Exclusion Lock */}
          <div className="bg-[#181111] p-3.5 rounded-[8px] border border-[#EF4444]/30 space-y-2">
            <div className="flex items-center space-x-2 text-[#EF4444]">
              <Lock className="w-4 h-4" />
              <label className="text-xs uppercase font-bold tracking-wider">
                Take a Break (Self-Exclusion)
              </label>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Temporarily freeze your ability to place bets or post Open Bet Cards.
            </p>
            <select
              value={selfExclusionDays}
              onChange={e => setSelfExclusionDays(Number(e.target.value))}
              className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EF4444]"
            >
              <option value={0}>No active exclusion (Standard access)</option>
              <option value={1}>Cool off for 24 Hours</option>
              <option value={7}>Cool off for 7 Days</option>
              <option value={30}>Self-Exclude for 30 Days</option>
              <option value={180}>Self-Exclude for 6 Months</option>
            </select>
          </div>

          {/* 18+ Warning */}
          <div className="p-3 bg-[#0E0E0F] rounded-[8px] border border-[#232328] flex items-center space-x-3 text-xs text-[#9CA3AF]">
            <span className="w-7 h-7 rounded-full bg-[#2A2A30] text-[#FFD700] font-bold flex items-center justify-center text-xs shrink-0">
              18+
            </span>
            <p>
              WeBet strictly promotes responsible peer-to-peer betting. If you need support, visit
              helpline resources or contact your Master Agent.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="save-responsible-gaming-btn"
              className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-extrabold uppercase tracking-wider rounded-[8px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {showSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Limits Saved!</span>
                </>
              ) : (
                <span>Save Gaming Limits</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
