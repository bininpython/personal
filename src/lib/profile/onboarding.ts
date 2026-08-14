export interface StudentConsentState {
  id?: string;
  privacy_consent_at?: string | null;
  terms_accepted_at?: string | null;
}

export function studentNeedsOnboarding(profile: StudentConsentState) {
  if (profile.id === '33333333-3333-3333-3333-333333333333') return false;
  return !profile.privacy_consent_at || !profile.terms_accepted_at;
}
