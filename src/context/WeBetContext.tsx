import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserRole,
  Match,
  OpenBet,
  UserProfile,
  AgentProfile,
  Transaction,
  CashierRequest,
  KYCSubmission,
  PlatformStats,
  AdminNotification,
  MatchResultReport,
  MatchWinnerApprovalStatus,
  Raffle,
  RaffleTicket,
  RaffleFulfillmentStatus
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_AGENTS,
  INITIAL_MATCHES,
  INITIAL_OPEN_BETS,
  INITIAL_TRANSACTIONS,
  INITIAL_CASHIER_REQUESTS,
  INITIAL_KYC_SUBMISSIONS,
  ALL_INITIAL_MATCHES,
  generateWeekAheadMatches,
  INITIAL_ADMIN_NOTIFICATIONS,
  INITIAL_RAFFLES,
  INITIAL_RAFFLE_TICKETS
} from '../data/mockData';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'bet_won' | 'commission';
  timestamp: string;
}

interface WeBetContextType {
  // Roles & Auth
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  currentAgent: AgentProfile;
  setCurrentAgent: (agent: AgentProfile) => void;
  allUsers: UserProfile[];
  allAgents: AgentProfile[];

  // Data
  matches: Match[];
  openBets: OpenBet[];
  transactions: Transaction[];
  cashierRequests: CashierRequest[];
  kycSubmissions: KYCSubmission[];
  platformStats: PlatformStats;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  addToast: (title: string, message: string, type?: ToastNotification['type']) => void;

  // Admin Notifications & Winner Approvals
  adminNotifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  trackMatchResult: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    period?: string,
    source?: string,
    notes?: string,
    customWinnerId?: string
  ) => { success: boolean; message: string };
  approveMatchWinner: (
    matchId: string,
    verifiedWinnerId?: string,
    verifiedHomeScore?: number,
    verifiedAwayScore?: number,
    adminNotes?: string
  ) => { success: boolean; settledCount: number };
  rejectMatchResult: (matchId: string, reason: string) => void;
  simulateTrackResult: (matchId?: string) => void;

  // Actions - P2P Betting
  createOpenBet: (matchId: string, teamId: string, riskAmount: number, ratio?: string) => { success: boolean; message: string };
  acceptOpenBet: (betId: string) => { success: boolean; message: string };
  cancelOpenBet: (betId: string) => { success: boolean; message: string };

  // Actions - Match Engine & Admin
  updateMatchStatus: (matchId: string, status: Match['status'], homeScore?: number, awayScore?: number) => void;
  updateMatchScores: (matchId: string, homeScore: number, awayScore: number, currentPeriod?: string) => void;
  batchSetMatches: (matches: Match[]) => void;
  settleMatch: (matchId: string, winnerTeamId: string, homeScore: number, awayScore: number) => { settledCount: number };
  createCustomMatch: (newMatch: Omit<Match, 'id'>) => void;
  approveSuggestedMatch: (matchId: string) => { success: boolean; message: string };
  rejectSuggestedMatch: (matchId: string, reason?: string) => { success: boolean; message: string };
  approveAllPendingMatches: () => { approvedCount: number; expiredCount: number };
  autoGenerateWeekSchedule: () => void;
  simulateAutoCloseThreshold: (matchId?: string) => void;
  isMatchLocked: (match: Match) => boolean;
  getMatchCountdown: (match: Match) => { isLocked: boolean; isStartingSoon: boolean; isImminent: boolean; secondsLeft: number; formatted: string };
  simulateMatchKickoff: (matchId: string, secondsInFuture?: number) => void;

  // Actions - Cashier & Wallet
  requestDeposit: (amount: number, method: string, details?: string) => { success: boolean; message: string };
  requestWithdrawal: (amount: number, method: string, details?: string) => { success: boolean; message: string };
  processCashierRequest: (requestId: string, action: 'approve' | 'reject', notes?: string) => void;
  agentTopUpPlayer: (playerId: string, amount: number) => { success: boolean; message: string };

  // Actions - KYC & Responsible Gaming
  submitKYC: (fullName: string, dob: string, idType: KYCSubmission['idType'], idNumber: string) => void;
  processKYC: (submissionId: string, action: 'approve' | 'reject') => void;
  updateResponsibleGaming: (settings: { dailyLimit?: number; weeklyLimit?: number; selfExclusionDays?: number; sessionLimit?: number }) => void;

  // Raffles & Prize Draws
  raffles: Raffle[];
  raffleTickets: RaffleTicket[];
  buyRaffleTickets: (raffleId: string, count: number) => { success: boolean; message: string; ticketNumbers?: number[] };
  drawRaffleWinner: (raffleId: string, customWinnerTicketId?: string) => { success: boolean; winnerName: string; prizeTitle: string };
  createRaffle: (newRaffle: Omit<Raffle, 'id' | 'totalTicketsSold' | 'status'> & { id?: string }) => { success: boolean; message: string };
  cancelRaffle: (raffleId: string, reason?: string) => { success: boolean; message: string };
  updateRaffleFulfillment: (raffleId: string, status: RaffleFulfillmentStatus, notes?: string, trackingNumber?: string) => void;

  // Configuration
  platformVigPercent: number;
  setPlatformVigPercent: (val: number) => void;
  agentVigSplit: number; // e.g. 0.60
  setAgentVigSplit: (val: number) => void;
  resetAllData: () => void;
}

const STORAGE_KEY = 'webet_state_v1';

const WeBetContext = createContext<WeBetContextType | undefined>(undefined);

export const WeBetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or defaults
  const [currentRole, setCurrentRole] = useState<UserRole>('player');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [allAgents, setAllAgents] = useState<AgentProfile[]>(INITIAL_AGENTS);
  const [matches, setMatches] = useState<Match[]>(ALL_INITIAL_MATCHES);
  const [openBets, setOpenBets] = useState<OpenBet[]>(INITIAL_OPEN_BETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [cashierRequests, setCashierRequests] = useState<CashierRequest[]>(INITIAL_CASHIER_REQUESTS);
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>(INITIAL_KYC_SUBMISSIONS);
  const [platformVigPercent, setPlatformVigPercent] = useState<number>(10); // 10% vig on winnings
  const [agentVigSplit, setAgentVigSplit] = useState<number>(0.60); // 60%
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(INITIAL_ADMIN_NOTIFICATIONS);
  const [raffles, setRaffles] = useState<Raffle[]>(INITIAL_RAFFLES);
  const [raffleTickets, setRaffleTickets] = useState<RaffleTicket[]>(INITIAL_RAFFLE_TICKETS);

  // Current active profiles
  const [currentUserId, setCurrentUserId] = useState<string>('usr_player_1');
  const [currentAgentId, setCurrentAgentId] = useState<string>('agt_marcus_1');

  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0];
  const currentAgent = allAgents.find(a => a.id === currentAgentId) || allAgents[0];

  // Helper to add in-app toasts
  const addToast = (title: string, message: string, type: ToastNotification['type'] = 'info') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [
      { id, title, message, type, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 4)
    ]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auto-expire toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Derived platform statistics
  const platformStats: PlatformStats = {
    totalTurnover: transactions
      .filter(t => t.type === 'bet_stake')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) + 148500,
    totalVigCollected: transactions
      .filter(t => t.type === 'vig_fee' || t.type === 'agent_commission' || t.type === 'admin_commission')
      .reduce((sum, t) => sum + (t.type === 'vig_fee' ? Math.abs(t.amount) : 0), 0) + 14850,
    adminVigShare: transactions
      .filter(t => t.type === 'admin_commission')
      .reduce((sum, t) => sum + t.amount, 0) + 5940,
    agentVigShare: transactions
      .filter(t => t.type === 'agent_commission')
      .reduce((sum, t) => sum + t.amount, 0) + 8910,
    activeBetsVolume: openBets
      .filter(b => b.status === 'open' || b.status === 'matched')
      .reduce((sum, b) => sum + b.makerRisk + (b.status === 'matched' ? b.takerRisk : 0), 0),
    totalBetsPlaced: openBets.length + 842,
    totalPlayers: allUsers.length + 128,
    totalAgents: allAgents.length + 14,
  };

  // ----------------------------------------------------
  // PRE-GAME COUNTDOWN, LOCKOUT & AUTO-KICKOFF ENGINE
  // ----------------------------------------------------

  const isMatchLocked = (match: Match): boolean => {
    if (!match) return true;
    if (match.approvalStatus && match.approvalStatus !== 'approved') return true;
    if (match.status !== 'upcoming') return true;
    return new Date(match.startTime).getTime() <= Date.now();
  };

  const getMatchCountdown = (match: Match) => {
    if (!match) {
      return { isLocked: true, isStartingSoon: false, isImminent: false, secondsLeft: 0, formatted: '00:00' };
    }
    const startMs = new Date(match.startTime).getTime();
    const diffSec = Math.floor((startMs - Date.now()) / 1000);

    if (match.status !== 'upcoming' || diffSec <= 0) {
      return { isLocked: true, isStartingSoon: false, isImminent: false, secondsLeft: 0, formatted: 'IN PLAY / LOCKED' };
    }

    const isImminent = diffSec <= 300; // <= 5 minutes
    const isStartingSoon = diffSec <= 900; // <= 15 minutes

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else {
      const padM = String(minutes).padStart(2, '0');
      const padS = String(seconds).padStart(2, '0');
      formatted = `${padM}:${padS}`;
    }

    return {
      isLocked: false,
      isStartingSoon,
      isImminent,
      secondsLeft: diffSec,
      formatted,
    };
  };

  const simulateMatchKickoff = (matchId: string, secondsInFuture: number = 0) => {
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;

    if (secondsInFuture <= 0) {
      updateMatchStatus(matchId, 'live', 0, 0);
      addToast(
        '⚡ Match Kickoff Triggered',
        `${targetMatch.homeTeam.name} vs ${targetMatch.awayTeam.name} is now LIVE! Markets locked and unmatched bets refunded.`,
        'warning'
      );
    } else {
      const newStartTime = new Date(Date.now() + secondsInFuture * 1000).toISOString();
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, startTime: newStartTime, status: 'upcoming' } : m))
      );
      addToast(
        '⏰ Kickoff Countdown Set',
        `${targetMatch.homeTeam.name} vs ${targetMatch.awayTeam.name} starts in ${secondsInFuture} seconds!`,
        'info'
      );
    }
  };

  // Automated background milestone alerts, 1-hour auto-close check & auto-start engine
  const alertedMilestonesRef = React.useRef<Record<string, { m15?: boolean; m5?: boolean; m1?: boolean; started?: boolean; autoClosed?: boolean }>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      matches.forEach(match => {
        // Auto-close suggested pending matches if unapproved 1 hour before game starts
        if (match.approvalStatus === 'pending') {
          const startMs = new Date(match.startTime).getTime();
          const msUntilKickoff = startMs - now;
          // 1 hour in ms = 3600000 ms
          if (msUntilKickoff <= 3600000) {
            const matchKey = match.id;
            if (!alertedMilestonesRef.current[matchKey]) {
              alertedMilestonesRef.current[matchKey] = {};
            }
            if (!alertedMilestonesRef.current[matchKey].autoClosed) {
              alertedMilestonesRef.current[matchKey].autoClosed = true;
              setMatches(prev =>
                prev.map(m =>
                  m.id === match.id
                    ? {
                        ...m,
                        approvalStatus: 'auto_closed',
                        rejectionReason: 'Auto-closed: Admin did not approve 1 hour prior to game start.',
                      }
                    : m
                )
              );
              addToast(
                '🔒 Suggested Match Auto-Closed',
                `${match.homeTeam.name} vs ${match.awayTeam.name} unapproved at 1-hour pre-game mark. Auto-closed from betting board.`,
                'warning'
              );
            }
          }
        }

        if (match.status === 'upcoming') {
          const startMs = new Date(match.startTime).getTime();
          const secondsLeft = Math.floor((startMs - now) / 1000);
          const matchKey = match.id;

          if (!alertedMilestonesRef.current[matchKey]) {
            alertedMilestonesRef.current[matchKey] = {};
          }
          const milestones = alertedMilestonesRef.current[matchKey];

          // Milestone: 15 minutes before
          if (secondsLeft <= 900 && secondsLeft > 300 && !milestones.m15) {
            milestones.m15 = true;
            addToast(
              '⏳ Match Starting Soon (15m)',
              `${match.homeTeam.name} vs ${match.awayTeam.name} starts in ~15 minutes!`,
              'info'
            );
          }

          // Milestone: 5 minutes before (Imminent Lockout Warning)
          if (secondsLeft <= 300 && secondsLeft > 60 && !milestones.m5) {
            milestones.m5 = true;
            addToast(
              '⚠️ BETTING CLOSING SOON (5 MINS)',
              `${match.homeTeam.name} vs ${match.awayTeam.name} kicks off in 5 minutes! Unmatched bets will be auto-refunded at kickoff.`,
              'warning'
            );
          }

          // Milestone: 60 seconds before (Urgent Lockout Alert)
          if (secondsLeft <= 60 && secondsLeft > 0 && !milestones.m1) {
            milestones.m1 = true;
            addToast(
              '🚨 FINAL 60 SECONDS TO BET',
              `${match.homeTeam.name} vs ${match.awayTeam.name} is about to begin! Markets lock in 1 minute.`,
              'warning'
            );
          }

          // KICKOFF REACHED: Auto-lock match and go LIVE
          if (secondsLeft <= 0 && !milestones.started) {
            milestones.started = true;
            updateMatchStatus(match.id, 'live', 0, 0);
            addToast(
              '🔒 KICKOFF REACHED — BETTING LOCKED',
              `${match.homeTeam.name} vs ${match.awayTeam.name} is now LIVE. Markets are locked and unmatched open bets have been cancelled & refunded.`,
              'warning'
            );
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matches]);

  // ----------------------------------------------------
  // BETTING ACTIONS
  // ----------------------------------------------------

  // 1. Create an Open Bet Card (Maker)
  const createOpenBet = (
    matchId: string,
    teamId: string,
    riskAmount: number,
    ratio: string = '100:100'
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, message: 'Match not found.' };

    if (isMatchLocked(match)) {
      return { success: false, message: 'Betting is locked! Cannot place bets on matches that have started or are in-play.' };
    }

    if (currentUser.selfExclusionUntil && new Date(currentUser.selfExclusionUntil) > new Date()) {
      return { success: false, message: 'Account is under self-exclusion restriction.' };
    }

    if (currentUser.balance < riskAmount) {
      return { success: false, message: `Insufficient PTS balance (${currentUser.balance.toFixed(2)} PTS available).` };
    }

    if (currentUser.depositLimitDaily && riskAmount > currentUser.depositLimitDaily) {
      return { success: false, message: `Exceeds responsible gaming daily limit of ${currentUser.depositLimitDaily} PTS.` };
    }

    // Calculate win amount based on ratio (e.g. "100:100", "100:90", "100:80", "100:70", "100:60", etc.)
    let ratioMultiplier = 1.0;
    if (ratio && ratio.includes(':')) {
      const parts = ratio.split(':').map(p => Number(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0) {
        ratioMultiplier = parts[1] / parts[0];
      }
    }

    // Maker risks riskAmount to win (riskAmount * ratioMultiplier)
    // Taker risks maker's potential win to win maker's risk
    const winAmount = Number((riskAmount * ratioMultiplier).toFixed(2));
    const takerRisk = winAmount;
    const takerWin = riskAmount;

    const opposingTeamId = match.homeTeam.id === teamId ? match.awayTeam.id : match.homeTeam.id;

    const newBet: OpenBet = {
      id: 'obc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      matchId,
      makerId: currentUser.id,
      makerName: currentUser.name,
      makerRole: 'Player',
      makerAvatar: currentUser.avatar,
      selectedTeamId: teamId,
      opposingTeamId,
      ratio,
      makerRisk: riskAmount,
      makerWin: winAmount,
      takerRisk,
      takerWin,
      vigPercent: platformVigPercent,
      createdAt: new Date().toISOString(),
      status: 'open',
      agentId: currentUser.agentId,
    };

    // Deduct risk amount from user's available balance into inPlay
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            balance: Number((u.balance - riskAmount).toFixed(2)),
            inPlayBalance: Number((u.inPlayBalance + riskAmount).toFixed(2)),
          };
        }
        return u;
      })
    );

    // Record ledger transaction for stake lock
    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'bet_stake',
      amount: -riskAmount,
      balanceAfter: Number((currentUser.balance - riskAmount).toFixed(2)),
      timestamp: new Date().toISOString(),
      description: `Escrow Stake: Open Bet on ${match.homeTeam.id === teamId ? match.homeTeam.name : match.awayTeam.name} (${ratio})`,
      status: 'completed',
      referenceId: newBet.id,
      agentId: currentUser.agentId,
    };

    setOpenBets(prev => [newBet, ...prev]);
    setTransactions(prev => [tx, ...prev]);

    addToast(
      'Open Bet Created!',
      `Risking ${riskAmount.toFixed(2)} PTS to win ${winAmount.toFixed(2)} PTS on ${match.homeTeam.id === teamId ? match.homeTeam.name : match.awayTeam.name}. Waiting for taker.`,
      'info'
    );

    return { success: true, message: 'Open Bet Card posted to P2P lobby!' };
  };

  // 2. Accept an Open Bet (Taker)
  const acceptOpenBet = (betId: string) => {
    const bet = openBets.find(b => b.id === betId);
    if (!bet) return { success: false, message: 'Bet card not found.' };

    if (bet.status !== 'open') {
      return { success: false, message: 'This bet is no longer open.' };
    }

    if (bet.makerId === currentUser.id) {
      return { success: false, message: 'You cannot accept your own open bet.' };
    }

    const match = matches.find(m => m.id === bet.matchId);
    if (!match || isMatchLocked(match)) {
      return { success: false, message: 'Cannot accept bet! The match has already started and market is locked.' };
    }

    if (currentUser.balance < bet.takerRisk) {
      return { success: false, message: `Insufficient PTS balance. You need ${bet.takerRisk.toFixed(2)} PTS to accept.` };
    }

    // Deduct taker's stake into inPlay
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            balance: Number((u.balance - bet.takerRisk).toFixed(2)),
            inPlayBalance: Number((u.inPlayBalance + bet.takerRisk).toFixed(2)),
          };
        }
        return u;
      })
    );

    // Update bet status to matched
    setOpenBets(prev =>
      prev.map(b => {
        if (b.id === betId) {
          return {
            ...b,
            status: 'matched',
            takerId: currentUser.id,
            takerName: currentUser.name,
            matchedAt: new Date().toISOString(),
          };
        }
        return b;
      })
    );

    // Record transaction for taker stake
    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'bet_stake',
      amount: -bet.takerRisk,
      balanceAfter: Number((currentUser.balance - bet.takerRisk).toFixed(2)),
      timestamp: new Date().toISOString(),
      description: `P2P Bet Accepted: Backing opposing side on ${match.league} (Risk: ${bet.takerRisk} PTS)`,
      status: 'completed',
      referenceId: bet.id,
      agentId: currentUser.agentId,
    };

    setTransactions(prev => [tx, ...prev]);

    addToast(
      'Bet Matched!',
      `You accepted ${bet.makerName}'s bet. You risked ${bet.takerRisk.toFixed(2)} PTS to win ${bet.takerWin.toFixed(2)} PTS.`,
      'success'
    );

    return { success: true, message: 'Bet matched successfully!' };
  };

  // 3. Cancel Open Bet (Maker)
  const cancelOpenBet = (betId: string) => {
    const bet = openBets.find(b => b.id === betId);
    if (!bet) return { success: false, message: 'Bet not found.' };

    if (bet.status !== 'open') {
      return { success: false, message: 'Only open bets can be cancelled.' };
    }

    // Refund maker
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === bet.makerId) {
          return {
            ...u,
            balance: Number((u.balance + bet.makerRisk).toFixed(2)),
            inPlayBalance: Number(Math.max(0, u.inPlayBalance - bet.makerRisk).toFixed(2)),
          };
        }
        return u;
      })
    );

    setOpenBets(prev =>
      prev.map(b => (b.id === betId ? { ...b, status: 'cancelled' } : b))
    );

    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: bet.makerId,
      userName: bet.makerName,
      type: 'bet_refund',
      amount: bet.makerRisk,
      balanceAfter: Number((currentUser.balance + bet.makerRisk).toFixed(2)),
      timestamp: new Date().toISOString(),
      description: `Open Bet Cancelled: Refund of ${bet.makerRisk.toFixed(2)} PTS`,
      status: 'completed',
      referenceId: bet.id,
    };

    setTransactions(prev => [tx, ...prev]);

    addToast('Bet Cancelled', `Refunded ${bet.makerRisk.toFixed(2)} PTS to your wallet.`, 'info');

    return { success: true, message: 'Open bet cancelled and stake refunded.' };
  };

  // ----------------------------------------------------
  // MATCH LIFECYCLE & SETTLEMENT ENGINE
  // ----------------------------------------------------

  // 4. Update match status (e.g. going LIVE)
  const updateMatchStatus = (
    matchId: string,
    status: Match['status'],
    homeScore?: number,
    awayScore?: number
  ) => {
    setMatches(prev =>
      prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status,
            homeScore: homeScore !== undefined ? homeScore : m.homeScore,
            awayScore: awayScore !== undefined ? awayScore : m.awayScore,
          };
        }
        return m;
      })
    );

    // CRITICAL BUSINESS RULE:
    // "All Open Bets must be automatically closed/cancelled once the match starts."
    if (status === 'live') {
      const openBetsToCancel = openBets.filter(b => b.matchId === matchId && b.status === 'open');
      if (openBetsToCancel.length > 0) {
        // Refund all makers
        setAllUsers(prevUsers => {
          return prevUsers.map(user => {
            const userCancelledBets = openBetsToCancel.filter(b => b.makerId === user.id);
            const totalRefund = userCancelledBets.reduce((s, b) => s + b.makerRisk, 0);
            if (totalRefund > 0) {
              return {
                ...user,
                balance: Number((user.balance + totalRefund).toFixed(2)),
                inPlayBalance: Number(Math.max(0, user.inPlayBalance - totalRefund).toFixed(2)),
              };
            }
            return user;
          });
        });

        // Mark them as cancelled
        setOpenBets(prev =>
          prev.map(b => {
            if (b.matchId === matchId && b.status === 'open') {
              return { ...b, status: 'cancelled' };
            }
            return b;
          })
        );

        addToast(
          'Match Went Live',
          `Auto-closed ${openBetsToCancel.length} unmatched Open Bet Card(s). All stakes refunded.`,
          'warning'
        );
      }
    }
  };

  const updateMatchScores = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    currentPeriod?: string
  ) => {
    setMatches(prev =>
      prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            homeScore,
            awayScore,
            currentPeriod: currentPeriod !== undefined ? currentPeriod : m.currentPeriod,
          };
        }
        return m;
      })
    );
  };

  const batchSetMatches = (newMatches: Match[]) => {
    setMatches(newMatches);
  };

  // 5. Settle Match (Admin finishes match and resolves winning team)
  const settleMatch = (
    matchId: string,
    winnerTeamId: string,
    homeScore: number,
    awayScore: number
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { settledCount: 0 };

    // Update match to completed
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              status: 'completed',
              winnerId: winnerTeamId,
              homeScore,
              awayScore,
              winnerApprovalStatus: 'approved',
              adminApprovedAt: m.adminApprovedAt || new Date().toISOString(),
              adminApprovedBy: m.adminApprovedBy || 'Admin',
            }
          : m
      )
    );

    // Dismiss any pending admin notifications for this match
    setAdminNotifications(prev =>
      prev.map(n => n.matchId === matchId ? { ...n, isRead: true } : n)
    );

    // Find all matched bets on this match
    const matchedBets = openBets.filter(b => b.matchId === matchId && b.status === 'matched');

    const newTransactions: Transaction[] = [];
    const updatedUserBalances: Record<string, { balanceAdd: number; inPlaySub: number }> = {};
    const updatedAgentCommissions: Record<string, number> = {};

    const updatedBets = openBets.map(bet => {
      if (bet.matchId !== matchId || bet.status !== 'matched') return bet;

      const isMakerWinner = bet.selectedTeamId === winnerTeamId;
      const winnerUserId = isMakerWinner ? bet.makerId : bet.takerId!;
      const winnerName = isMakerWinner ? bet.makerName : bet.takerName!;
      const loserUserId = isMakerWinner ? bet.takerId! : bet.makerId;

      // Money Model calculation:
      // Winner gross winnings
      const grossWin = isMakerWinner ? bet.makerWin : bet.takerWin;
      const stakeReturned = isMakerWinner ? bet.makerRisk : bet.takerRisk;
      const loserStakeLost = isMakerWinner ? bet.takerRisk : bet.makerRisk;

      // Vig calculation: 10% on winnings only
      const vigAmount = Number((grossWin * (platformVigPercent / 100)).toFixed(2));
      const netWin = Number((grossWin - vigAmount).toFixed(2));
      const totalPayout = Number((stakeReturned + netWin).toFixed(2));

      // Fee split:
      // 60% of Vig to Agent, 40% of Vig to Admin
      const agentCut = Number((vigAmount * agentVigSplit).toFixed(2));
      const adminCut = Number((vigAmount * (1 - agentVigSplit)).toFixed(2));

      // Identify winner's agent
      const winnerUserObj = allUsers.find(u => u.id === winnerUserId);
      const agentId = winnerUserObj?.agentId || 'agt_marcus_1';

      // Record for Winner User:
      if (!updatedUserBalances[winnerUserId]) {
        updatedUserBalances[winnerUserId] = { balanceAdd: 0, inPlaySub: 0 };
      }
      updatedUserBalances[winnerUserId].balanceAdd += totalPayout;
      updatedUserBalances[winnerUserId].inPlaySub += stakeReturned;

      // Record for Loser User (reduce inPlay stake, 0 returned):
      if (!updatedUserBalances[loserUserId]) {
        updatedUserBalances[loserUserId] = { balanceAdd: 0, inPlaySub: 0 };
      }
      updatedUserBalances[loserUserId].inPlaySub += loserStakeLost;

      // Record for Agent:
      if (!updatedAgentCommissions[agentId]) {
        updatedAgentCommissions[agentId] = 0;
      }
      updatedAgentCommissions[agentId] += agentCut;

      // Create Ledger Entries:
      // 1. Winner payout transaction
      newTransactions.push({
        id: 'tx_win_' + bet.id + '_' + Date.now(),
        userId: winnerUserId,
        userName: winnerName,
        type: 'bet_payout',
        amount: totalPayout,
        balanceAfter: (winnerUserObj?.balance || 0) + totalPayout,
        timestamp: new Date().toISOString(),
        description: `P2P Win: ${match.league} - Gross: ${grossWin} PTS, Fee: -${vigAmount} PTS (${platformVigPercent}%), Net Win: +${netWin} PTS + Stake: ${stakeReturned} PTS`,
        status: 'completed',
        referenceId: bet.id,
        agentId,
      });

      // 2. Vig Fee transaction
      newTransactions.push({
        id: 'tx_vig_' + bet.id + '_' + Date.now(),
        userId: winnerUserId,
        userName: winnerName,
        type: 'vig_fee',
        amount: -vigAmount,
        balanceAfter: (winnerUserObj?.balance || 0) + totalPayout,
        timestamp: new Date().toISOString(),
        description: `${platformVigPercent}% Platform Convenience Fee on ${grossWin} PTS winnings (Split: Agent ${agentCut} PTS / Admin ${adminCut} PTS)`,
        status: 'completed',
        referenceId: bet.id,
        agentId,
      });

      // 3. Agent Commission Credit transaction
      const agentObj = allAgents.find(a => a.id === agentId);
      newTransactions.push({
        id: 'tx_agt_' + bet.id + '_' + Date.now(),
        userId: agentId,
        userName: `${agentObj?.name || 'Agent'} (Agent)`,
        type: 'agent_commission',
        amount: agentCut,
        balanceAfter: (agentObj?.balance || 0) + agentCut,
        timestamp: new Date().toISOString(),
        description: `Agent ${(agentVigSplit * 100).toFixed(0)}% Commission split on ${vigAmount} PTS Fee (Player: ${winnerName})`,
        status: 'completed',
        referenceId: bet.id,
        agentId,
      });

      // 4. Admin Commission transaction
      newTransactions.push({
        id: 'tx_adm_' + bet.id + '_' + Date.now(),
        userId: 'usr_admin_ops',
        userName: 'Admin Treasury',
        type: 'admin_commission',
        amount: adminCut,
        balanceAfter: adminCut,
        timestamp: new Date().toISOString(),
        description: `Admin ${((1 - agentVigSplit) * 100).toFixed(0)}% Fee Retention on ${match.league} (Bet #${bet.id})`,
        status: 'completed',
        referenceId: bet.id,
      });

      return {
        ...bet,
        status: (isMakerWinner && bet.makerId === currentUser.id) || (!isMakerWinner && bet.takerId === currentUser.id) ? 'won' : 'lost',
        settledAt: new Date().toISOString(),
        winnerUserId,
        grossWin,
        vigAmount,
        agentCommission: agentCut,
        adminCommission: adminCut,
        netWin,
        payout: totalPayout,
        agentId,
      };
    });

    // Apply balances to all users
    setAllUsers(prev =>
      prev.map(u => {
        if (updatedUserBalances[u.id]) {
          const { balanceAdd, inPlaySub } = updatedUserBalances[u.id];
          return {
            ...u,
            balance: Number((u.balance + balanceAdd).toFixed(2)),
            inPlayBalance: Number(Math.max(0, u.inPlayBalance - inPlaySub).toFixed(2)),
          };
        }
        return u;
      })
    );

    // Apply commissions to agents
    setAllAgents(prev =>
      prev.map(a => {
        if (updatedAgentCommissions[a.id]) {
          const cut = updatedAgentCommissions[a.id];
          return {
            ...a,
            balance: Number((a.balance + cut).toFixed(2)),
            lifetimeCommissions: Number((a.lifetimeCommissions + cut).toFixed(2)),
          };
        }
        return a;
      })
    );

    setOpenBets(updatedBets);
    setTransactions(prev => [...newTransactions, ...prev]);

    // Trigger confetti if current user won any bet!
    const userWon = matchedBets.some(
      b =>
        (b.makerId === currentUser.id && b.selectedTeamId === winnerTeamId) ||
        (b.takerId === currentUser.id && b.opposingTeamId === winnerTeamId)
    );

    if (userWon) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF0000', '#FFD700', '#FFFFFF', '#131314'],
      });
      addToast(
        '🏆 Bet Won & Paid Out!',
        `Your match completed! Net winnings + stake credited to your wallet with 10% Vig deducted.`,
        'bet_won'
      );
    } else {
      addToast(
        'Match Settled',
        `Settled ${matchedBets.length} P2P bet(s). Vig distributed (60% Agent / 40% Admin).`,
        'info'
      );
    }

    return { settledCount: matchedBets.length };
  };

  // 6. Create custom match (Admin)
  const createCustomMatch = (newMatchData: Omit<Match, 'id'>) => {
    const id = 'match_' + Date.now().toString(36);
    const newMatch: Match = { ...newMatchData, id, approvalStatus: 'approved' };
    setMatches(prev => [newMatch, ...prev]);
    addToast('Match Created', `${newMatch.homeTeam.name} vs ${newMatch.awayTeam.name} is now on the board.`, 'success');
  };

  // 7. Approve suggested match (Admin)
  const approveSuggestedMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, message: 'Match not found.' };

    const msUntilKickoff = new Date(match.startTime).getTime() - Date.now();
    if (msUntilKickoff <= 3600000) {
      // Within 1 hour - auto-closed!
      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? {
                ...m,
                approvalStatus: 'auto_closed',
                rejectionReason: 'Auto-closed: Admin did not approve 1 hour prior to game start.',
              }
            : m
        )
      );
      addToast(
        'Match Cannot Be Approved',
        `Kickoff is within 1 hour. Unapproved matches automatically close 1 hour prior to start.`,
        'warning'
      );
      return { success: false, message: 'Kickoff is within 1 hour. Match has auto-closed.' };
    }

    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              approvalStatus: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin Ops',
            }
          : m
      )
    );

    addToast(
      'Match Approved & Posted',
      `${match.homeTeam.name} vs ${match.awayTeam.name} is now posted for Open Bet Cards!`,
      'success'
    );
    return { success: true, message: 'Match approved and posted for open bets.' };
  };

  // 8. Reject suggested match (Admin)
  const rejectSuggestedMatch = (matchId: string, reason?: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, message: 'Match not found.' };

    const finalReason = reason || 'Declined by Admin Operations';
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              approvalStatus: 'rejected',
              rejectionReason: finalReason,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Admin Ops',
            }
          : m
      )
    );

    addToast(
      'Match Rejected',
      `${match.homeTeam.name} vs ${match.awayTeam.name} was rejected (${finalReason}).`,
      'info'
    );
    return { success: true, message: 'Match rejected.' };
  };

  // 9. Batch approve all eligible pending matches
  const approveAllPendingMatches = () => {
    const now = Date.now();
    let approved = 0;
    let autoClosed = 0;

    setMatches(prev =>
      prev.map(m => {
        if (m.approvalStatus !== 'pending') return m;
        const msUntilKickoff = new Date(m.startTime).getTime() - now;
        if (msUntilKickoff > 3600000) {
          approved++;
          return {
            ...m,
            approvalStatus: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin Ops (Batch)',
          };
        } else {
          autoClosed++;
          return {
            ...m,
            approvalStatus: 'auto_closed',
            rejectionReason: 'Auto-closed: Kickoff within 1 hour.',
          };
        }
      })
    );

    addToast(
      'Batch Approvals Processed',
      `Approved ${approved} match(es) for Open Bet Cards.${autoClosed > 0 ? ` ${autoClosed} expired (< 1h).` : ''}`,
      'success'
    );
    return { approvedCount: approved, expiredCount: autoClosed };
  };

  // 10. Auto-generate 1-week schedule across major sports
  const autoGenerateWeekSchedule = () => {
    const newWeeklyMatches = generateWeekAheadMatches();
    setMatches(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const freshMatches = newWeeklyMatches.filter(n => !existingIds.has(n.id));
      if (freshMatches.length === 0) {
        // Regenerate fresh instances with new timestamps and IDs
        const timestamped = newWeeklyMatches.map(m => ({
          ...m,
          id: m.id + '_' + Date.now().toString(36),
          suggestedAt: new Date().toISOString(),
        }));
        return [...timestamped, ...prev];
      }
      return [...freshMatches, ...prev];
    });

    addToast(
      '📅 1-Week Schedule Synced',
      'Auto-created upcoming fixtures across 10 major sports scheduled 1 week before the game. Awaiting review.',
      'success'
    );
  };

  // 11. Simulation helper for the 1-hour auto-close threshold
  const simulateAutoCloseThreshold = (matchId?: string) => {
    let target = matchId ? matches.find(m => m.id === matchId) : matches.find(m => m.approvalStatus === 'pending');
    if (!target) {
      const newId = 'match_test_thresh_' + Date.now();
      const testMatch: Match = {
        id: newId,
        sport: 'soccer',
        league: 'UEFA Champions League Qualifier',
        homeTeam: { id: 'team_t1', name: 'Real Madrid', shortName: 'RMA', logo: '👑' },
        awayTeam: { id: 'team_t2', name: 'Borussia Dortmund', shortName: 'BVB', logo: '🟡' },
        startTime: new Date(Date.now() + 50 * 60 * 1000).toISOString(), // 50 mins from now (< 1 hour!)
        status: 'upcoming',
        approvalStatus: 'pending',
        venue: 'Santiago Bernabéu, Madrid',
        source: 'auto_schedule',
      };
      setMatches(prev => [testMatch, ...prev]);
      target = testMatch;
    } else {
      setMatches(prev =>
        prev.map(m =>
          m.id === target!.id
            ? {
                ...m,
                startTime: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
                approvalStatus: 'pending',
              }
            : m
        )
      );
    }

    addToast(
      '⏱️ 1-Hour Threshold Test Activated',
      `${target.homeTeam.name} vs ${target.awayTeam.name} kickoff moved to 50 mins from now. The auto-close engine will close it!`,
      'info'
    );
  };

  // ----------------------------------------------------
  // TRACK MATCH RESULTS & STRICT ADMIN WINNER APPROVAL
  // (Strict policy: Track results, send notification, strictly DO NOT auto-post winners)
  // ----------------------------------------------------

  const trackMatchResult = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    period: string = 'Final (Result Tracked)',
    source: string = 'Official Scoreboard Feed',
    notes?: string,
    customWinnerId?: string
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, message: 'Match not found.' };

    // Determine provisional winner
    let provWinnerId: string;
    let provWinnerName: string;

    if (customWinnerId) {
      provWinnerId = customWinnerId;
      provWinnerName = customWinnerId === match.homeTeam.id
        ? match.homeTeam.name
        : customWinnerId === match.awayTeam.id
        ? match.awayTeam.name
        : 'Draw / Tie';
    } else if (homeScore > awayScore) {
      provWinnerId = match.homeTeam.id;
      provWinnerName = match.homeTeam.name;
    } else if (awayScore > homeScore) {
      provWinnerId = match.awayTeam.id;
      provWinnerName = match.awayTeam.name;
    } else {
      provWinnerId = 'draw';
      provWinnerName = 'Draw / Tie';
    }

    const reportTimestamp = new Date().toISOString();
    const resultNote = notes || `Match finished (${homeScore}-${awayScore}). Provisional Winner: ${provWinnerName}. STRICTLY NOT AUTO-POSTED. Pending Admin winner verification & approval.`;

    const resultReport: MatchResultReport = {
      id: `report_${matchId}_${Date.now()}`,
      matchId,
      reportedAt: reportTimestamp,
      source: source as any,
      homeScore,
      awayScore,
      provisionalWinnerId: provWinnerId,
      provisionalWinnerName: provWinnerName,
      period,
      notes: resultNote,
      status: 'pending_admin_approval',
    };

    // Update match state
    // STRICT INTEGRITY RULE:
    // winnerId is NOT set!
    // status is NOT marked completed (remains live/in-review)!
    // Bets are NOT settled!
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              homeScore,
              awayScore,
              currentPeriod: period,
              winnerApprovalStatus: 'pending_admin_approval',
              provisionalWinnerId: provWinnerId,
              provisionalWinnerName: provWinnerName,
              provisionalHomeScore: homeScore,
              provisionalAwayScore: awayScore,
              resultReportedAt: reportTimestamp,
              resultSource: source,
              resultNotes: resultNote,
              latestResultReport: resultReport,
            }
          : m
      )
    );

    // Send Notification to Admin
    const newNotif: AdminNotification = {
      id: `notif_winner_${matchId}_${Date.now()}`,
      type: 'winner_approval',
      title: '⚠️ Match Result Tracked: Winner Approval Required',
      message: `${match.homeTeam.name} (${homeScore}) vs ${match.awayTeam.name} (${awayScore}) concluded. Provisional Winner: ${provWinnerName}. Strictly NOT auto-posted. Admin review & approval required.`,
      matchId,
      timestamp: reportTimestamp,
      isRead: false,
      priority: 'critical',
      actionLabel: 'Review & Approve Winner',
    };

    setAdminNotifications(prev => [newNotif, ...prev]);

    // Dispatch in-app toast notification
    addToast(
      '🔔 Result Tracked: Winner Approval Required',
      `${match.homeTeam.name} vs ${match.awayTeam.name} (${homeScore}-${awayScore}) concluded. Winner (${provWinnerName}) is strictly NOT auto-posted. Action required in Admin Dashboard.`,
      'warning'
    );

    return {
      success: true,
      message: `Match result tracked (${homeScore}-${awayScore}). Provisional winner: ${provWinnerName}. Notification dispatched to Admin. Winner held pending approval.`,
    };
  };

  const approveMatchWinner = (
    matchId: string,
    verifiedWinnerId?: string,
    verifiedHomeScore?: number,
    verifiedAwayScore?: number,
    adminNotes?: string
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, settledCount: 0 };

    const finalWinnerId = verifiedWinnerId || match.provisionalWinnerId || match.homeTeam.id;
    const finalHomeScore = verifiedHomeScore ?? match.provisionalHomeScore ?? match.homeScore ?? 0;
    const finalAwayScore = verifiedAwayScore ?? match.provisionalAwayScore ?? match.awayScore ?? 0;

    const winnerName = finalWinnerId === match.homeTeam.id
      ? match.homeTeam.name
      : finalWinnerId === match.awayTeam.id
      ? match.awayTeam.name
      : 'Draw / Tie';

    // Mark approval status
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              winnerApprovalStatus: 'approved',
              adminApprovedAt: new Date().toISOString(),
              adminApprovedBy: 'Administrator',
              adminNotes: adminNotes || 'Winner verified & approved by Administrator.',
            }
          : m
      )
    );

    // Mark notifications for this match as read
    setAdminNotifications(prev =>
      prev.map(n => n.matchId === matchId ? { ...n, isRead: true } : n)
    );

    // Execute settlement & post winner to players and escrow ledger
    const result = settleMatch(matchId, finalWinnerId, finalHomeScore, finalAwayScore);

    addToast(
      '🏆 Match Winner Approved & Posted',
      `Admin officially approved ${winnerName} as the winner for ${match.homeTeam.name} vs ${match.awayTeam.name}. Result posted and ${result.settledCount} bet(s) settled.`,
      'success'
    );

    return { success: true, settledCount: result.settledCount };
  };

  const rejectMatchResult = (matchId: string, reason: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setMatches(prev =>
      prev.map(m =>
        m.id === matchId
          ? {
              ...m,
              winnerApprovalStatus: 'rejected',
              resultNotes: `Result rejected by Admin: ${reason}`,
              currentPeriod: 'Live (In Review / Disputed)',
            }
          : m
      )
    );

    setAdminNotifications(prev =>
      prev.map(n => n.matchId === matchId ? { ...n, isRead: true } : n)
    );

    addToast(
      'Result Rejected by Admin',
      `Result for ${match.homeTeam.name} vs ${match.awayTeam.name} was rejected: "${reason}". Winner was NOT posted.`,
      'info'
    );
  };

  const simulateTrackResult = (matchId?: string) => {
    let target = matchId ? matches.find(m => m.id === matchId) : undefined;
    if (!target) {
      target = matches.find(m => m.status === 'live' && m.winnerApprovalStatus !== 'pending_admin_approval') ||
               matches.find(m => m.status === 'upcoming');
    }
    if (!target) {
      target = matches[0];
    }
    if (!target) return;

    let simHomeScore = target.homeScore ?? 0;
    let simAwayScore = target.awayScore ?? 0;

    if (target.sport === 'basketball') {
      simHomeScore = simHomeScore > 0 ? simHomeScore : 108;
      simAwayScore = simAwayScore > 0 ? (simAwayScore === simHomeScore ? simAwayScore + 4 : simAwayScore) : 102;
    } else if (target.sport === 'soccer') {
      simHomeScore = simHomeScore > 0 ? simHomeScore : 2;
      simAwayScore = simAwayScore > 0 ? simAwayScore : 1;
      if (simHomeScore === simAwayScore) simHomeScore += 1;
    } else {
      simHomeScore = simHomeScore > 0 ? simHomeScore : 3;
      simAwayScore = simAwayScore > 0 ? simAwayScore : 1;
      if (simHomeScore === simAwayScore) simHomeScore += 1;
    }

    trackMatchResult(
      target.id,
      simHomeScore,
      simAwayScore,
      'Final Whistle (FT)',
      'Official Scoreboard Feed (Final Whistle)',
      'Game reached full time. Final score reported. Winner strictly held pending admin approval.'
    );
  };

  const markNotificationRead = (id: string) => {
    setAdminNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // ----------------------------------------------------
  // CASHIERING & WALLET
  // ----------------------------------------------------

  const requestDeposit = (amount: number, method: string, details?: string) => {
    if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };

    const req: CashierRequest = {
      id: 'cashier_dep_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'deposit',
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
      paymentMethod: method,
      accountDetails: details || 'Agent Marcus Vance (Direct Point Request)',
      agentId: currentUser.agentId,
    };

    setCashierRequests(prev => [req, ...prev]);
    addToast('Deposit Requested', `Request for ${amount.toFixed(2)} PTS submitted to Cashier/Agent.`, 'info');
    return { success: true, message: 'Deposit request submitted for cashier review.' };
  };

  const requestWithdrawal = (amount: number, method: string, details?: string) => {
    if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
    if (amount > currentUser.balance) {
      return { success: false, message: `Insufficient PTS. Available balance is ${currentUser.balance.toFixed(2)} PTS.` };
    }

    // Deduct immediately into pending
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            balance: Number((u.balance - amount).toFixed(2)),
          };
        }
        return u;
      })
    );

    const req: CashierRequest = {
      id: 'cashier_wth_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'withdrawal',
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
      paymentMethod: method,
      accountDetails: details,
      agentId: currentUser.agentId,
    };

    setCashierRequests(prev => [req, ...prev]);
    addToast('Withdrawal Requested', `Withdrawal of ${amount.toFixed(2)} PTS queued for Agent / Admin approval.`, 'info');
    return { success: true, message: 'Withdrawal requested successfully.' };
  };

  const processCashierRequest = (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    const req = cashierRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;

    if (action === 'approve') {
      if (req.type === 'deposit') {
        // Credit player wallet
        setAllUsers(prev =>
          prev.map(u => {
            if (u.id === req.userId) {
              return { ...u, balance: Number((u.balance + req.amount).toFixed(2)) };
            }
            return u;
          })
        );

        setTransactions(prev => [
          {
            id: 'tx_dep_' + Date.now(),
            userId: req.userId,
            userName: req.userName,
            type: 'deposit',
            amount: req.amount,
            balanceAfter: (allUsers.find(u => u.id === req.userId)?.balance || 0) + req.amount,
            timestamp: new Date().toISOString(),
            description: `Cashier Approved Deposit: +${req.amount.toFixed(2)} PTS (${req.paymentMethod})`,
            status: 'completed',
          },
          ...prev,
        ]);
      } else {
        // Withdrawal completed
        setTransactions(prev => [
          {
            id: 'tx_wth_' + Date.now(),
            userId: req.userId,
            userName: req.userName,
            type: 'withdrawal',
            amount: -req.amount,
            balanceAfter: allUsers.find(u => u.id === req.userId)?.balance || 0,
            timestamp: new Date().toISOString(),
            description: `Cashier Approved Withdrawal: -${req.amount.toFixed(2)} PTS (${req.paymentMethod})`,
            status: 'completed',
          },
          ...prev,
        ]);
      }
    } else {
      // Rejection: if it was a withdrawal, refund the balance back
      if (req.type === 'withdrawal') {
        setAllUsers(prev =>
          prev.map(u => {
            if (u.id === req.userId) {
              return { ...u, balance: Number((u.balance + req.amount).toFixed(2)) };
            }
            return u;
          })
        );
      }
    }

    setCashierRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected', notes } : r))
    );

    addToast(
      action === 'approve' ? 'Request Approved' : 'Request Rejected',
      `${req.type.toUpperCase()} of ${req.amount.toFixed(2)} PTS for ${req.userName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      action === 'approve' ? 'success' : 'warning'
    );
  };

  // Agent transfers points to their assigned player
  const agentTopUpPlayer = (playerId: string, amount: number) => {
    if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
    if (currentAgent.balance < amount) {
      return { success: false, message: `Insufficient agent balance (${currentAgent.balance.toFixed(2)} PTS available).` };
    }

    const player = allUsers.find(u => u.id === playerId);
    if (!player) return { success: false, message: 'Player not found.' };

    // Deduct agent balance, credit player balance
    setAllAgents(prev =>
      prev.map(a => (a.id === currentAgent.id ? { ...a, balance: Number((a.balance - amount).toFixed(2)) } : a))
    );

    setAllUsers(prev =>
      prev.map(u => (u.id === playerId ? { ...u, balance: Number((u.balance + amount).toFixed(2)) } : u))
    );

    setTransactions(prev => [
      {
        id: 'tx_agttop_' + Date.now(),
        userId: playerId,
        userName: player.name,
        type: 'agent_topup',
        amount: amount,
        balanceAfter: Number((player.balance + amount).toFixed(2)),
        timestamp: new Date().toISOString(),
        description: `Direct Credit Top-Up by Agent ${currentAgent.name} (${currentAgent.code})`,
        status: 'completed',
        agentId: currentAgent.id,
      },
      ...prev,
    ]);

    addToast('Transfer Successful', `Transferred ${amount.toFixed(2)} PTS to ${player.name}.`, 'success');
    return { success: true, message: `Successfully transferred ${amount.toFixed(2)} PTS to ${player.name}.` };
  };

  // ----------------------------------------------------
  // KYC & RESPONSIBLE GAMING
  // ----------------------------------------------------

  const submitKYC = (
    fullName: string,
    dob: string,
    idType: KYCSubmission['idType'],
    idNumber: string
  ) => {
    const sub: KYCSubmission = {
      id: 'kyc_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      fullName,
      dob,
      idType,
      idNumber,
      livenessVerified: true,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setKycSubmissions(prev => [sub, ...prev]);
    setAllUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, kycStatus: 'pending' } : u))
    );

    addToast('KYC Submitted', 'Your identity details & liveness verification have been submitted.', 'info');
  };

  const processKYC = (submissionId: string, action: 'approve' | 'reject') => {
    const sub = kycSubmissions.find(k => k.id === submissionId);
    if (!sub) return;

    setKycSubmissions(prev =>
      prev.map(k => (k.id === submissionId ? { ...k, status: action === 'approve' ? 'approved' : 'rejected' } : k))
    );

    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === sub.userId) {
          return {
            ...u,
            kycStatus: action === 'approve' ? 'verified' : 'rejected',
            kycTier: action === 'approve' ? 2 : u.kycTier,
          };
        }
        return u;
      })
    );

    addToast(
      'KYC Processed',
      `Verification for ${sub.fullName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      action === 'approve' ? 'success' : 'warning'
    );
  };

  const updateResponsibleGaming = (settings: {
    dailyLimit?: number;
    weeklyLimit?: number;
    selfExclusionDays?: number;
    sessionLimit?: number;
  }) => {
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          let selfExclusionUntil = u.selfExclusionUntil;
          if (settings.selfExclusionDays && settings.selfExclusionDays > 0) {
            const until = new Date();
            until.setDate(until.getDate() + settings.selfExclusionDays);
            selfExclusionUntil = until.toISOString();
          }

          return {
            ...u,
            depositLimitDaily: settings.dailyLimit ?? u.depositLimitDaily,
            depositLimitWeekly: settings.weeklyLimit ?? u.depositLimitWeekly,
            sessionTimeLimitMinutes: settings.sessionLimit ?? u.sessionTimeLimitMinutes,
            selfExclusionUntil,
          };
        }
        return u;
      })
    );

    addToast('Settings Saved', 'Responsible gaming limits updated successfully.', 'success');
  };

  // ----------------------------------------------------
  // WEEKLY PRIZE RAFFLE & DRAW ENGINE
  // ----------------------------------------------------

  const buyRaffleTickets = (raffleId: string, count: number): { success: boolean; message: string; ticketNumbers?: number[] } => {
    if (count <= 0) {
      return { success: false, message: 'Please select at least 1 ticket.' };
    }

    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) {
      return { success: false, message: 'Raffle draw not found.' };
    }

    if (raffle.status !== 'active') {
      return { success: false, message: 'This raffle is no longer accepting ticket purchases.' };
    }

    const totalCost = count * raffle.ticketCost;
    if (currentUser.balance < totalCost) {
      addToast('Insufficient Points', `You need ${totalCost.toLocaleString()} PTS to enter. Your balance: ${currentUser.balance.toLocaleString()} PTS.`, 'warning');
      return { success: false, message: 'Insufficient points balance.' };
    }

    // Check max tickets per user limit if specified
    const userExistingTickets = raffleTickets.filter(t => t.raffleId === raffleId && t.userId === currentUser.id);
    if (raffle.maxTicketsPerUser && userExistingTickets.length + count > raffle.maxTicketsPerUser) {
      const allowed = Math.max(0, raffle.maxTicketsPerUser - userExistingTickets.length);
      return { success: false, message: `Maximum ${raffle.maxTicketsPerUser} entries allowed per player. You currently have ${userExistingTickets.length} and can purchase up to ${allowed} more.` };
    }

    // Deduct user balance
    const newBalance = currentUser.balance - totalCost;
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, balance: newBalance } : u));

    // Determine ticket numbering based on current raffle tickets
    const existingRaffleTickets = raffleTickets.filter(t => t.raffleId === raffleId);
    const startNum = 1000 + existingRaffleTickets.length + 1;
    const nowIso = new Date().toISOString();

    const newTickets: RaffleTicket[] = [];
    const generatedNumbers: number[] = [];

    for (let i = 0; i < count; i++) {
      const tNum = startNum + i;
      generatedNumbers.push(tNum);
      newTickets.push({
        id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
        raffleId: raffle.id,
        ticketNumber: tNum,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        purchasedAt: nowIso,
        ticketCost: raffle.ticketCost,
      });
    }

    // Append to raffle tickets
    setRaffleTickets(prev => [...prev, ...newTickets]);

    // Update raffle tickets count
    setRaffles(prev => prev.map(r => r.id === raffleId ? { ...r, totalTicketsSold: r.totalTicketsSold + count } : r));

    // Record ledger transaction
    const newTx: Transaction = {
      id: `tx_raffle_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      type: 'raffle_entry',
      amount: -totalCost,
      balanceAfter: newBalance,
      timestamp: nowIso,
      description: `Entered ${count}x ticket${count > 1 ? 's' : ''} into "${raffle.title}"`,
      status: 'completed',
      referenceId: raffle.id,
    };
    setTransactions(prev => [newTx, ...prev]);

    // Celebrate with micro-confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // ignore
    }

    addToast(
      'Tickets Confirmed! 🎟️',
      `Acquired ${count}x entries for ${raffle.title} (Ticket #${generatedNumbers[0]}${count > 1 ? ` - #${generatedNumbers[generatedNumbers.length - 1]}` : ''}). Good luck!`,
      'success'
    );

    return { success: true, message: 'Tickets successfully issued!', ticketNumbers: generatedNumbers };
  };

  const drawRaffleWinner = (raffleId: string, customWinnerTicketId?: string): { success: boolean; winnerName: string; prizeTitle: string } => {
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) {
      return { success: false, winnerName: '', prizeTitle: '' };
    }

    const pool = raffleTickets.filter(t => t.raffleId === raffleId);
    if (pool.length === 0) {
      addToast('No Entries in Draw', 'Cannot pick a winner because no tickets have been purchased yet.', 'warning');
      return { success: false, winnerName: '', prizeTitle: raffle.title };
    }

    let winningTicket: RaffleTicket;
    if (customWinnerTicketId) {
      const found = pool.find(t => t.id === customWinnerTicketId);
      winningTicket = found || pool[Math.floor(Math.random() * pool.length)];
    } else {
      const randomIndex = Math.floor(Math.random() * pool.length);
      winningTicket = pool[randomIndex];
    }

    const nowIso = new Date().toISOString();
    const adminAuthorizer = currentUser.role === 'admin' ? `Admin (${currentUser.name})` : 'System Automated Draw';

    setRaffles(prev => prev.map(r => {
      if (r.id === raffleId) {
        return {
          ...r,
          status: 'completed',
          winnerTicketId: winningTicket.id,
          winnerTicketNumber: winningTicket.ticketNumber,
          winnerUserId: winningTicket.userId,
          winnerName: winningTicket.userName,
          winnerAvatar: winningTicket.userAvatar,
          drawnAt: nowIso,
          adminDrawnBy: adminAuthorizer,
          fulfillmentStatus: 'pending_contact',
        };
      }
      return r;
    }));

    // Add admin notification
    const notif: AdminNotification = {
      id: `notif_raffle_${Date.now()}`,
      type: 'raffle',
      title: `🎉 Raffle Winner Drawn: ${raffle.title}`,
      message: `Ticket #${winningTicket.ticketNumber} held by ${winningTicket.userName} has won the "${raffle.title}" (Retail Value: $${raffle.prizeValue}). Contact winner for fulfillment.`,
      raffleId: raffle.id,
      timestamp: nowIso,
      isRead: false,
      priority: 'high',
      actionLabel: 'Manage Prize Delivery',
    };
    setAdminNotifications(prev => [notif, ...prev]);

    // Big celebration confetti
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch {
      // ignore
    }

    addToast(
      '🎉 Official Winner Drawn!',
      `${winningTicket.userName} won the ${raffle.title} with Ticket #${winningTicket.ticketNumber}!`,
      'bet_won'
    );

    return { success: true, winnerName: winningTicket.userName, prizeTitle: raffle.title };
  };

  const createRaffle = (newRaffleData: Omit<Raffle, 'id' | 'totalTicketsSold' | 'status'> & { id?: string }): { success: boolean; message: string } => {
    const newRaffle: Raffle = {
      ...newRaffleData,
      id: newRaffleData.id || `raffle_${Date.now()}`,
      totalTicketsSold: 0,
      status: 'active',
      isWeeklySpecial: newRaffleData.isWeeklySpecial ?? true,
      minTicketsThreshold: newRaffleData.minTicketsThreshold || 100,
      ticketCost: newRaffleData.ticketCost || 100,
    };

    setRaffles(prev => [newRaffle, ...prev]);
    addToast('Prize Draw Launched!', `"${newRaffle.title}" is now active in the Prize Arena.`, 'success');
    return { success: true, message: 'Raffle created successfully' };
  };

  const cancelRaffle = (raffleId: string, reason?: string): { success: boolean; message: string } => {
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) return { success: false, message: 'Raffle not found' };

    // Find all tickets for this raffle and refund each player
    const ticketsToRefund = raffleTickets.filter(t => t.raffleId === raffleId);
    const refundByUser: Record<string, number> = {};

    ticketsToRefund.forEach(t => {
      refundByUser[t.userId] = (refundByUser[t.userId] || 0) + t.ticketCost;
    });

    const nowIso = new Date().toISOString();
    const newRefundTxs: Transaction[] = [];

    // Refund each user
    setAllUsers(prev => prev.map(u => {
      const refundAmt = refundByUser[u.id];
      if (refundAmt && refundAmt > 0) {
        newRefundTxs.push({
          id: `tx_refund_${Date.now()}_${u.id}`,
          userId: u.id,
          userName: u.name,
          type: 'raffle_refund',
          amount: refundAmt,
          balanceAfter: u.balance + refundAmt,
          timestamp: nowIso,
          description: `100% Refund for cancelled raffle "${raffle.title}" (${reason || 'Threshold not met'})`,
          status: 'completed',
          referenceId: raffle.id,
        });
        return { ...u, balance: u.balance + refundAmt };
      }
      return u;
    }));

    if (newRefundTxs.length > 0) {
      setTransactions(prev => [...newRefundTxs, ...prev]);
    }

    setRaffles(prev => prev.map(r => r.id === raffleId ? { ...r, status: 'cancelled' } : r));
    addToast('Raffle Cancelled', `Raffle cancelled. ${ticketsToRefund.length} tickets (100% of points) refunded to players.`, 'info');
    return { success: true, message: 'Raffle cancelled and points refunded.' };
  };

  const updateRaffleFulfillment = (raffleId: string, status: RaffleFulfillmentStatus, notes?: string, trackingNumber?: string) => {
    setRaffles(prev => prev.map(r => {
      if (r.id === raffleId) {
        return {
          ...r,
          fulfillmentStatus: status,
          fulfillmentNotes: notes ?? r.fulfillmentNotes,
          trackingNumber: trackingNumber ?? r.trackingNumber,
        };
      }
      return r;
    }));
    addToast('Fulfillment Updated', `Prize delivery status changed to: ${status.toUpperCase()}`, 'info');
  };

  const resetAllData = () => {
    setAllUsers(INITIAL_USERS);
    setAllAgents(INITIAL_AGENTS);
    setMatches(ALL_INITIAL_MATCHES);
    setOpenBets(INITIAL_OPEN_BETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCashierRequests(INITIAL_CASHIER_REQUESTS);
    setKycSubmissions(INITIAL_KYC_SUBMISSIONS);
    setRaffles(INITIAL_RAFFLES);
    setRaffleTickets(INITIAL_RAFFLE_TICKETS);
    setPlatformVigPercent(10);
    setAgentVigSplit(0.60);
    addToast('Data Reset', 'Restored default demo data with 1-week fixture schedule and prize raffles.', 'info');
  };

  return (
    <WeBetContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser: (u: UserProfile) => {
          setCurrentUserId(u.id);
        },
        currentAgent,
        setCurrentAgent: (a: AgentProfile) => {
          setCurrentAgentId(a.id);
        },
        allUsers,
        allAgents,
        matches,
        openBets,
        transactions,
        cashierRequests,
        kycSubmissions,
        platformStats,
        toasts,
        removeToast,
        addToast,
        createOpenBet,
        acceptOpenBet,
        cancelOpenBet,
        updateMatchStatus,
        updateMatchScores,
        batchSetMatches,
        settleMatch,
        createCustomMatch,
        approveSuggestedMatch,
        rejectSuggestedMatch,
        approveAllPendingMatches,
        autoGenerateWeekSchedule,
        simulateAutoCloseThreshold,
        isMatchLocked,
        getMatchCountdown,
        simulateMatchKickoff,
        adminNotifications,
        markNotificationRead,
        clearAllNotifications,
        trackMatchResult,
        approveMatchWinner,
        rejectMatchResult,
        simulateTrackResult,
        requestDeposit,
        requestWithdrawal,
        processCashierRequest,
        agentTopUpPlayer,
        submitKYC,
        processKYC,
        updateResponsibleGaming,
        raffles,
        raffleTickets,
        buyRaffleTickets,
        drawRaffleWinner,
        createRaffle,
        cancelRaffle,
        updateRaffleFulfillment,
        platformVigPercent,
        setPlatformVigPercent,
        agentVigSplit,
        setAgentVigSplit,
        resetAllData,
      }}
    >
      {children}
    </WeBetContext.Provider>
  );
};

export const useWeBet = () => {
  const context = useContext(WeBetContext);
  if (!context) {
    throw new Error('useWeBet must be used within a WeBetProvider');
  }
  return context;
};
