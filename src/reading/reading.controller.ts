import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { ReadingService } from './reading.service';
import { ReadingAnalysisService } from './services/reading-analysis.service';
import { StartReadingSessionDto } from './dto/start-reading-session.dto';
import { SubmitReadingAnswerDto } from './dto/submit-reading-answer.dto';
import { CompleteReadingSessionDto } from './dto/complete-reading-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reading')
@UseGuards(JwtAuthGuard)
export class ReadingController {
  constructor(
    private readonly readingService: ReadingService,
    private readonly readingAnalysisService: ReadingAnalysisService,
  ) {}

  @Get()
  getStatus() {
    return this.readingService.getStatus();
  }

  @Get('recommended')
  getRecommended(@CurrentUser() user: User) {
    return this.readingService.getRecommendedPassage(user.id);
  }

  @Get('passages')
  getPassages(
    @Query('testType') testType?: string,
    @Query('difficulty') difficulty?: string,
    @Query('topic') topic?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.readingService.getPassageCatalog({
      testType,
      difficulty,
      topic,
      limit,
      offset,
    });
  }

  @Get('passages/:id')
  getPassage(@Param('id') id: string) {
    return this.readingService.getPassage(id);
  }

  @Get('sessions/:sessionId')
  getSession(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.readingService.getSession(sessionId, user.id);
  }

  @Post('sessions')
  startSession(@CurrentUser() user: User, @Body() body: StartReadingSessionDto) {
    return this.readingService.startSession(user.id, body);
  }

  @Post('sessions/:sessionId/answers')
  submitAnswer(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() body: SubmitReadingAnswerDto,
  ) {
    return this.readingService.submitAnswer(sessionId, user.id, body);
  }

  @Post('sessions/:sessionId/complete')
  completeSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() body: CompleteReadingSessionDto,
  ) {
    return this.readingService.completeSession(sessionId, user.id, body?.forceComplete);
  }

  @Get('sessions/:sessionId/results')
  getResults(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.readingService.getResults(sessionId, user.id);
  }

  @Get('sessions/:sessionId/analysis')
  getAnalysis(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.readingAnalysisService.analyzeSession(sessionId, user.id);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: User) {
    return this.readingService.getProgress(user.id);
  }

  @Get('progress/question-types')
  getQuestionTypeProgress(@CurrentUser() user: User) {
    return this.readingService.getQuestionTypeProgress(user.id);
  }

  @Get('achievements')
  getAchievements(@CurrentUser() user: User) {
    return this.readingService.getUserAchievements(user.id);
  }
}
