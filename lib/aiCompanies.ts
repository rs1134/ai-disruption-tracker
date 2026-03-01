// Top AI company funding data — updated Q1 2026
// Sources: public press releases / Crunchbase

export interface AICompanyFunding {
  name: string;
  totalFunding: string;
  fundingUSD: number;    // in millions for bar scaling
  latestRound: string;
  latestRoundDate: string;
  investors: string;
  valuation: string;
}

export const TOP_AI_COMPANIES: AICompanyFunding[] = [
  {
    name: 'OpenAI',
    totalFunding: '$150B+',
    fundingUSD: 150_000,
    latestRound: '$110B round',
    latestRoundDate: 'Feb 2026',
    investors: 'Amazon, Nvidia, SoftBank, Microsoft',
    valuation: '$730B pre-money',
  },
  {
    name: 'Anthropic',
    totalFunding: '$44.3B+',
    fundingUSD: 44_300,
    latestRound: '$30B Series G',
    latestRoundDate: 'Feb 2026',
    investors: 'Founders Fund, Coatue, Nvidia',
    valuation: '$380B valuation',
  },
  {
    name: 'xAI',
    totalFunding: '$40B+',
    fundingUSD: 40_000,
    latestRound: '$20B round',
    latestRoundDate: 'Jan 2026',
    investors: 'Nvidia, Cisco, Fidelity, Sequoia, a16z',
    valuation: '$200B+ valuation',
  },
  {
    name: 'Waymo',
    totalFunding: '$16B+',
    fundingUSD: 16_000,
    latestRound: '$16B round',
    latestRoundDate: 'Feb 2026',
    investors: 'Alphabet + strategic investors',
    valuation: 'Alphabet subsidiary',
  },
  {
    name: 'Skild AI',
    totalFunding: '$2.5B+',
    fundingUSD: 2_500,
    latestRound: '$1.4B Series C',
    latestRoundDate: 'Jan 2026',
    investors: 'SoftBank, Nvidia',
    valuation: '$14B valuation',
  },
];

export const TOTAL_FUNDING_USD = TOP_AI_COMPANIES.reduce(
  (sum, c) => sum + c.fundingUSD,
  0
);

export function formatTotalFunding(): string {
  const billions = TOTAL_FUNDING_USD / 1000;
  return `$${billions.toFixed(0)}B+`;
}
