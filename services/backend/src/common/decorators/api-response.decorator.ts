import { applyDecorators, Type } from '@nestjs/common'
import { ApiOkResponse, getSchemaPath, ApiProperty } from '@nestjs/swagger'

/**
 * Swagger response wrapper class
 */
export class ApiResponseWrapper<T> {
  @ApiProperty()
  success!: boolean

  data!: T

  @ApiProperty()
  timestamp!: string
}

/**
 * Custom API response decorator
 *
 * Combines ApiOkResponse with standard response wrapper format.
 * Generates proper Swagger documentation for wrapped responses.
 *
 * @example
 * @Get()
 * @ApiStandardResponse(UserDto)
 * async getUsers() { }
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                $ref: getSchemaPath(model),
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    }),
  )
}
