export const AUTH_COOKIE = "hila_auth";

// Passcode can be overridden via APP_PASSCODE; AUTH_SECRET salts the cookie token.
function getPasscode(): string {
  return process.env.APP_PASSCODE || "1412";
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function computeAuthToken(): Promise<string> {
  return sha256Hex(
    `${getPasscode()}:${process.env.AUTH_SECRET || "hila-attendance"}`
  );
}

export function isValidPasscode(input: string): boolean {
  return input === getPasscode();
}

export async function isValidAuthToken(token: string | undefined | null) {
  return Boolean(token) && token === (await computeAuthToken());
}
