import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { validate as isUuid } from 'uuid'

/**
 * UUID validation pipe
 *
 * Validates that a parameter is a valid UUID v4.
 * Throws BadRequestException if validation fails.
 *
 * @example
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) { }
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUuid(value)) {
      throw new BadRequestException('Invalid UUID format')
    }
    return value
  }
}
