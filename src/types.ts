export type UserRole = 'player' | 'agent' | 'admin';

export type SportType =
  | 'soccer'
  | 'basketball'
  | 'football'
  | 'baseball'
  | 'mma'
  | 'tennis'
  | 'hockey'
  | 'boxing'
  | 'esports'
  | 'cricket';

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';

export type MatchApprovalStatus = 'approved' | 'pending' | 'rejected' | 'auto_closed';

export type MatchWinnerApprovalStatus = 'none' | 'pending_admin_approval' | 'approved' | 'rejected' | 'disputed';

export interface MatchResultReport {
  id: string;
  matchId: string;
  reportedAt: string;
  source: 'live_feed' | 'manual_admin' | 'oracle' | 'simulation';
  homeScore: number;
  awayScore: number;
  provisionalWinnerId: string; // Team ID or 'draw'
  provisionalWinnerName: string;
  period: string; // e.g. "FT", "Final", "Q4 0:00", "Round 3"
  notes?: string;
  status: MatchWinnerApprovalStatus;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  adminNotes?: string;
}

export interface AdminNotification {
  id: string;
  type: 'winner_approval' | 'fixture_approval' | 'cashier' | 'kyc' | 'system' | 'raffle';
  title: string;
  message: string;
  matchId?: string;
  raffleId?: string;
  timestamp: string;
  isRead: boolean;
  priority: 'critical' | 'high' | 'medium' | 'info';
  actionLabel?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string;
}

export interface Match {
  id: string;
  sport: SportType;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string; // ISO string
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  currentPeriod?: string; // e.g. "72'", "Q3 4:15", "Round 2", "Set 2"
  winnerId?: string; // set when completed & approved by admin (STRICTLY NOT AUTO-POSTED)
  venue: string;
  isFeatured?: boolean;
  approvalStatus?: MatchApprovalStatus;
  suggestedAt?: string; // ISO timestamp when auto-created
  reviewedAt?: string; // ISO timestamp when reviewed by admin
  reviewedBy?: string;
  autoCloseAt?: string; // ISO timestamp (1 hour before startTime)
  rejectionReason?: string;
  source?: 'auto_schedule' | 'manual' | 'espn_api';
  
  // Track Match Results & Admin Winner Approval Workflow
  winnerApprovalStatus?: MatchWinnerApprovalStatus;
  provisionalWinnerId?: string; // Tracked provisional winner (held until admin approves)
  provisionalWinnerName?: string;
  provisionalHomeScore?: number;
  provisionalAwayScore?: number;
  resultReportedAt?: string;
  resultNotes?: string;
  resultSource?: string;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  adminNotes?: string;
  latestResultReport?: MatchResultReport;
}

export type BetStatus = 'open' | 'matched' | 'in_play' | 'won' | 'lost' | 'cancelled' | 'refunded';

export interface OpenBet {
  id: string;
  matchId: string;
  makerId: string;
  makerName: string;
  makerRole: string;
  makerAvatar?: string;
  selectedTeamId: string; // the team maker is backing
  opposingTeamId: string;
  ratio: string; // e.g. "100:100"
  makerRisk: number; // e.g. 100 PTS
  makerWin: number; // e.g. 100 PTS (gross win at 100:100 ratio)
  // When taker accepts, taker risks makerWin to win makerRisk
  takerRisk: number; // = makerWin
  takerWin: number; // = makerRisk
  vigPercent: number; // 5% default convenience fee on winnings
  createdAt: string;
  status: BetStatus;
  takerId?: string;
  takerName?: string;
  matchedAt?: string;
  settledAt?: string;
  winnerUserId?: string;
  // Financial breakdown on settlement
  grossWin?: number;
  vigAmount?: number; // 5% convenience fee of gross win
  agentCommission?: number; // 60% of vig
  adminCommission?: number; // 40% of vig
  netWin?: number; // gross win - vigAmount
  payout?: number; // netWin + stake returned
  agentId?: string; // the agent assigned to the winning player
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_payout' | 'vig_fee' | 'agent_commission' | 'admin_commission' | 'bet_refund' | 'agent_topup' | 'raffle_entry' | 'raffle_refund';
  amount: number;
  balanceAfter: number;
  timestamp: string;
  description: string;
  status: 'completed' | 'pending' | 'rejected';
  referenceId?: string; // betId, matchId, or raffleId
  agentId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  balance: number; // Available PTS
  inPlayBalance: number; // PTS in active open/matched bets
  agentId?: string; // Assigned agent
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycTier: number; // 1, 2, 3
  avatar: string;
  joinedDate: string;
  phone?: string;
  country: string;
  selfExclusionUntil?: string | null;
  depositLimitDaily?: number;
  depositLimitWeekly?: number;
  sessionTimeLimitMinutes?: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  username: string;
  code: string; // e.g. "AGENT-RED-01"
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  commissionRate: number; // e.g. 0.60 (60% of vig)
  balance: number;
  lifetimeCommissions: number;
  activePlayersCount: number;
  totalPlayerVolume: number;
  avatar: string;
  status: 'active' | 'pending_approval' | 'suspended';
}

export interface CashierRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  accountDetails?: string;
  agentId?: string;
  notes?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  dob: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontIdImage?: string;
  livenessVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface PlatformStats {
  totalTurnover: number;
  totalVigCollected: number;
  adminVigShare: number; // 40%
  agentVigShare: number; // 60%
  activeBetsVolume: number;
  totalBetsPlaced: number;
  totalPlayers: number;
  totalAgents: number;
}

export type RaffleStatus = 'active' | 'drawing' | 'completed' | 'cancelled';
export type RaffleFulfillmentStatus = 'pending_contact' | 'claimed' | 'dispatched' | 'delivered';

export interface Raffle {
  id: string;
  title: string;
  subtitle: string;
  category: 'Gaming & Tech' | 'Sports Memorabilia' | 'Gift Cards' | 'Luxury & Lifestyle' | 'VIP Experience';
  description: string;
  prizeValue: number; // Retail USD value e.g. 499
  wholesaleCost?: number; // Cost to platform for accounting
  prizeImage: string;
  ticketCost: number; // Price in Points (e.g. 50, 100 PTS)
  totalTicketsSold: number;
  minTicketsThreshold: number; // Minimum tickets to guarantee draw
  maxTicketsPerUser?: number;
  endsAt: string; // ISO date string
  status: RaffleStatus;
  isWeeklySpecial: boolean;
  featuredBadge?: string; // e.g. "Weekly Major", "Guaranteed Draw", "High Demand"

  // Winner Information (filled when drawn)
  winnerTicketId?: string;
  winnerTicketNumber?: number;
  winnerUserId?: string;
  winnerName?: string;
  winnerAvatar?: string;
  drawnAt?: string;
  adminDrawnBy?: string;
  fulfillmentStatus?: RaffleFulfillmentStatus;
  fulfillmentNotes?: string;
  trackingNumber?: string;
}

export interface RaffleTicket {
  id: string;
  raffleId: string;
  ticketNumber: number; // e.g. 1001, 1002
  userId: string;
  userName: string;
  userAvatar?: string;
  purchasedAt: string;
  ticketCost: number;
}

