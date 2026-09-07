import React, { useState, useMemo, useEffect } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { Match, SportType, MatchApprovalStatus } from '../../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Lock,
  RefreshCw,
  Search,
  Zap,
  Filter,
  Check,
  X,
  Timer,
  Info
} from 'lucide-react';

const SPORTS_FILTERS: { id: 'all' | SportType; label: string; icon: string }[] = [
  { id: 'all', label: 'All Sports', icon: '🏆' },
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

const REJECTION_REASONS = [
  'Declined by Admin Operations',
  'Fixture Postponed / Rescheduled',
  'Low Liquidity / Risk Profile',
  'Duplicate or Conflicting Fixture',
  'Team Lineup / Venue Unconfirmed'
];

export const MatchApprovalQueue: React.FC = () => {
  const {
    matches,
    approveSuggestedMatch,
    rejectSuggestedMatch,
    approveAllPendingMatches,
    autoGenerateWeekSchedule,
    simulateAutoCloseThreshold,
  } = useWeBet();

  const [selectedSport, setSelectedSport] = useState<'all' | SportType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MatchApprovalStatus>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection modal state
  const [rejectingMatchId, setRejectingMatchId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  // Live timer tick to update deadline countdowns every second
  const [, setClockTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter matches based on criteria
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchApproval = match.approvalStatus || 'approved';
      const matchesStatus = statusFilter === 'all' || matchApproval === statusFilter;
      const matchesSport = selectedSport === 'all' || match.sport === selectedSport;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        match.homeTeam.name.toLowerCase().includes(q) ||
        match.awayTeam.name.toLowerCase().includes(q) ||
        match.league.toLowerCase().includes(q) ||
        (match.venue && match.venue.toLowerCase().includes(q));

      return matchesStatus && matchesSport && matchesSearch;
    });
  }, [matches, statusFilter, selectedSport, searchQuery]);

  // Counts for tabs & badges
  const counts = useMemo(() => {
    const pending = matches.filter(m => (m.approvalStatus || 'approved') === 'pending').length;
    const approved = matches.filter(m => (m.approvalStatus || 'approved') === 'approved').length;
    const rejected = matches.filter(m => m.approvalStatus === 'rejected').length;
    const autoClosed = matches.filter(m => m.approvalStatus === 'auto_closed').length;
    const weekAhead = matches.filter(m => m.source === 'auto_schedule').length;
    return { pending, approved, rejected, autoClosed, weekAhead, total: matches.length };
  }, [matches]);

  const handleConfirmReject = () => {
    if (!rejectingMatchId) return;
    const finalReason = customReason.trim() || rejectionReason;
    rejectSuggestedMatch(rejectingMatchId, finalReason);
    setRejectingMatchId(null);
    setCustomReason('');
  };

  // Helper to format remaining time until auto-close deadline (1 hour before kickoff)
  const getAutoCloseDeadlineInfo = (match: Match) => {
    const startMs = new Date(match.startTime).getTime();
    const autoCloseMs = match.autoCloseAt ? new Date(match.autoCloseAt).getTime() : startMs - 3600000;
    const now = Date.now();
    const msUntilAutoClose = autoCloseMs - now;

    if (match.approvalStatus === 'auto_closed') {
      return {
        text: 'Auto-Closed (< 1h to kickoff)',
        isPastDeadline: true,
        urgency: 'closed',
        formatted: 'Expired',
      };
    }

    if (match.approvalStatus === 'approved') {
      return {
        text: 'Approved & Live on Board',
        isPastDeadline: false,
        urgency: 'approved',
        formatted: 'Active',
      };
    }

    if (match.approvalStatus === 'rejected') {
      return {
        text: 'Rejected by Admin',
        isPastDeadline: false,
        urgency: 'rejected',
        formatted: 'Declined',
      };
    }

    // Status is 'pending'
    if (msUntilAutoClose <= 0) {
      return {
        text: 'Auto-Closing Now (< 1h threshold)',
        isPastDeadline: true,
        urgency: 'critical',
        formatted: '0m 0s',
      };
    }

    const totalSeconds = Math.floor(msUntilAutoClose / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h left`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m left`;
    } else {
      formatted = `${minutes}m ${seconds}s left`;
    }

    const urgency = msUntilAutoClose <= 3600000 ? 'critical' : msUntilAutoClose <= 86400000 ? 'warning' : 'normal';

    return {
      text: `Auto-closes in: ${formatted}`,
      isPastDeadline: false,
      urgency,
      formatted,
    };
  };

  return (
    <div className="space-y-5">
      {/* Informative Rule Header Banner */}
      <div className="bg-[#131314] p-5 rounded-[8px] border border-[#232328] space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-[6px] bg-[#FF0000]/10 text-[#FF0000]">
                <Calendar className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white tracking-wide">
                Auto-Scheduled Match Approvals & 1-Week Advance Fixture Queue
              </h3>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-3xl leading-relaxed">
              Fixtures across major sports are automatically generated <strong className="text-white">1 week before game time</strong> in a <span className="text-[#F59E0B] font-semibold">Pending Approval</span> state.
              Suggested matches are <strong className="text-white">never posted for open bet cards</strong> until an administrator approves them.
              Any unapproved match will <strong className="text-[#FF0000]">automatically close 1 hour before game start</strong>.
            </p>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-admin-auto-generate-week"
              onClick={autoGenerateWeekSchedule}
              className="px-3.5 py-2 bg-[#1E1E24] hover:bg-[#2A2A30] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 border border-[#374151] cursor-pointer"
              title="Generate new 1-week ahead fixtures across 10 major sports"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Sync 1-Week Schedule</span>
            </button>

            {counts.pending > 0 && (
              <button
                id="btn-admin-approve-all-pending"
                onClick={approveAllPendingMatches}
                className="px-3.5 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md"
                title="Approve all pending fixtures that are more than 1 hour away from kickoff"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve All ({counts.pending})</span>
              </button>
            )}

            <button
              id="btn-admin-simulate-1h-threshold"
              onClick={() => simulateAutoCloseThreshold()}
              className="px-3.5 py-2 bg-[#B91C1C]/20 hover:bg-[#B91C1C]/30 text-[#EF4444] hover:text-white border border-[#EF4444]/40 text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Test the 1-hour auto-close rule by fast-forwarding a fixture to 50 minutes before kickoff"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Test 1-Hour Auto-Close</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1F1F24]">
          <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#232328]">
            <div className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Pending Review</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-xl font-mono font-extrabold text-[#F59E0B]">{counts.pending}</span>
              <span className="text-[10px] text-[#9CA3AF]">fixtures</span>
            </div>
            <div className="text-[10px] text-[#F59E0B]/80 flex items-center space-x-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>Awaiting Admin Action</span>
            </div>
          </div>

          <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#232328]">
            <div className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Approved & Live</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-xl font-mono font-extrabold text-[#10B981]">{counts.approved}</span>
              <span className="text-[10px] text-[#9CA3AF]">fixtures</span>
            </div>
            <div className="text-[10px] text-[#10B981]/80 flex items-center space-x-1 mt-0.5">
              <CheckCircle className="w-2.5 h-2.5" />
              <span>Open for Bet Cards</span>
            </div>
          </div>

          <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#232328]">
            <div className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Auto-Closed (&lt;1h)</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-xl font-mono font-extrabold text-[#9CA3AF]">{counts.autoClosed}</span>
              <span className="text-[10px] text-[#9CA3AF]">expired</span>
            </div>
            <div className="text-[10px] text-[#9CA3AF] flex items-center space-x-1 mt-0.5">
              <Lock className="w-2.5 h-2.5" />
              <span>Closed 1h before game</span>
            </div>
          </div>

          <div className="bg-[#0E0E0F] p-3 rounded-[6px] border border-[#232328]">
            <div className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Rejected by Admin</div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-xl font-mono font-extrabold text-[#EF4444]">{counts.rejected}</span>
              <span className="text-[10px] text-[#9CA3AF]">declined</span>
            </div>
            <div className="text-[10px] text-[#EF4444]/80 flex items-center space-x-1 mt-0.5">
              <XCircle className="w-2.5 h-2.5" />
              <span>Explicitly rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131314] p-3 rounded-[8px] border border-[#232328]">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            id="filter-approval-pending"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              statusFilter === 'pending'
                ? 'bg-[#F59E0B] text-black shadow-md'
                : 'bg-[#1E1E24] text-[#9CA3AF] hover:text-white hover:bg-[#2A2A30]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'pending' ? 'bg-black/30 text-black' : 'bg-[#131314] text-[#F59E0B]'
            }`}>
              {counts.pending}
            </span>
          </button>

          <button
            id="filter-approval-approved"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              statusFilter === 'approved'
                ? 'bg-[#10B981] text-white shadow-md'
                : 'bg-[#1E1E24] text-[#9CA3AF] hover:text-white hover:bg-[#2A2A30]'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved & Posted</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'approved' ? 'bg-black/30 text-white' : 'bg-[#131314] text-[#10B981]'
            }`}>
              {counts.approved}
            </span>
          </button>

          <button
            id="filter-approval-autoclosed"
            onClick={() => setStatusFilter('auto_closed')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              statusFilter === 'auto_closed'
                ? 'bg-[#6B7280] text-white shadow-md'
                : 'bg-[#1E1E24] text-[#9CA3AF] hover:text-white hover:bg-[#2A2A30]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Auto-Closed (&lt;1h)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'auto_closed' ? 'bg-black/30 text-white' : 'bg-[#131314] text-[#9CA3AF]'
            }`}>
              {counts.autoClosed}
            </span>
          </button>

          <button
            id="filter-approval-rejected"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-[#EF4444] text-white shadow-md'
                : 'bg-[#1E1E24] text-[#9CA3AF] hover:text-white hover:bg-[#2A2A30]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === 'rejected' ? 'bg-black/30 text-white' : 'bg-[#131314] text-[#EF4444]'
            }`}>
              {counts.rejected}
            </span>
          </button>

          <button
            id="filter-approval-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-[#FF0000] text-white'
                : 'bg-[#1E1E24] text-[#9CA3AF] hover:text-white hover:bg-[#2A2A30]'
            }`}
          >
            <span>All Fixtures ({counts.total})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            id="input-search-approvals"
            type="text"
            placeholder="Search teams, league, venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E0E0F] border border-[#232328] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF0000]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sport Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] text-[#9CA3AF] uppercase font-bold mr-1 flex items-center space-x-1 shrink-0">
          <Filter className="w-3 h-3 text-[#FF0000]" />
          <span>Sport:</span>
        </span>
        {SPORTS_FILTERS.map(sport => {
          const isSelected = selectedSport === sport.id;
          const countForSport = matches.filter(
            m =>
              (sport.id === 'all' || m.sport === sport.id) &&
              (statusFilter === 'all' || (m.approvalStatus || 'approved') === statusFilter)
          ).length;

          return (
            <button
              key={sport.id}
              id={`filter-sport-${sport.id}`}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-2.5 py-1 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#FF0000] text-white shadow-sm font-bold'
                  : 'bg-[#131314] text-[#9CA3AF] hover:text-white hover:bg-[#1E1E24] border border-[#232328]'
              }`}
            >
              <span>{sport.icon}</span>
              <span>{sport.label}</span>
              <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'text-[#6B7280]'}`}>
                {countForSport}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fixtures List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-[#131314] p-12 rounded-[8px] border border-[#232328] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1E1E24] flex items-center justify-center mx-auto text-xl">
            📋
          </div>
          <h4 className="text-sm font-bold text-white">No Fixtures Found</h4>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
            {statusFilter === 'pending'
              ? 'No matches are currently pending approval. All auto-scheduled fixtures have been reviewed or auto-closed.'
              : `No matches match the selected criteria for ${selectedSport === 'all' ? 'all sports' : selectedSport}.`}
          </p>
          <div className="pt-2">
            <button
              onClick={autoGenerateWeekSchedule}
              className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold rounded-[6px] transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate 1-Week Ahead Schedule</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const deadline = getAutoCloseDeadlineInfo(match);
            const approval = match.approvalStatus || 'approved';
            const kickoffDate = new Date(match.startTime);
            const is1WeekAhead = match.source === 'auto_schedule';

            return (
              <div
                key={match.id}
                id={`match-approval-card-${match.id}`}
                className={`bg-[#131314] rounded-[8px] p-4 border transition-all ${
                  approval === 'pending'
                    ? 'border-[#F59E0B]/50 hover:border-[#F59E0B]'
                    : approval === 'approved'
                    ? 'border-[#10B981]/40'
                    : approval === 'rejected'
                    ? 'border-[#EF4444]/30'
                    : 'border-[#232328]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Match details */}
                  <div className="space-y-2 flex-1">
                    {/* Header tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Sport Badge */}
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#1E1E24] text-[#D1D5DB] font-semibold flex items-center space-x-1 border border-[#2A2A30]">
                        <span className="capitalize">{match.sport}</span>
                      </span>

                      {/* League */}
                      <span className="font-bold text-white">{match.league}</span>

                      {/* 1-Week Ahead Source Badge */}
                      {is1WeekAhead && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#3B82F6]/20 text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider border border-[#3B82F6]/30 flex items-center space-x-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span>1-Week Ahead Schedule</span>
                        </span>
                      )}

                      {/* Venue */}
                      {match.venue && (
                        <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">
                          📍 {match.venue}
                        </span>
                      )}
                    </div>

                    {/* Teams Display */}
                    <div className="flex items-center space-x-4 py-1">
                      {/* Home Team */}
                      <div className="flex items-center space-x-2 min-w-40">
                        <span className="text-2xl">{match.homeTeam.logo}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{match.homeTeam.name}</div>
                          <div className="text-[10px] font-mono text-[#9CA3AF] uppercase">{match.homeTeam.shortName} • Home</div>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-2">VS</div>

                      {/* Away Team */}
                      <div className="flex items-center space-x-2 min-w-40">
                        <span className="text-2xl">{match.awayTeam.logo}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{match.awayTeam.name}</div>
                          <div className="text-[10px] font-mono text-[#9CA3AF] uppercase">{match.awayTeam.shortName} • Away</div>
                        </div>
                      </div>
                    </div>

                    {/* Timing & Auto-Close Deadline Notice */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-[#1E1E24]">
                      {/* Kickoff Time */}
                      <div className="flex items-center space-x-1.5 text-[#D1D5DB]">
                        <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        <span>Kickoff: <strong className="text-white">{kickoffDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </div>

                      {/* Auto-Close Countdown Rule */}
                      <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] font-mono text-[11px] ${
                        deadline.urgency === 'critical'
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold animate-pulse'
                          : deadline.urgency === 'warning'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                          : deadline.urgency === 'closed'
                          ? 'bg-[#374151]/30 text-[#9CA3AF]'
                          : deadline.urgency === 'approved'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#1E1E24] text-[#9CA3AF]'
                      }`}>
                        <Timer className="w-3 h-3" />
                        <span>{deadline.text}</span>
                      </div>

                      {/* Rejection / Close Reason Notice if applicable */}
                      {match.rejectionReason && (
                        <div className="text-[11px] text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-[4px]">
                          Note: {match.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 lg:border-l lg:border-[#1E1E24] lg:pl-4">
                    {/* Status Pill */}
                    <div>
                      {approval === 'pending' && (
                        <span className="px-3 py-1 rounded-[6px] bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 text-xs font-bold flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Admin Approval</span>
                        </span>
                      )}
                      {approval === 'approved' && (
                        <span className="px-3 py-1 rounded-[6px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-xs font-bold flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approved & Posted for Bets</span>
                        </span>
                      )}
                      {approval === 'rejected' && (
                        <span className="px-3 py-1 rounded-[6px] bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 text-xs font-bold flex items-center space-x-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected by Admin</span>
                        </span>
                      )}
                      {approval === 'auto_closed' && (
                        <span className="px-3 py-1 rounded-[6px] bg-[#374151]/40 text-[#9CA3AF] border border-[#4B5563]/40 text-xs font-bold flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Auto-Closed (&lt; 1h to start)</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons for Pending Matches */}
                    {approval === 'pending' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          id={`btn-approve-match-${match.id}`}
                          onClick={() => approveSuggestedMatch(match.id)}
                          className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
                          title="Approve fixture and post it for Open Bet Cards in player lobby"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Post</span>
                        </button>

                        <button
                          id={`btn-reject-match-${match.id}`}
                          onClick={() => setRejectingMatchId(match.id)}
                          className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] hover:text-white border border-[#EF4444]/40 text-xs font-bold rounded-[6px] transition-colors flex items-center space-x-1.5 cursor-pointer"
                          title="Reject this match so it won't be posted for betting"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => simulateAutoCloseThreshold(match.id)}
                          className="px-2 py-1.5 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#9CA3AF] hover:text-white text-[10px] font-mono rounded-[6px] border border-[#374151] transition-colors cursor-pointer"
                          title="Fast-forward this fixture's kickoff to 50 mins from now to test the 1-hour auto-close"
                        >
                          Fast-Forward &lt;1h
                        </button>
                      </div>
                    )}

                    {/* Re-approval or Actions for other statuses */}
                    {approval === 'approved' && (
                      <div className="text-[11px] text-[#10B981] flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Visible on Open Bet Cards</span>
                      </div>
                    )}

                    {approval === 'rejected' && (
                      <button
                        onClick={() => approveSuggestedMatch(match.id)}
                        className="px-2.5 py-1 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#D1D5DB] hover:text-white text-xs font-semibold rounded-[6px] border border-[#374151] transition-colors"
                      >
                        Re-evaluate & Approve
                      </button>
                    )}

                    {approval === 'auto_closed' && (
                      <div className="text-[10px] text-[#9CA3AF] max-w-44 text-right">
                        Unapproved at 1-hour pre-game mark. Betting board locked.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#131314] border border-[#232328] rounded-[10px] p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F24]">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-[6px] bg-[#EF4444]/20 text-[#EF4444]">
                  <XCircle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">Reject Suggested Fixture</h3>
              </div>
              <button
                onClick={() => setRejectingMatchId(null)}
                className="text-[#9CA3AF] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9CA3AF]">
              Select or provide a reason for rejecting this fixture. It will not be posted for open bet cards and will be archived with your notes.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#D1D5DB]">Pre-set Reason</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#232328] rounded-[6px] p-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
              >
                {REJECTION_REASONS.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#D1D5DB]">Custom Note (Optional)</label>
              <input
                type="text"
                placeholder="E.g. Rescheduled to next month due to weather"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full bg-[#0E0E0F] border border-[#232328] rounded-[6px] p-2 text-xs text-white focus:outline-none focus:border-[#FF0000]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#1F1F24]">
              <button
                onClick={() => setRejectingMatchId(null)}
                className="px-3.5 py-1.5 bg-[#1E1E24] hover:bg-[#2A2A30] text-[#9CA3AF] hover:text-white text-xs font-semibold rounded-[6px]"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-match"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-[6px] transition-colors shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
