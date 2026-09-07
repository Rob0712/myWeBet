import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Match, SportType } from '../../types';
import { X, ShieldAlert, Zap, Info, ChevronRight, Check, Clock, AlertTriangle, Lock, Filter } from 'lucide-react';

interface CreateBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMatch?: Match;
}

const STAKE_PRESETS = [50, 100, 250, 500, 1000];

const MODAL_SPORTS: { id: 'all' | SportType; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🔥' },
  { id: 'soccer', label: 'Soccer', icon: '⚽' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'football', label: 'NFL', icon: '🏈' },
  { id: 'baseball', label: 'MLB', icon: '⚾' },
  { id: 'mma', label: 'MMA/UFC', icon: '🥊' },
  { id: 'boxing', label: 'Boxing', icon: '🥊' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'hockey', label: 'NHL', icon: '🏒' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'esports', label: 'Esports', icon: '🎮' },
];

export const CreateBetModal: React.FC<CreateBetModalProps> = ({
  isOpen,
  onClose,
  preselectedMatch,
}) => {
  const { matches, currentUser, createOpenBet, platformVigPercent, agentVigSplit, isMatchLocked, getMatchCountdown } = useWeBet();

  const [selectedSport, setSelectedSport] = useState<'all' | SportType>(
    preselectedMatch ? preselectedMatch.sport : 'all'
  );

  // Filter for matches that are approved, upcoming and not locked
  const availableMatches = matches.filter(m => (m.approvalStatus ? m.approvalStatus === 'approved' : true) && !isMatchLocked(m));
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    preselectedMatch?.id || availableMatches[0]?.id || matches.find(m => m.status === 'upcoming' && (m.approvalStatus ? m.approvalStatus === 'approved' : true))?.id || ''
  );

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || availableMatches[0];

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    selectedMatch ? selectedMatch.homeTeam.id : ''
  );

  const [riskAmount, setRiskAmount] = useState<number>(100);
  const [ratioMode, setRatioMode] = useState<'100:100' | '100:90' | '100:80' | '100:70' | '100:60' | '100:50' | 'custom'>('100:100');
  const [customRatioValue, setCustomRatioValue] = useState<number>(70);

  if (!isOpen || !selectedMatch) return null;

  // Filter matches for selector by sport and approval
  const selectableMatches = matches.filter(m => (m.approvalStatus ? m.approvalStatus === 'approved' : true) && (selectedSport === 'all' || m.sport === selectedSport));

  const matchCountdown = getMatchCountdown(selectedMatch);
  const isLocked = isMatchLocked(selectedMatch);

  const backedTeam =
    selectedMatch.homeTeam.id === selectedTeamId
      ? selectedMatch.homeTeam
      : selectedMatch.awayTeam;

  const opposingTeam =
    selectedMatch.homeTeam.id === selectedTeamId
      ? selectedMatch.awayTeam
      : selectedMatch.homeTeam;

  // Determine current effective ratio
  const effectiveRatioNumber = ratioMode === 'custom' ? customRatioValue : Number(ratioMode.split(':')[1]);
  const effectiveRatioString = `100:${effectiveRatioNumber}`;
  const ratioMultiplier = effectiveRatioNumber / 100;

  // Money Model Calculations
  const grossWin = Number((riskAmount * ratioMultiplier).toFixed(2));
  const vigFee = Number((grossWin * (platformVigPercent / 100)).toFixed(2));
  const netWin = Number((grossWin - vigFee).toFixed(2));
  const totalPayout = Number((riskAmount + netWin).toFixed(2));

  // Taker (Opponent) calculations for transparency
  const takerRisk = grossWin;
  const takerGrossWin = riskAmount;
  const takerVig = Number((takerGrossWin * (platformVigPercent / 100)).toFixed(2));
  const takerNetWin = Number((takerGrossWin - takerVig).toFixed(2));

  const agentCut = Number((vigFee * agentVigSplit).toFixed(2));
  const adminCut = Number((vigFee * (1 - agentVigSplit)).toFixed(2));

  const hasSufficientBalance = currentUser.balance >= riskAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSufficientBalance || isLocked) return;

    const result = createOpenBet(selectedMatch.id, selectedTeamId, riskAmount, effectiveRatioString);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="create-bet-modal"
        className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#232328] flex items-center justify-between bg-[#18181C]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#FF0000] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Create Open Bet Card</h3>
              <p className="text-xs text-[#9CA3AF]">P2P Standard 100:100 Ratio with 10% Vig on Winnings</p>
            </div>
          </div>
          <button
            id="close-create-bet-modal"
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-white hover:bg-[#26262B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Kickoff Countdown & Pre-Game Alert Banner */}
          {isLocked ? (
            <div className="p-3 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[8px] flex items-center space-x-2.5 text-xs text-[#EF4444]">
              <Lock className="w-4 h-4 shrink-0" />
              <div>
                <strong className="font-bold uppercase tracking-wider block">Betting Locked for this Match</strong>
                <span>Kickoff has been reached or the match is live. You cannot post or lock in bets after start time.</span>
              </div>
            </div>
          ) : matchCountdown.isImminent ? (
            <div className="p-3 bg-[#FF0000]/15 border border-[#FF0000]/40 rounded-[8px] flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center space-x-2 text-[#FFD700]">
                <AlertTriangle className="w-4 h-4 text-[#FF0000] shrink-0" />
                <div>
                  <strong className="font-bold text-white uppercase tracking-wider block">
                    ⚡ FINAL MINUTES BEFORE KICKOFF
                  </strong>
                  <span className="text-[#D1D5DB]">
                    Unmatched open bets are automatically closed & refunded when the game starts.
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-[10px] text-[#9CA3AF] uppercase block">Locks in</span>
                <span className="font-mono font-extrabold text-sm text-[#FFD700]">{matchCountdown.formatted}</span>
              </div>
            </div>
          ) : matchCountdown.isStartingSoon ? (
            <div className="p-2.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-[8px] flex items-center justify-between text-xs text-[#F59E0B]">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Match begins in <strong className="font-mono font-bold text-white">{matchCountdown.formatted}</strong></span>
              </div>
              <span className="text-[10px] text-[#9CA3AF]">Auto-lockout at kickoff</span>
            </div>
          ) : null}

          {/* Match Selector with Sport Category Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase font-bold text-[#9CA3AF] tracking-wider">
                1. Select Sport & Match
              </label>
              <span className="text-[11px] font-mono text-[#9CA3AF]">
                Kickoff: {new Date(selectedMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({matchCountdown.formatted})
              </span>
            </div>

            {/* Sport Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              {MODAL_SPORTS.map(sportItem => {
                const count = sportItem.id === 'all'
                  ? matches.length
                  : matches.filter(m => m.sport === sportItem.id).length;
                if (sportItem.id !== 'all' && count === 0) return null;
                const isSelected = selectedSport === sportItem.id;
                return (
                  <button
                    key={sportItem.id}
                    type="button"
                    onClick={() => {
                      setSelectedSport(sportItem.id);
                      const filtered = matches.filter(m => sportItem.id === 'all' || m.sport === sportItem.id);
                      const firstUnlocked = filtered.find(m => !isMatchLocked(m)) || filtered[0];
                      if (firstUnlocked) {
                        setSelectedMatchId(firstUnlocked.id);
                        setSelectedTeamId(firstUnlocked.homeTeam.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF0000] text-white shadow-xs'
                        : 'bg-[#18181C] text-[#9CA3AF] hover:text-white hover:bg-[#25252C] border border-[#26262B]'
                    }`}
                  >
                    <span>{sportItem.icon}</span>
                    <span>{sportItem.label}</span>
                    <span className={`text-[10px] ml-0.5 px-1 rounded ${isSelected ? 'bg-white/20' : 'bg-[#2A2A30] text-[#D1D5DB]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <select
              id="select-match-dropdown"
              value={selectedMatchId}
              onChange={e => {
                setSelectedMatchId(e.target.value);
                const m = matches.find(match => match.id === e.target.value);
                if (m) setSelectedTeamId(m.homeTeam.id);
              }}
              className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000]"
            >
              {selectableMatches.map(m => {
                const locked = isMatchLocked(m);
                const timeStr = new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <option key={m.id} value={m.id} disabled={locked}>
                    {locked ? '🔒 [LOCKED/IN PLAY] ' : ''}{m.league}: {m.homeTeam.name} vs {m.awayTeam.name} ({timeStr})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Side Pick (Choose Home or Away) */}
          <div>
            <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1.5 tracking-wider">
              2. Back Your Team / Side
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Home Team Card */}
              <button
                type="button"
                id="select-team-home"
                onClick={() => setSelectedTeamId(selectedMatch.homeTeam.id)}
                className={`p-3.5 rounded-[8px] border text-left transition-all relative flex flex-col items-center justify-center text-center cursor-pointer ${
                  selectedTeamId === selectedMatch.homeTeam.id
                    ? 'bg-[#1C1818] border-[#FF0000] redline-glow'
                    : 'bg-[#0E0E0F] border-[#232328] hover:border-[#3A3A40]'
                }`}
              >
                {selectedTeamId === selectedMatch.homeTeam.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FF0000] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                )}
                <span className="text-3xl mb-1">{selectedMatch.homeTeam.logo}</span>
                <span className="font-bold text-sm text-white">{selectedMatch.homeTeam.name}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">Home Team &bull; {selectedMatch.homeTeam.record || '5-0'}</span>
              </button>

              {/* Away Team Card */}
              <button
                type="button"
                id="select-team-away"
                onClick={() => setSelectedTeamId(selectedMatch.awayTeam.id)}
                className={`p-3.5 rounded-[8px] border text-left transition-all relative flex flex-col items-center justify-center text-center cursor-pointer ${
                  selectedTeamId === selectedMatch.awayTeam.id
                    ? 'bg-[#1C1818] border-[#FF0000] redline-glow'
                    : 'bg-[#0E0E0F] border-[#232328] hover:border-[#3A3A40]'
                }`}
              >
                {selectedTeamId === selectedMatch.awayTeam.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FF0000] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                )}
                <span className="text-3xl mb-1">{selectedMatch.awayTeam.logo}</span>
                <span className="font-bold text-sm text-white">{selectedMatch.awayTeam.name}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">Away Team &bull; {selectedMatch.awayTeam.record || '4-1'}</span>
              </button>
            </div>
          </div>

          {/* Stake Amount Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase font-bold text-[#9CA3AF] tracking-wider">
                3. Your Risk Stake (PTS)
              </label>
              <span className="text-xs text-[#9CA3AF]">
                Available: <span className="font-mono font-bold text-white">{currentUser.balance.toFixed(2)} PTS</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  id="input-risk-amount"
                  min="10"
                  max={currentUser.balance}
                  step="10"
                  value={riskAmount}
                  onChange={e => setRiskAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] pl-3 pr-12 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-[#FF0000]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-[#FFD700]">PTS</span>
              </div>
            </div>

            {/* Quick Stake Preset Buttons */}
            <div className="flex items-center space-x-2">
              {STAKE_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setRiskAmount(preset)}
                  className={`flex-1 py-1.5 rounded-[6px] text-xs font-mono font-semibold transition-colors ${
                    riskAmount === preset
                      ? 'bg-[#FF0000] text-white'
                      : 'bg-[#18181C] text-[#9CA3AF] hover:bg-[#232328] hover:text-white border border-[#26262B]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Ratio & Team Advantage Selector (Step 4) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase font-bold text-[#9CA3AF] tracking-wider flex items-center space-x-1.5">
                <span>4. Odds Ratio & Advantage Handicap</span>
                {effectiveRatioNumber < 100 && (
                  <span className="bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#FFD700]/40">
                    Advantage
                  </span>
                )}
              </label>
              <span className="text-xs font-mono font-bold text-[#FFD700]">{effectiveRatioString}</span>
            </div>

            {/* Ratio Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
              {[
                { id: '100:100', label: '100:100', subtitle: 'Even (1:1)' },
                { id: '100:90', label: '100:90', subtitle: 'Slight Fav' },
                { id: '100:80', label: '100:80', subtitle: 'Fav (1.25x)' },
                { id: '100:70', label: '100:70', subtitle: 'Advantage' },
                { id: '100:60', label: '100:60', subtitle: 'Strong Fav' },
                { id: 'custom', label: 'Custom', subtitle: `${effectiveRatioNumber}%` },
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRatioMode(item.id as any)}
                  className={`p-2 rounded-[6px] text-center border transition-all cursor-pointer ${
                    ratioMode === item.id
                      ? 'bg-[#1F1A1A] border-[#FF0000] text-white'
                      : 'bg-[#0E0E0F] border-[#26262B] text-[#9CA3AF] hover:text-white hover:border-[#3A3A42]'
                  }`}
                >
                  <div className="font-mono font-bold text-xs">{item.label}</div>
                  <div className="text-[9px] text-[#6B7280]">{item.subtitle}</div>
                </button>
              ))}
            </div>

            {/* Custom Ratio Slider if custom selected */}
            {ratioMode === 'custom' && (
              <div className="p-3 bg-[#0E0E0F] rounded-[6px] border border-[#26262B] space-y-2 mb-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#9CA3AF]">Custom Win Ratio:</span>
                  <span className="font-mono font-bold text-[#FFD700]">
                    100 : {customRatioValue} (Maker wins {customRatioValue}% of stake)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="140"
                  step="5"
                  value={customRatioValue}
                  onChange={e => setCustomRatioValue(Number(e.target.value))}
                  className="w-full accent-[#FF0000] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B7280]">
                  <span>100:40 (Heavy Fav)</span>
                  <span>100:100 (Even)</span>
                  <span>100:140 (Underdog)</span>
                </div>
              </div>
            )}

            {/* Advantage Explanation Banner */}
            <div className="p-2.5 bg-[#18181C] rounded-[6px] border border-[#26262B] text-[11px] text-[#9CA3AF] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#FFD700] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {effectiveRatioNumber < 100 ? (
                  <p>
                    <strong className="text-white">Advantage Odds Active:</strong> You risk <span className="text-white font-mono font-bold">{riskAmount} PTS</span> to win <span className="text-white font-mono font-bold">{grossWin} PTS</span> on {backedTeam.name}. In return, an opponent risks only <span className="text-[#10B981] font-mono font-bold">{takerRisk} PTS</span> to win <span className="text-[#10B981] font-mono font-bold">{takerGrossWin} PTS</span> on {opposingTeam.name}.
                  </p>
                ) : (
                  <p>
                    <strong className="text-white">Even-Money 1:1:</strong> Both you and the taker risk symmetric amounts ({riskAmount} PTS each) on this fixture.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Money Model Live Breakdown Card */}
          <div className="bg-[#0E0E0F] p-3.5 rounded-[8px] border border-[#26262B] space-y-2">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1F1F24]">
              <span className="text-[#9CA3AF]">Selected Ratio & Terms:</span>
              <span className="font-mono font-bold text-[#FFD700]">{effectiveRatioString} ({ratioMultiplier.toFixed(2)}x Multiplier)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#6B7280] text-[11px]">Your Risk Stake:</span>
                <div className="font-mono font-bold text-white text-sm">{riskAmount.toFixed(2)} PTS</div>
              </div>
              <div>
                <span className="text-[#6B7280] text-[11px]">Gross Win ({effectiveRatioString}):</span>
                <div className="font-mono font-bold text-white text-sm">+{grossWin.toFixed(2)} PTS</div>
              </div>
            </div>

            <div className="bg-[#131314] p-2 rounded-[6px] text-[11px] space-y-1 text-[#9CA3AF]">
              <div className="flex justify-between">
                <span>{platformVigPercent}% Vig on Winnings:</span>
                <span className="font-mono text-[#EF4444]">-{vigFee.toFixed(2)} PTS</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#6B7280]">
                <span>&bull; Agent Split ({(agentVigSplit * 100).toFixed(0)}%):</span>
                <span className="font-mono">{agentCut.toFixed(2)} PTS</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#6B7280]">
                <span>&bull; Admin Split ({((1 - agentVigSplit) * 100).toFixed(0)}%):</span>
                <span className="font-mono">{adminCut.toFixed(2)} PTS</span>
              </div>
            </div>

            {/* Symmetry Preview: What Opponent Sees */}
            <div className="bg-[#161619] p-2 rounded-[6px] text-[11px] border border-[#222226]">
              <div className="text-[10px] text-[#9CA3AF] uppercase font-bold mb-1 flex items-center justify-between">
                <span>Opponent (Taker) Terms</span>
                <span className="text-[#10B981] font-mono">Backs {opposingTeam.name}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#D1D5DB]">
                <span>Taker Risks: <strong className="text-white font-mono">{takerRisk.toFixed(2)} PTS</strong></span>
                <span>Taker Net Win: <strong className="text-[#10B981] font-mono">+{takerNetWin.toFixed(2)} PTS</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#9CA3AF] uppercase font-bold">Your Estimated Net Win:</span>
                <div className="font-mono font-extrabold text-[#10B981] text-base leading-none">
                  +{netWin.toFixed(2)} PTS
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6B7280]">Total Return (Net + Stake):</span>
                <div className="font-mono font-bold text-white text-sm">{totalPayout.toFixed(2)} PTS</div>
              </div>
            </div>
          </div>

          {!hasSufficientBalance && (
            <div className="p-2.5 rounded-[6px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Insufficient PTS balance. Please top up before placing bet.</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              id="submit-create-open-bet"
              disabled={!hasSufficientBalance || isLocked}
              className={`w-full py-3 rounded-[8px] text-sm font-extrabold uppercase tracking-wider text-white transition-all flex items-center justify-center space-x-2 ${
                isLocked
                  ? 'bg-[#2A2A30] text-[#6B7280] cursor-not-allowed border border-[#3A3A42]'
                  : hasSufficientBalance
                  ? 'bg-[#FF0000] hover:bg-[#CC0000] redline-glow cursor-pointer'
                  : 'bg-[#2A2A30] text-[#6B7280] cursor-not-allowed'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-4 h-4 text-[#EF4444]" />
                  <span>Betting Locked (Match in Play)</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Post Open Bet Card ({riskAmount} PTS)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
