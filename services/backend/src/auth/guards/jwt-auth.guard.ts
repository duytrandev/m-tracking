import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'

interface JwtPayload {
  userId: string
  email: string
  sessionId: string
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    // Call the parent canActivate to perform JWT validation
    return super.canActivate(context)
  }

  override handleRequest<TUser = JwtPayload>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext
  ): TUser {
    // Handle errors or missing user
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required')
    }

    return user
  }
}
