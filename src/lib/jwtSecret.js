const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
  }
  return secret;
}
