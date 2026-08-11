export interface StudentConsentState {
  privacy_consent_at?: string | null;
  terms_accepted_at?: string | null;
}

export function studentNeedsOnboarding(profile: StudentConsentState) {
  return !profile.privacy_consent_at || !profile.terms_accepted_at;
}
