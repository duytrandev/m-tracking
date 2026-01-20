import { REGEX_PATTERNS } from '../constants/regex.constant'

export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    return REGEX_PATTERNS.EMAIL.test(email)
  }

  static isValidPassword(password: string): boolean {
    return REGEX_PATTERNS.PASSWORD.test(password)
  }

  static isValidUUID(uuid: string): boolean {
    return REGEX_PATTERNS.UUID.test(uuid)
  }

  static isValidPhone(phone: string): boolean {
    return REGEX_PATTERNS.PHONE.test(phone)
  }
}
