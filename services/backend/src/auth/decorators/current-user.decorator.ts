import { createParamDecorator, ExecutionContext } from '@nestjs/common'

interface JwtUserPayload {
  userId: string
  email: string
  roles: string[]
  sessionId: string
}

interface RequestWithUser {
  user?: JwtUserPayload
}

type UserPayloadKey = keyof JwtUserPayload

export const CurrentUser = createParamDecorator(
  (data: UserPayloadKey | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    if (!user) {
      return undefined
    }

    // If a specific property is requested, return just that property
    if (data) {
      return user[data]
    }

    // Otherwise return the entire user object
    return user
  }
)
