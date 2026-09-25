//Http Client Param Type
export interface IHttpClient<TBody = unknown> {
  url: string | URL;
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  timeoutMs?: number;
  headers?: Record<string, string>;
  body?: TBody;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface IEnvironmentVariables {
  geminiModel: string;
  geminiKey: string;
  paystackSecretKey: string;
  paystackPublicKey: string;
  paystackTransactionUrl: string;
  telegramToken: string;
  telegramBaseUrl: string;
  telegramChatId: string;
}

export interface IFootballCompetition {
  id: string;
  name: string;
  code: string;
  emblem: string;
  type: string;
  currentSeason?: {
    id: string;
    startDate: string;
    endDate: string;
    currentMatchDay: string;
    stages: string[];
  };
}

export interface IFootballStanding {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  form: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
export interface IFootballStandings {
  id: string;
  name: string;
  code: string;
  emblem: string;
  type: string;
  currentSeason: {
    id: string;
    startDate: string;
    endDate: string;
    currentMatchDay: string;
    stages: string[];
  };
  standings: {
    table: IFootballStanding[];
  }[];
}

export interface IEventArea {
  id: string;
  name: string;
  code: string;
  flag: string;
}

export interface IEventSeason {
  id: string;
  startDate: string;
  endDate: string;
  currentMatchDay: string;
  winner: string | null;
  stages: string[];
}

export interface IMatchPerson {
  id: number;
  name: string;
}
export interface ILineupMember extends IMatchPerson {
  position: string;
  shirtNumber: number;
}
export interface IMatchCoach extends IMatchPerson {
  nationality: string;
}
export interface IMatchReferee extends IMatchPerson {
  nationality: string;
  type: string;
}

export interface IMatchStats {
  corner_kicks: number;
  free_kicks: number;
  goal_kicks: number;
  offsides: number;
  fouls: number;
  ball_possession: number;
  saves: number;
  throw_ins: number;
  shots: number;
  shots_on_goal: number;
  shots_off_goal: number;
  yellow_cards: number;
  yellow_red_cards: number;
  red_cards: number;
}
export interface IMatchScore {
  winner: string;
  duration: string;
  fullTime: IMatchScoreBreakdown;
  halfTime: IMatchScoreBreakdown;
}

export interface IMatchGoal {
  minute: number;
  injuryTime: string | null;
  type: string;
  team: IMatchPerson;
  scorer: IMatchPerson;
  assist: string | null;
  score: IMatchScoreBreakdown;
}

export interface IMatchScoreBreakdown {
  home: number;
  away: number;
}
export interface IMatchTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  coach: IMatchCoach;
  leagueRank: string | null;
  formation: string;
  lineup: ILineupMember[];
  bench: ILineupMember[];
  statistics: IMatchStats;
}
export interface IMatchPenalty {
  player: IMatchPerson;
  team: IMatchPerson;
  scored: boolean;
}

export interface IMatchBooking {
  minute: number;
  team: IMatchPerson;
  player: IMatchPerson;
  card: string;
}

export interface IMatchSubstitution {
  minute: number;
  team: IMatchPerson;
  playerOut: IMatchPerson;
  playerIn: IMatchPerson;
}
export interface IFootballMatch {
  area: IEventArea;
  competition: IFootballCompetition;
  season: IEventSeason;
  id: number;
  utcDate: Date;
  status: string;
  minute: number;
  injuryTime: number;
  attendance: number;
  venue: string;
  matchday: number;
  stage: string;
  group: string | null;
  lastUpdated: string | Date;
  homeTeam: IMatchTeam;
  awayTeam: IMatchTeam;
  score: IMatchScore;
  goals: IMatchGoal[];
  penalties: IMatchPenalty[];
  bookings: IMatchBooking[];
  substitutions: IMatchSubstitution[];
  odds: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  referees: IMatchReferee[];
}

export interface ICompetitionFootballMatch {
  matches: IFootballMatch[];
}

export interface ITelegramWebhookResponse {
  update_id: number;
  message: ITelegamMessage;
}
export interface ITelegamMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: false;
    first_name: string;
    language_code: string;
  };
  chat: {
    id: number;
    first_name: string;
    type: 'private' | 'public';
  };
  date: number;
  text: string;
}
