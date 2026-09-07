import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import {
  Users,
  TrendingUp,
  Award,
  DollarSign,
  Send,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const {
    currentAgent,
    allUsers,
    transactions,
    agentTopUpPlayer,
    openBets,
    matches,
    addToast
  } = useWeBet();

  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'players' | 'onboarding'>('overview');
  const [selectedPlayerForTopUp, setSelectedPlayerForTopUp] = useState<string>('');
  const [topUpAmount, setTopUpAmount] = useState<number>(250);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Find players assigned to this agent
  const assignedPlayers = allUsers.filter(u => u.agentId === currentAgent.id || true); // fallback includes all players in mock

  // Filter commission transactions for this agent
  const agentCommissions = transactions.filter(
    t => t.type === 'agent_commission' && (t.userId === currentAgent.id || t.agentId === currentAgent.id)
  );

  const totalCommissionsCount = agentCommissions.length;
  const totalCommissionEarned = agentCommissions.reduce((sum, t) => sum + t.amount, 0);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForTopUp || topUpAmount <= 0) return;

    const res = agentTopUpPlayer(selectedPlayerForTopUp, topUpAmount);
    if (res.success) {
      setShowTopUpModal(false);
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText?.(`https://webet.io/join?ref=${currentAgent.code}`);
    setCopiedLink(true);
    addToast('Link Copied', 'Agent referral link copied to clipboard!', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Agent Top Banner */}
      <div className="bg-[#131314] p-5 rounded-[8px] border border-[#2A2A30] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={currentAgent.avatar}
            alt={currentAgent.name}
            className="w-14 h-14 rounded-[8px] object-cover border-2 border-[#FFD700]/50"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white leading-tight">{currentAgent.name}</h2>
              <span className="bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border border-[#FFD700]/30">
                {currentAgent.tier.toUpperCase()} AGENT ({currentAgent.commissionRate * 100}% CUT)
              </span>
            </div>
            <div className="text-xs text-[#9CA3AF] flex items-center space-x-2 mt-0.5">
              <span>Agent ID: <strong className="text-white font-mono">{currentAgent.code}</strong></span>
              <span>&bull;</span>
              <span className="text-[#10B981] font-semibold">Active Credit Line</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-agent-topup-modal"
            onClick={() => {
              setSelectedPlayerForTopUp(assignedPlayers[0]?.id || '');
              setShowTopUpModal(true);
            }}
            className="px-4 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[8px] transition-colors flex items-center space-x-1.5 redline-glow cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Credit Top-Up for Player</span>
          </button>

          <button
            onClick={handleCopyReferral}
            className="px-3 py-2.5 bg-[#1E1E24] hover:bg-[#26262B] text-[#D1D5DB] text-xs font-semibold rounded-[8px] transition-colors flex items-center space-x-1.5 cursor-pointer border border-[#2A2A30]"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Referral Link</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commission Balance */}
        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Unclaimed Commissions</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-[#FFD700]">
              {currentAgent.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#FFD700] font-bold">PTS</span>
          </div>
          <div className="text-[10px] text-[#10B981] flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>60% split of all winning vig</span>
          </div>
        </div>

        {/* Lifetime Commissions */}
        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Lifetime Commissions</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-white">
              {(currentAgent.lifetimeCommissions + totalCommissionEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#9CA3AF] font-bold">PTS</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]">
            Accumulated from player wins
          </div>
        </div>

        {/* Assigned Bettors */}
        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Assigned Bettors</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-white">{currentAgent.activePlayersCount}</span>
            <span className="text-xs text-[#9CA3AF]">Players</span>
          </div>
          <div className="text-[10px] text-[#10B981]">
            100% verified & active
          </div>
        </div>

        {/* Total Player Volume */}
        <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] space-y-1">
          <div className="text-[11px] text-[#9CA3AF] uppercase font-bold tracking-wider">Total Player Volume</div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-extrabold text-white">
              {currentAgent.totalPlayerVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#9CA3AF] font-bold">PTS</span>
          </div>
          <div className="text-[10px] text-[#9CA3AF]">
            P2P Open Bet Stakes
          </div>
        </div>
      </div>

      {/* Agent Nav Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#232328] pb-1">
        <button
          id="agent-tab-commissions"
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all ${
            activeTab === 'commissions'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Commission Reports (60% Vig Breakdown)
        </button>
        <button
          id="agent-tab-players"
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all ${
            activeTab === 'players'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Assigned Players & Cashier ({assignedPlayers.length})
        </button>
        <button
          id="agent-tab-onboarding"
          onClick={() => setActiveTab('onboarding')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all ${
            activeTab === 'onboarding'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          Tier Progression & Onboarding
        </button>
      </div>

      {/* TAB 1: Commission Reports */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-[#131314] p-4 rounded-[8px] border border-[#232328] flex items-center justify-between">
            <div className="text-xs text-[#9CA3AF]">
              <span className="text-white font-bold block mb-0.5">Vig Money Model Formula:</span>
              <span>Winner Gross Profit &times; 10% Platform Vig &times; 60% Agent Split = Direct Commission</span>
            </div>
            <span className="bg-[#0E0E0F] text-[#FFD700] text-xs font-mono font-bold px-3 py-1.5 rounded-[6px] border border-[#FFD700]/30">
              Gold Tier Rate: 60.00%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
              <thead className="bg-[#18181C] text-[#9CA3AF] uppercase text-[10px] font-semibold border-b border-[#232328]">
                <tr>
                  <th className="px-4 py-3">Event / Transaction</th>
                  <th className="px-4 py-3">Winner Player</th>
                  <th className="px-4 py-3">10% Platform Vig</th>
                  <th className="px-4 py-3">Your Commission (60%)</th>
                  <th className="px-4 py-3">Admin Split (40%)</th>
                  <th className="px-4 py-3">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F24]">
                {agentCommissions.map(tx => {
                  const vigBase = tx.amount / 0.60;
                  const adminSplit = vigBase * 0.40;

                  return (
                    <tr key={tx.id} className="hover:bg-[#161618] transition-colors">
                      <td className="px-4 py-3 max-w-sm">
                        <div className="text-white font-medium">{tx.description}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">TX #{tx.id}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#D1D5DB]">
                        Alex Mercer
                      </td>
                      <td className="px-4 py-3 font-mono text-[#EF4444]">
                        {vigBase.toFixed(2)} PTS
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-[#FFD700]">
                        +{tx.amount.toFixed(2)} PTS
                      </td>
                      <td className="px-4 py-3 font-mono text-[#9CA3AF]">
                        {adminSplit.toFixed(2)} PTS
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Assigned Players */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#131314] p-3 rounded-[8px] border border-[#232328]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search players by name or email..."
                value={playerSearchQuery}
                onChange={e => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF0000]"
              />
            </div>
            <span className="text-xs text-[#9CA3AF]">
              Managing <strong className="text-white">{assignedPlayers.length}</strong> active bettor accounts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedPlayers.map(player => (
              <div
                key={player.id}
                className="bg-[#131314] border border-[#232328] rounded-[8px] p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-[8px] object-cover border border-[#333]"
                    />
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">{player.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">@{player.username}</div>
                    </div>
                  </div>

                  <div className="bg-[#0E0E0F] p-2.5 rounded-[6px] text-xs space-y-1">
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>Available Balance:</span>
                      <span className="font-mono font-bold text-white">{player.balance.toFixed(2)} PTS</span>
                    </div>
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>In-Play Escrow:</span>
                      <span className="font-mono text-[#D1D5DB]">{player.inPlayBalance.toFixed(2)} PTS</span>
                    </div>
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>KYC Tier:</span>
                      <span className="text-[#10B981] font-semibold">Tier {player.kycTier} Verified</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlayerForTopUp(player.id);
                    setShowTopUpModal(true);
                  }}
                  className="w-full py-2 bg-[#1E1E24] hover:bg-[#FF0000] hover:text-white text-[#D1D5DB] text-xs font-semibold rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer Credits (Top-Up)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Onboarding & Progression */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">WeBet Master Agent Tier System</h3>
              <p className="text-xs text-[#9CA3AF]">
                Higher volume unlocks increased vig commission splits from platform earnings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0E0E0F] rounded-[8px] border border-[#232328] space-y-1">
                <div className="text-xs font-bold text-[#CD7F32]">Bronze Agent</div>
                <div className="text-xl font-mono font-bold text-white">50% Vig</div>
                <div className="text-[10px] text-[#6B7280]">0 - 25,000 PTS Volume</div>
              </div>

              <div className="p-4 bg-[#0E0E0F] rounded-[8px] border border-[#232328] space-y-1">
                <div className="text-xs font-bold text-[#C0C0C0]">Silver Agent</div>
                <div className="text-xl font-mono font-bold text-white">55% Vig</div>
                <div className="text-[10px] text-[#6B7280]">25,000 - 100,000 PTS</div>
              </div>

              <div className="p-4 bg-[#1C1818] rounded-[8px] border border-[#FFD700] redline-glow space-y-1 relative">
                <span className="absolute top-2 right-2 bg-[#FFD700] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px]">
                  CURRENT
                </span>
                <div className="text-xs font-bold text-[#FFD700]">Gold Agent</div>
                <div className="text-xl font-mono font-bold text-white">60% Vig</div>
                <div className="text-[10px] text-[#9CA3AF]">100,000 - 500,000 PTS</div>
              </div>

              <div className="p-4 bg-[#0E0E0F] rounded-[8px] border border-[#232328] space-y-1">
                <div className="text-xs font-bold text-[#A855F7]">Platinum Master</div>
                <div className="text-xl font-mono font-bold text-white">65% Vig</div>
                <div className="text-[10px] text-[#6B7280]">500,000+ PTS Volume</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131314] border border-[#26262B] rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Direct Agent Credit Top-Up</h3>
            <p className="text-xs text-[#9CA3AF]">
              Transfer points from your available agent balance ({currentAgent.balance.toFixed(2)} PTS) directly to a player.
            </p>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                  Select Player
                </label>
                <select
                  value={selectedPlayerForTopUp}
                  onChange={e => setSelectedPlayerForTopUp(e.target.value)}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000]"
                >
                  {assignedPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.balance.toFixed(2)} PTS)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[#9CA3AF] mb-1">
                  Top-Up Amount (PTS)
                </label>
                <input
                  type="number"
                  min="10"
                  max={currentAgent.balance}
                  step="10"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(Number(e.target.value))}
                  className="w-full bg-[#0E0E0F] border border-[#2A2A30] rounded-[8px] px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#1E1E24] text-xs font-semibold text-[#9CA3AF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topUpAmount > currentAgent.balance || topUpAmount <= 0}
                  className="flex-1 py-2.5 rounded-[8px] bg-[#FF0000] hover:bg-[#CC0000] text-xs font-bold text-white"
                >
                  Transfer {topUpAmount} PTS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
