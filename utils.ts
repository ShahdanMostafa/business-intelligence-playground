
import { RegistrationRecord, ExtractedData, BasicInfo } from "./types";

export const calculateEligibility = (
  basic: BasicInfo,
  extracted: ExtractedData
): RegistrationRecord['eligibility'] => {
  const reasons: string[] = [];
  let isEligible = true;
  let needsHumanReview = false;

  // 1. Age Calculation (18-60)
  const birthDate = new Date(extracted.dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18 || age > 60) {
    isEligible = false;
    reasons.push(`Out of age range (18-60). Detected age: ${age}`);
  }

  // 2. Confidence Checks
  const lowConf = Object.values(extracted.confidenceScores).some(score => score < 0.85);
  if (lowConf) {
    needsHumanReview = true;
    reasons.push("Low confidence scores in data extraction.");
  }

  // 3. Sudanese Passport Condition (Post April 2023)
  if (basic.nationality === 'Sudanese' && basic.idType === 'Passport') {
    needsHumanReview = true;
    reasons.push("Sudanese Passport entry date requires manual verification (Post-April 2023 rule).");
  }

  // 4. Duplicate Check Simulation (Placeholder)
  // In a real app, we'd check against a database here.
  
  return {
    isEligible,
    reason: reasons,
    needsHumanReview
  };
};

export const formatID = (id: string, type: string) => {
  if (type === 'Egyptian ID' && id.length === 14) return id;
  return id;
};
