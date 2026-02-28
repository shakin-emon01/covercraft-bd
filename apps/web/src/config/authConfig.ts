const rawGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const googleClientId = rawGoogleClientId;

export const isGoogleAuthConfigured =
  rawGoogleClientId.length > 0 &&
  rawGoogleClientId.toLowerCase() !== 'placeholder' &&
  rawGoogleClientId.endsWith('.apps.googleusercontent.com');

