export const ONBOARDING_STORAGE_KEY_PREFIX = 'thermocheck_onboarding_state_v2';

export function getOnboardingStorageKey(profileId?: string) {
  return profileId ? `${ONBOARDING_STORAGE_KEY_PREFIX}:${profileId}` : ONBOARDING_STORAGE_KEY_PREFIX;
}
