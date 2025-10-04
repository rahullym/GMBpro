import * as crypto from 'crypto';

export class EncryptionUtil {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;

  /**
   * Generate a random encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Encrypt text using AES-256-GCM
   */
  static encrypt(text: string, key: string): string {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
    cipher.setAAD(Buffer.from('gmb-optimizer', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine IV + tag + encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  /**
   * Decrypt text using AES-256-GCM
   */
  static decrypt(encryptedText: string, key: string): string {
    const keyBuffer = Buffer.from(key, 'hex');
    
    // Extract IV, tag, and encrypted data
    const iv = Buffer.from(encryptedText.slice(0, this.ivLength * 2), 'hex');
    const tag = Buffer.from(
      encryptedText.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2),
      'hex'
    );
    const encrypted = encryptedText.slice((this.ivLength + this.tagLength) * 2);

    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAAD(Buffer.from('gmb-optimizer', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash a string using SHA-256
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
