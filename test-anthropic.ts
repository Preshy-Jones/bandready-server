const { ConfigModule } = require('@nestjs/config');
const { Test } = require('@nestjs/testing');
const { EssayAssessmentService } = require('./src/writing/services/essay-assessment.service');
const { PrismaService } = require('./src/common/prisma/prisma.service');

async function run() {
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
    providers: [EssayAssessmentService, PrismaService],
  }).compile();

  const service = module.get(EssayAssessmentService);

  const essayText = `Some individuals prefer to live a stable life by doing familiar activities and avoiding change, while others believe that change is always beneficial. This essay will discuss both perspectives before explaining why I believe a balanced approach to change is the most sensible.

On the one hand, many people value routine because it provides a sense of security and predictability. By maintaining consistent habits, individuals can reduce stress and avoid the uncertainty that often accompanies major changes. For example, people who remain in the same profession for many years may develop deep expertise and enjoy long-term financial stability. In addition, avoiding frequent change can help individuals maintain strong relationships and a stable lifestyle, which is particularly important for those with family responsibilities.

On the other hand, proponents of change argue that it is essential for personal growth and development. Embracing change allows individuals to acquire new skills, adapt to evolving circumstances, and discover new opportunities. In today’s rapidly changing world, those who resist change may struggle to remain relevant, particularly in the workplace. For instance, professionals who continually update their skills are more likely to progress in their careers than those who rely solely on past experience. Moreover, change can lead to greater self-awareness and resilience by encouraging people to step outside their comfort zones.

In my opinion, although change is not always easy, it is generally beneficial when approached thoughtfully. While excessive or unnecessary change can be disruptive, refusing to change altogether may limit personal and professional growth. Therefore, individuals should seek a balance between stability and adaptability in order to lead fulfilling and successful lives.`;
  const question = "Some people prefer to spend their lives doing the same things and avoiding change. Others, however, think that change is always a good thing.\n\nDiscuss both these views and give your own opinion.";

  try {
    console.log('Calling assessEssay...');
    const result = await service.assessEssay(
      essayText,
      question,
      'TASK2',
      'discussion',
      267,
      3,
      'ACADEMIC'
    );
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
