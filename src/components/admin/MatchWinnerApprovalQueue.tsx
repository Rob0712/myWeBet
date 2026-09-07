import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Match } from '../../types';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Play,
  XCircle,
  Edit3,
  DollarSign,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info,
  Layers,
  AlertCircle
} from 'lucide-react';

export const MatchWinnerApprovalQueue: React.FC = () => {
  const {
    matches,
    openBets,
    approveMatchWinner,
    rejectMatchResult,
    simulateTrackResult,
    trackMatchResult,
    platformVigPercent,
    agentVigSplit
  } = useWeBet();

  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [customHomeScore, setCustomHomeScore] = useState<number>(0);
  const [customAwayScore, setCustomAwayScore] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectModalMatchId, setRejectModalMatchId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedMatchToTrack, setSelectedMatchToTrack] = useState<string>('');

  // Matches with tracked results
  const pendingApprovalMatches = matches.filter(
    m => m.winnerApprovalStatus === 'pending_admin_approval'
  );

  const approvedMatches = matches.filter(
    m => m.winnerApprovalStatus === 'approved' || (m.status === 'completed' && m.winnerId)
  );

  const displayedMatches =
    filterTab === 'pending'
      ? pendingApprovalMatches
      : filterTab === 'approved'
      ? approvedMatches
      : matches.filter(m => m.winnerApprovalStatus || m.status === 'completed');

  // Untracked active matches that can have a result simulated/tracked
  const activeUntrackedMatches = matches.filter(
    m => m.status !== 'completed' && m.winnerApprovalStatus !== 'pending_admin_approval'
  );

  const handleStartEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setSelectedWinnerId(match.provisionalWinnerId || match.homeTeam.id);
    setCustomHomeScore(match.provisionalHomeScore ?? match.homeScore ?? 0);
    setCustomAwayScore(match.provisionalAwayScore ?? match.awayScore ?? 0);
    setAdminNotes('');
  };

  const handleConfirmApproval = (matchId: string) => {
    if (editingMatchId === matchId) {
      approveMatchWinner(matchId, selectedWinnerId, customHomeScore, customAwayScore, adminNotes);
      setEditingMatchId(null);
    } else {
      approveMatchWinner(matchId);
    }
  };

  const handleConfirmRejection = () => {
    if (!rejectModalMatchId) return;
    rejectMatchResult(rejectModalMatchId, rejectionReason || 'Disputed result / feed discrepancy');
    setRejectModalMatchId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Policy Banner & Integrity Notice */}
      <div className="bg-[#131314] border border-[#232328] rounded-[8px] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444]"></span>
              </span>
              <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
                Match Result Tracking &amp; Winner Approvals
              </h2>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-bold uppercase tracking-wider">
                Strict: No Auto-Posting
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] max-w-3xl leading-relaxed">
              In accordance with operational policy, match scores and full-time whistles tracked from live feeds
              or automated scoreboards are <strong className="text-[#D1D5DB]">strictly held in escrow</strong>. Winners
              are <strong className="text-[#EF4444]">never auto-posted</strong> without explicit Administrator review and authorization.
            </p>
          </div>

          {/* Quick Simulation Trigger */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-simulate-track-result"
              onClick={() => simulateTrackResult(selectedMatchToTrack || undefined)}
              className="px-3.5 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
              title="Simulates match conclusion, captures scores, dispatches Admin notification, and leaves winner strictly unposted"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Simulate Final Whistle (Track Result)</span>
            </button>
          </div>
        </div>

        {/* Quick select for manual track simulation */}
        {activeUntrackedMatches.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1F1F24] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-[#9CA3AF]">
              <Info className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Target fixture for result tracking:</span>
              <select
                id="select-target-match"
                value={selectedMatchToTrack}
                onChange={e => setSelectedMatchToTrack(e.target.value)}
                className="bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FF0000]"
              >
                <option value="">Auto-Select Active Live/Upcoming Match</option>
                {activeUntrackedMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.sport.toUpperCase()}: {m.homeTeam.name} vs {m.awayTeam.name} ({m.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-[#6B7280]">
              {pendingApprovalMatches.length} pending winner approval(s) requiring admin action
            </span>
          </div>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between border-b border-[#232328] pb-1">
        <div className="flex items-center space-x-2">
          <button
            id="tab-winner-approvals-pending"
            onClick={() => setFilterTab('pending')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
              filterTab === 'pending'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Winner Approval</span>
            {pendingApprovalMatches.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-[#FF0000] font-mono text-[10px] font-extrabold rounded-full animate-pulse">
                {pendingApprovalMatches.length}
              </span>
            )}
          </button>

          <button
            id="tab-winner-approvals-approved"
            onClick={() => setFilterTab('approved')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
              filterTab === 'approved'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved &amp; Settled ({approvedMatches.length})</span>
          </button>

          <button
            id="tab-winner-approvals-all"
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
              filterTab === 'all'
                ? 'bg-[#FF0000] text-white shadow-md'
                : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Tracked History</span>
          </button>
        </div>

        <div className="text-[11px] text-[#6B7280] hidden md:block">
          Commission Split: <span className="text-[#FFD700] font-mono">{(agentVigSplit * 100).toFixed(0)}% Agent</span> /{' '}
          <span className="text-white font-mono">{((1 - agentVigSplit) * 100).toFixed(0)}% House Vig</span>
        </div>
      </div>

      {/* Main Queue List */}
      {displayedMatches.length === 0 ? (
        <div className="bg-[#131314] border border-[#232328] rounded-[8px] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1F1F24] mx-auto flex items-center justify-center text-[#9CA3AF]">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
          </div>
          <h3 className="text-sm font-bold text-white">No Matches Awaiting Winner Approval</h3>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
            All tracked match results have been reviewed and approved. Use "Simulate Final Whistle (Track Result)" above
            to simulate an incoming scoreboard result feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedMatches.map(match => {
            const isPending = match.winnerApprovalStatus === 'pending_admin_approval';
            const isApproved = match.winnerApprovalStatus === 'approved' || match.status === 'completed';
            const isEditing = editingMatchId === match.id;

            // Escrow details for this match
            const matchedBets = openBets.filter(b => b.matchId === match.id && b.status === 'matched');
            const totalEscrowPool = matchedBets.reduce((sum, b) => sum + b.makerRisk + b.takerRisk, 0);
            const totalGrossWin = matchedBets.reduce((sum, b) => sum + b.makerWin, 0);
            const estimatedVig = Number((totalGrossWin * (platformVigPercent / 100)).toFixed(2));
            const estimatedAgentCut = Number((estimatedVig * agentVigSplit).toFixed(2));
            const estimatedAdminCut = Number((estimatedVig * (1 - agentVigSplit)).toFixed(2));

            const provWinnerName =
              match.provisionalWinnerId === match.homeTeam.id
                ? match.homeTeam.name
                : match.provisionalWinnerId === match.awayTeam.id
                ? match.awayTeam.name
                : match.provisionalWinnerName || 'Draw / Tie';

            return (
              <div
                key={match.id}
                id={`card-winner-approval-${match.id}`}
                className={`bg-[#131314] border rounded-[8px] p-5 transition-all space-y-4 ${
                  isPending
                    ? 'border-[#EF4444]/60 bg-gradient-to-r from-[#131314] via-[#161214] to-[#131314] shadow-md'
                    : 'border-[#232328]'
                }`}
              >
                {/* Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F1F24]">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#1F1F24] text-white text-xs font-bold uppercase">
                      {match.sport}
                    </span>
                    <span className="text-xs font-bold text-[#D1D5DB]">{match.league}</span>
                    <span className="text-xs text-[#6B7280]">&bull;</span>
                    <span className="text-xs text-[#9CA3AF]">{match.venue}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-[4px] bg-[#EF4444]/20 border border-[#EF4444]/50 text-[#EF4444] text-[11px] font-extrabold uppercase tracking-wide flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                        <span>RESULT TRACKED &bull; AWAITING ADMIN APPROVAL</span>
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-[4px] bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-[11px] font-bold uppercase flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                        <span>WINNER APPROVED &amp; SETTLED</span>
                      </span>
                    )}

                    {match.winnerApprovalStatus === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-[4px] bg-[#6B7280]/20 border border-[#6B7280]/40 text-[#9CA3AF] text-[11px] font-bold uppercase flex items-center space-x-1">
                        <XCircle className="w-3 h-3 text-[#9CA3AF]" />
                        <span>RESULT REJECTED / DISPUTED</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Scoreboard and Teams Display */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 py-2">
                  {/* Home Team */}
                  <div className="lg:col-span-4 flex items-center space-x-3">
                    <span className="text-3xl p-1 bg-[#0E0E0F] rounded-[8px] border border-[#232328]">
                      {match.homeTeam.logo}
                    </span>
                    <div>
                      <div className="font-bold text-white text-base leading-tight">{match.homeTeam.name}</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">
                        {match.homeTeam.record || 'Team Record'}
                      </div>
                    </div>
                  </div>

                  {/* Score & Period Center */}
                  <div className="lg:col-span-4 text-center space-y-1">
                    <div className="inline-flex items-center space-x-3 bg-[#0E0E0F] px-4 py-2 rounded-[8px] border border-[#232328]">
                      <span className="font-mono text-2xl font-black text-white">
                        {match.provisionalHomeScore ?? match.homeScore ?? 0}
                      </span>
                      <span className="text-xs text-[#6B7280] font-bold">VS</span>
                      <span className="font-mono text-2xl font-black text-white">
                        {match.provisionalAwayScore ?? match.awayScore ?? 0}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#9CA3AF] font-mono flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3 text-[#6B7280]" />
                      <span>{match.currentPeriod || 'Full Time'}</span>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="lg:col-span-4 flex items-center justify-end space-x-3 text-right">
                    <div>
                      <div className="font-bold text-white text-base leading-tight">{match.awayTeam.name}</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">
                        {match.awayTeam.record || 'Team Record'}
                      </div>
                    </div>
                    <span className="text-3xl p-1 bg-[#0E0E0F] rounded-[8px] border border-[#232328]">
                      {match.awayTeam.logo}
                    </span>
                  </div>
                </div>

                {/* Provisional Winner & Strict Non-Posting Alert */}
                <div className="bg-[#0E0E0F] border border-[#26262B] rounded-[8px] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[#6B7280] uppercase text-[10px] font-bold tracking-wider block">
                        {isPending ? 'Tracked Provisional Winner' : 'Official Approved Winner'}
                      </span>
                      <span className="font-extrabold text-white text-sm">
                        {isApproved ? (match.winnerId === match.homeTeam.id ? match.homeTeam.name : match.winnerId === match.awayTeam.id ? match.awayTeam.name : 'Draw') : provWinnerName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider block">
                      Tracking Feed &amp; Timestamp
                    </span>
                    <span className="text-xs text-[#9CA3AF] font-mono">
                      {match.resultSource || 'Live Scoreboard Feed'} &bull;{' '}
                      {match.resultReportedAt
                        ? new Date(match.resultReportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Escrow & Payout Transparency */}
                <div className="bg-[#0E0E0F] p-3 rounded-[8px] border border-[#1F1F24] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block font-sans">Matched Bets in Escrow</span>
                    <span className="font-bold text-white text-sm">{matchedBets.length} Bets</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block font-sans">Total Escrow Volume</span>
                    <span className="font-bold text-white text-sm">{totalEscrowPool.toFixed(2)} PTS</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block font-sans">10% Platform Vig</span>
                    <span className="font-bold text-[#10B981] text-sm">+{estimatedVig.toFixed(2)} PTS</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase block font-sans">Agent Cut (60%)</span>
                    <span className="font-bold text-[#FFD700] text-sm">+{estimatedAgentCut.toFixed(2)} PTS</span>
                  </div>
                </div>

                {/* Edit Form (if admin clicks overrule / edit) */}
                {isEditing && (
                  <div className="bg-[#18181C] p-4 rounded-[8px] border border-[#FF0000] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Admin Override / Verification Controls</span>
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        Adjust scores or select winner prior to financial execution
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Winner Selection */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9CA3AF] block font-semibold">Official Winning Team</label>
                        <select
                          value={selectedWinnerId}
                          onChange={e => setSelectedWinnerId(e.target.value)}
                          className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF0000]"
                        >
                          <option value={match.homeTeam.id}>{match.homeTeam.name} (Home)</option>
                          <option value={match.awayTeam.id}>{match.awayTeam.name} (Away)</option>
                          <option value="draw">Draw / Tie (Void or Refund)</option>
                        </select>
                      </div>

                      {/* Home Score */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9CA3AF] block font-semibold">{match.homeTeam.shortName} Final Score</label>
                        <input
                          type="number"
                          value={customHomeScore}
                          onChange={e => setCustomHomeScore(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF0000]"
                        />
                      </div>

                      {/* Away Score */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9CA3AF] block font-semibold">{match.awayTeam.shortName} Final Score</label>
                        <input
                          type="number"
                          value={customAwayScore}
                          onChange={e => setCustomAwayScore(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF0000]"
                        />
                      </div>
                    </div>

                    {/* Admin verification note */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#9CA3AF] block font-semibold">Audit / Verification Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., Verified against official league box score after VAR review."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF0000]"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingMatchId(null)}
                        className="px-3 py-1.5 bg-[#232328] hover:bg-[#2A2A30] text-[#9CA3AF] text-xs font-semibold rounded-[6px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmApproval(match.id)}
                        className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Overrides &amp; Execute Settlement</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                {isPending && !isEditing && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#1F1F24]">
                    <div className="text-[11px] text-[#EF4444] font-semibold flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Strict Protocol: Winner will NOT post until you click "Approve Winner &amp; Post Results".</span>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        id={`btn-reject-result-${match.id}`}
                        onClick={() => {
                          setRejectModalMatchId(match.id);
                          setRejectionReason('');
                        }}
                        className="px-3 py-2 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#9CA3AF] hover:text-white text-xs font-semibold rounded-[6px] transition-colors"
                      >
                        Dispute / Reject
                      </button>

                      <button
                        id={`btn-edit-result-${match.id}`}
                        onClick={() => handleStartEdit(match)}
                        className="px-3 py-2 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#D1D5DB] hover:text-white text-xs font-semibold rounded-[6px] transition-colors flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit / Overrule</span>
                      </button>

                      <button
                        id={`btn-approve-winner-${match.id}`}
                        onClick={() => handleConfirmApproval(match.id)}
                        className="flex-1 sm:flex-none px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Winner &amp; Post Results</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Already Settled Stamp */}
                {isApproved && (
                  <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between text-xs text-[#6B7280]">
                    <span className="flex items-center space-x-1.5 text-[#10B981]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Verified by {match.adminApprovedBy || 'Administrator'} &bull; Bets settled &amp; funds released
                      </span>
                    </span>
                    <span className="font-mono text-[11px]">
                      {match.adminApprovedAt ? new Date(match.adminApprovedAt).toLocaleString() : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalMatchId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#232328] rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-white">
              <XCircle className="w-5 h-5 text-[#EF4444]" />
              <h3 className="font-bold text-sm">Reject / Dispute Tracked Match Result</h3>
            </div>

            <p className="text-xs text-[#9CA3AF]">
              Rejecting this result will prevent any winner from being posted. The match will be returned to live review
              and all matched bets will remain safely held in escrow.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#D1D5DB]">Rejection / Dispute Reason</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Official match delayed by rain, scoreboard feed error, or awaiting VAR official ruling."
                className="w-full h-20 bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] p-2.5 text-xs text-white focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1F1F24]">
              <button
                onClick={() => setRejectModalMatchId(null)}
                className="px-3 py-1.5 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#9CA3AF] text-xs font-semibold rounded-[6px]"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-result"
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-[6px]"
              >
                Confirm Rejection (Keep In Escrow)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
