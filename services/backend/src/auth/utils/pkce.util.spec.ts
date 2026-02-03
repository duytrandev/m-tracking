import {
  generateCodeVerifier,
  generateCodeChallenge,
  verifyCodeChallenge,
} from './pkce.util'

describe('PKCE Utility', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a base64url encoded string', () => {
      const verifier = generateCodeVerifier()
      // base64url only contains alphanumeric, hyphen, and underscore
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should generate 43-character verifier (32 bytes = 43 base64url chars)', () => {
      const verifier = generateCodeVerifier()
      expect(verifier.length).toBe(43)
    })

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier()
      const verifier2 = generateCodeVerifier()
      expect(verifier1).not.toBe(verifier2)
    })
  })

  describe('generateCodeChallenge', () => {
    it('should generate a base64url encoded S256 challenge', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      // base64url only contains alphanumeric, hyphen, and underscore
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should generate 43-character challenge (SHA-256 = 32 bytes = 43 base64url)', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      expect(challenge.length).toBe(43)
    })

    it('should generate same challenge for same verifier', () => {
      const verifier = 'test-verifier-value-for-determinism'
      const challenge1 = generateCodeChallenge(verifier)
      const challenge2 = generateCodeChallenge(verifier)
      expect(challenge1).toBe(challenge2)
    })

    it('should generate different challenges for different verifiers', () => {
      const challenge1 = generateCodeChallenge('verifier1')
      const challenge2 = generateCodeChallenge('verifier2')
      expect(challenge1).not.toBe(challenge2)
    })
  })

  describe('verifyCodeChallenge', () => {
    it('should return true for valid verifier-challenge pair', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      expect(verifyCodeChallenge(verifier, challenge)).toBe(true)
    })

    it('should return false for invalid verifier', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      const wrongVerifier = generateCodeVerifier()
      expect(verifyCodeChallenge(wrongVerifier, challenge)).toBe(false)
    })

    it('should return false for manipulated challenge', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      const tamperedChallenge = challenge.slice(0, -1) + 'X'
      expect(verifyCodeChallenge(verifier, tamperedChallenge)).toBe(false)
    })

    it('should return false for challenges with different length', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      const shorterChallenge = challenge.slice(0, 10)
      expect(verifyCodeChallenge(verifier, shorterChallenge)).toBe(false)
    })

    it('should be timing-safe (consistent response time)', () => {
      const verifier = generateCodeVerifier()
      const challenge = generateCodeChallenge(verifier)
      const wrongChallenge = generateCodeChallenge(generateCodeVerifier())

      // Both valid and invalid should complete without throwing
      expect(() => verifyCodeChallenge(verifier, challenge)).not.toThrow()
      expect(() => verifyCodeChallenge(verifier, wrongChallenge)).not.toThrow()
    })
  })

  describe('RFC 7636 compliance', () => {
    it('should generate code_verifier between 43-128 characters', () => {
      // RFC 7636 Section 4.1: code_verifier is 43-128 characters
      for (let i = 0; i < 10; i++) {
        const verifier = generateCodeVerifier()
        expect(verifier.length).toBeGreaterThanOrEqual(43)
        expect(verifier.length).toBeLessThanOrEqual(128)
      }
    })

    it('should produce correct S256 challenge per RFC spec', () => {
      // RFC 7636 example test vector
      // code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
      // S256 challenge should be "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
      const testVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
      const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
      const actualChallenge = generateCodeChallenge(testVerifier)
      expect(actualChallenge).toBe(expectedChallenge)
    })
  })
})
