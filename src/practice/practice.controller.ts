import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { PracticeService } from './practice.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('practice')
export class PracticeController {
  constructor(
    private readonly practiceService: PracticeService,
    private readonly usersService: UsersService,
  ) {}

  // ========================
  // Questions Endpoints
  // ========================

  @Get('topics/:part')
  async getTopics(@Param('part', ParseIntPipe) part: number) {
    if (part < 1 || part > 3) {
      throw new BadRequestException('Part must be 1, 2, or 3');
    }
    return this.practiceService.getTopics(part as 1 | 2 | 3);
  }

  @Get('question/:part')
  async getQuestion(
    @Param('part', ParseIntPipe) part: number,
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    if (part < 1 || part > 3) {
      throw new BadRequestException('Part must be 1, 2, or 3');
    }
    return this.practiceService.getRandomQuestion(part as 1 | 2 | 3, topic, difficulty);
  }

  // ========================
  // Session Endpoints
  // ========================

  @Post('session/start')
  @UseGuards(AuthGuard('jwt'))
  async startSession(
    @CurrentUser() user: User,
    @Body() dto: { questionId: string; part: number },
  ) {
    // Check daily session limit
    const canStart = await this.practiceService.canUserStartSession(user.id);
    if (!canStart) {
      throw new ForbiddenException('Daily session limit reached. Upgrade to premium for unlimited sessions.');
    }

    return this.practiceService.createSession(user.id, dto.questionId, dto.part as 1 | 2 | 3);
  }

  @Post('session/submit')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('audio'))
  async submitSession(
    @CurrentUser() user: User,
    @UploadedFile() audioFile: Express.Multer.File,
    @Body() dto: { sessionId: string; prepTimeUsed?: string; speakingTime?: string },
  ) {
    if (!audioFile) {
      throw new BadRequestException('Audio file is required');
    }

    // Multipart form data sends all fields as strings, so parse to numbers
    const prepTimeUsed = dto.prepTimeUsed ? Number(dto.prepTimeUsed) : undefined;
    const speakingTime = dto.speakingTime ? Number(dto.speakingTime) : undefined;

    return this.practiceService.processSession(
      dto.sessionId,
      user.id,
      audioFile.buffer,
      prepTimeUsed,
      speakingTime,
    );
  }

  @Get('session/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async getSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    const session = await this.practiceService.getSessionWithDetails(sessionId);
    
    if (!session || session.userId !== user.id) {
      throw new BadRequestException('Session not found');
    }

    return session;
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async getUserSessions(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('part') part?: string,
  ) {
    return this.practiceService.getUserSessions(
      user.id,
      parseInt(limit || '20'),
      parseInt(offset || '0'),
      part ? parseInt(part) as 1 | 2 | 3 : undefined,
    );
  }

  // ========================
  // Progress Endpoints
  // ========================

  @Get('progress')
  @UseGuards(AuthGuard('jwt'))
  async getUserProgress(@CurrentUser() user: User) {
    return this.practiceService.getUserProgress(user.id);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@CurrentUser() user: User) {
    return this.practiceService.getStats(user.id);
  }

  // ========================
  // Model Answer (Premium)
  // ========================

  @Get('session/:sessionId/model-answer')
  @UseGuards(AuthGuard('jwt'))
  async getModelAnswer(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    const normalizedUser = await this.usersService.syncSubscriptionStatus(user.id);

    if (!normalizedUser || normalizedUser.subscriptionTier !== 'premium') {
      throw new ForbiddenException('Model answers are a premium feature');
    }

    return this.practiceService.generateModelAnswer(sessionId, user.id);
  }

  @Get('session/:sessionId/enhanced-model-answer')
  @UseGuards(AuthGuard('jwt'))
  async getEnhancedModelAnswer(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    const normalizedUser = await this.usersService.syncSubscriptionStatus(user.id);

    if (!normalizedUser || normalizedUser.subscriptionTier !== 'premium') {
      throw new ForbiddenException('Enhanced model answers are a premium feature');
    }

    return this.practiceService.generateEnhancedModelAnswer(sessionId, user.id);
  }
}
