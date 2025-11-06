import { randomBytes, createHash } from 'crypto';

export interface EDSCertificate {
  id: string;
  ownerName: string;
  ownerIIN: string;
  organizationBIN?: string;
  issuer: string;
  validFrom: Date;
  validUntil: Date;
  publicKey: string;
}

export interface SignatureResult {
  signature: string;
  certificateId: string;
  timestamp: Date;
  isValid: boolean;
}

export class MockEDSService {
  generateMockCertificate(userId: string, name: string, iin: string, bin?: string): EDSCertificate {
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    return {
      id: `CERT-${randomBytes(8).toString('hex').toUpperCase()}`,
      ownerName: name,
      ownerIIN: iin,
      organizationBIN: bin,
      issuer: "Mock Kazakhstan Certificate Authority",
      validFrom,
      validUntil,
      publicKey: randomBytes(32).toString('hex'),
    };
  }

  async signDocument(documentData: string, certificateId: string): Promise<SignatureResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const hash = createHash('sha256').update(documentData).digest('hex');
    const signature = createHash('sha512')
      .update(`${hash}-${certificateId}-${Date.now()}`)
      .digest('base64');

    return {
      signature,
      certificateId,
      timestamp: new Date(),
      isValid: true,
    };
  }

  async verifySignature(
    documentData: string,
    signature: string,
    certificateId: string
  ): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!signature || !certificateId) {
      return false;
    }

    return Math.random() > 0.05;
  }

  validateCertificate(certificate: EDSCertificate): boolean {
    const now = new Date();
    return now >= certificate.validFrom && now <= certificate.validUntil;
  }

  generateDocumentHash(documentData: string): string {
    return createHash('sha256').update(documentData).digest('hex');
  }
}

export const edsService = new MockEDSService();
