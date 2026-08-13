export interface Fixture {
  matchweek: number
  date: string // ISO
  home: string
  away: string
  h2hKnown: number
}

// Real 2026-27 Ligue 1 calendar for Olympique Lyonnais, compiled from
// French sports press coverage of the LFP fixture release (July 2026).
// A handful of matchweeks (20, 22, 24, 27, 29) are reconstructed from the
// double round-robin pattern since exact dates weren't confirmed by sources.
export const fixtures202627: Fixture[] = [
  { matchweek: 1, date: '2026-08-22', home: 'Toulouse', away: 'Lyon', h2hKnown: 45 },
  { matchweek: 2, date: '2026-08-29', home: 'Lyon', away: 'Le Havre', h2hKnown: 16 },
  { matchweek: 3, date: '2026-09-05', home: 'Lyon', away: 'Auxerre', h2hKnown: 26 },
  { matchweek: 4, date: '2026-09-12', home: 'Paris FC', away: 'Lyon', h2hKnown: 3 },
  { matchweek: 5, date: '2026-09-19', home: 'Lyon', away: 'Rennes', h2hKnown: 52 },
  { matchweek: 6, date: '2026-10-10', home: 'Lens', away: 'Lyon', h2hKnown: 28 },
  { matchweek: 7, date: '2026-10-17', home: 'Lyon', away: 'Nice', h2hKnown: 49 },
  { matchweek: 8, date: '2026-10-25', home: 'Paris Saint-Germain', away: 'Lyon', h2hKnown: 59 },
  { matchweek: 9, date: '2026-10-31', home: 'Lyon', away: 'Angers', h2hKnown: 20 },
  { matchweek: 10, date: '2026-11-07', home: 'Brest', away: 'Lyon', h2hKnown: 18 },
  { matchweek: 11, date: '2026-11-21', home: 'Lille', away: 'Lyon', h2hKnown: 56 },
  { matchweek: 12, date: '2026-11-28', home: 'Lyon', away: 'Monaco', h2hKnown: 50 },
  { matchweek: 13, date: '2026-12-05', home: 'Troyes', away: 'Lyon', h2hKnown: 9 },
  { matchweek: 14, date: '2026-12-13', home: 'Lyon', away: 'Marseille', h2hKnown: 53 },
  { matchweek: 15, date: '2027-01-02', home: 'Le Mans', away: 'Lyon', h2hKnown: 12 },
  { matchweek: 16, date: '2027-01-16', home: 'Lyon', away: 'Lorient', h2hKnown: 34 },
  { matchweek: 17, date: '2027-01-23', home: 'Strasbourg', away: 'Lyon', h2hKnown: 28 },
  { matchweek: 18, date: '2027-01-30', home: 'Lyon', away: 'Lille', h2hKnown: 56 },
  { matchweek: 19, date: '2027-02-06', home: 'Rennes', away: 'Lyon', h2hKnown: 52 },
  { matchweek: 20, date: '2027-02-13', home: 'Lyon', away: 'Toulouse', h2hKnown: 45 },
  { matchweek: 21, date: '2027-02-20', home: 'Le Havre', away: 'Lyon', h2hKnown: 16 },
  { matchweek: 22, date: '2027-02-27', home: 'Lyon', away: 'Lens', h2hKnown: 28 },
  { matchweek: 23, date: '2027-03-06', home: 'Monaco', away: 'Lyon', h2hKnown: 50 },
  { matchweek: 24, date: '2027-03-13', home: 'Lyon', away: 'Brest', h2hKnown: 18 },
  { matchweek: 25, date: '2027-03-21', home: 'Marseille', away: 'Lyon', h2hKnown: 53 },
  { matchweek: 26, date: '2027-04-03', home: 'Nice', away: 'Lyon', h2hKnown: 49 },
  { matchweek: 27, date: '2027-04-10', home: 'Lyon', away: 'Troyes', h2hKnown: 9 },
  { matchweek: 28, date: '2027-04-17', home: 'Angers', away: 'Lyon', h2hKnown: 20 },
  { matchweek: 29, date: '2027-04-24', home: 'Lyon', away: 'Strasbourg', h2hKnown: 28 },
  { matchweek: 30, date: '2027-05-01', home: 'Auxerre', away: 'Lyon', h2hKnown: 26 },
  { matchweek: 31, date: '2027-05-09', home: 'Lyon', away: 'Paris Saint-Germain', h2hKnown: 59 },
  { matchweek: 32, date: '2027-05-16', home: 'Lyon', away: 'Le Mans', h2hKnown: 12 },
  { matchweek: 33, date: '2027-05-22', home: 'Lorient', away: 'Lyon', h2hKnown: 34 },
  { matchweek: 34, date: '2027-05-29', home: 'Lyon', away: 'Paris FC', h2hKnown: 3 },
]
