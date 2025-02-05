export interface BaseUser {
  id: string;
  email: string;
  phone: string;
  photo: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  verificationLevel: VerificationLevel;
  subscriptionTier: SubscriptionTier;
}

export interface Entrepreneur extends BaseUser {
  type: 'entrepreneur';
  projectName: string;
  logo?: string;
  dbaNumber?: string;
  taxId?: string;
  features: string[];
  industries: Industry[];
  yearsExperience: number;
  businessType: 'B2B' | 'B2C';
  desiredInvestment: {
    amount: number;
    timeframe: string;
  };
  profitabilityTimeframe: string;
}

export interface Funder extends BaseUser {
  type: 'funder';
  name: string;
  logo?: string;
  taxId: string;
  availableFunds: number;
  areasOfInterest: Industry[];
  yearsExperience: number;
  investmentPreferences: {
    timeframe: string;
    commitmentLength: string;
  };
  certifications: Certification[];
}

export type VerificationLevel = 'None' | 'BusinessPlan' | 'UseCase' | 'DemographicAlignment' | 'AppUXUI' | 'FiscalAnalysis';
export type SubscriptionTier = 'Basic' | 'Chrome' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type Industry = string;
export type Certification = 'SmallBusiness' | 'MinorityOwned' | 'WomenOwned' | 'GreenFriendly';