import React, { useState, useMemo } from 'react';
import { useWeBet } from '../../context/WeBetContext';
import { SportType, Match, MatchStatus } from '../../types';
import { OpenBetCard } from './OpenBetCard';
import { useLiveScoresPolling } from '../../hooks/useLiveScoresPolling';
import {
  Flame,
  Zap,
  PlusCircle,
  Trophy,
  Filter,
  Search,
  Clock,
  Radio,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  RefreshCw,
  Play,
  Pause,
  Activity,
  Bell,
  X,
  Lock,
  AlertTriangle,
  Timer
} from 'lucide-react';

interface PlayerLobbyProps {
  onOpenCreateBet: (match?: Match) => void;
}

interface SportCategoryItem {
  id: 'all' | SportType;
  name: string;
  shortLabel: string;
  icon: string;
  leagues: string[];
}

const SPORTS_CATEGORIES: SportCategoryItem[] = [
  { id: 'all', name: 'All Sports', shortLabel: 'All', icon: '🔥', leagues: ['Champions League', 'NBA', 'NFL', 'MLB', 'UFC'] },
  { id: 'soccer', name: 'Soccer', shortLabel: 'Soccer', icon: '⚽', leagues: ['Champions League', 'Premier League', 'La Liga'] },
  { id: 'basketball', name: 'Basketball', shortLabel: 'Basketball', icon: '🏀', leagues: ['NBA Playoffs', 'EuroLeague'] },
  { id: 'football', name: 'Football (NFL)', shortLabel: 'NFL', icon: '🏈', leagues: ['NFL Championship', 'Super Bowl'] },
  { id: 'baseball', name: 'Baseball (MLB)', shortLabel: 'MLB', icon: '⚾', leagues: ['MLB World Series', 'American League'] },
  { id: 'mma', name: 'MMA / UFC', shortLabel: 'UFC', icon: '🥊', leagues: ['UFC Championship', 'Main Card'] },
  { id: 'boxing', name: 'Boxing', shortLabel: 'Boxing', icon: '🥊', leagues: ['Super Middleweight', 'Heavyweight'] },
  { id: 'tennis', name: 'Tennis', shortLabel: 'Tennis', icon: '🎾', leagues: ['Wimbledon', 'ATP Finals'] },
  { id: 'hockey', name: 'Ice Hockey', shortLabel: 'NHL', icon: '🏒', leagues: ['NHL Stanley Cup'] },
  { id: 'cricket', name: 'Cricket', shortLabel: 'Cricket', icon: '🏏', leagues: ['ICC World Cup', 'IPL'] },
  { id: 'esports', name: 'Esports', shortLabel: 'Esports', icon: '🎮', leagues: ['CS2 Major', 'Worlds'] },
];

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenCreateBet }) => {
  const { matches, openBets, currentUser, isMatchLocked, getMatchCountdown, simulateMatchKickoff } = useWeBet();
  const [selectedSport, setSelectedSport] = useState<'all' | SportType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Score Polling Hook from Public Sports APIs
  const {
    isPolling,
    togglePolling,
    intervalSeconds,
    changeInterval,
    countdown,
    lastUpdated,
    isFetching,
    fetchNow,
    recentAlerts,
    dismissAlert,
    recentScoreChangeMatchIds,
    liveMatchesCount,
    source,
  } = useLiveScoresPolling({
    autoStart: true,
    defaultIntervalSeconds: 10,
    showToastsOnScore: true,
  });

  // Helper to test if a match satisfies the search query (by league, team name, short name, or venue)
  const matchMatchesSearch = (match: Match, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const leagueMatch = match.league.toLowerCase().includes(q);
    const homeNameMatch = match.homeTeam.name.toLowerCase().includes(q);
    const homeShortMatch = match.homeTeam.shortName?.toLowerCase().includes(q) || false;
    const awayNameMatch = match.awayTeam.name.toLowerCase().includes(q);
    const awayShortMatch = match.awayTeam.shortName?.toLowerCase().includes(q) || false;
    const venueMatch = match.venue?.toLowerCase().includes(q) || false;
    return leagueMatch || homeNameMatch || homeShortMatch || awayNameMatch || awayShortMatch || venueMatch;
  };

  // Filter matches (only show approved matches for public player lobby / open betting)
  const approvedMatches = useMemo(() => {
    return matches.filter(m => (m.approvalStatus ? m.approvalStatus === 'approved' : true));
  }, [matches]);

  const filteredMatches = approvedMatches.filter(match => {
    const matchesSport = selectedSport === 'all' || match.sport === selectedSport;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'live' && match.status === 'live') ||
      (statusFilter === 'upcoming' && match.status === 'upcoming');
    const matchesSearch = matchMatchesSearch(match, searchQuery);
    return matchesSport && matchesStatus && matchesSearch;
  });

  // Filter open bets (available to accept - only from upcoming and unlocked matches)
  const availableOpenBets = openBets.filter(bet => {
    if (bet.status !== 'open') return false;
    const match = approvedMatches.find(m => m.id === bet.matchId);
    if (!match || isMatchLocked(match)) return false;
    if (selectedSport !== 'all' && match.sport !== selectedSport) return false;
    if (statusFilter === 'live' && match.status !== 'live') return false;
    if (statusFilter === 'upcoming' && match.status !== 'upcoming') return false;
    if (!matchMatchesSearch(match, searchQuery)) return false;
    return true;
  });

  // Count matches and open bets per sport category
  const sportStats = useMemo(() => {
    const stats: Record<string, { total: number; live: number; openBets: number }> = {
      all: {
        total: approvedMatches.length,
        live: approvedMatches.filter(m => m.status === 'live').length,
        openBets: openBets.filter(b => b.status === 'open').length,
      },
    };
    for (const cat of SPORTS_CATEGORIES) {
      if (cat.id === 'all') continue;
      const catMatches = approvedMatches.filter(m => m.sport === cat.id);
      const catLive = catMatches.filter(m => m.status === 'live').length;
      const catMatchIds = new Set(catMatches.map(m => m.id));
      const catOpenBets = openBets.filter(b => b.status === 'open' && catMatchIds.has(b.matchId)).length;
      stats[cat.id] = { total: catMatches.length, live: catLive, openBets: catOpenBets };
    }
    return stats;
  }, [approvedMatches, openBets]);

  const activeCategory = SPORTS_CATEGORIES.find(c => c.id === selectedSport) || SPORTS_CATEGORIES[0];

  // Context-aware suggested search chips based on selected sport category
  const suggestedQueries = useMemo(() => {
    if (selectedSport !== 'all') {
      const currentCat = SPORTS_CATEGORIES.find(c => c.id === selectedSport);
      const catMatches = matches.filter(m => m.sport === selectedSport);
      const suggestions: { label: string; query: string }[] = [];
      currentCat?.leagues.forEach(l => {
        suggestions.push({ label: l, query: l });
      });
      catMatches.slice(0, 3).forEach(m => {
        suggestions.push({ label: m.homeTeam.name, query: m.homeTeam.name });
      });
      return suggestions.slice(0, 6);
    }
    return [
      { label: 'Champions League', query: 'Champions League' },
      { label: 'NBA', query: 'NBA' },
      { label: 'NFL', query: 'NFL' },
      { label: 'MLB', query: 'MLB' },
      { label: 'UFC', query: 'UFC' },
      { label: 'Premier League', query: 'Premier League' },
    ];
  }, [selectedSport, matches]);

  // Matches starting soon (within 30 mins) for pre-game alert watcher
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');

  const featuredMatch = matches.find(m => m.isFeatured && (m.status === 'live' || m.status === 'upcoming')) || matches[0];
  const isFeaturedFlashing = featuredMatch && !!recentScoreChangeMatchIds[featuredMatch.id];
  const isFeaturedLocked = featuredMatch ? isMatchLocked(featuredMatch) : false;
  const featuredCountdown = featuredMatch ? getMatchCountdown(featuredMatch) : null;

  return (
    <div className="space-y-6">
      {/* Live Sports API Polling Feed Bar */}
      <div className="bg-[#131316] border border-[#26262F] rounded-[8px] p-3.5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Status & Connection */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${isPolling ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
              {isPolling && (
                <span className="w-3 h-3 rounded-full bg-[#10B981] animate-ping absolute" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Public Sports Score Feed</span>
                </span>
                <span className="text-[10px] bg-[#1E1E26] text-[#9CA3AF] px-2 py-0.5 rounded-[4px] font-mono">
                  {source}
                </span>
              </div>
              <div className="text-[11px] text-[#9CA3AF] flex items-center space-x-2 mt-0.5">
                <span>
                  {liveMatchesCount} active match{liveMatchesCount === 1 ? '' : 'es'} in play
                </span>
                <span>&bull;</span>
                <span>
                  Last synced: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Polling Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Countdown Badge */}
            {isPolling ? (
              <div className="flex items-center space-x-1.5 bg-[#0E0E10] border border-[#2B2B36] px-2.5 py-1 rounded-[6px] text-xs font-mono text-[#D1D5DB]">
                <Clock className="w-3 h-3 text-[#FFD700]" />
                <span>Next sync in</span>
                <span className="text-[#FFD700] font-bold w-4 text-center">{countdown}s</span>
              </div>
            ) : (
              <span className="bg-[#1E1E24] text-[#9CA3AF] text-xs px-2.5 py-1 rounded-[6px] font-medium">
                Auto-sync paused
              </span>
            )}

            {/* Interval Selector */}
            <div className="flex items-center space-x-1 bg-[#0E0E10] border border-[#2B2B36] p-0.5 rounded-[6px]">
              {[5, 10, 30].map(sec => (
                <button
                  key={sec}
                  id={`btn-interval-${sec}s`}
                  onClick={() => changeInterval(sec)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer ${
                    intervalSeconds === sec
                      ? 'bg-[#FF0000] text-white font-bold'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                  title={`Poll public sports API every ${sec} seconds`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Pause / Resume Button */}
            <button
              id="btn-toggle-polling"
              onClick={togglePolling}
              className={`p-1.5 rounded-[6px] border transition-colors flex items-center cursor-pointer ${
                isPolling
                  ? 'bg-[#1E1E24] hover:bg-[#282832] text-[#E5E7EB] border-[#2B2B36]'
                  : 'bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border-[#10B981]/40'
              }`}
              title={isPolling ? 'Pause auto-polling' : 'Resume auto-polling'}
            >
              {isPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-[#10B981]" />}
            </button>

            {/* Manual Refresh Button */}
            <button
              id="btn-manual-sync-scores"
              onClick={fetchNow}
              disabled={isFetching}
              className="bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-[#4B2020] text-white text-xs font-bold px-3 py-1.5 rounded-[6px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Fetch latest scores now from sports API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Score Alert Banner */}
        {recentAlerts.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#23232C] space-y-1.5">
            {recentAlerts.slice(0, 2).map((alert, idx) => (
              <div
                key={alert.id || `alert-${idx}`}
                className="bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-[6px] px-3 py-1.5 flex items-center justify-between text-xs animate-fadeIn"
              >
                <div className="flex items-center space-x-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0000]" />
                  </span>
                  <span className="font-extrabold text-[#FFD700] uppercase tracking-wider text-[11px]">
                    LIVE SCORE UPDATE &bull; {alert.league}
                  </span>
                  <span className="text-white font-medium">
                    <strong className="text-white font-bold">{alert.scoringTeam}</strong> scored! Current: {alert.homeTeam} {alert.homeScore} - {alert.awayScore} {alert.awayTeam} ({alert.period})
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-[#9CA3AF]">
                  <span>{alert.timestamp}</span>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-[#6B7280] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Match Hero Card */}
      {featuredMatch && (
        <div className={`relative rounded-[8px] bg-gradient-to-r from-[#18181C] via-[#141416] to-[#1A1111] border transition-all duration-300 p-5 overflow-hidden shadow-xl ${
          isFeaturedFlashing ? 'border-[#FF0000] ring-2 ring-[#FF0000]/40' : 'border-[#2D2222]'
        }`}>
          {/* Accent red flare background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF0000]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {featuredMatch.status === 'live' ? (
                  <span className="flex items-center bg-[#FF0000] text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] redline-glow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5" />
                    LIVE IN-PLAY &bull; {featuredMatch.currentPeriod}
                  </span>
                ) : isFeaturedLocked ? (
                  <span className="flex items-center bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px]">
                    <Lock className="w-3 h-3 mr-1" />
                    BETTING LOCKED (IN PLAY)
                  </span>
                ) : featuredCountdown?.isImminent ? (
                  <span className="flex items-center bg-[#FF0000]/20 border border-[#FF0000]/50 text-[#FFD700] text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-[#FF0000] mr-1" />
                    KICKOFF IN {featuredCountdown.formatted} (CLOSING SOON)
                  </span>
                ) : (
                  <span className="bg-[#2A2A32] text-[#FFD700] text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px]">
                    FEATURED UPCOMING &bull; {new Date(featuredMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({featuredCountdown?.formatted})
                  </span>
                )}
                <span className="text-xs text-[#9CA3AF] font-medium">{featuredMatch.league}</span>
                {isFeaturedFlashing && (
                  <span className="bg-[#FFD700] text-black text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded animate-bounce">
                    SCORE UPDATED!
                  </span>
                )}
              </div>

              {/* Match Header Teams */}
              <div className="flex items-center space-x-4 pt-1">
                {/* Home Team */}
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{featuredMatch.homeTeam.logo}</span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {featuredMatch.homeTeam.name}
                    </h2>
                    <span className="text-[11px] text-[#9CA3AF] font-mono">{featuredMatch.homeTeam.record || '5-0'}</span>
                  </div>
                </div>

                {/* Score or VS in Gold */}
                <div className={`px-3 py-1 bg-[#0E0E0F] rounded-[8px] border transition-all ${
                  isFeaturedFlashing ? 'border-[#FF0000] scale-105' : 'border-[#2D2D33]'
                } text-center`}>
                  {featuredMatch.status === 'live' ? (
                    <div className="flex items-center space-x-2 font-mono font-extrabold text-xl text-white">
                      <span className="text-[#FF0000]">{featuredMatch.homeScore}</span>
                      <span className="text-[#6B7280]">:</span>
                      <span>{featuredMatch.awayScore}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-extrabold text-[#FFD700] tracking-widest">VS</span>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center space-x-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight text-right sm:text-left">
                      {featuredMatch.awayTeam.name}
                    </h2>
                    <span className="text-[11px] text-[#9CA3AF] font-mono text-right sm:text-left block">{featuredMatch.awayTeam.record || '4-1'}</span>
                  </div>
                  <span className="text-3xl">{featuredMatch.awayTeam.logo}</span>
                </div>
              </div>

              <div className="text-xs text-[#6B7280] flex items-center space-x-2">
                <span>📍 {featuredMatch.venue}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3 pt-2 lg:pt-0">
              {isFeaturedLocked ? (
                <div className="px-4 py-2.5 rounded-[8px] bg-[#1C1515] border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold flex items-center space-x-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Market Locked &bull; In Play</span>
                </div>
              ) : (
                <button
                  id="btn-hero-create-bet"
                  onClick={() => onOpenCreateBet(featuredMatch)}
                  className="bg-[#FF0000] hover:bg-[#CC0000] text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-[8px] transition-all redline-glow flex items-center space-x-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Create Open Bet (100:100)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pre-Game Starting Soon & Market Lockout Watch Panel */}
      <div className="bg-[#121215] border border-[#232328] rounded-[8px] p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-[#FFD700]" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-white">
              Pre-Game Kickoff & Market Lockout Protection
            </h3>
            <span className="bg-[#1F1F24] text-[#9CA3AF] text-[10px] px-2 py-0.5 rounded-full font-mono">
              Auto-closes & refunds unmatched bets at game start
            </span>
          </div>

          <div className="text-[11px] text-[#6B7280]">
            System Alerts at <span className="text-[#FFD700] font-semibold">15m</span>, <span className="text-[#FF0000] font-semibold">5m</span>, & <span className="text-[#EF4444] font-semibold">60s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.filter(m => m.status === 'upcoming').slice(0, 3).map(match => {
            const cd = getMatchCountdown(match);
            return (
              <div
                key={`lockout-watch-${match.id}`}
                className="bg-[#0E0E10] border border-[#1F1F24] rounded-[6px] p-2.5 flex items-center justify-between"
              >
                <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                  <div className="text-xs font-bold text-white truncate">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-mono flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Kickoff: {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 space-y-1">
                  {cd.isImminent ? (
                    <span className="px-2 py-0.5 rounded bg-[#FF0000]/20 text-[#FFD700] text-[10px] font-mono font-black border border-[#FF0000]/40 animate-pulse">
                      ⏳ {cd.formatted}
                    </span>
                  ) : cd.isStartingSoon ? (
                    <span className="px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-mono font-bold border border-[#F59E0B]/30">
                      ⏰ {cd.formatted}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#1A1A1E] text-[#9CA3AF] text-[10px] font-mono">
                      ⏱️ {cd.formatted}
                    </span>
                  )}

                  {/* Test Acceleration Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => simulateMatchKickoff(match.id, 15)}
                      title="Set kickoff in 15 seconds to test alerts and lockout"
                      className="text-[9px] bg-[#232328] hover:bg-[#FF0000] text-[#9CA3AF] hover:text-white px-1.5 py-0.5 rounded font-mono transition-colors"
                    >
                      Test in 15s
                    </button>
                    <button
                      onClick={() => simulateMatchKickoff(match.id, 0)}
                      title="Lock match and go live immediately"
                      className="text-[9px] bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white px-1.5 py-0.5 rounded font-mono transition-colors"
                    >
                      Lock Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sports Categories & Filters */}
      <div className="space-y-3">
        {/* Sports Categories Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-white">
              Sports Categories
            </h3>
            <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">
              Select a sport to explore matches and open bets
            </span>
          </div>
          <span className="text-[11px] text-[#FFD700] font-mono">
            {matches.length} Matches • {openBets.filter(b => b.status === 'open').length} Open Bets
          </span>
        </div>

        {/* Sports Category Tabs with Live Badges & Fixture Counters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#26262B]">
          {SPORTS_CATEGORIES.map(cat => {
            const stats = sportStats[cat.id] || { total: 0, live: 0, openBets: 0 };
            const isSelected = selectedSport === cat.id;

            return (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                onClick={() => {
                  setSelectedSport(cat.id);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-md shadow-[#FF0000]/20 font-bold'
                    : 'bg-[#131314] text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-white border-[#232328]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>

                {/* Live in-play pulse badge */}
                {stats.live > 0 && (
                  <span
                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping" />
                    <span>{stats.live} LIVE</span>
                  </span>
                )}

                {/* Fixtures count */}
                {stats.total > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-[#1E1E24] text-[#D1D5DB]'
                    }`}
                  >
                    {stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Sport Category Hub Banner */}
        {selectedSport !== 'all' && (
          <div className="bg-gradient-to-r from-[#18181C] via-[#141417] to-[#18181C] border border-[#FF0000]/30 rounded-[8px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#23232A] border border-[#2F2F38] flex items-center justify-center text-2xl shadow-inner">
                {activeCategory.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-extrabold text-white">
                    {activeCategory.name} Betting
                  </h4>
                  {sportStats[selectedSport]?.live > 0 && (
                    <span className="bg-[#FF0000] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{sportStats[selectedSport].live} Match In Play</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Showing {filteredMatches.length} fixture{filteredMatches.length === 1 ? '' : 's'} and {availableOpenBets.length} active open bet card{availableOpenBets.length === 1 ? '' : 's'}.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-post-sport-bet"
                onClick={() => {
                  const firstSportMatch = matches.find(m => m.sport === selectedSport && !isMatchLocked(m));
                  onOpenCreateBet(firstSportMatch);
                }}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold px-3 py-1.5 rounded-[6px] transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post {activeCategory.shortLabel} Bet</span>
              </button>
              <button
                type="button"
                id="btn-view-all-sports"
                onClick={() => {
                  setSelectedSport('all');
                  setSearchQuery('');
                }}
                className="bg-[#232328] hover:bg-[#2F2F36] text-[#D1D5DB] text-xs font-medium px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
              >
                View All Sports
              </button>
            </div>
          </div>
        )}

        {/* Search Bar with League & Team Filter */}
        <div className="bg-[#131314] p-3 rounded-[8px] border border-[#232328] space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-matches"
                placeholder={`Search ${selectedSport === 'all' ? 'matches' : activeCategory.name} by league or team name...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                className="w-full bg-[#0E0E0F] border border-[#26262B] rounded-[6px] pl-9 pr-8 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF0000] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Create Open Bet Button */}
            <button
              id="btn-open-create-modal"
              onClick={() => onOpenCreateBet()}
              className="bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold px-4 py-2 rounded-[6px] transition-colors flex items-center justify-center space-x-1.5 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Open Bet</span>
            </button>
          </div>

          {/* Quick League / Team Shortcut Suggestions & Active Filter Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1F1F24] text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#6B7280] font-medium flex items-center mr-1">
                <Filter className="w-3 h-3 mr-1 text-[#FF0000]" />
                Suggested Filters:
              </span>
              {suggestedQueries.map(chip => {
                const isActive = searchQuery.toLowerCase().includes(chip.query.toLowerCase());
                return (
                  <button
                    key={chip.label}
                    type="button"
                    id={`btn-quick-filter-${chip.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSearchQuery(isActive ? '' : chip.query)}
                    className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FF0000] text-white font-bold shadow-xs'
                        : 'bg-[#1A1A1E] text-[#9CA3AF] hover:text-white hover:bg-[#25252C] border border-[#26262B]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Match Counter / Clear Feedback */}
            {searchQuery && (
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="text-[#9CA3AF]">
                  Found <strong className="text-[#FFD700] font-mono">{filteredMatches.length}</strong> match{filteredMatches.length === 1 ? '' : 'es'} & <strong className="text-[#FFD700] font-mono">{availableOpenBets.length}</strong> open bet{availableOpenBets.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#FF0000] hover:underline font-semibold flex items-center space-x-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Filter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Subfilter (Status Tabs) */}
        <div className="flex items-center space-x-2 bg-[#131314] p-2 rounded-[8px] border border-[#232328]">
          <button
            id="filter-status-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-[#232328] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            All Matches ({matches.length})
          </button>
          <button
            id="filter-status-live"
            onClick={() => setStatusFilter('live')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center space-x-1 ${
              statusFilter === 'live' ? 'bg-[#FF0000] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping mr-1" />
            <span>Live In-Play</span>
          </button>
          <button
            id="filter-status-upcoming"
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
              statusFilter === 'upcoming' ? 'bg-[#232328] text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* SECTION 1: Active Open Bet Cards (P2P Market) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-[#FF0000]" />
            <h3 className="text-sm uppercase font-extrabold tracking-wider text-white">
              Open Bet Cards (OBC) &bull; Ready To Accept
            </h3>
            <span className="bg-[#26262B] text-[#FFD700] text-xs font-bold px-2 py-0.2 rounded-full font-mono">
              {availableOpenBets.length} Available
            </span>
          </div>
          <span className="text-xs text-[#9CA3AF] hidden sm:inline">
            100:100 Ratio &bull; Deducts 10% Vig from Winner
          </span>
        </div>

        {availableOpenBets.length === 0 ? (
          <div className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1F1F24] flex items-center justify-center mx-auto text-xl">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-white">
              {searchQuery.trim()
                ? `No Open Bet Cards Matching "${searchQuery}"`
                : 'No Open Bet Cards Available in this Category'}
            </h4>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              {searchQuery.trim()
                ? `There are currently no active open bet cards for "${searchQuery}". You can be the first to create one for this match!`
                : 'Be the first bettor to post an Open Bet Card for an upcoming match and set your preferred side.'}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => onOpenCreateBet()}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold px-4 py-2 rounded-[8px] transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Open Bet Card</span>
              </button>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="bg-[#232328] hover:bg-[#2F2F36] text-[#D1D5DB] text-xs font-medium px-3 py-2 rounded-[8px] transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableOpenBets.map(bet => {
              const match = matches.find(m => m.id === bet.matchId)!;
              return <OpenBetCard key={bet.id} bet={bet} match={match} />;
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Matches Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#9CA3AF]" />
            <h3 className="text-sm uppercase font-extrabold tracking-wider text-white">
              Upcoming & Live Sports Fixtures
            </h3>
            {searchQuery && (
              <span className="text-xs text-[#FFD700] font-mono bg-[#1C1A14] px-2 py-0.5 rounded border border-[#FFD700]/30">
                Filtered by &quot;{searchQuery}&quot; ({filteredMatches.length})
              </span>
            )}
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div id="matches-empty-state" className="bg-[#131314] rounded-[8px] border border-[#232328] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1F1F24] flex items-center justify-center mx-auto text-[#FF0000]">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Betting Fixtures Found</h4>
            <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
              {searchQuery.trim()
                ? `No sports fixtures match "${searchQuery}" in ${selectedSport === 'all' ? 'any sport' : selectedSport}. Try searching for a different team (e.g. Real Madrid, Lakers, Arsenal) or league name (e.g. Champions League, NBA, Premier League).`
                : 'No matches found matching the selected sports category or status filter.'}
            </p>
            {searchQuery.trim() && (
              <button
                type="button"
                id="btn-empty-clear-search"
                onClick={() => setSearchQuery('')}
                className="bg-[#232328] hover:bg-[#FF0000] text-white text-xs font-bold px-4 py-2 rounded-[6px] transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(match => {
              const matchOpenBets = openBets.filter(b => b.matchId === match.id && b.status === 'open');
              const isScoreRecentlyUpdated = !!recentScoreChangeMatchIds[match.id];
              const isLocked = isMatchLocked(match);
              const countdown = getMatchCountdown(match);

              return (
                <div
                  key={match.id}
                  id={`match-card-${match.id}`}
                  className={`bg-[#131314] hover:bg-[#161618] border rounded-[8px] p-4 transition-all duration-300 shadow-md flex flex-col justify-between relative ${
                    isScoreRecentlyUpdated
                      ? 'border-[#FF0000] ring-1 ring-[#FF0000]/50 shadow-[#FF0000]/10'
                      : isLocked
                      ? 'border-[#26262B] opacity-95'
                      : 'border-[#232328]'
                  }`}
                >
                  {/* Score Flash Tag */}
                  {isScoreRecentlyUpdated && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-[#FF0000] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow-md z-10">
                      <Zap className="w-2.5 h-2.5 fill-white" />
                      <span>SCORE FLASH</span>
                    </div>
                  )}

                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F1F24]">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#D1D5DB]">{match.league}</span>
                    </div>
                    <div>
                      {match.winnerApprovalStatus === 'pending_admin_approval' ? (
                        <span className="flex items-center bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          CONCLUDED &bull; AWAITING APPROVAL
                        </span>
                      ) : match.status === 'live' ? (
                        <span className="flex items-center bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/40 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping mr-1" />
                          LIVE ({match.currentPeriod})
                        </span>
                      ) : match.status === 'completed' ? (
                        <span className="bg-[#2A2A30] text-[#9CA3AF] text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px]">
                          FINAL / SETTLED
                        </span>
                      ) : isLocked ? (
                        <span className="flex items-center bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          LOCKED
                        </span>
                      ) : countdown.isImminent ? (
                        <span className="flex items-center bg-[#FF0000]/20 text-[#FFD700] border border-[#FF0000]/40 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[4px] animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5 text-[#FF0000] mr-1" />
                          CLOSES IN {countdown.formatted}
                        </span>
                      ) : countdown.isStartingSoon ? (
                        <span className="flex items-center bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          STARTS IN {countdown.formatted}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9CA3AF] font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-[#6B7280]" />
                          <span>{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({countdown.formatted})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Teams Row */}
                  <div className="grid grid-cols-5 items-center gap-2 mb-4">
                    {/* Home */}
                    <div className="col-span-2 flex items-center space-x-2">
                      <span className="text-2xl">{match.homeTeam.logo}</span>
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{match.homeTeam.name}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">{match.homeTeam.record || '5-0'}</div>
                      </div>
                    </div>

                    {/* Score / VS Center */}
                    <div className="col-span-1 text-center">
                      {match.status === 'live' || match.status === 'completed' ? (
                        <div className={`font-mono font-extrabold text-base text-white px-1.5 py-0.5 rounded ${
                          isScoreRecentlyUpdated ? 'bg-[#FF0000]/20 text-[#FFD700]' : ''
                        }`}>
                          <span className={match.status === 'live' ? 'text-[#FF0000]' : 'text-white'}>{match.homeScore}</span>
                          <span className="text-[#6B7280] mx-1">-</span>
                          <span className={match.status === 'live' ? 'text-[#FF0000]' : 'text-white'}>{match.awayScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-extrabold text-[#FFD700] px-2 py-0.5 bg-[#0E0E0F] rounded-[4px] border border-[#FFD700]/20">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Away */}
                    <div className="col-span-2 flex items-center justify-end space-x-2 text-right">
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{match.awayTeam.name}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">{match.awayTeam.record || '4-1'}</div>
                      </div>
                      <span className="text-2xl">{match.awayTeam.logo}</span>
                    </div>
                  </div>

                  {/* Match Card Bottom Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24] text-xs">
                    <span className="text-[#9CA3AF]">
                      {matchOpenBets.length > 0 ? (
                        <span className="text-[#FFD700] font-semibold">{matchOpenBets.length} Open Bet(s) Listed</span>
                      ) : (
                        <span className="text-[#6B7280]">No open bets yet</span>
                      )}
                    </span>

                    {!isLocked ? (
                      <button
                        id={`btn-match-create-bet-${match.id}`}
                        onClick={() => onOpenCreateBet(match)}
                        className="bg-[#1F1F24] hover:bg-[#FF0000] hover:text-white text-[#D1D5DB] font-semibold text-xs px-3 py-1.5 rounded-[6px] transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Post Open Bet</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#EF4444] font-semibold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Betting Locked</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

