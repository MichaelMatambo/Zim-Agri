// Offline funding directory. Verify current terms with the institution before applying.
export type Fund = { id: string; name: string; type: string; summary: string; eligibility: string[]; contact: string; icon: string };
export const FUNDS: Fund[] = [
  { id: 'afc', name: 'Agricultural Finance Corporation (AFC)', type: 'Loan', icon: 'bank', summary: 'Seasonal and asset finance for smallholder and commercial farmers.',
    eligibility: ['Zimbabwean resident farmer', 'Proof of land use (offer letter, permit or communal land confirmation)', 'Farm plan / budget (use My Farm records)', 'National ID'], contact: 'Nearest AFC branch or afc.co.zw' },
  { id: 'zagp', name: 'ZAGP – Zimbabwe Agricultural Growth Programme', type: 'Programme', icon: 'sprout', summary: 'Programme supporting productivity and market linkages for farmers, including youth and women.',
    eligibility: ['Organised in a farmer group or value chain', 'Registered with Agritex', 'Willing to adopt recommended practices'], contact: 'Agritex district office' },
  { id: 'contract', name: 'Contract farming (cotton, tobacco, soya, sorghum)', type: 'Contract', icon: 'file-sign', summary: 'A company supplies inputs and buys the crop at harvest; costs are deducted from sales.',
    eligibility: ['Suitable land in the contractor’s region', 'Ability to follow the crop package', 'Sell only to the contractor (side-marketing breaches contract)', 'Read the contract fully before signing'], contact: 'Contractor field officers / Agritex' },
  { id: 'youth', name: 'Youth agri-entrepreneurship funds', type: 'Grant / Loan', icon: 'account-group', summary: 'Government, NGO and bank youth funds for agribusiness start-ups.',
    eligibility: ['Aged 18–35 (check each fund)', 'Business plan or farm plan', 'Bank or EcoCash account', 'Ministry of Youth / NGO registration where required'], contact: 'Ministry of Youth, Empower Bank and NGO calls' },
  { id: 'inputs', name: 'Pfumvudza / Intwasa input support', type: 'Inputs', icon: 'seed', summary: 'Conservation-agriculture input packs for households.',
    eligibility: ['Smallholder household', 'Registered with local Agritex officer', 'Prepared planting plots (Pfumvudza method)'], contact: 'Ward Agritex officer' },
];
