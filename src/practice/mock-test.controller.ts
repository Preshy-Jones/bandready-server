import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MockTestService } from './mock-test.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class StartMockTestDto {
  timingMode: 'strict' | 'flexible';
}

class SubmitQuestionDto {
  sessionId: string;
}

@Controller('practice/mock-test')
@UseGuards(AuthGuard('jwt'))
export class MockTestController {
  constructor(private readonly mockTestService: MockTestService) {}

  /**
   * Start a new mock test
   * POST /practice/mock-test/start
   */
  @Post('start')
  async start(
    @CurrentUser() user: User,
    @Body() dto: StartMockTestDto,
  ) {
    return this.mockTestService.startMockTest(user.id, dto.timingMode);
  }

  /**
   * Get current state of mock test
   * GET /practice/mock-test/:mockTestId/state
   */
  @Get(':mockTestId/state')
  async getState(
    @CurrentUser() user: User,
    @Param('mockTestId') mockTestId: string,
  ) {
    return this.mockTestService.getCurrentState(mockTestId, user.id);
  }

  /**
   * Submit current question and get next
   * POST /practice/mock-test/:mockTestId/submit-question
   */
  @Post(':mockTestId/submit-question')
  async submitQuestion(
    @CurrentUser() user: User,
    @Param('mockTestId') mockTestId: string,
    @Body() dto: SubmitQuestionDto,
  ) {
    return this.mockTestService.submitQuestionAndGetNext(
      mockTestId,
      dto.sessionId,
      user.id,
    );
  }

  /**
   * Finalize mock test - calculate overall score and generate analysis
   * POST /practice/mock-test/:mockTestId/finalize
   */
  @Post(':mockTestId/finalize')
  async finalize(
    @CurrentUser() user: User,
    @Param('mockTestId') mockTestId: string,
  ) {
    return this.mockTestService.finalizeMockTest(mockTestId, user.id);
  }

  /**
   * Get comprehensive results for completed mock test
   * GET /practice/mock-test/:mockTestId/results
   */
  @Get(':mockTestId/results')
  async getResults(
    @CurrentUser() user: User,
    @Param('mockTestId') mockTestId: string,
  ) {
    return this.mockTestService.getComprehensiveResults(mockTestId, user.id);
  }
}
