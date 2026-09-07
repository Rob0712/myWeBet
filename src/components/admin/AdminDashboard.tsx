import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Match, SportType } from '../../types';
import { MatchApprovalQueue } from './MatchApprovalQueue';
import { MatchWinnerApprovalQueue } from './MatchWinnerApprovalQueue';
import { AdminNotificationCenter } from './AdminNotificationCenter';
import { RaffleAdminManager } from './RaffleAdminManager';
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Sliders,
  DollarSign,
  PlusCircle,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Lock,
  Layers,
  Users,
  Award,
  Calendar,
  Clock,
  Gift,
  Ticket
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    platformStats,
    matches,
    openBets,
    cashierRequests,
    processCashierRequest,
    kycSubmissions,
    processKYC,
    updateMatchStatus,
    settleMatch,
    trackMatchResult,
    approveMatchWinner,
    createCustomMatch,
    platformVigPercent,
    setPlatformVigPercent,
    agentVigSplit,
    setAgentVigSplit,
    allAgents,
    allUsers,
    transactions,
    resetAllData,
    raffles
  } = useWeBet();

  const [activeTab, setActiveTab] = useState<'winner-approvals' | 'approvals' | 'matches' | 'raffles' | 'cashier' | 'kyc' | 'agents' | 'settings'>('winner-approvals');

  // Match settlement state
  const [selectedMatchToSettle, setSelectedMatchToSettle] = useState<string>('');
  const [settleWinnerId, setSettleWinnerId] = useState<string>('');
  const [settleHomeScore, setSettleHomeScore] = useState<number>(3);
  const [settleAwayScore, setSettleAwayScore] = useState<number>(2);

  // New match form state
  const [showNewMatchModal, setShowNewMatchModal] = useState<boolean>(false);
  const [newSport, setNewSport] = useState<SportType>('soccer');
  const [newLeague, setNewLeague] = useState<string>('UEFA Champions League');
  const [newHomeName, setNewHomeName] = useState<string>('Bayern Munich');
  const [newHomeLogo, setNewHomeLogo] = useState<string>('🔴');
  const [newAwayName, setNewAwayName] = useState<string>('Paris Saint-Germain');
  const [newAwayLogo, setNewAwayLogo] = useState<string>('🗼');
  const [newVenue, setNewVenue] = useState<string>('Allianz Arena, Munich');

  const pendingCashierCount = cashierRequests.filter(r => r.status === 'pending').length;
  const pendingKYCCount = kycSubmissions.filter(k => k.status === 'pending').length;
  const pendingApprovalsCount = matches.filter(m => (m.approvalStatus || 'approved') === 'pending').length;
  const pendingWinnerApprovalsCount = matches.filter(m => m.winnerApprovalStatus === 'pending_admin_approval').length;

  const handleSettleSubmit = (match: Match) => {
    if (!settleWinnerId) return;
    settleMatch(match.id, settleWinnerId, settleHomeScore, settleAwayScore);
    setSelectedMatchToSettle('');
  };

  const handleCreateMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomMatch({
      sport: newSport,
      league: newLeague,
      homeTeam: {
        id: 'team_' + Math.random().toString(36).substring(2, 6),
        name: newHomeName,
        shortName: newHomeName.substring(0, 3).toUpperCase(),
        logo: newHomeLogo,
      },
      awayTeam: {
        id: 'team_' + Math.random().toString(36).substring(2, 6),
        name: newAwayName,
        shortName: newAwayName.substring(0, 3).toUpperCase(),
        logo: newAwayLogo,
      },
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      status: 'upcoming',
      venue: newVenue,
    });
    setShowNewMatchModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Platform Analytics Banner */}
      <div className="bg-[#131314] p-5 rounded-[8px] border border-[#FF0000]/40 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000] animate-ping" />
            <h2 className="text-lg font-bold text-white leading-tight">WeBet Central Administration & Settlement Hub</h2>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Full platform financial visibility, live match lifecycle management, and cashier settlement approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notification Center */}
          <AdminNotificationCenter onSelectApprovalTab={() => setActiveTab('winner-approvals')} />

          <button
            onClick={() => setShowNewMatchModal(true)}
            className="px-3.5 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 redline-glow cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Fixture</span>
          </button>

          <button
            onClick={resetAllData}
            title="Reset to default mock state"
            className="px-3 py-2 bg-[#1E1E24] hover:bg-[#26262B] text-[#9CA3AF] hover:text-white text-xs rounded-[6px] transition-colors flex items-center space-x-1 border border-[#2A2A30] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Platform KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Total Platform Volume</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-white">
              {platformStats.totalTurnover.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#9CA3AF]">PTS</span>
          </div>
          <div className="text-[10px] text-[#10B981]">Total P2P Stakes Processed</div>
        </div>

        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">10% Platform Vig Collected</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-[#FFD700]">
              {platformStats.totalVigCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#FFD700]">PTS</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]">10% fee deducted only on winnings</div>
        </div>

        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Admin Net Retention (40%)</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-[#3B82F6]">
              {platformStats.adminVigShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#3B82F6]">PTS</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]">Net platform treasury earnings</div>
        </div>

        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Agent Commissions (60%)</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-[#10B981]">
              {platformStats.agentVigShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#10B981]">PTS</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]">Distributed to master agents</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#232328] pb-1 overflow-x-auto">
        <button
          id="admin-tab-winner-approvals"
          onClick={() => setActiveTab('winner-approvals')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'winner-approvals'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>Winner Approvals (Escrow)</span>
          {pendingWinnerApprovalsCount > 0 && (
            <span className="bg-[#EF4444] text-white font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
              {pendingWinnerApprovalsCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-approvals"
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>1-Week Schedule Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="bg-[#F59E0B] text-black text-[10px] font-bold px-1.5 rounded-full">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-matches"
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'matches'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Match Control & Settle Engine ({matches.length})
        </button>

        <button
          id="admin-tab-raffles"
          onClick={() => setActiveTab('raffles')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'raffles'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Raffles &amp; Prizes</span>
          {raffles.filter(r => r.status === 'active').length > 0 && (
            <span className="bg-[#10B981] text-black text-[10px] font-bold px-1.5 rounded-full font-mono">
              {raffles.filter(r => r.status === 'active').length}
            </span>
          )}
        </button>

        <button
          id="admin-tab-cashier"
          onClick={() => setActiveTab('cashier')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'cashier'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <span>Cashier Approvals</span>
          {pendingCashierCount > 0 && (
            <span className="bg-[#F59E0B] text-black text-[10px] font-bold px-1.5 rounded-full">
              {pendingCashierCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-kyc"
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            activeTab === 'kyc'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <span>KYC Verifications</span>
          {pendingKYCCount > 0 && (
            <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-1.5 rounded-full">
              {pendingKYCCount}
            </span>
          )}
        </button>

        <button
          id="admin-tab-agents"
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'agents'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Agent Performance ({allAgents.length})
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Vig & System Settings
        </button>
      </div>

      {/* TAB: Match Result Tracking & Winner Approvals Queue */}
      {activeTab === 'winner-approvals' && (
        <MatchWinnerApprovalQueue />
      )}

      {/* TAB 0: 1-Week Advance Schedule & Match Approvals Queue */}
      {activeTab === 'approvals' && (
        <MatchApprovalQueue />
      )}

      {/* TAB 1: Match Control & Settlement */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] flex items-center justify-between">
            <div className="text-xs text-[#9CA3AF]">
              <strong className="text-white">Settlement Automation:</strong> Trigger match kickoff (auto-cancels open bets), update live scores, and resolve winners with instantaneous 10% Vig distribution!
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {matches.map(match => {
              const matchedCount = openBets.filter(b => b.matchId === match.id && b.status === 'matched').length;
              const openCount = openBets.filter(b => b.matchId === match.id && b.status === 'open').length;

              return (
                <div
                  key={match.id}
                  className="bg-[#131314] border border-[#232328] rounded-[8px] p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#1F1F24] text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#D1D5DB]">{match.league}</span>
                        {match.approvalStatus === 'pending' && (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold uppercase">
                            Pending Approval
                          </span>
                        )}
                        {match.approvalStatus === 'auto_closed' && (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#6B7280]/20 text-[#9CA3AF] text-[10px] font-bold uppercase">
                            Auto-Closed (&lt;1h)
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                        match.status === 'live'
                          ? 'bg-[#FF0000]/20 text-[#FF0000]'
                          : match.status === 'completed'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#2A2A30] text-[#9CA3AF]'
                      }`}>
                        {match.status} {match.currentPeriod && `(${match.currentPeriod})`}
                      </span>
                    </div>

                    {/* Match Score & Teams */}
                    <div className="grid grid-cols-5 items-center my-3 text-xs">
                      <div className="col-span-2 flex items-center space-x-2">
                        <span className="text-2xl">{match.homeTeam.logo}</span>
                        <span className="font-bold text-white">{match.homeTeam.name}</span>
                      </div>

                      <div className="col-span-1 text-center font-mono font-extrabold text-base text-white">
                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                      </div>

                      <div className="col-span-2 flex items-center justify-end space-x-2 text-right">
                        <span className="font-bold text-white">{match.awayTeam.name}</span>
                        <span className="text-2xl">{match.awayTeam.logo}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#9CA3AF] bg-[#0E0E0F] p-2 rounded-[6px] flex justify-between">
                      <span>{openCount} Open Bets (OBC)</span>
                      <span className="font-semibold text-white">{matchedCount} Matched Bets in Escrow</span>
                    </div>
                  </div>

                  {/* Actions depending on match state */}
                  <div className="pt-2 border-t border-[#1F1F24] space-y-2">
                    {/* Pending Winner Approval Banner on Match Card */}
                    {match.winnerApprovalStatus === 'pending_admin_approval' && (
                      <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-[6px] p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#EF4444] font-bold">
                          <span className="flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Result Tracked &bull; Pending Winner Approval</span>
                          </span>
                          <span className="text-[10px] uppercase px-1.5 py-0.2 bg-[#EF4444]/20 rounded font-mono">
                            Strict Escrow
                          </span>
                        </div>
                        <p className="text-[11px] text-[#D1D5DB] leading-relaxed">
                          Tracked: <strong>{match.provisionalWinnerName}</strong> ({match.provisionalHomeScore ?? match.homeScore} - {match.provisionalAwayScore ?? match.awayScore}). Winner strictly unposted until approved.
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActiveTab('winner-approvals')}
                            className="flex-1 py-1.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[4px] transition-colors flex items-center justify-center space-x-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Open Winner Approval Queue</span>
                          </button>
                          <button
                            onClick={() => approveMatchWinner(match.id)}
                            className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[4px] transition-colors flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {match.status === 'upcoming' && (
                      <div className="flex items-center space-x-2">
                        <button
                          id={`btn-admin-start-match-${match.id}`}
                          onClick={() => updateMatchStatus(match.id, 'live', 0, 0)}
                          className="flex-1 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Match (Auto-Close Open Bets)</span>
                        </button>
                      </div>
                    )}

                    {match.status === 'live' && match.winnerApprovalStatus !== 'pending_admin_approval' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateMatchStatus(match.id, 'live', (match.homeScore || 0) + 1, match.awayScore)}
                            className="flex-1 py-1.5 bg-[#1E1E24] hover:bg-[#2A2A30] text-xs font-mono text-white rounded-[6px]"
                          >
                            +1 {match.homeTeam.shortName}
                          </button>
                          <button
                            onClick={() => updateMatchStatus(match.id, 'live', match.homeScore, (match.awayScore || 0) + 1)}
                            className="flex-1 py-1.5 bg-[#1E1E24] hover:bg-[#2A2A30] text-xs font-mono text-white rounded-[6px]"
                          >
                            +1 {match.awayTeam.shortName}
                          </button>
                        </div>

                        {/* Track Result without auto-posting */}
                        <button
                          id={`btn-track-result-${match.id}`}
                          onClick={() => trackMatchResult(match.id, match.homeScore || 2, match.awayScore || 1, 'Final Whistle (FT)')}
                          className="w-full py-1.5 bg-[#18181C] hover:bg-[#24242A] text-[#D1D5DB] hover:text-white text-xs font-semibold rounded-[6px] transition-colors flex items-center justify-center space-x-1 border border-[#2A2A30]"
                          title="Track final score and trigger admin notification without auto-posting winner"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>Track Result &amp; Send Approval Alert (No Auto-Post)</span>
                        </button>

                        {selectedMatchToSettle === match.id ? (
                          <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#FF0000] space-y-2">
                            <div className="text-xs font-bold text-white">Select Winner & Finalize:</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSettleWinnerId(match.homeTeam.id)}
                                className={`p-2 rounded-[6px] text-xs font-bold border transition-colors ${
                                  settleWinnerId === match.homeTeam.id
                                    ? 'bg-[#FF0000] text-white border-[#FF0000]'
                                    : 'bg-[#18181C] text-[#9CA3AF] border-[#2A2A30]'
                                }`}
                              >
                                {match.homeTeam.name} Wins
                              </button>
                              <button
                                onClick={() => setSettleWinnerId(match.awayTeam.id)}
                                className={`p-2 rounded-[6px] text-xs font-bold border transition-colors ${
                                  settleWinnerId === match.awayTeam.id
                                    ? 'bg-[#FF0000] text-white border-[#FF0000]'
                                    : 'bg-[#18181C] text-[#9CA3AF] border-[#2A2A30]'
                                }`}
                              >
                                {match.awayTeam.name} Wins
                              </button>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                onClick={() => setSelectedMatchToSettle('')}
                                className="py-1.5 px-3 bg-[#1E1E24] text-xs text-[#9CA3AF] rounded-[6px]"
                              >
                                Cancel
                              </button>
                              <button
                                id={`btn-confirm-settle-${match.id}`}
                                onClick={() => handleSettleSubmit(match)}
                                disabled={!settleWinnerId}
                                className="flex-1 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px]"
                              >
                                Settle & Execute Payouts
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            id={`btn-open-settle-${match.id}`}
                            onClick={() => {
                              setSelectedMatchToSettle(match.id);
                              setSettleWinnerId(match.homeTeam.id);
                              setSettleHomeScore(match.homeScore || 2);
                              setSettleAwayScore(match.awayScore || 1);
                            }}
                            className="w-full py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Settle Match & Pay Winners</span>
                          </button>
                        )}
                      </div>
                    )}

                    {match.status === 'completed' && (
                      <div className="text-center py-1.5 text-xs text-[#10B981] font-semibold bg-[#10B981]/10 rounded-[6px]">
                        ✓ All bets settled and paid out to winners with 10% Vig
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Raffles & Prize Draws Manager */}
      {activeTab === 'raffles' && (
        <RaffleAdminManager />
      )}

      {/* TAB 2: Cashier Approvals */}
      {activeTab === 'cashier' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase font-bold text-white">Deposit & Withdrawal Queue</h3>
            <span className="text-xs text-[#9CA3AF]">{cashierRequests.length} Total Requests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
              <thead className="bg-[#18181C] text-[#9CA3AF] uppercase text-[10px] font-semibold border-b border-[#232328]">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method & Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {cashierRequests.map(req => (
                  <tr key={req.id} className="hover:bg-[#161618] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                        req.type === 'deposit' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{req.userName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{req.amount.toFixed(2)} PTS</td>
                    <td className="px-4 py-3 text-[#9CA3AF]">
                      <div>{req.paymentMethod}</div>
                      {req.accountDetails && <div className="text-[10px] text-[#6B7280]">{req.accountDetails}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold ${
                        req.status === 'approved' ? 'text-[#10B981]' : req.status === 'rejected' ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            id={`approve-cashier-${req.id}`}
                            onClick={() => processCashierRequest(req.id, 'approve')}
                            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-[4px] text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            id={`reject-cashier-${req.id}`}
                            onClick={() => processCashierRequest(req.id, 'reject')}
                            className="px-2.5 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-[4px] text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B7280]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KYC Submissions */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
              <thead className="bg-[#18181C] text-[#9CA3AF] uppercase text-[10px] font-semibold border-b border-[#232328]">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Legal Name</th>
                  <th className="px-4 py-3">ID Type & Number</th>
                  <th className="px-4 py-3">Liveness Check</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {kycSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-[#161618] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{sub.userName}</td>
                    <td className="px-4 py-3 text-[#D1D5DB]">{sub.fullName}</td>
                    <td className="px-4 py-3 font-mono text-[#9CA3AF]">
                      {sub.idType.toUpperCase()}: {sub.idNumber}
                    </td>
                    <td className="px-4 py-3 text-[#10B981] font-semibold">
                      ✓ Biometric Passed
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold ${
                        sub.status === 'approved' ? 'text-[#10B981]' : 'text-[#F59E0B]'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.status === 'pending' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => processKYC(sub.id, 'approve')}
                            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-[4px] text-xs font-bold"
                          >
                            Approve Tier 2
                          </button>
                          <button
                            onClick={() => processKYC(sub.id, 'reject')}
                            className="px-2.5 py-1 bg-[#EF4444] text-white rounded-[4px] text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B7280]">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Agents */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAgents.map(agent => (
            <div key={agent.id} className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-3">
              <div className="flex items-center space-x-3">
                <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-[8px] object-cover" />
                <div>
                  <div className="text-sm font-bold text-white">{agent.name}</div>
                  <div className="text-xs text-[#FFD700] font-mono">{agent.code} &bull; {agent.tier} Tier</div>
                </div>
              </div>

              <div className="bg-[#0E0E0F] p-3 rounded-[6px] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#6B7280]">Commission Share:</span>
                  <div className="font-mono font-bold text-white">{agent.commissionRate * 100}% of Vig</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Active Players:</span>
                  <div className="font-mono font-bold text-white">{agent.activePlayersCount}</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Lifetime Vig Paid:</span>
                  <div className="font-mono font-bold text-[#10B981]">{agent.lifetimeCommissions.toFixed(2)} PTS</div>
                </div>
                <div>
                  <span className="text-[#6B7280]">Volume Driven:</span>
                  <div className="font-mono font-bold text-white">{agent.totalPlayerVolume.toFixed(2)} PTS</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: System Settings & Vig Adjustments */}
      {activeTab === 'settings' && (
        <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] max-w-xl space-y-5">
          <h3 className="text-base font-bold text-white">System Vig & Money Model Parameters</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-white mb-1">
                <span>Platform Vig on Winnings:</span>
                <span className="font-mono text-[#FF0000]">{platformVigPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={platformVigPercent}
                onChange={e => setPlatformVigPercent(Number(e.target.value))}
                className="w-full accent-[#FF0000]"
              />
              <span className="text-[10px] text-[#6B7280]">Standard baseline is 10% vig on winner's profit (100:100 even-money model).</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-white mb-1">
                <span>Agent Commission Split:</span>
                <span className="font-mono text-[#FFD700]">{(agentVigSplit * 100).toFixed(0)}% Agent / {((1 - agentVigSplit) * 100).toFixed(0)}% Admin</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.80"
                step="0.05"
                value={agentVigSplit}
                onChange={e => setAgentVigSplit(Number(e.target.value))}
                className="w-full accent-[#FFD700]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Match Modal */}
      {showNewMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Sports Fixture</h3>

            <form onSubmit={handleCreateMatchSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">Sport Category</label>
                <select
                  value={newSport}
                  onChange={e => setNewSport(e.target.value as SportType)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-xs text-white"
                >
                  <option value="soccer">⚽ Soccer</option>
                  <option value="basketball">🏀 Basketball</option>
                  <option value="football">🏈 Football (NFL)</option>
                  <option value="baseball">⚾ Baseball (MLB)</option>
                  <option value="mma">🥊 MMA / UFC</option>
                  <option value="boxing">🥊 Boxing</option>
                  <option value="tennis">🎾 Tennis</option>
                  <option value="hockey">🏒 Ice Hockey (NHL)</option>
                  <option value="cricket">🏏 Cricket</option>
                  <option value="esports">🎮 Esports</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">League / Event</label>
                <input
                  type="text"
                  value={newLeague}
                  onChange={e => setNewLeague(e.target.value)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">Home Team</label>
                  <input
                    type="text"
                    value={newHomeName}
                    onChange={e => setNewHomeName(e.target.value)}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">Away Team</label>
                  <input
                    type="text"
                    value={newAwayName}
                    onChange={e => setNewAwayName(e.target.value)}
                    className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMatchModal(false)}
                  className="flex-1 py-2 rounded-[6px] bg-[#1E1E24] text-xs text-[#9CA3AF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-[6px] bg-[#FF0000] hover:bg-[#CC0000] text-xs font-bold text-white"
                >
                  Publish Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
