import React, { useState } from 'react';
import { OpenBet, Match } from '../../types';
import { useWeBet } from '../../context/WeBetContext';
import { Flame, CheckCircle, Shield, ArrowRight, UserCheck, Clock, Zap, Lock, AlertTriangle } from 'lucide-react';

interface OpenBetCardProps {
  bet: OpenBet;
  match: Match;
  onAcceptSuccess?: () => void;
}

export const OpenBetCard: React.FC<OpenBetCardProps> = ({ bet, match, onAcceptSuccess }) => {
  const { currentUser, acceptOpenBet, isMatchLocked, getMatchCountdown } = useWeBet();
  const [isAccepting, setIsAccepting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLocked = isMatchLocked(match);
  const countdown = getMatchCountdown(match);

  const backedTeam = match.homeTeam.id === bet.selectedTeamId ? match.homeTeam : match.awayTeam;
  const opposingTeam = match.homeTeam.id === bet.opposingTeamId ? match.homeTeam : match.awayTeam;

  const isMaker = bet.makerId === currentUser.id;

  // Taker calculations:
  // In 100:100 ratio: Maker backed Team A (Risk 100 to win 100), Taker backs Team B (Risk 100 to win 100)
  // Taker Gross Win = bet.takerWin
  // 5% Convenience Fee on Taker Gross Win = bet.takerWin * (bet.vigPercent / 100)
  // Taker Net Win = bet.takerWin - takerVig
  const takerGrossWin = bet.takerWin;
  const takerVig = takerGrossWin * (bet.vigPercent / 100);
  const takerNetWin = takerGrossWin - takerVig;
  const takerTotalPayout = bet.takerRisk + takerNetWin;

  const handleAccept = () => {
    setIsAccepting(true);
    const result = acceptOpenBet(bet.id);
    setIsAccepting(false);
    setShowConfirm(false);
    if (result.success && onAcceptSuccess) {
      onAcceptSuccess();
    }
  };

  return (
    <div
      id={`open-bet-card-${bet.id}`}
      className="bg-[#131314] hover:bg-[#161618] border border-[#232328] hover:border-[#FF0000]/40 rounded-[8px] p-4 transition-all duration-200 shadow-md flex flex-col justify-between relative overflow-hidden group"
    >
      {/* Redline Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF0000] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Card Header: Maker & Odds Badge */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <img
              src={bet.makerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={bet.makerName}
              className="w-6 h-6 rounded-full object-cover border border-[#333]"
            />
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#E5E7EB]">{bet.makerName}</span>
              {isMaker && (
                <span className="bg-[#2A2A30] text-[#9CA3AF] text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]">
                  YOU
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {bet.takerRisk < bet.makerRisk && (
              <span className="bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] border border-[#10B981]/30">
                Underdog Value
              </span>
            )}
            <span className="bg-[#0E0E0F] text-[#FFD700] text-[11px] font-mono font-bold px-2 py-0.5 rounded-[6px] border border-[#FFD700]/20">
              {bet.ratio}
            </span>
            <span className="bg-[#1E1E24] text-[#9CA3AF] text-[10px] px-1.5 py-0.5 rounded-[4px]">
              {bet.vigPercent}% Vig
            </span>
          </div>
        </div>

        {/* Backed Team vs Opposing Team Box */}
        <div className="bg-[#0E0E0F] p-3 rounded-[8px] border border-[#1F1F24] mb-3">
          <div className="flex items-center justify-between mb-1 text-[11px] text-[#6B7280]">
            <span>Maker Backs:</span>
            <span>You Back (if accepted):</span>
          </div>

          <div className="flex items-center justify-between">
            {/* Maker Side */}
            <div className="flex items-center space-x-2">
              <span className="text-xl">{backedTeam.logo}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight">{backedTeam.name}</span>
                <span className="text-[10px] text-[#FF0000] font-semibold">Risks: {bet.makerRisk} PTS</span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="px-2 py-0.5 rounded-[6px] bg-[#1A1A1E] text-[#FFD700] text-[10px] font-extrabold tracking-wider border border-[#FFD700]/20">
              VS
            </div>

            {/* Taker Side */}
            <div className="flex items-center space-x-2 text-right">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-[#60A5FA] leading-tight">{opposingTeam.name}</span>
                <span className="text-[10px] text-[#10B981] font-semibold">Risks: {bet.takerRisk} PTS</span>
              </div>
              <span className="text-xl">{opposingTeam.logo}</span>
            </div>
          </div>
        </div>

        {/* Financial Transparency Calculation (Money Model) */}
        <div className="bg-[#18181C] p-2.5 rounded-[6px] border border-[#232328] mb-3 text-xs">
          <div className="flex items-center justify-between text-[#9CA3AF] text-[11px] mb-1">
            <span>Your Stake (Risk):</span>
            <span className="font-mono font-bold text-white">{bet.takerRisk.toFixed(2)} PTS</span>
          </div>
          <div className="flex items-center justify-between text-[#9CA3AF] text-[11px] mb-1">
            <span>Gross Win Potential:</span>
            <span className="font-mono text-[#9CA3AF]">{takerGrossWin.toFixed(2)} PTS</span>
          </div>
          <div className="flex items-center justify-between text-[#9CA3AF] text-[11px] mb-1.5">
            <span className="flex items-center text-[10px] text-[#6B7280]">
              {bet.vigPercent}% Vig on Win (60% Agent / 40% Admin):
            </span>
            <span className="font-mono text-[#EF4444] text-[10px]">-{takerVig.toFixed(2)} PTS</span>
          </div>
          <div className="pt-1.5 border-t border-[#26262B] flex items-center justify-between font-bold">
            <span className="text-white text-xs">Net Win Credit:</span>
            <span className="font-mono text-[#10B981] text-xs">+{takerNetWin.toFixed(2)} PTS</span>
          </div>
        </div>

        {/* Kickoff Countdown Warning */}
        {countdown.isImminent && !isLocked && (
          <div className="mb-3 px-2 py-1.5 rounded-[6px] bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-between text-[11px] text-[#FFD700] animate-pulse">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF0000]" />
              <span className="font-semibold">Closing Soon</span>
            </div>
            <span className="font-mono font-bold">{countdown.formatted}</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div>
        {isLocked ? (
          <div className="w-full text-center py-2 bg-[#1C1515] text-[#EF4444] text-xs font-bold rounded-[8px] border border-[#EF4444]/30 flex items-center justify-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Market Locked (Match in Play)</span>
          </div>
        ) : isMaker ? (
          <div className="w-full text-center py-2 bg-[#1A1A1E] text-[#9CA3AF] text-xs font-semibold rounded-[8px] border border-[#26262B] flex flex-col items-center justify-center space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Awaiting Opponent in Lobby</span>
            </div>
            {countdown.isStartingSoon && (
              <span className="text-[10px] text-[#6B7280]">
                Auto-refunded in {countdown.formatted} if untaken
              </span>
            )}
          </div>
        ) : showConfirm ? (
          <div className="flex items-center space-x-2">
            <button
              id={`cancel-accept-${bet.id}`}
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-[8px] bg-[#1E1E24] hover:bg-[#26262B] text-xs font-semibold text-[#9CA3AF] transition-colors"
            >
              Cancel
            </button>
            <button
              id={`confirm-accept-${bet.id}`}
              onClick={handleAccept}
              disabled={isAccepting || currentUser.balance < bet.takerRisk}
              className="flex-1 py-2 rounded-[8px] bg-[#FF0000] hover:bg-[#CC0000] text-xs font-bold text-white transition-all shadow-md flex items-center justify-center space-x-1"
            >
              {isAccepting ? (
                <span>Matching...</span>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Lock {bet.takerRisk} PTS</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            id={`btn-accept-${bet.id}`}
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 bg-[#FF0000] hover:bg-[#E60000] active:scale-[0.99] text-white text-xs font-extrabold uppercase tracking-wider rounded-[8px] transition-all redline-glow flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Accept Bet &bull; Risk {bet.takerRisk} PTS</span>
          </button>
        )}
      </div>
    </div>
  );
};
