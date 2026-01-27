export interface IApiResponse<T = unknown> {
  data?: T
  error?: IApiError
  meta: IApiMeta
}

export interface IApiError {
  code: string
  message: string
  details?: unknown[]
}

export interface IApiMeta {
  timestamp: string
  requestId?: string
  pagination?: IPagination
}

export interface IPagination {
  page: number
  limit: number
  total: number
  pages: number
}
