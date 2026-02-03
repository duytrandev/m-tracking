import { Global, Module } from '@nestjs/common'
import { CryptoService } from './crypto.service'

/**
 * Global CryptoModule
 * Provides centralized cryptographic operations across the application
 * Marked as @Global so it doesn't need to be imported in every module
 */
@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
