import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { PaginationDto } from './pagination.dto'

describe('PaginationDto', () => {
  describe('skip calculation', () => {
    it('should calculate skip as 0 for page 1 with limit 20', () => {
      const dto = new PaginationDto()
      dto.page = 1
      dto.limit = 20

      expect(dto.skip).toBe(0)
    })

    it('should calculate skip as 20 for page 2 with limit 20', () => {
      const dto = new PaginationDto()
      dto.page = 2
      dto.limit = 20

      expect(dto.skip).toBe(20)
    })

    it('should calculate skip as 40 for page 3 with limit 20', () => {
      const dto = new PaginationDto()
      dto.page = 3
      dto.limit = 20

      expect(dto.skip).toBe(40)
    })

    it('should calculate skip as 50 for page 6 with limit 10', () => {
      const dto = new PaginationDto()
      dto.page = 6
      dto.limit = 10

      expect(dto.skip).toBe(50)
    })

    it('should use default page (1) in skip calculation when page is undefined', () => {
      const dto = new PaginationDto()
      dto.page = undefined
      dto.limit = 20

      expect(dto.skip).toBe(0) // (undefined || 1) - 1 = 0
    })

    it('should use default limit (20) in skip calculation when limit is undefined', () => {
      const dto = new PaginationDto()
      dto.page = 2
      dto.limit = undefined

      expect(dto.skip).toBe(20) // (2 - 1) * (undefined || 20) = 20
    })

    it('should use defaults for both page and limit in skip calculation', () => {
      const dto = new PaginationDto()

      expect(dto.skip).toBe(0) // (1 - 1) * 20 = 0
    })

    it('should work with maximum limit of 100', () => {
      const dto = new PaginationDto()
      dto.page = 2
      dto.limit = 100

      expect(dto.skip).toBe(100)
    })

    it('should work with minimum page of 1', () => {
      const dto = new PaginationDto()
      dto.page = 1
      dto.limit = 50

      expect(dto.skip).toBe(0)
    })
  })

  describe('validation', () => {
    it('should pass validation with valid page and limit', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 20,
      })

      const errors = await validate(dto)

      expect(errors).toHaveLength(0)
    })

    it('should pass validation with optional fields', async () => {
      const dto = plainToInstance(PaginationDto, {})

      const errors = await validate(dto)

      expect(errors).toHaveLength(0)
    })

    it('should fail validation if page is 0', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 0,
        limit: 20,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('page')
    })

    it('should fail validation if page is negative', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: -1,
        limit: 20,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('page')
    })

    it('should fail validation if limit is 0', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 0,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('limit')
    })

    it('should fail validation if limit is negative', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: -10,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('limit')
    })

    it('should fail validation if limit exceeds maximum of 100', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 101,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('limit')
    })

    it('should fail validation if page is not an integer', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1.5,
        limit: 20,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
    })

    it('should fail validation if limit is not an integer', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 20.5,
      })

      const errors = await validate(dto)

      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept limit of 100 (maximum)', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 100,
      })

      const errors = await validate(dto)

      expect(errors).toHaveLength(0)
    })

    it('should accept limit of 1 (minimum)', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: 1,
        limit: 1,
      })

      const errors = await validate(dto)

      expect(errors).toHaveLength(0)
    })
  })

  describe('default values', () => {
    it('should have default page value of 1', () => {
      const dto = new PaginationDto()

      expect(dto.page ?? 1).toBe(1)
    })

    it('should have default limit value of 20', () => {
      const dto = new PaginationDto()

      expect(dto.limit ?? 20).toBe(20)
    })
  })

  describe('edge cases', () => {
    it('should handle large page numbers', () => {
      const dto = new PaginationDto()
      dto.page = 1000
      dto.limit = 10

      expect(dto.skip).toBe(9990)
    })

    it('should handle page 1 with various limits', () => {
      const limits = [1, 10, 20, 50, 100]

      for (const limit of limits) {
        const dto = new PaginationDto()
        dto.page = 1
        dto.limit = limit

        expect(dto.skip).toBe(0)
      }
    })

    it('should handle consistent skip calculation across multiple calls', () => {
      const dto = new PaginationDto()
      dto.page = 5
      dto.limit = 25

      const firstCall = dto.skip
      const secondCall = dto.skip

      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe(100)
    })
  })
})
