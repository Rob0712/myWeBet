import { Match, MatchStatus, SportType } from '../types';

export interface LiveScoreEvent {
  id: string;
  sport: SportType;
  league: string;
  homeTeam: {
    name: string;
    shortName: string;
    score: number;
    logo?: string;
    record?: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
    score: number;
    logo?: string;
    record?: string;
  };
  period: string;
  status: MatchStatus;
  clock?: string;
  venue?: string;
  source: string;
  lastUpdated: string;
}

export interface ScoreUpdateResult {
  updatedMatch: Match;
  hasScoreChanged: boolean;
  scoringTeam?: string;
  scoreDifference?: { home: number; away: number };
}

// Public ESPN scoreboard endpoints (CORS accessible and public)
const ESPN_ENDPOINTS: Record<string, { sport: SportType; league: string; url: string }> = {
  nba: {
    sport: 'basketball',
    league: 'NBA',
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  },
  epl: {
    sport: 'soccer',
    league: 'English Premier League',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  },
  ucl: {
    sport: 'soccer',
    league: 'UEFA Champions League',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
  },
  mlb: {
    sport: 'baseball',
    league: 'MLB',
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  },
  nfl: {
    sport: 'football',
    league: 'NFL',
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  },
  nhl: {
    sport: 'hockey',
    league: 'NHL',
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  },
};

/**
 * Parses raw ESPN API event into standardized LiveScoreEvent
 */
function parseEspnEvent(event: any, defaultSport: SportType, leagueName: string): LiveScoreEvent | null {
  try {
    const competition = event.competitions?.[0];
    if (!competition || !competition.competitors || competition.competitors.length < 2) {
      return null;
    }

    const homeComp = competition.competitors.find((c: any) => c.homeAway === 'home') || competition.competitors[0];
    const awayComp = competition.competitors.find((c: any) => c.homeAway === 'away') || competition.competitors[1];

    const homeScore = parseInt(homeComp.score || '0', 10);
    const awayScore = parseInt(awayComp.score || '0', 10);

    const statusType = event.status?.type;
    let matchStatus: MatchStatus = 'upcoming';
    if (statusType?.completed) {
      matchStatus = 'completed';
    } else if (statusType?.state === 'in') {
      matchStatus = 'live';
    } else if (statusType?.state === 'pre') {
      matchStatus = 'upcoming';
    }

    const periodStr = statusType?.shortDetail || statusType?.detail || (matchStatus === 'live' ? 'In Play' : 'Upcoming');
    const venue = competition.venue?.fullName || competition.venue?.address?.city || 'Arena';

    return {
      id: event.id,
      sport: defaultSport,
      league: event.league?.name || leagueName,
      homeTeam: {
        name: homeComp.team?.displayName || homeComp.team?.name || 'Home Team',
        shortName: homeComp.team?.abbreviation || homeComp.team?.shortDisplayName || 'HOM',
        score: isNaN(homeScore) ? 0 : homeScore,
        logo: homeComp.team?.logo,
        record: homeComp.records?.[0]?.summary,
      },
      awayTeam: {
        name: awayComp.team?.displayName || awayComp.team?.name || 'Away Team',
        shortName: awayComp.team?.abbreviation || awayComp.team?.shortDisplayName || 'AWY',
        score: isNaN(awayScore) ? 0 : awayScore,
        logo: awayComp.team?.logo,
        record: awayComp.records?.[0]?.summary,
      },
      period: periodStr,
      status: matchStatus,
      clock: event.status?.displayClock,
      venue,
      source: 'ESPN Public Sports API',
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Error parsing ESPN event:', err);
    return null;
  }
}

/**
 * Fetch live scores from public ESPN sports scoreboards
 */
export async function fetchPublicLiveScores(): Promise<LiveScoreEvent[]> {
  const allEvents: LiveScoreEvent[] = [];

  const fetchPromises = Object.entries(ESPN_ENDPOINTS).map(async ([key, config]) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(config.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const data = await res.json();
      const events = data.events || [];
      const parsed: LiveScoreEvent[] = [];

      for (const ev of events) {
        const item = parseEspnEvent(ev, config.sport, config.league);
        if (item) {
          parsed.push(item);
        }
      }

      return parsed;
    } catch (err) {
      // Endpoint may be offline, timed out, or blocked; gracefully continue
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  for (const res of results) {
    if (res.status === 'fulfilled') {
      allEvents.push(...res.value);
    }
  }

  return allEvents;
}

/**
 * Normalizes team names for fuzzy matching (e.g., "Boston Celtics" -> "boston celtics", "Celtics")
 */
function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc|cf|sc|club|team/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Check if two team names match (by abbreviation, exact name, or substring)
 */
export function isTeamMatch(teamA: { name: string; shortName?: string }, teamB: { name: string; shortName?: string }): boolean {
  if (!teamA || !teamB) return false;

  const shortA = (teamA.shortName || '').toLowerCase().trim();
  const shortB = (teamB.shortName || '').toLowerCase().trim();
  if (shortA && shortB && shortA === shortB) return true;

  const cleanA = cleanName(teamA.name);
  const cleanB = cleanName(teamB.name);

  if (cleanA === cleanB) return true;
  if (cleanA.length > 3 && cleanB.includes(cleanA)) return true;
  if (cleanB.length > 3 && cleanA.includes(cleanB)) return true;

  // Specific common sportsbook team aliases
  const aliases: Record<string, string[]> = {
    'celtics': ['boston', 'bos', 'boston celtics'],
    'lakers': ['lal', 'los angeles lakers', 'la lakers'],
    'realmadrid': ['rma', 'madrid', 'real'],
    'mancity': ['mci', 'manchester city', 'man city', 'city'],
    'arsenal': ['ars', 'arsenal fc', 'the gunners'],
    'liverpool': ['liv', 'liverpool fc'],
    'makhachev': ['mak', 'islam makhachev'],
    'tsarukyan': ['tsa', 'arman tsarukyan'],
    'alcaraz': ['alc', 'carlos alcaraz'],
    'sinner': ['sin', 'jannik sinner'],
  };

  for (const [key, list] of Object.entries(aliases)) {
    const aMatches = cleanA.includes(key) || list.some(l => cleanA.includes(cleanName(l)));
    const bMatches = cleanB.includes(key) || list.some(l => cleanB.includes(cleanName(l)));
    if (aMatches && bMatches) return true;
  }

  return false;
}

/**
 * Synchronizes platform matches with public API live score feeds.
 * If live games exist in the API, updates homeScore, awayScore, currentPeriod, status.
 * If no direct API match is live, simulates a realistic in-play score advancement for existing live matches.
 */
export function syncPlatformMatches(
  currentMatches: Match[],
  apiEvents: LiveScoreEvent[],
  allowSimulationFallback: boolean = true
): { updatedMatches: Match[]; updates: ScoreUpdateResult[] } {
  const updates: ScoreUpdateResult[] = [];

  const updatedMatches = currentMatches.map(match => {
    // 1. Try to find a direct match from live public API events
    const apiMatch = apiEvents.find(event => {
      if (event.sport !== match.sport) return false;
      const homeMatches = isTeamMatch(match.homeTeam, event.homeTeam);
      const awayMatches = isTeamMatch(match.awayTeam, event.awayTeam);
      return homeMatches || awayMatches;
    });

    if (apiMatch) {
      const oldHomeScore = match.homeScore ?? 0;
      const oldAwayScore = match.awayScore ?? 0;
      const newHomeScore = apiMatch.homeTeam.score;
      const newAwayScore = apiMatch.awayTeam.score;

      const hasScoreChanged = oldHomeScore !== newHomeScore || oldAwayScore !== newAwayScore;
      let scoringTeam: string | undefined;

      if (newHomeScore > oldHomeScore) {
        scoringTeam = match.homeTeam.name;
      } else if (newAwayScore > oldAwayScore) {
        scoringTeam = match.awayTeam.name;
      }

      // Check if official feed reports game completion
      const isCompletedInFeed = apiMatch.status === 'completed' ||
        (apiMatch.period && /ft|final|ended|concluded/i.test(apiMatch.period));

      let winnerApprovalStatus = match.winnerApprovalStatus;
      let provisionalWinnerId = match.provisionalWinnerId;
      let provisionalWinnerName = match.provisionalWinnerName;
      let provisionalHomeScore = match.provisionalHomeScore;
      let provisionalAwayScore = match.provisionalAwayScore;
      let resultReportedAt = match.resultReportedAt;
      let resultNotes = match.resultNotes;

      // When game completes in feed, track result provisionally, strictly DO NOT auto-post winner!
      if (
        isCompletedInFeed &&
        match.status !== 'completed' &&
        match.winnerApprovalStatus !== 'pending_admin_approval' &&
        match.winnerApprovalStatus !== 'approved'
      ) {
        winnerApprovalStatus = 'pending_admin_approval';
        provisionalHomeScore = newHomeScore;
        provisionalAwayScore = newAwayScore;
        if (newHomeScore > newAwayScore) {
          provisionalWinnerId = match.homeTeam.id;
          provisionalWinnerName = match.homeTeam.name;
        } else if (newAwayScore > newHomeScore) {
          provisionalWinnerId = match.awayTeam.id;
          provisionalWinnerName = match.awayTeam.name;
        } else {
          provisionalWinnerId = 'draw';
          provisionalWinnerName = 'Draw / Tie';
        }
        resultReportedAt = new Date().toISOString();
        resultNotes = `Tracked from official score feed (${apiMatch.period || 'Final'}). Strictly held pending Admin Winner Approval.`;
      }

      const updated: Match = {
        ...match,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        currentPeriod: apiMatch.period || match.currentPeriod,
        // STRICT RULE: Keep status as live/in-review until admin approves! Never set winnerId automatically!
        status: match.status === 'completed' ? 'completed' : 'live',
        winnerApprovalStatus,
        provisionalWinnerId,
        provisionalWinnerName,
        provisionalHomeScore,
        provisionalAwayScore,
        resultReportedAt,
        resultNotes,
      };

      if (hasScoreChanged) {
        updates.push({
          updatedMatch: updated,
          hasScoreChanged: true,
          scoringTeam,
          scoreDifference: {
            home: newHomeScore - oldHomeScore,
            away: newAwayScore - oldAwayScore,
          },
        });
      }

      return updated;
    }

    // 2. Simulation Fallback for active live matches
    // When matches are in 'live' status on the platform, generate realistic live score progression
    if (allowSimulationFallback && match.status === 'live') {
      const currentHome = match.homeScore ?? (match.sport === 'basketball' ? 82 : match.sport === 'soccer' ? 1 : 0);
      const currentAway = match.awayScore ?? (match.sport === 'basketball' ? 80 : match.sport === 'soccer' ? 1 : 0);

      // Random chance of score update based on sport
      // Basketball: frequent 2-3 pt scores (~45% chance per tick)
      // Soccer / Tennis / MMA: occasional score / clock progress (~20% chance)
      const scoreChance = match.sport === 'basketball' ? 0.45 : 0.18;
      const shouldScore = Math.random() < scoreChance;

      if (shouldScore) {
        const isHomeScoring = Math.random() > 0.48;
        let homeAdd = 0;
        let awayAdd = 0;

        if (match.sport === 'basketball') {
          const pts = Math.random() > 0.65 ? 3 : 2;
          if (isHomeScoring) homeAdd = pts;
          else awayAdd = pts;
        } else if (match.sport === 'soccer') {
          if (isHomeScoring) homeAdd = 1;
          else awayAdd = 1;
        } else if (match.sport === 'baseball') {
          if (isHomeScoring) homeAdd = 1;
          else awayAdd = 1;
        }

        const newHomeScore = currentHome + homeAdd;
        const newAwayScore = currentAway + awayAdd;

        // Progress game clock / period
        let nextPeriod = match.currentPeriod;
        if (match.sport === 'basketball') {
          const minutes = Math.max(1, Math.floor(Math.random() * 11));
          const seconds = Math.floor(Math.random() * 59);
          const formattedSec = seconds < 10 ? `0${seconds}` : seconds;
          nextPeriod = `Q4 ${minutes}:${formattedSec}`;
        } else if (match.sport === 'soccer') {
          const currentMin = parseInt(match.currentPeriod?.replace(/\D/g, '') || '70', 10);
          const nextMin = Math.min(90, currentMin + 1);
          nextPeriod = `${nextMin}'`;
        }

        const updated: Match = {
          ...match,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          currentPeriod: nextPeriod,
        };

        if (homeAdd > 0 || awayAdd > 0) {
          updates.push({
            updatedMatch: updated,
            hasScoreChanged: true,
            scoringTeam: isHomeScoring ? match.homeTeam.name : match.awayTeam.name,
            scoreDifference: { home: homeAdd, away: awayAdd },
          });
        }

        return updated;
      }
    }

    return match;
  });

  return { updatedMatches, updates };
}
