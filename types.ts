
export type IdType = 'Egyptian ID' | 'UNHCR ID' | 'Passport';
export type Nationality = 'Egyptian' | 'Sudanese' | 'Syrian' | 'Other';

export interface BasicInfo {
  fullName: string;
  nationality: Nationality;
  idType: IdType;
}

export interface ExtractedData {
  fullName: string;
  dob: string; // YYYY-MM-DD
  idNumber: string;
  documentType: string;
  confidenceScores: {
    fullName: number;
    dob: number;
    idNumber: number;
  };
  qualityCheck: {
    isClear: boolean;
    isComplete: boolean;
    isReadable: boolean;
    reason?: string;
  };
}

export interface AdditionalInfo {
  familySize: number;
  educationLevel: string;
  employmentStatus: string;
  financialResponsibility: boolean;
}

export interface RegistrationRecord {
  id: string;
  basic: BasicInfo;
  extracted: ExtractedData;
  additional: AdditionalInfo;
  eligibility: {
    isEligible: boolean;
    reason: string[];
    needsHumanReview: boolean;
  };
  submittedAt: string;
}

export enum FormStep {
  BASIC_INFO = 0,
  ID_UPLOAD = 1,
  VERIFICATION = 2,
  ADDITIONAL_INFO = 3,
  SUMMARY = 4,
  DASHBOARD = 5
}
