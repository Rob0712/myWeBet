import { useState, useEffect, useRef, useCallback } from 'react';
import { useWeBet } from '../context/WeBetContext';
import { fetchPublicLiveScores, syncPlatformMatches, LiveScoreEvent, ScoreUpdateResult } from '../services/sportsScoreService';

export interface ScoreAlert {
  id: string;
  matchId: string;
  league: string;
  scoringTeam: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  pointsAdded?: number;
  period: string;
  timestamp: string;
}

export interface UseLiveScoresPollingOptions {
  autoStart?: boolean;
  defaultIntervalSeconds?: number;
  showToastsOnScore?: boolean;
}

export const useLiveScoresPolling = (options: UseLiveScoresPollingOptions = {}) => {
  const { autoStart = true, defaultIntervalSeconds = 10, showToastsOnScore = true } = options;
  const { matches, addToast, batchSetMatches } = useWeBet();

  const [isPolling, setIsPolling] = useState<boolean>(autoStart);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(defaultIntervalSeconds);
  const [countdown, setCountdown] = useState<number>(defaultIntervalSeconds);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [liveEvents, setLiveEvents] = useState<LiveScoreEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<ScoreAlert[]>([]);
  const [recentScoreChangeMatchIds, setRecentScoreChangeMatchIds] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Store matches in ref to prevent stale closures during timer callbacks
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Clear score flash highlights after 4 seconds
  useEffect(() => {
    const flashIds = Object.keys(recentScoreChangeMatchIds);
    if (flashIds.length > 0) {
      const timer = setTimeout(() => {
        setRecentScoreChangeMatchIds({});
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentScoreChangeMatchIds]);

  /**
   * Core poll function: fetches public API scores and synchronizes matches
   */
  const pollScores = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      // 1. Query public sports APIs (ESPN)
      const apiScores = await fetchPublicLiveScores();
      setLiveEvents(apiScores);

      // 2. Sync with current platform matches
      const { updatedMatches, updates } = syncPlatformMatches(matchesRef.current, apiScores, true);

      // 3. If scores were updated, update context & record notifications
      if (updates.length > 0) {
        if (batchSetMatches) {
          batchSetMatches(updatedMatches);
        }

        const newAlerts: ScoreAlert[] = [];
        const newFlashMap: Record<string, number> = {};

        updates.forEach((u, index) => {
          newFlashMap[u.updatedMatch.id] = Date.now();

          const alertItem: ScoreAlert = {
            id: `score_${u.updatedMatch.id}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
            matchId: u.updatedMatch.id,
            league: u.updatedMatch.league,
            scoringTeam: u.scoringTeam || u.updatedMatch.homeTeam.name,
            homeTeam: u.updatedMatch.homeTeam.name,
            awayTeam: u.updatedMatch.awayTeam.name,
            homeScore: u.updatedMatch.homeScore || 0,
            awayScore: u.updatedMatch.awayScore || 0,
            period: u.updatedMatch.currentPeriod || 'LIVE',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };

          newAlerts.push(alertItem);

          if (showToastsOnScore && u.scoringTeam) {
            const sportIcon = u.updatedMatch.sport === 'soccer' ? '⚽ GOAL' : u.updatedMatch.sport === 'basketball' ? '🏀 SCORE' : '⚡ LIVE UPDATE';
            addToast(
              `${sportIcon}: ${u.scoringTeam}`,
              `${u.updatedMatch.homeTeam.name} ${u.updatedMatch.homeScore} - ${u.updatedMatch.awayScore} ${u.updatedMatch.awayTeam.name} (${u.updatedMatch.currentPeriod})`,
              'info'
            );
          }
        });

        setRecentScoreChangeMatchIds(prev => ({ ...prev, ...newFlashMap }));
        setRecentAlerts(prev => {
          const merged = [...newAlerts, ...prev];
          const uniqueMap = new Map<string, ScoreAlert>();
          for (const item of merged) {
            if (!uniqueMap.has(item.id)) {
              uniqueMap.set(item.id, item);
            }
          }
          return Array.from(uniqueMap.values()).slice(0, 5);
        });
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('Live scores polling failed:', err);
      setError(err?.message || 'Failed to poll live scores');
    } finally {
      setIsFetching(false);
      setCountdown(intervalSeconds);
    }
  }, [batchSetMatches, addToast, intervalSeconds, showToastsOnScore]);

  /**
   * Manual trigger
   */
  const fetchNow = useCallback(() => {
    setCountdown(intervalSeconds);
    pollScores();
  }, [pollScores, intervalSeconds]);

  /**
   * Toggle polling state
   */
  const togglePolling = useCallback(() => {
    setIsPolling(prev => !prev);
  }, []);

  /**
   * Change polling interval
   */
  const changeInterval = useCallback((seconds: number) => {
    setIntervalSeconds(seconds);
    setCountdown(seconds);
  }, []);

  /**
   * Dismiss single alert
   */
  const dismissAlert = useCallback((id: string) => {
    setRecentAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Countdown timer tick (every 1 second)
  useEffect(() => {
    if (!isPolling) return;

    countdownRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          pollScores();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isPolling, intervalSeconds, pollScores]);

  // Initial poll on mount
  useEffect(() => {
    pollScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveMatchesCount = matches.filter(m => m.status === 'live').length;

  return {
    isPolling,
    togglePolling,
    intervalSeconds,
    changeInterval,
    countdown,
    lastUpdated,
    isFetching,
    fetchNow,
    liveEvents,
    recentAlerts,
    dismissAlert,
    recentScoreChangeMatchIds,
    error,
    liveMatchesCount,
    source: 'ESPN Public Scoreboard API Feed',
  };
};
