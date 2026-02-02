/**
 * API Response Types - Source of Truth
 * Shared across backend and frontend for consistent API contracts
 */

/**
 * API Error structure
 */
export interface IApiError {
  code: string
  message: string
  details?: unknown[]
}

/**
 * Type alias for backwards compatibility
 */
export type ApiError = IApiError

/**
 * Pagination metadata
 */
export interface IPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Response metadata
 */
export interface IApiMeta {
  requestId?: string
  pagination?: IPagination
}

/**
 * Standard API response wrapper
 * Used by all API endpoints for consistent response format
 */
export interface IApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: IApiError
  message?: string
  timestamp: string
  meta?: IApiMeta
}

/**
 * Type alias for backwards compatibility
 */
export type ApiResponse<T = unknown> = IApiResponse<T>

/**
 * Paginated response wrapper
 * Convenience type for list endpoints
 */
export interface IPaginatedResponse<T> {
  success: boolean
  data: T[]
  timestamp: string
  meta: {
    pagination: IPagination
  }
}

/**
 * Type alias for backwards compatibility
 */
export type PaginatedResponse<T> = IPaginatedResponse<T>

/**
 * List filters for API queries
 */
export interface IListFilters {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

/**
 * Type alias for backwards compatibility
 */
export type ListFilters = IListFilters
