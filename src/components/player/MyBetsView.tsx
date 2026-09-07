import React, { useState } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { OpenBet } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react';

export const MyBetsView: React.FC = () => {
  const { openBets, matches, currentUser, cancelOpenBet, platformVigPercent } = useWeBet();
  const [activeTab, setActiveTab] = useState<'open' | 'matched' | 'settled'>('open');

  // Filter user's bets
  const userOpenBets = openBets.filter(
    b => b.makerId === currentUser.id && b.status === 'open'
  );

  const userMatchedBets = openBets.filter(
    b => (b.makerId === currentUser.id || b.takerId === currentUser.id) && b.status === 'matched'
  );

  const userSettledBets = openBets.filter(
    b => (b.makerId === currentUser.id || b.takerId === currentUser.id) &&
         (b.status === 'won' || b.status === 'lost' || b.status === 'cancelled' || b.status === 'refunded')
  );

  // Lifetime Stats
  const wonBets = userSettledBets.filter(b => b.status === 'won');
  const totalNetWon = wonBets.reduce((sum, b) => sum + (b.netWin || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">My Peer-to-Peer Bets</h2>
          <p className="text-xs text-[#9CA3AF]">
            Track your open cards, matched in-play fixtures, and settled winnings with {platformVigPercent}% vig breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#0E0E0F] px-3.5 py-2 rounded-[8px] border border-[#26262B]">
            <span className="text-[10px] uppercase font-bold text-[#6B7280]">Active In-Play Escrow</span>
            <div className="font-mono font-bold text-white text-sm">
              {currentUser.inPlayBalance.toFixed(2)} PTS
            </div>
          </div>
          <div className="bg-[#0E0E0F] px-3.5 py-2 rounded-[8px] border border-[#26262B]">
            <span className="text-[10px] uppercase font-bold text-[#10B981]">Total Net Profit</span>
            <div className="font-mono font-bold text-[#10B981] text-sm">
              +{totalNetWon.toFixed(2)} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#232328] pb-1">
        <button
          id="tab-open-bets"
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'open'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Open in Lobby ({userOpenBets.length})</span>
        </button>

        <button
          id="tab-matched-bets"
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'matched'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Matched & In-Play ({userMatchedBets.length})</span>
        </button>

        <button
          id="tab-settled-bets"
          onClick={() => setActiveTab('settled')}
          className={`px-4 py-2 rounded-[6px] text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'settled'
              ? 'bg-[#FF0000] text-white shadow-md'
              : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border border-[#232328]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Settled History ({userSettledBets.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'open' && (
        <div className="space-y-4">
          {userOpenBets.length === 0 ? (
            <div className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center text-[#9CA3AF] text-xs space-y-2">
              <Clock className="w-8 h-8 text-[#6B7280] mx-auto" />
              <p className="font-semibold text-white">No active open bet cards</p>
              <p>When you post a 100:100 Open Bet Card, it will appear here until an opponent accepts it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userOpenBets.map(bet => {
                const match = matches.find(m => m.id === bet.matchId);
                if (!match) return null;
                const backedTeam = match.homeTeam.id === bet.selectedTeamId ? match.homeTeam : match.awayTeam;

                return (
                  <div
                    key={bet.id}
                    className="bg-[#131314] border border-[#26262B] rounded-[8px] p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#9CA3AF]">{match.league}</span>
                        <span className="bg-[#0E0E0F] text-[#FFD700] text-[11px] font-mono px-2 py-0.5 rounded-[4px] border border-[#FFD700]/20">
                          {bet.ratio}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{backedTeam.logo}</span>
                        <div>
                          <div className="text-sm font-bold text-white">Backing {backedTeam.name}</div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            vs {match.homeTeam.id === bet.selectedTeamId ? match.awayTeam.name : match.homeTeam.name}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0E0E0F] p-2.5 rounded-[6px] text-xs space-y-1">
                        <div className="flex justify-between text-[#9CA3AF]">
                          <span>Your Escrow Stake:</span>
                          <span className="font-mono font-bold text-white">{bet.makerRisk.toFixed(2)} PTS</span>
                        </div>
                        <div className="flex justify-between text-[#9CA3AF]">
                          <span>Gross Win:</span>
                          <span className="font-mono text-[#9CA3AF]">+{bet.makerWin.toFixed(2)} PTS</span>
                        </div>
                        <div className="flex justify-between text-[#10B981] font-bold">
                          <span>Est. Net Win (after {bet.vigPercent}% Fee):</span>
                          <span className="font-mono">+{(bet.makerWin * (1 - bet.vigPercent / 100)).toFixed(2)} PTS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                      <span className="text-[11px] text-[#F59E0B] flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                        <span>Listed in P2P Lobby</span>
                      </span>

                      <button
                        id={`btn-cancel-bet-${bet.id}`}
                        onClick={() => cancelOpenBet(bet.id)}
                        className="bg-[#26262B] hover:bg-[#EF4444] hover:text-white text-[#9CA3AF] text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel & Refund Stake</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'matched' && (
        <div className="space-y-4">
          {userMatchedBets.length === 0 ? (
            <div className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center text-[#9CA3AF] text-xs space-y-2">
              <Flame className="w-8 h-8 text-[#6B7280] mx-auto" />
              <p className="font-semibold text-white">No active matched bets</p>
              <p>Accept an Open Bet in the lobby or wait for someone to accept yours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMatchedBets.map(bet => {
                const match = matches.find(m => m.id === bet.matchId);
                if (!match) return null;

                const isMaker = bet.makerId === currentUser.id;
                const mySideTeamId = isMaker ? bet.selectedTeamId : bet.opposingTeamId;
                const opponentSideTeamId = isMaker ? bet.opposingTeamId : bet.selectedTeamId;

                const myTeam = match.homeTeam.id === mySideTeamId ? match.homeTeam : match.awayTeam;
                const opponentTeam = match.homeTeam.id === opponentSideTeamId ? match.homeTeam : match.awayTeam;

                const myRisk = isMaker ? bet.makerRisk : bet.takerRisk;
                const myGrossWin = isMaker ? bet.makerWin : bet.takerWin;
                const myNetWin = Number((myGrossWin * (1 - bet.vigPercent / 100)).toFixed(2));
                const opponentName = isMaker ? bet.takerName : bet.makerName;

                return (
                  <div
                    key={bet.id}
                    className="bg-[#131314] border border-[#FF0000]/40 rounded-[8px] p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF0000]" />

                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#9CA3AF]">{match.league}</span>
                        {match.winnerApprovalStatus === 'pending_admin_approval' ? (
                          <span className="flex items-center text-[#F59E0B] text-[10px] font-bold bg-[#F59E0B]/15 px-2 py-0.5 rounded-[4px] border border-[#F59E0B]/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1" />
                            CONCLUDED &bull; AWAITING ADMIN APPROVAL
                          </span>
                        ) : match.status === 'live' ? (
                          <span className="flex items-center text-[#FF0000] text-[10px] font-bold bg-[#FF0000]/10 px-2 py-0.5 rounded-[4px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping mr-1" />
                            LIVE IN-PLAY ({match.currentPeriod})
                          </span>
                        ) : (
                          <span className="text-[#D1D5DB] text-[10px] bg-[#1F1F24] px-2 py-0.5 rounded-[4px]">
                            Matched &bull; Starts {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Head to Head */}
                      <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#232328] mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{myTeam.logo}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{myTeam.name}</div>
                            <div className="text-[10px] text-[#10B981] font-semibold">YOU (Risk: {myRisk} PTS)</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold text-[#FFD700] px-1.5 py-0.5 bg-[#18181C] rounded-[4px]">
                          VS
                        </span>

                        <div className="flex items-center space-x-2 text-right">
                          <div>
                            <div className="text-xs font-bold text-[#9CA3AF]">{opponentTeam.name}</div>
                            <div className="text-[10px] text-[#EF4444] font-semibold">{opponentName}</div>
                          </div>
                          <span className="text-xl">{opponentTeam.logo}</span>
                        </div>
                      </div>

                      <div className="bg-[#18181C] p-2.5 rounded-[6px] text-xs space-y-1">
                        <div className="flex justify-between text-[#9CA3AF]">
                          <span>Your Escrow Locked:</span>
                          <span className="font-mono font-bold text-white">{myRisk.toFixed(2)} PTS</span>
                        </div>
                        <div className="flex justify-between text-[#9CA3AF]">
                          <span>Gross Potential:</span>
                          <span className="font-mono text-[#9CA3AF]">+{myGrossWin.toFixed(2)} PTS</span>
                        </div>
                        <div className="flex justify-between text-[#10B981] font-bold pt-1 border-t border-[#26262B]">
                          <span>Net Win Credit ({bet.vigPercent}% Fee):</span>
                          <span className="font-mono">+{myNetWin.toFixed(2)} PTS</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#6B7280] italic text-center">
                      {match.winnerApprovalStatus === 'pending_admin_approval'
                        ? '🔒 Whistle blown: Result is being audited by Admin. Payouts remain safely held in escrow until official approval.'
                        : 'Funds will be settled to winner once match results are officially approved.'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settled' && (
        <div className="space-y-3">
          {userSettledBets.length === 0 ? (
            <div className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center text-[#9CA3AF] text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
              <p className="font-semibold text-white">No settled bets yet</p>
              <p>Completed matches and payouts will be archived here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-[#131314] border border-[#232328] rounded-[8px] overflow-hidden">
                <thead className="bg-[#18181C] text-[#9CA3AF] uppercase text-[10px] font-semibold border-b border-[#232328]">
                  <tr>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Match / Opponent</th>
                    <th className="px-4 py-3">Your Stake</th>
                    <th className="px-4 py-3">Gross Win</th>
                    <th className="px-4 py-3">10% Vig Fee</th>
                    <th className="px-4 py-3">Net Profit</th>
                    <th className="px-4 py-3">Settled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {userSettledBets.map(bet => {
                    const isWon = bet.status === 'won';
                    const isMaker = bet.makerId === currentUser.id;
                    const myStake = isMaker ? bet.makerRisk : bet.takerRisk;
                    const opponentName = isMaker ? (bet.takerName || 'Opponent') : bet.makerName;

                    return (
                      <tr key={bet.id} className="hover:bg-[#161618] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWon ? (
                            <span className="bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-[4px] border border-[#10B981]/30">
                              WON &bull; PAID
                            </span>
                          ) : bet.status === 'lost' ? (
                            <span className="bg-[#EF4444]/20 text-[#EF4444] font-bold px-2 py-0.5 rounded-[4px] border border-[#EF4444]/30">
                              LOST
                            </span>
                          ) : (
                            <span className="bg-[#2A2A30] text-[#9CA3AF] font-bold px-2 py-0.5 rounded-[4px]">
                              CANCELLED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{bet.ratio} OBC</div>
                          <div className="text-[10px] text-[#9CA3AF]">vs {opponentName}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-white">
                          {myStake.toFixed(2)} PTS
                        </td>
                        <td className="px-4 py-3 font-mono text-[#9CA3AF]">
                          {isWon ? `+${(bet.grossWin || 0).toFixed(2)} PTS` : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#EF4444]">
                          {isWon && bet.vigAmount ? `-${bet.vigAmount.toFixed(2)} PTS` : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                          {isWon ? (
                            <span className="text-[#10B981]">+{bet.netWin?.toFixed(2)} PTS</span>
                          ) : bet.status === 'lost' ? (
                            <span className="text-[#EF4444]">-{myStake.toFixed(2)} PTS</span>
                          ) : (
                            <span className="text-[#9CA3AF]">0.00 PTS (Refunded)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280] font-mono text-[11px] whitespace-nowrap">
                          {bet.settledAt ? new Date(bet.settledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Cancelled'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
