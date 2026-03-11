import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReadingService } from './reading.service';
import { StartReadingSessionDto } from './dto/start-reading-session.dto';
import { SubmitReadingAnswerDto } from './dto/submit-reading-answer.dto';

@Controller('reading')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Get()
  getStatus() {
    return this.readingService.getStatus();
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

  @Post('sessions')
  startSession(@Body() body: StartReadingSessionDto) {
    return this.readingService.startSession(body);
  }

  @Post('sessions/:sessionId/answers')
  submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() body: SubmitReadingAnswerDto,
  ) {
    return this.readingService.submitAnswer(sessionId, body);
  }

  @Post('sessions/:sessionId/complete')
  completeSession(@Param('sessionId') sessionId: string) {
    return this.readingService.completeSession(sessionId);
  }

  @Get('sessions/:sessionId/results')
  getResults(@Param('sessionId') sessionId: string) {
    return this.readingService.getResults(sessionId);
  }

  @Get('progress')
  getProgress() {
    return this.readingService.getProgress();
  }

  @Get('progress/question-types')
  getQuestionTypeProgress() {
    return this.readingService.getQuestionTypeProgress();
  }
}
