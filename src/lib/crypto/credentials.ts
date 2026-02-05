import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY: Must be 64 hex characters (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt credentials using AES-256-GCM
 * @param plaintext - Plain text credentials (JSON string)
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 */
export function encryptCredentials(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt credentials
 * @param encrypted - Encrypted string from encryptCredentials
 * @returns Decrypted plain text
 */
export function decryptCredentials(encrypted: string): string {
  const key = getEncryptionKey()
  const [ivB64, authTagB64, ciphertext] = encrypted.split(':')

  if (!ivB64 || !authTagB64 || !ciphertext) {
    throw new Error('Invalid encrypted credential format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Mask a credential string for display
 * @param credential - Credential to mask
 * @param visibleChars - Number of visible characters at start and end
 */
export function maskCredential(credential: string, visibleChars = 4): string {
  if (credential.length <= visibleChars * 2) {
    return '*'.repeat(credential.length)
  }
  const start = credential.slice(0, visibleChars)
  const end = credential.slice(-visibleChars)
  const masked = '*'.repeat(Math.min(credential.length - visibleChars * 2, 20))
  return `${start}${masked}${end}`
}
