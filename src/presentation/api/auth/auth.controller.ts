import { Body, Controller, Inject, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../../core/application/decorators/public.decorator';
import { IUserService } from 'src/core/application/interfaces/user.service.interface';
import { UserServiceSymbol } from '../../../core/application/services/user/user.service';

@Controller('auth')
export class AuthController {
  /**
   * Creates an instance of AuthController
   * @param userService - Service for user operations
   * @param jwtService - Service for JWT token operations
   */
  public constructor(
    @Inject(UserServiceSymbol) private readonly userService: IUserService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Handles user login and returns a JWT token
   * @param loginDto login credentials
   * @returns access token
   */
  @Public()
  @Post('login')
  public async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.userService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
