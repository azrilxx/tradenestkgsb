/**
 * Helper script to ensure all HS codes have all 19 trade agreements
 * Run this to standardize the database
 */

const ALL_AGREEMENTS = [
  { agreement: 'PDK 2024', agreement_full_name: 'Perintah Duti Kastam 2024 (MFN)', rate: 0, rate_type: 'percentage', effective_date: '2024-01-01' },
  { agreement: 'ATIGA', agreement_full_name: 'ASEAN Trade in Goods Agreement (ATIGA) 2022', rate: 0, rate_type: 'percentage', note: 'Requires Certificate of Origin (Form D)' },
  { agreement: 'ACFTA', agreement_full_name: 'ASEAN China Free Trade Agreement', rate: 0, rate_type: 'percentage', note: 'Requires Certificate of Origin (Form E)' },
  { agreement: 'AHKFTA', agreement_full_name: 'ASEAN Hong Kong Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MPCEPA', agreement_full_name: 'Malaysia Pakistan Closer Economic Partnership Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'AKFTA', agreement_full_name: 'ASEAN Korea Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'AJCEP', agreement_full_name: 'ASEAN Japan Comprehensive Economic Partnership', rate: 0, rate_type: 'percentage' },
  { agreement: 'AANZFTA', agreement_full_name: 'ASEAN Australia New Zealand Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'AINDFTA', agreement_full_name: 'ASEAN India Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MNZFTA', agreement_full_name: 'Malaysia New Zealand Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MICECA', agreement_full_name: 'Malaysia India Comprehensive Economic Cooperation Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'D8PTA', agreement_full_name: 'Developing Eight (D-8) Preferential Tariff Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MCFTA', agreement_full_name: 'Malaysia Chile Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MAFTA', agreement_full_name: 'Malaysia Australia Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'MTFTA', agreement_full_name: 'Malaysia Turkey Free Trade Agreement', rate: 0, rate_type: 'percentage' },
  { agreement: 'RCEP', agreement_full_name: 'Regional Comprehensive Economic Partnership', rate: 0, rate_type: 'percentage', note: 'Requires Certificate of Origin (RCEP Form)' },
  { agreement: 'CPTPP', agreement_full_name: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership', rate: 0, rate_type: 'percentage' },
  { agreement: 'TPS-OIC', agreement_full_name: 'Trade Preferential System among the Member States of the Organisation of the Islamic Conference', rate: 0, rate_type: 'percentage' },
  { agreement: 'MY-UAE-CEPA', agreement_full_name: 'Malaysia United Arab Emirates Comprehensive Economic Partnership Agreement', rate: 0, rate_type: 'percentage' },
];

console.log(`Complete list of ${ALL_AGREEMENTS.length} trade agreements to include in every HS code:`);
ALL_AGREEMENTS.forEach((ag, idx) => {
  console.log(`${idx + 1}. ${ag.agreement} - ${ag.agreement_full_name}`);
});

console.log('\nApply these to all HS codes for consistency.');

module.exports = { ALL_AGREEMENTS };

