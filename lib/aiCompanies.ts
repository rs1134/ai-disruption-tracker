// Static AI company funding data (updated as of Q1 2026)
// Source: Crunchbase / public filings

export interface AICompanyFunding {
  name: string;
  totalFunding: string;  // formatted string e.g. "$57.9B"
  fundingUSD: number;    // in millions for sorting
  latestRound: string;
  latestRoundDate: string;
  investors: string;
}

export const TOP_AI_COMPANIES: AICompanyFunding[] = [
  {
    name: 'OpenAI',
    totalFunding: '$57.9B',
    fundingUSD: 57_900,
    latestRound: '$40B Series (SoftBank)',
    latestRoundDate: 'Mar 2025',
    investors: 'SoftBank, Microsoft, Thrive',
  },
  {
    name: 'xAI',
    totalFunding: '$12B',
    fundingUSD: 12_000,
    latestRound: '$6B Series B',
    latestRoundDate: 'Dec 2024',
    investors: 'a16z, Sequoia, Kingdom Holdings',
  },
  {
    name: 'Anthropic',
    totalFunding: '$9.6B',
    fundingUSD: 9_600,
    latestRound: '$2.5B Series E',
    latestRoundDate: 'Mar 2024',
    investors: 'Google, Amazon, Spark Capital',
  },
  {
    name: 'Mistral AI',
    totalFunding: '$1.1B',
    fundingUSD: 1_100,
    latestRound: '€600M Series B',
    latestRoundDate: 'Jun 2024',
    investors: 'General Catalyst, a16z, BNP Paribas',
  },
  {
    name: 'Perplexity AI',
    totalFunding: '$900M',
    fundingUSD: 900,
    latestRound: '$250M Series D',
    latestRoundDate: 'Jan 2025',
    investors: 'SoftBank, NEA, Nvidia',
  },
];

export const TOTAL_FUNDING_USD = TOP_AI_COMPANIES.reduce(
  (sum, c) => sum + c.fundingUSD,
  0
);

export function formatTotalFunding(): string {
  const billions = TOTAL_FUNDING_USD / 1000;
  return `$${billions.toFixed(1)}B`;
}
