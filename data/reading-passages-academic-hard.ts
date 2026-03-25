import { ReadingPassageSeed } from './reading-passages-types';

export const academicHardPassages: ReadingPassageSeed[] = [
  // ──────────────────────────────────────────────────────────────
  // Passage 7: Business — Remote Work Trends (HARD)
  // Question types: Matching Sentence Endings (4), TFNG (5), MC (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'The Transformation of Work: Remote Employment in the Post-Pandemic Era',
    content: `The global pandemic of 2020–2021 precipitated the most rapid transformation of workplace practices in modern history. What had previously been a gradually increasing trend towards remote and flexible working arrangements became, almost overnight, the default mode of operation for millions of knowledge workers across the developed world. As organisations adjusted to this forced experiment, the question of whether remote work would persist beyond the pandemic generated intense debate among business leaders, economists, and employees themselves.

Prior to the pandemic, remote work was a relatively niche arrangement, primarily associated with freelancers, technology workers, and certain categories of corporate professionals. According to data from the International Labour Organization, fewer than 8 percent of workers in OECD countries regularly worked from home before 2020. By April of that year, this figure had risen to approximately 40 percent in many developed economies, a fivefold increase that would have seemed inconceivable just months earlier.

The rapid adoption of remote work was facilitated by decades of investment in digital infrastructure. Cloud computing platforms, video conferencing tools, and collaborative software had matured to a point where most professional tasks could be performed remotely with minimal loss of functionality. Companies that had already invested in digital transformation found the transition relatively seamless, while those that had relied on legacy systems and in-person processes faced significant disruption.

Proponents of remote work have argued that it offers substantial benefits to both employers and employees. For employers, reduced demand for office space can translate into significant cost savings on rent, utilities, and maintenance. A study by Global Workplace Analytics estimated that companies in the United States could save an average of $11,000 per year for each employee who works remotely half the time. For employees, the elimination of daily commutes saves both time and money, while the flexibility to work from any location can improve work-life balance and access to a wider range of housing options.

However, critics have raised valid concerns about the long-term sustainability and equity implications of widespread remote work. Research conducted by Microsoft's Human Factors Lab found that remote workers reported higher levels of digital fatigue and difficulty establishing clear boundaries between professional and personal life. Junior employees and those new to an organisation were particularly affected, as informal mentoring and spontaneous knowledge-sharing, which typically occur through casual workplace interactions, were substantially diminished in virtual environments.

The question of productivity in remote work settings has produced conflicting evidence. A widely cited study by Stanford University economist Nicholas Bloom, conducted in partnership with a Chinese travel company before the pandemic, found that remote workers were 13 percent more productive than their office-based counterparts. However, subsequent research has yielded more nuanced results. A 2023 analysis by the National Bureau of Economic Research suggested that while individual task productivity might increase during remote work, collaborative innovation and creative problem-solving could suffer when teams lack regular in-person interaction.

The hybrid model, combining some days of remote work with regular in-person attendance, has emerged as the most popular arrangement among major employers. Companies such as Google, Microsoft, and JPMorgan Chase have implemented policies requiring employees to be present in the office for a specified number of days per week, typically two or three. This approach attempts to capture the flexibility benefits of remote work while preserving the collaborative advantages of physical proximity. Nevertheless, enforcing hybrid attendance policies has proven challenging, with many employees resisting what they perceive as an erosion of the autonomy they gained during the pandemic.

The geographic implications of remote work may prove to be among its most lasting effects. Workers freed from the necessity of living near their workplace have relocated to smaller cities, rural areas, and even different countries, seeking lower costs of living and improved quality of life. This redistribution of knowledge workers has the potential to revitalise economically declining regions, though it also raises concerns about the erosion of urban tax bases and the social cohesion of communities experiencing rapid demographic change.`,
    wordCount: 585,
    difficultyLevel: 'HARD',
    testType: 'ACADEMIC',
    topicCategory: 'Business',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'The global pandemic of 2020–2021 precipitated the most rapid transformation of workplace practices in modern history. What had previously been a gradually increasing trend towards remote and flexible working arrangements became, almost overnight, the default mode of operation for millions of knowledge workers across the developed world. As organisations adjusted to this forced experiment, the question of whether remote work would persist beyond the pandemic generated intense debate among business leaders, economists, and employees themselves.' },
      { label: 'B', content: 'Prior to the pandemic, remote work was a relatively niche arrangement, primarily associated with freelancers, technology workers, and certain categories of corporate professionals. According to data from the International Labour Organization, fewer than 8 percent of workers in OECD countries regularly worked from home before 2020. By April of that year, this figure had risen to approximately 40 percent in many developed economies, a fivefold increase that would have seemed inconceivable just months earlier.' },
      { label: 'C', content: 'The rapid adoption of remote work was facilitated by decades of investment in digital infrastructure. Cloud computing platforms, video conferencing tools, and collaborative software had matured to a point where most professional tasks could be performed remotely with minimal loss of functionality. Companies that had already invested in digital transformation found the transition relatively seamless, while those that had relied on legacy systems and in-person processes faced significant disruption.' },
      { label: 'D', content: 'Proponents of remote work have argued that it offers substantial benefits to both employers and employees. For employers, reduced demand for office space can translate into significant cost savings on rent, utilities, and maintenance. A study by Global Workplace Analytics estimated that companies in the United States could save an average of $11,000 per year for each employee who works remotely half the time. For employees, the elimination of daily commutes saves both time and money, while the flexibility to work from any location can improve work-life balance and access to a wider range of housing options.' },
      { label: 'E', content: 'However, critics have raised valid concerns about the long-term sustainability and equity implications of widespread remote work. Research conducted by Microsoft\'s Human Factors Lab found that remote workers reported higher levels of digital fatigue and difficulty establishing clear boundaries between professional and personal life. Junior employees and those new to an organisation were particularly affected, as informal mentoring and spontaneous knowledge-sharing, which typically occur through casual workplace interactions, were substantially diminished in virtual environments.' },
      { label: 'F', content: 'The question of productivity in remote work settings has produced conflicting evidence. A widely cited study by Stanford University economist Nicholas Bloom, conducted in partnership with a Chinese travel company before the pandemic, found that remote workers were 13 percent more productive than their office-based counterparts. However, subsequent research has yielded more nuanced results. A 2023 analysis by the National Bureau of Economic Research suggested that while individual task productivity might increase during remote work, collaborative innovation and creative problem-solving could suffer when teams lack regular in-person interaction.' },
      { label: 'G', content: 'The hybrid model, combining some days of remote work with regular in-person attendance, has emerged as the most popular arrangement among major employers. Companies such as Google, Microsoft, and JPMorgan Chase have implemented policies requiring employees to be present in the office for a specified number of days per week, typically two or three. This approach attempts to capture the flexibility benefits of remote work while preserving the collaborative advantages of physical proximity. Nevertheless, enforcing hybrid attendance policies has proven challenging, with many employees resisting what they perceive as an erosion of the autonomy they gained during the pandemic.' },
      { label: 'H', content: 'The geographic implications of remote work may prove to be among its most lasting effects. Workers freed from the necessity of living near their workplace have relocated to smaller cities, rural areas, and even different countries, seeking lower costs of living and improved quality of life. This redistribution of knowledge workers has the potential to revitalise economically declining regions, though it also raises concerns about the erosion of urban tax bases and the social cohesion of communities experiencing rapid demographic change.' },
    ],
    questionSets: [
      // Set 1: MATCHING SENTENCE ENDINGS (Questions 1-4)
      {
        questionType: 'MATCHING_SENTENCE_ENDINGS',
        instructions: 'Complete each sentence with the correct ending, A-F.',
        setData: {
          endings: [
            { label: 'A', text: 'because digital tools had already reached sufficient maturity.' },
            { label: 'B', text: 'due to the loss of informal workplace interactions.' },
            { label: 'C', text: 'as workers sought lower living costs elsewhere.' },
            { label: 'D', text: 'since legacy systems could not support remote operations.' },
            { label: 'E', text: 'while collaborative work may become less effective.' },
            { label: 'F', text: 'because employees resist returning to the office.' },
          ],
        },
        questions: [
          {
            questionNumber: 1,
            questionData: {
              prompt: 'The shift to remote work happened quickly',
              options: [
                { label: 'A', text: 'because digital tools had already reached sufficient maturity.' },
                { label: 'B', text: 'due to the loss of informal workplace interactions.' },
                { label: 'C', text: 'as workers sought lower living costs elsewhere.' },
                { label: 'D', text: 'since legacy systems could not support remote operations.' },
                { label: 'E', text: 'while collaborative work may become less effective.' },
                { label: 'F', text: 'because employees resist returning to the office.' },
              ],
            },
            correctAnswer: 'A',
            explanation: 'Paragraph C explains the rapid adoption was "facilitated by decades of investment in digital infrastructure" and that tools "had matured."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 2,
            questionData: {
              prompt: 'Junior employees were disproportionately disadvantaged',
              options: [
                { label: 'A', text: 'because digital tools had already reached sufficient maturity.' },
                { label: 'B', text: 'due to the loss of informal workplace interactions.' },
                { label: 'C', text: 'as workers sought lower living costs elsewhere.' },
                { label: 'D', text: 'since legacy systems could not support remote operations.' },
                { label: 'E', text: 'while collaborative work may become less effective.' },
                { label: 'F', text: 'because employees resist returning to the office.' },
              ],
            },
            correctAnswer: 'B',
            explanation: 'Paragraph E states junior employees were affected because "informal mentoring and spontaneous knowledge-sharing... were substantially diminished in virtual environments."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 3,
            questionData: {
              prompt: 'Individual productivity may rise with remote work',
              options: [
                { label: 'A', text: 'because digital tools had already reached sufficient maturity.' },
                { label: 'B', text: 'due to the loss of informal workplace interactions.' },
                { label: 'C', text: 'as workers sought lower living costs elsewhere.' },
                { label: 'D', text: 'since legacy systems could not support remote operations.' },
                { label: 'E', text: 'while collaborative work may become less effective.' },
                { label: 'F', text: 'because employees resist returning to the office.' },
              ],
            },
            correctAnswer: 'E',
            explanation: 'Paragraph F states that "individual task productivity might increase during remote work, collaborative innovation and creative problem-solving could suffer."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 4,
            questionData: {
              prompt: 'Urban tax bases may decline',
              options: [
                { label: 'A', text: 'because digital tools had already reached sufficient maturity.' },
                { label: 'B', text: 'due to the loss of informal workplace interactions.' },
                { label: 'C', text: 'as workers sought lower living costs elsewhere.' },
                { label: 'D', text: 'since legacy systems could not support remote operations.' },
                { label: 'E', text: 'while collaborative work may become less effective.' },
                { label: 'F', text: 'because employees resist returning to the office.' },
              ],
            },
            correctAnswer: 'C',
            explanation: 'Paragraph H discusses workers relocating "to smaller cities, rural areas, and even different countries, seeking lower costs of living," which raises concerns about "the erosion of urban tax bases."',
            skillTested: 'Inference',
          },
        ],
      },
      // Set 2: TRUE/FALSE/NOT GIVEN (Questions 5-9)
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the passage?',
        questions: [
          {
            questionNumber: 5,
            questionData: { prompt: 'Before 2020, more than 10 percent of OECD workers regularly worked from home.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph B states "fewer than 8 percent of workers in OECD countries regularly worked from home before 2020."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 6,
            questionData: { prompt: 'Companies can save approximately $11,000 per employee annually through full-time remote work.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph D specifies the savings are for employees "who works remotely half the time," not full-time.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 7,
            questionData: { prompt: 'Nicholas Bloom\'s study was conducted during the pandemic.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph F states the study was "conducted in partnership with a Chinese travel company before the pandemic."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 8,
            questionData: { prompt: 'Most major employers now require employees to be in the office every day.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph G states companies have implemented hybrid policies requiring "two or three" days per week in the office, not every day.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 9,
            questionData: { prompt: 'Remote workers who relocate tend to choose areas with better schools.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'Paragraph H mentions workers seeking "lower costs of living and improved quality of life" but does not mention school quality as a factor.',
            skillTested: 'Inference',
          },
        ],
      },
      // Set 3: MULTIPLE CHOICE (Questions 10-13)
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 10,
            questionData: {
              prompt: 'The writer\'s main purpose in paragraph A is to:',
              options: [
                { label: 'A', text: 'criticise companies for being unprepared for remote work' },
                { label: 'B', text: 'set the context for the discussion of remote work trends' },
                { label: 'C', text: 'argue that remote work should become permanent' },
                { label: 'D', text: 'describe the health impacts of the pandemic on workers' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph A introduces the topic by establishing the pandemic as the catalyst for a rapid shift to remote work, setting context for the detailed discussion that follows.',
            skillTested: 'Skimming',
          },
          {
            questionNumber: 11,
            questionData: {
              prompt: 'What challenge does paragraph G identify with hybrid work policies?',
              options: [
                { label: 'A', text: 'They are too expensive to implement' },
                { label: 'B', text: 'Technology does not support them adequately' },
                { label: 'C', text: 'Employees resist losing the autonomy they gained' },
                { label: 'D', text: 'Managers cannot monitor employee performance' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph G states "enforcing hybrid attendance policies has proven challenging, with many employees resisting what they perceive as an erosion of the autonomy they gained during the pandemic."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 12,
            questionData: {
              prompt: 'According to the passage, which of the following is a potential benefit of workers relocating from cities?',
              options: [
                { label: 'A', text: 'Improved public transport in rural areas' },
                { label: 'B', text: 'Economic revival of declining regions' },
                { label: 'C', text: 'Reduced housing costs in cities' },
                { label: 'D', text: 'Greater cultural diversity in small towns' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph H states the redistribution of knowledge workers "has the potential to revitalise economically declining regions."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 13,
            questionData: {
              prompt: 'The passage as a whole presents remote work as:',
              options: [
                { label: 'A', text: 'an entirely positive development for all workers' },
                { label: 'B', text: 'a temporary phenomenon that will soon end' },
                { label: 'C', text: 'a complex trend with both advantages and drawbacks' },
                { label: 'D', text: 'primarily harmful to employee wellbeing' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'The passage balances benefits (cost savings, flexibility, productivity gains) against concerns (digital fatigue, reduced collaboration, equity issues), presenting a nuanced view.',
            skillTested: 'Skimming',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // Passage 8: Science — Quantum Computing (HARD)
  // Question types: Matching Information (5), Summary Completion (5), Sentence Completion (4) = 14 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Quantum Computing: Promise, Progress, and Obstacles',
    content: `Quantum computing, a technology that harnesses the principles of quantum mechanics to process information in fundamentally new ways, has progressed from theoretical curiosity to practical reality over the past three decades. While classical computers encode information as binary digits, or bits, which can exist in one of two states (0 or 1), quantum computers use quantum bits, or qubits, which can exist in multiple states simultaneously through a phenomenon known as superposition. This property, along with quantum entanglement and interference, gives quantum computers the potential to solve certain categories of problems exponentially faster than any classical machine.

The theoretical foundations of quantum computing were laid in the 1980s by physicists including Richard Feynman and David Deutsch. Feynman proposed that a computer based on quantum principles could simulate physical systems in ways that classical computers fundamentally could not, while Deutsch developed the concept of a universal quantum computer capable of performing any computation that quantum physics allows. However, translating these theoretical insights into working hardware proved enormously challenging, and it was not until the late 1990s that the first rudimentary quantum processors were constructed.

One of the most significant potential applications of quantum computing lies in cryptography. Current encryption systems, including the RSA algorithm that secures most internet communications, rely on the mathematical difficulty of factoring very large numbers. In 1994, mathematician Peter Shor demonstrated that a sufficiently powerful quantum computer could factor large numbers exponentially faster than any known classical algorithm, potentially rendering current encryption methods obsolete. This prospect has prompted governments and security agencies worldwide to invest heavily in both quantum computing research and the development of quantum-resistant encryption standards.

Drug discovery and materials science represent another area where quantum computing could have transformative impact. Simulating the behaviour of molecules at the quantum level is computationally intractable for classical computers beyond a certain level of complexity. Pharmaceutical companies hope that quantum computers will enable them to model molecular interactions with unprecedented accuracy, dramatically accelerating the identification of effective drug candidates. Similarly, materials scientists envision using quantum simulations to design new materials with specific properties, from more efficient solar cells to stronger and lighter aerospace components.

Despite the enormous potential, practical quantum computing faces formidable technical obstacles. Qubits are extremely fragile and susceptible to decoherence, the loss of quantum properties through interaction with the surrounding environment. Current quantum processors must be cooled to temperatures near absolute zero and shielded from electromagnetic interference to maintain qubit stability. Even with these precautions, error rates in quantum computations remain far higher than in classical computing, necessitating complex error-correction schemes that consume significant computational resources.

The race to achieve quantum supremacy, the point at which a quantum computer can perform a calculation that is practically impossible for any classical machine, has intensified in recent years. In 2019, Google claimed to have achieved this milestone using its 53-qubit Sycamore processor, which reportedly completed a specific computation in 200 seconds that would take the world's most powerful classical supercomputer approximately 10,000 years. However, IBM challenged this claim, arguing that with optimised algorithms, a classical supercomputer could complete the same task in approximately two and a half days, suggesting that the threshold of quantum supremacy had not been definitively crossed.

The commercial quantum computing landscape is dominated by a handful of major technology companies and well-funded startups. IBM, Google, and Microsoft have all invested billions of dollars in quantum research and development, pursuing different technical approaches. IBM favours superconducting qubit technology and has made its quantum processors available through cloud-based services, enabling researchers and businesses to experiment with quantum algorithms without owning quantum hardware. Google has focused on demonstrating computational milestones, while Microsoft has pursued a more speculative approach based on topological qubits, which theoretically offer greater stability but have proven difficult to construct.

Most experts agree that large-scale, fault-tolerant quantum computers capable of solving commercially relevant problems remain years, perhaps decades, away. In the interim, researchers are exploring hybrid approaches that combine classical and quantum computing resources to tackle problems that are difficult but not impossible for classical machines alone. This pragmatic strategy, sometimes called the NISQ (Noisy Intermediate-Scale Quantum) approach, seeks to extract useful results from current quantum processors despite their limitations.`,
    wordCount: 645,
    difficultyLevel: 'HARD',
    testType: 'ACADEMIC',
    topicCategory: 'Science',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'Quantum computing, a technology that harnesses the principles of quantum mechanics to process information in fundamentally new ways, has progressed from theoretical curiosity to practical reality over the past three decades. While classical computers encode information as binary digits, or bits, which can exist in one of two states (0 or 1), quantum computers use quantum bits, or qubits, which can exist in multiple states simultaneously through a phenomenon known as superposition. This property, along with quantum entanglement and interference, gives quantum computers the potential to solve certain categories of problems exponentially faster than any classical machine.' },
      { label: 'B', content: 'The theoretical foundations of quantum computing were laid in the 1980s by physicists including Richard Feynman and David Deutsch. Feynman proposed that a computer based on quantum principles could simulate physical systems in ways that classical computers fundamentally could not, while Deutsch developed the concept of a universal quantum computer capable of performing any computation that quantum physics allows. However, translating these theoretical insights into working hardware proved enormously challenging, and it was not until the late 1990s that the first rudimentary quantum processors were constructed.' },
      { label: 'C', content: 'One of the most significant potential applications of quantum computing lies in cryptography. Current encryption systems, including the RSA algorithm that secures most internet communications, rely on the mathematical difficulty of factoring very large numbers. In 1994, mathematician Peter Shor demonstrated that a sufficiently powerful quantum computer could factor large numbers exponentially faster than any known classical algorithm, potentially rendering current encryption methods obsolete. This prospect has prompted governments and security agencies worldwide to invest heavily in both quantum computing research and the development of quantum-resistant encryption standards.' },
      { label: 'D', content: 'Drug discovery and materials science represent another area where quantum computing could have transformative impact. Simulating the behaviour of molecules at the quantum level is computationally intractable for classical computers beyond a certain level of complexity. Pharmaceutical companies hope that quantum computers will enable them to model molecular interactions with unprecedented accuracy, dramatically accelerating the identification of effective drug candidates. Similarly, materials scientists envision using quantum simulations to design new materials with specific properties, from more efficient solar cells to stronger and lighter aerospace components.' },
      { label: 'E', content: 'Despite the enormous potential, practical quantum computing faces formidable technical obstacles. Qubits are extremely fragile and susceptible to decoherence, the loss of quantum properties through interaction with the surrounding environment. Current quantum processors must be cooled to temperatures near absolute zero and shielded from electromagnetic interference to maintain qubit stability. Even with these precautions, error rates in quantum computations remain far higher than in classical computing, necessitating complex error-correction schemes that consume significant computational resources.' },
      { label: 'F', content: 'The race to achieve quantum supremacy, the point at which a quantum computer can perform a calculation that is practically impossible for any classical machine, has intensified in recent years. In 2019, Google claimed to have achieved this milestone using its 53-qubit Sycamore processor, which reportedly completed a specific computation in 200 seconds that would take the world\'s most powerful classical supercomputer approximately 10,000 years. However, IBM challenged this claim, arguing that with optimised algorithms, a classical supercomputer could complete the same task in approximately two and a half days, suggesting that the threshold of quantum supremacy had not been definitively crossed.' },
      { label: 'G', content: 'The commercial quantum computing landscape is dominated by a handful of major technology companies and well-funded startups. IBM, Google, and Microsoft have all invested billions of dollars in quantum research and development, pursuing different technical approaches. IBM favours superconducting qubit technology and has made its quantum processors available through cloud-based services, enabling researchers and businesses to experiment with quantum algorithms without owning quantum hardware. Google has focused on demonstrating computational milestones, while Microsoft has pursued a more speculative approach based on topological qubits, which theoretically offer greater stability but have proven difficult to construct.' },
      { label: 'H', content: 'Most experts agree that large-scale, fault-tolerant quantum computers capable of solving commercially relevant problems remain years, perhaps decades, away. In the interim, researchers are exploring hybrid approaches that combine classical and quantum computing resources to tackle problems that are difficult but not impossible for classical machines alone. This pragmatic strategy, sometimes called the NISQ (Noisy Intermediate-Scale Quantum) approach, seeks to extract useful results from current quantum processors despite their limitations.' },
    ],
    questionSets: [
      // Set 1: MATCHING INFORMATION (Questions 1-5)
      {
        questionType: 'MATCHING_INFORMATION',
        instructions: 'Which paragraph contains the following information?',
        questions: [
          {
            questionNumber: 1,
            questionData: {
              prompt: 'A dispute between two companies about a computational achievement',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'F',
            explanation: 'Paragraph F describes Google\'s claim of quantum supremacy and IBM\'s challenge to that claim.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 2,
            questionData: {
              prompt: 'The potential application of quantum computing to pharmaceutical research',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'D',
            explanation: 'Paragraph D discusses how pharmaceutical companies hope quantum computers will model molecular interactions to accelerate drug discovery.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 3,
            questionData: {
              prompt: 'A description of the physical conditions needed to operate quantum processors',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'E',
            explanation: 'Paragraph E describes cooling to near absolute zero and shielding from electromagnetic interference.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 4,
            questionData: {
              prompt: 'The threat that quantum computing poses to current internet security',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'C',
            explanation: 'Paragraph C discusses how quantum computers could break RSA encryption, "potentially rendering current encryption methods obsolete."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 5,
            questionData: {
              prompt: 'A strategy for using current imperfect quantum computers productively',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'H',
            explanation: 'Paragraph H describes the NISQ approach — hybrid classical-quantum methods that extract useful results from current imperfect processors.',
            skillTested: 'Scanning',
          },
        ],
      },
      // Set 2: SUMMARY COMPLETION (Questions 6-10)
      {
        questionType: 'SUMMARY_COMPLETION',
        instructions: 'Complete the summary. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        questions: [
          {
            questionNumber: 6,
            questionData: { prompt: 'Qubits can exist in multiple states at once through a phenomenon called _______.' },
            correctAnswer: ['superposition'],
            explanation: 'Paragraph A: qubits "can exist in multiple states simultaneously through a phenomenon known as superposition."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 7,
            questionData: { prompt: 'The loss of quantum properties due to environmental interaction is known as _______.' },
            correctAnswer: ['decoherence'],
            explanation: 'Paragraph E defines decoherence as "the loss of quantum properties through interaction with the surrounding environment."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 8,
            questionData: { prompt: 'Google\'s quantum supremacy claim was based on its _______ processor.' },
            correctAnswer: ['Sycamore'],
            explanation: 'Paragraph F: Google used "its 53-qubit Sycamore processor."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 9,
            questionData: { prompt: 'IBM makes its quantum processors accessible through _______ services.' },
            correctAnswer: ['cloud-based', 'cloud based'],
            explanation: 'Paragraph G: IBM "has made its quantum processors available through cloud-based services."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 10,
            questionData: { prompt: 'Microsoft is developing _______ qubits, which theoretically offer greater stability.' },
            correctAnswer: ['topological'],
            explanation: 'Paragraph G: Microsoft "has pursued a more speculative approach based on topological qubits."',
            skillTested: 'Scanning',
          },
        ],
      },
      // Set 3: SENTENCE COMPLETION (Questions 11-14)
      {
        questionType: 'SENTENCE_COMPLETION',
        instructions: 'Complete the sentences. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
        questions: [
          {
            questionNumber: 11,
            questionData: { prompt: 'The RSA algorithm protects internet communications by relying on the difficulty of _______ very large numbers.' },
            correctAnswer: ['factoring'],
            explanation: 'Paragraph C: the RSA algorithm relies on "the mathematical difficulty of factoring very large numbers."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'Richard Feynman suggested that quantum computers could _______ physical systems better than classical computers.' },
            correctAnswer: ['simulate'],
            explanation: 'Paragraph B: Feynman proposed a quantum computer "could simulate physical systems in ways that classical computers fundamentally could not."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'Quantum processors must be cooled to temperatures close to _______ to function.' },
            correctAnswer: ['absolute zero'],
            explanation: 'Paragraph E: "Current quantum processors must be cooled to temperatures near absolute zero."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 14,
            questionData: { prompt: 'The NISQ approach combines classical and quantum computing to address _______ problems.' },
            correctAnswer: ['difficult'],
            explanation: 'Paragraph H: hybrid approaches "tackle problems that are difficult but not impossible for classical machines alone."',
            skillTested: 'Inference',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // Passage 9: Culture — Language Extinction (HARD)
  // Question types: TFNG (5), Matching Headings (5), Short Answer (3) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'The Silent Crisis: Language Death in the Modern World',
    content: `Of the approximately 7,000 languages currently spoken around the world, linguists estimate that between 50 and 90 percent will have disappeared by the end of this century. A language is considered endangered when it is no longer being learned by children as a first language, and it is classified as extinct when its last native speaker dies. According to UNESCO, a language dies somewhere in the world approximately every two weeks, a rate of loss that some scholars have compared to the extinction of biological species.

The causes of language death are complex and interrelated, but they can broadly be divided into two categories: external pressures and internal shifts. External pressures include colonisation, forced assimilation policies, and the economic dominance of certain languages. Throughout history, colonial powers systematically suppressed indigenous languages, often through policies that punished the use of native tongues in schools and public life. While such overt suppression has largely ended, its effects continue to reverberate through communities where indigenous languages were interrupted across multiple generations.

Internal shifts occur when speakers voluntarily abandon a language in favour of a more economically or socially dominant one. Parents may choose to raise their children in a majority language because they believe it will provide better educational and economic opportunities. This decision, while rational from an individual perspective, can lead to the rapid decline of a community language within just two or three generations. Globalisation and the dominance of a small number of languages in media, technology, and commerce have accelerated this process considerably.

The loss of a language represents far more than the disappearance of a communication system. Languages encode unique systems of knowledge about the natural world, including ecological relationships, medicinal plant properties, and navigational techniques that may have no equivalent in other languages. The Inuit languages, for example, contain dozens of terms for different types of snow and ice conditions, reflecting centuries of accumulated environmental knowledge. When such a language disappears, this specialised knowledge often vanishes with it.

Languages also embody distinctive ways of conceptualising time, space, causality, and social relationships. The Hopi language of the American Southwest, famously studied by linguist Benjamin Lee Whorf, structures temporal concepts very differently from European languages. The Australian Aboriginal language Guugu Yimithirr uses absolute cardinal directions rather than relative spatial terms, so its speakers say the equivalent of "the cup is to the north of the plate" rather than "the cup is to the left of the plate." Such linguistic diversity offers valuable insights into the range of human cognitive and cultural possibilities.

Efforts to preserve and revitalise endangered languages have taken various forms. Documentation projects, often involving collaborations between linguists and community elders, create comprehensive records of grammar, vocabulary, and oral traditions before they are lost. Digital technology has opened new avenues for language preservation, with mobile applications, online dictionaries, and social media platforms being used to support language learning and daily use among younger generations.

The most celebrated example of language revitalisation is the case of Hebrew, which was revived as a spoken language in the late nineteenth and early twentieth centuries after centuries of use primarily as a liturgical and literary language. More recently, the Māori language in New Zealand has experienced significant revitalisation through a comprehensive strategy that includes Māori-medium schools known as kura kaupapa, Māori-language television and radio broadcasting, and the designation of Māori as an official language of New Zealand.

However, the challenges facing language revitalisation efforts are considerable. Successful revival typically requires sustained institutional support, community commitment, and significant financial resources. Many endangered languages are spoken by small, economically marginalised communities that lack the resources to mount comprehensive preservation programmes. Furthermore, there is an inherent tension between promoting linguistic diversity and ensuring that minority language speakers have access to the educational and economic opportunities associated with dominant languages.`,
    wordCount: 570,
    difficultyLevel: 'HARD',
    testType: 'ACADEMIC',
    topicCategory: 'Culture',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'Of the approximately 7,000 languages currently spoken around the world, linguists estimate that between 50 and 90 percent will have disappeared by the end of this century. A language is considered endangered when it is no longer being learned by children as a first language, and it is classified as extinct when its last native speaker dies. According to UNESCO, a language dies somewhere in the world approximately every two weeks, a rate of loss that some scholars have compared to the extinction of biological species.' },
      { label: 'B', content: 'The causes of language death are complex and interrelated, but they can broadly be divided into two categories: external pressures and internal shifts. External pressures include colonisation, forced assimilation policies, and the economic dominance of certain languages. Throughout history, colonial powers systematically suppressed indigenous languages, often through policies that punished the use of native tongues in schools and public life. While such overt suppression has largely ended, its effects continue to reverberate through communities where indigenous languages were interrupted across multiple generations.' },
      { label: 'C', content: 'Internal shifts occur when speakers voluntarily abandon a language in favour of a more economically or socially dominant one. Parents may choose to raise their children in a majority language because they believe it will provide better educational and economic opportunities. This decision, while rational from an individual perspective, can lead to the rapid decline of a community language within just two or three generations. Globalisation and the dominance of a small number of languages in media, technology, and commerce have accelerated this process considerably.' },
      { label: 'D', content: 'The loss of a language represents far more than the disappearance of a communication system. Languages encode unique systems of knowledge about the natural world, including ecological relationships, medicinal plant properties, and navigational techniques that may have no equivalent in other languages. The Inuit languages, for example, contain dozens of terms for different types of snow and ice conditions, reflecting centuries of accumulated environmental knowledge. When such a language disappears, this specialised knowledge often vanishes with it.' },
      { label: 'E', content: 'Languages also embody distinctive ways of conceptualising time, space, causality, and social relationships. The Hopi language of the American Southwest, famously studied by linguist Benjamin Lee Whorf, structures temporal concepts very differently from European languages. The Australian Aboriginal language Guugu Yimithirr uses absolute cardinal directions rather than relative spatial terms, so its speakers say the equivalent of "the cup is to the north of the plate" rather than "the cup is to the left of the plate." Such linguistic diversity offers valuable insights into the range of human cognitive and cultural possibilities.' },
      { label: 'F', content: 'Efforts to preserve and revitalise endangered languages have taken various forms. Documentation projects, often involving collaborations between linguists and community elders, create comprehensive records of grammar, vocabulary, and oral traditions before they are lost. Digital technology has opened new avenues for language preservation, with mobile applications, online dictionaries, and social media platforms being used to support language learning and daily use among younger generations.' },
      { label: 'G', content: 'The most celebrated example of language revitalisation is the case of Hebrew, which was revived as a spoken language in the late nineteenth and early twentieth centuries after centuries of use primarily as a liturgical and literary language. More recently, the Māori language in New Zealand has experienced significant revitalisation through a comprehensive strategy that includes Māori-medium schools known as kura kaupapa, Māori-language television and radio broadcasting, and the designation of Māori as an official language of New Zealand.' },
      { label: 'H', content: 'However, the challenges facing language revitalisation efforts are considerable. Successful revival typically requires sustained institutional support, community commitment, and significant financial resources. Many endangered languages are spoken by small, economically marginalised communities that lack the resources to mount comprehensive preservation programmes. Furthermore, there is an inherent tension between promoting linguistic diversity and ensuring that minority language speakers have access to the educational and economic opportunities associated with dominant languages.' },
    ],
    questionSets: [
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the passage?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'More than half of the world\'s languages may disappear within the next hundred years.' },
            correctAnswer: 'TRUE',
            explanation: 'Paragraph A: "between 50 and 90 percent will have disappeared by the end of this century."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Colonial language suppression policies are still widely practised today.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph B states "such overt suppression has largely ended," though its effects continue.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'A community language can decline significantly within two to three generations.' },
            correctAnswer: 'TRUE',
            explanation: 'Paragraph C: voluntary language shift "can lead to the rapid decline of a community language within just two or three generations."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'The Inuit have more words for snow than any other language group.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'Paragraph D mentions "dozens of terms for different types of snow and ice" but does not compare this to other language groups.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 5,
            questionData: { prompt: 'Hebrew was successfully revived despite having no native speakers for centuries.' },
            correctAnswer: 'TRUE',
            explanation: 'Paragraph G describes Hebrew being "revived as a spoken language" after "centuries of use primarily as a liturgical and literary language" — implying it had no native speakers.',
            skillTested: 'Inference',
          },
        ],
      },
      {
        questionType: 'MATCHING_HEADINGS',
        instructions: 'Choose the correct heading for each paragraph from the list below.',
        setData: {
          headings: [
            { label: 'i', text: 'The scale of language loss' },
            { label: 'ii', text: 'Languages as repositories of knowledge' },
            { label: 'iii', text: 'External forces driving language death' },
            { label: 'iv', text: 'Voluntary language shift and globalisation' },
            { label: 'v', text: 'Different cognitive worlds encoded in language' },
            { label: 'vi', text: 'Modern tools for language preservation' },
            { label: 'vii', text: 'Success stories in language revival' },
            { label: 'viii', text: 'Barriers to language revitalisation' },
          ],
        },
        questions: [
          {
            questionNumber: 6,
            questionData: {
              prompt: 'Paragraph B',
              options: [
                { label: 'i', text: 'The scale of language loss' },
                { label: 'ii', text: 'Languages as repositories of knowledge' },
                { label: 'iii', text: 'External forces driving language death' },
                { label: 'iv', text: 'Voluntary language shift and globalisation' },
                { label: 'v', text: 'Different cognitive worlds encoded in language' },
                { label: 'vi', text: 'Modern tools for language preservation' },
                { label: 'vii', text: 'Success stories in language revival' },
                { label: 'viii', text: 'Barriers to language revitalisation' },
              ],
            },
            correctAnswer: 'iii',
            explanation: 'Paragraph B discusses external pressures: colonisation, forced assimilation, and economic dominance.',
            skillTested: 'Skimming',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'Paragraph D',
              options: [
                { label: 'i', text: 'The scale of language loss' },
                { label: 'ii', text: 'Languages as repositories of knowledge' },
                { label: 'iii', text: 'External forces driving language death' },
                { label: 'iv', text: 'Voluntary language shift and globalisation' },
                { label: 'v', text: 'Different cognitive worlds encoded in language' },
                { label: 'vi', text: 'Modern tools for language preservation' },
                { label: 'vii', text: 'Success stories in language revival' },
                { label: 'viii', text: 'Barriers to language revitalisation' },
              ],
            },
            correctAnswer: 'ii',
            explanation: 'Paragraph D discusses how languages encode knowledge about the natural world, ecology, and medicine.',
            skillTested: 'Skimming',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'Paragraph E',
              options: [
                { label: 'i', text: 'The scale of language loss' },
                { label: 'ii', text: 'Languages as repositories of knowledge' },
                { label: 'iii', text: 'External forces driving language death' },
                { label: 'iv', text: 'Voluntary language shift and globalisation' },
                { label: 'v', text: 'Different cognitive worlds encoded in language' },
                { label: 'vi', text: 'Modern tools for language preservation' },
                { label: 'vii', text: 'Success stories in language revival' },
                { label: 'viii', text: 'Barriers to language revitalisation' },
              ],
            },
            correctAnswer: 'v',
            explanation: 'Paragraph E discusses how languages embody different ways of conceptualising time, space, and social relationships.',
            skillTested: 'Skimming',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'Paragraph G',
              options: [
                { label: 'i', text: 'The scale of language loss' },
                { label: 'ii', text: 'Languages as repositories of knowledge' },
                { label: 'iii', text: 'External forces driving language death' },
                { label: 'iv', text: 'Voluntary language shift and globalisation' },
                { label: 'v', text: 'Different cognitive worlds encoded in language' },
                { label: 'vi', text: 'Modern tools for language preservation' },
                { label: 'vii', text: 'Success stories in language revival' },
                { label: 'viii', text: 'Barriers to language revitalisation' },
              ],
            },
            correctAnswer: 'vii',
            explanation: 'Paragraph G presents Hebrew and Māori as celebrated examples of successful language revitalisation.',
            skillTested: 'Skimming',
          },
          {
            questionNumber: 10,
            questionData: {
              prompt: 'Paragraph H',
              options: [
                { label: 'i', text: 'The scale of language loss' },
                { label: 'ii', text: 'Languages as repositories of knowledge' },
                { label: 'iii', text: 'External forces driving language death' },
                { label: 'iv', text: 'Voluntary language shift and globalisation' },
                { label: 'v', text: 'Different cognitive worlds encoded in language' },
                { label: 'vi', text: 'Modern tools for language preservation' },
                { label: 'vii', text: 'Success stories in language revival' },
                { label: 'viii', text: 'Barriers to language revitalisation' },
              ],
            },
            correctAnswer: 'viii',
            explanation: 'Paragraph H discusses the considerable challenges — institutional support, funding, and tension with economic opportunity.',
            skillTested: 'Skimming',
          },
        ],
      },
      {
        questionType: 'SHORT_ANSWER',
        instructions: 'Answer the following questions. Choose NO MORE THAN THREE WORDS from the passage.',
        questions: [
          {
            questionNumber: 11,
            questionData: { prompt: 'How often does a language die, according to UNESCO?' },
            correctAnswer: ['every two weeks'],
            explanation: 'Paragraph A: "a language dies somewhere in the world approximately every two weeks."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'What type of directions does the Guugu Yimithirr language use instead of relative spatial terms?' },
            correctAnswer: ['absolute cardinal directions', 'cardinal directions'],
            explanation: 'Paragraph E: "Guugu Yimithirr uses absolute cardinal directions rather than relative spatial terms."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'What are Māori-medium schools called in New Zealand?' },
            correctAnswer: ['kura kaupapa'],
            explanation: 'Paragraph G: "Māori-medium schools known as kura kaupapa."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // Passage 10: Environment — Renewable Energy (HARD)
  // Question types: YNNG (4), MC (5), Summary Completion (5) = 14 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'The Global Transition to Renewable Energy',
    content: `The transition from fossil fuels to renewable energy sources represents one of the most consequential economic and technological shifts in human history. Driven by growing awareness of climate change, declining technology costs, and evolving government policies, renewable energy capacity has expanded at an unprecedented pace over the past two decades. In 2022, renewable sources accounted for approximately 30 percent of global electricity generation, up from just 19 percent in 2010, with solar and wind power leading the expansion.

Solar photovoltaic technology has experienced the most dramatic cost reduction of any energy source in history. The cost of solar panels has fallen by more than 99 percent since the 1970s, and by approximately 90 percent since 2010 alone. This decline, driven by manufacturing economies of scale, improved cell efficiency, and intense market competition, has made solar power cost-competitive with fossil fuels in most regions of the world. In many countries, new solar installations now produce electricity more cheaply than new coal or natural gas plants, a milestone that was widely considered unachievable just a decade ago.

Wind energy has followed a similar trajectory, though less dramatic in percentage terms. Onshore wind turbines have become significantly larger and more efficient over the past two decades, with the average capacity of new installations increasing from approximately 1 megawatt in 2000 to over 4 megawatts by 2023. Offshore wind, while more expensive than its onshore counterpart, offers the advantage of stronger and more consistent wind resources. The development of floating offshore wind platforms, which can operate in deeper waters where fixed foundations are impractical, has expanded the potential geographic scope of offshore wind considerably.

Energy storage represents perhaps the most critical challenge facing the renewable energy transition. Solar and wind power are inherently intermittent, producing electricity only when the sun shines or the wind blows. To maintain a stable and reliable electricity grid, this variability must be managed through some combination of energy storage, grid interconnection, demand management, and backup generation. Lithium-ion battery technology, which has benefited from massive investment driven by the electric vehicle industry, has emerged as the leading short-term storage solution, with costs declining by approximately 97 percent since 1991.

However, lithium-ion batteries are not well-suited for long-duration storage, meaning the storage of energy for periods longer than four to eight hours. Several alternative technologies are being developed to address this gap, including compressed air energy storage, gravity-based storage systems, and green hydrogen produced through electrolysis powered by renewable electricity. Of these, green hydrogen has attracted the most attention and investment, as it can serve not only as an energy storage medium but also as a zero-carbon fuel for industrial processes, heavy transport, and heating applications that are difficult to electrify directly.

The geographic distribution of renewable energy adoption varies considerably. European nations, led by Denmark, Germany, and Spain, were early leaders in wind power deployment, while China has emerged as the dominant force in global solar manufacturing and installation. The United States has seen rapid growth in both wind and solar, though the pace has been uneven across states due to differences in policy support and natural resource availability. In the developing world, renewable energy offers the prospect of expanding electricity access without the need for costly centralised grid infrastructure, with distributed solar systems providing power to communities that have never been connected to traditional electricity networks.

The transition to renewable energy has significant implications for labour markets. While the decline of fossil fuel industries threatens jobs in coal mining, oil extraction, and related sectors, the renewable energy industry has become a major source of employment. The International Renewable Energy Agency reported that the global renewable energy sector employed approximately 13.7 million people in 2022, a figure that is expected to grow substantially as deployment continues to accelerate. However, the geographic and skill profiles of renewable energy jobs often differ from those in fossil fuel industries, creating challenges for workers and communities dependent on conventional energy sectors.

Government policy plays a decisive role in shaping the pace and direction of the energy transition. Carbon pricing mechanisms, renewable portfolio standards, tax incentives, and direct subsidies have all been used to accelerate renewable deployment. The European Union's Emissions Trading System and the United States' Inflation Reduction Act of 2022 represent two of the most significant policy interventions, each employing different approaches to incentivise clean energy investment. The effectiveness of these policies ultimately depends on their stringency, stability, and ability to attract sustained private capital investment.`,
    wordCount: 670,
    difficultyLevel: 'HARD',
    testType: 'ACADEMIC',
    topicCategory: 'Environment',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'The transition from fossil fuels to renewable energy sources represents one of the most consequential economic and technological shifts in human history. Driven by growing awareness of climate change, declining technology costs, and evolving government policies, renewable energy capacity has expanded at an unprecedented pace over the past two decades. In 2022, renewable sources accounted for approximately 30 percent of global electricity generation, up from just 19 percent in 2010, with solar and wind power leading the expansion.' },
      { label: 'B', content: 'Solar photovoltaic technology has experienced the most dramatic cost reduction of any energy source in history. The cost of solar panels has fallen by more than 99 percent since the 1970s, and by approximately 90 percent since 2010 alone. This decline, driven by manufacturing economies of scale, improved cell efficiency, and intense market competition, has made solar power cost-competitive with fossil fuels in most regions of the world. In many countries, new solar installations now produce electricity more cheaply than new coal or natural gas plants, a milestone that was widely considered unachievable just a decade ago.' },
      { label: 'C', content: 'Wind energy has followed a similar trajectory, though less dramatic in percentage terms. Onshore wind turbines have become significantly larger and more efficient over the past two decades, with the average capacity of new installations increasing from approximately 1 megawatt in 2000 to over 4 megawatts by 2023. Offshore wind, while more expensive than its onshore counterpart, offers the advantage of stronger and more consistent wind resources. The development of floating offshore wind platforms, which can operate in deeper waters where fixed foundations are impractical, has expanded the potential geographic scope of offshore wind considerably.' },
      { label: 'D', content: 'Energy storage represents perhaps the most critical challenge facing the renewable energy transition. Solar and wind power are inherently intermittent, producing electricity only when the sun shines or the wind blows. To maintain a stable and reliable electricity grid, this variability must be managed through some combination of energy storage, grid interconnection, demand management, and backup generation. Lithium-ion battery technology, which has benefited from massive investment driven by the electric vehicle industry, has emerged as the leading short-term storage solution, with costs declining by approximately 97 percent since 1991.' },
      { label: 'E', content: 'However, lithium-ion batteries are not well-suited for long-duration storage, meaning the storage of energy for periods longer than four to eight hours. Several alternative technologies are being developed to address this gap, including compressed air energy storage, gravity-based storage systems, and green hydrogen produced through electrolysis powered by renewable electricity. Of these, green hydrogen has attracted the most attention and investment, as it can serve not only as an energy storage medium but also as a zero-carbon fuel for industrial processes, heavy transport, and heating applications that are difficult to electrify directly.' },
      { label: 'F', content: 'The geographic distribution of renewable energy adoption varies considerably. European nations, led by Denmark, Germany, and Spain, were early leaders in wind power deployment, while China has emerged as the dominant force in global solar manufacturing and installation. The United States has seen rapid growth in both wind and solar, though the pace has been uneven across states due to differences in policy support and natural resource availability. In the developing world, renewable energy offers the prospect of expanding electricity access without the need for costly centralised grid infrastructure, with distributed solar systems providing power to communities that have never been connected to traditional electricity networks.' },
      { label: 'G', content: 'The transition to renewable energy has significant implications for labour markets. While the decline of fossil fuel industries threatens jobs in coal mining, oil extraction, and related sectors, the renewable energy industry has become a major source of employment. The International Renewable Energy Agency reported that the global renewable energy sector employed approximately 13.7 million people in 2022, a figure that is expected to grow substantially as deployment continues to accelerate. However, the geographic and skill profiles of renewable energy jobs often differ from those in fossil fuel industries, creating challenges for workers and communities dependent on conventional energy sectors.' },
      { label: 'H', content: 'Government policy plays a decisive role in shaping the pace and direction of the energy transition. Carbon pricing mechanisms, renewable portfolio standards, tax incentives, and direct subsidies have all been used to accelerate renewable deployment. The European Union\'s Emissions Trading System and the United States\' Inflation Reduction Act of 2022 represent two of the most significant policy interventions, each employing different approaches to incentivise clean energy investment. The effectiveness of these policies ultimately depends on their stringency, stability, and ability to attract sustained private capital investment.' },
    ],
    questionSets: [
      {
        questionType: 'YES_NO_NOT_GIVEN',
        instructions: 'Do the following statements agree with the claims of the writer?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'Solar power is now cheaper than fossil fuels everywhere in the world.' },
            correctAnswer: 'NO',
            explanation: 'Paragraph B states solar is "cost-competitive with fossil fuels in most regions of the world" — not everywhere.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'The electric vehicle industry has helped reduce the cost of lithium-ion batteries.' },
            correctAnswer: 'YES',
            explanation: 'Paragraph D states lithium-ion battery technology "has benefited from massive investment driven by the electric vehicle industry."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'Green hydrogen is the most cost-effective form of energy storage currently available.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'The passage says green hydrogen has attracted the most attention and investment but does not compare its cost to other storage solutions.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'Renewable energy can help developing countries that lack traditional power grids.' },
            correctAnswer: 'YES',
            explanation: 'Paragraph F states renewable energy offers "expanding electricity access without the need for costly centralised grid infrastructure."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 5,
            questionData: {
              prompt: 'What advantage does offshore wind have over onshore wind?',
              options: [
                { label: 'A', text: 'It is less expensive to install' },
                { label: 'B', text: 'It has stronger and more consistent wind' },
                { label: 'C', text: 'It requires less maintenance' },
                { label: 'D', text: 'It produces less visual pollution' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph C: offshore wind "offers the advantage of stronger and more consistent wind resources."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 6,
            questionData: {
              prompt: 'Which country is described as the leading force in solar manufacturing?',
              options: [
                { label: 'A', text: 'Denmark' },
                { label: 'B', text: 'Germany' },
                { label: 'C', text: 'China' },
                { label: 'D', text: 'United States' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph F: "China has emerged as the dominant force in global solar manufacturing and installation."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'What is identified as the main limitation of lithium-ion batteries for grid storage?',
              options: [
                { label: 'A', text: 'They are too expensive for large-scale use' },
                { label: 'B', text: 'They cannot store energy for extended periods' },
                { label: 'C', text: 'They are environmentally harmful to produce' },
                { label: 'D', text: 'They require rare materials that are difficult to source' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph E: "lithium-ion batteries are not well-suited for long-duration storage, meaning the storage of energy for periods longer than four to eight hours."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'According to the passage, why is the renewable energy job transition challenging?',
              options: [
                { label: 'A', text: 'Renewable energy jobs pay significantly less' },
                { label: 'B', text: 'There are fewer jobs in renewable energy than fossil fuels' },
                { label: 'C', text: 'The locations and skills required are different' },
                { label: 'D', text: 'Renewable energy companies prefer younger workers' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph G: "the geographic and skill profiles of renewable energy jobs often differ from those in fossil fuel industries."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'The writer suggests that the success of energy policies depends primarily on:',
              options: [
                { label: 'A', text: 'public opinion and voter support' },
                { label: 'B', text: 'international cooperation between governments' },
                { label: 'C', text: 'their strictness, consistency, and ability to attract investment' },
                { label: 'D', text: 'the development of new technologies' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph H: effectiveness "depends on their stringency, stability, and ability to attract sustained private capital investment."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'SUMMARY_COMPLETION',
        instructions: 'Complete the summary. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'In 2022, renewables generated approximately _______ percent of global electricity.' },
            correctAnswer: ['30'],
            explanation: 'Paragraph A: "renewable sources accounted for approximately 30 percent of global electricity generation."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'Solar panel costs have dropped by more than _______ percent since the 1970s.' },
            correctAnswer: ['99'],
            explanation: 'Paragraph B: "The cost of solar panels has fallen by more than 99 percent since the 1970s."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'By 2023, the average capacity of new wind turbines exceeded _______ megawatts.' },
            correctAnswer: ['4'],
            explanation: 'Paragraph C: "the average capacity of new installations increasing... to over 4 megawatts by 2023."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'Green hydrogen is produced through _______ powered by renewable electricity.' },
            correctAnswer: ['electrolysis'],
            explanation: 'Paragraph E: "green hydrogen produced through electrolysis powered by renewable electricity."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 14,
            questionData: { prompt: 'The global renewable energy sector employed approximately _______ million people in 2022.' },
            correctAnswer: ['13.7'],
            explanation: 'Paragraph G: "the global renewable energy sector employed approximately 13.7 million people in 2022."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },
];
