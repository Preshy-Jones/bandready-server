import { ReadingPassageSeed } from './reading-passages-types';

export const academicEasyPassages: ReadingPassageSeed[] = [
  // ──────────────────────────────────────────────────────────────
  // Passage 1: Science & Health — Sleep Research (EASY)
  // Question types: TFNG (5), MC (4), Short Answer (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'The Science of Sleep',
    content: `Sleep is one of the most fundamental biological processes, yet it remains one of the least understood aspects of human physiology. For centuries, sleep was dismissed as a passive state during which the body simply rested. However, modern neuroscience has revealed that sleep is an extraordinarily active process, essential for memory consolidation, emotional regulation, and physical repair.

The human sleep cycle consists of two main categories: rapid eye movement (REM) sleep and non-rapid eye movement (NREM) sleep. NREM sleep is further divided into three stages, each progressively deeper. Stage 1 is a light transitional phase lasting only a few minutes, during which a person can be easily awakened. Stage 2 represents a slightly deeper state where heart rate slows and body temperature drops. Stage 3, often called deep sleep or slow-wave sleep, is the most restorative phase, during which the body repairs tissues, builds bone and muscle, and strengthens the immune system.

REM sleep, which typically begins about 90 minutes after falling asleep, is characterised by rapid movements of the eyes beneath closed lids, increased brain activity, and temporary paralysis of most voluntary muscles. This is the stage most closely associated with vivid dreaming. Research conducted at Harvard Medical School has demonstrated that REM sleep plays a critical role in processing emotional experiences and consolidating procedural memories, such as learning to play a musical instrument or ride a bicycle.

The importance of adequate sleep has been underscored by numerous studies linking sleep deprivation to serious health consequences. Dr Sarah Chen of the National Sleep Foundation has noted that chronic sleep loss increases the risk of cardiovascular disease, obesity, diabetes, and depression. Even moderate sleep restriction, defined as sleeping fewer than seven hours per night over an extended period, can impair cognitive function to a degree comparable to alcohol intoxication.

Circadian rhythms, the internal biological clocks that regulate the sleep-wake cycle, are controlled primarily by a small region of the brain called the suprachiasmatic nucleus (SCN). The SCN responds to light signals received through the eyes, synchronising the body's internal clock with the external environment. This is why exposure to bright light in the evening, particularly the blue light emitted by electronic screens, can disrupt the natural sleep cycle by suppressing the production of melatonin, a hormone that promotes sleepiness.

Recent research has also highlighted the role of sleep in clearing waste products from the brain. The glymphatic system, discovered in 2012 by researchers at the University of Rochester, functions primarily during deep sleep, flushing out toxic proteins including beta-amyloid, which is associated with Alzheimer's disease. This discovery has led scientists to hypothesise that insufficient sleep may contribute to the development of neurodegenerative conditions over time.

The optimal amount of sleep varies across the lifespan. Newborns require between 14 and 17 hours of sleep per day, while teenagers need approximately 8 to 10 hours. Most adults function best with 7 to 9 hours, though individual requirements can vary based on genetic factors. Interestingly, a small percentage of the population carries a genetic mutation that allows them to function normally on as few as six hours of sleep, though such individuals are extremely rare.

Public health initiatives in several countries have begun to address what many experts describe as a global sleep crisis. In Japan, where chronic sleep deprivation is particularly prevalent, some companies have introduced designated napping rooms and adjusted work schedules to promote better sleep habits among employees. Similar programmes have been adopted by forward-thinking organisations in Europe and North America, reflecting a growing recognition that adequate sleep is not a luxury but a biological necessity.

The relationship between sleep and the immune system has received particular attention in recent years. Studies have shown that individuals who sleep fewer than six hours per night are over four times more likely to catch a common cold compared to those who sleep seven hours or more. Vaccines have also been shown to be less effective in sleep-deprived individuals, as the body requires adequate rest to mount a full immune response. This connection between sleep and immunity has become especially relevant in the context of global pandemic preparedness.

Sleep disorders, including insomnia, sleep apnoea, and restless leg syndrome, affect a significant proportion of the global population. The World Health Organisation estimates that sleep-related problems affect up to 45 percent of the world's population at some point in their lives. Cognitive behavioural therapy for insomnia (CBT-I) has emerged as the gold standard treatment, preferred over pharmaceutical interventions due to its long-lasting effects and absence of side effects. Despite its effectiveness, access to trained CBT-I practitioners remains limited in many regions, prompting the development of digital therapy platforms that can deliver the treatment remotely.`,
    wordCount: 780,
    difficultyLevel: 'EASY',
    testType: 'ACADEMIC',
    topicCategory: 'Science & Health',
    sourceAttribution: 'Original content for educational purposes',
    vocabularyTerms: [
      { term: 'circadian rhythms', definition: 'Internal biological clocks that regulate the sleep-wake cycle over a 24-hour period' },
      { term: 'melatonin', definition: 'A hormone produced by the pineal gland that promotes sleepiness and regulates sleep timing' },
      { term: 'neurodegenerative', definition: 'Relating to the progressive loss of structure or function of neurons in the brain' },
      { term: 'suprachiasmatic nucleus', definition: 'A small region of the brain that acts as the master circadian clock' },
      { term: 'glymphatic system', definition: 'A waste-clearance system in the brain that is most active during deep sleep' },
      { term: 'consolidation', definition: 'The process by which short-term memories are stabilised into long-term memories' },
      { term: 'restorative', definition: 'Having the ability to restore health, strength, or well-being' },
      { term: 'sleep deprivation', definition: 'The condition of not having enough sleep, either acutely or chronically' },
    ],
    paragraphs: [
      { label: 'A', content: 'Sleep is one of the most fundamental biological processes, yet it remains one of the least understood aspects of human physiology. For centuries, sleep was dismissed as a passive state during which the body simply rested. However, modern neuroscience has revealed that sleep is an extraordinarily active process, essential for memory consolidation, emotional regulation, and physical repair.' },
      { label: 'B', content: 'The human sleep cycle consists of two main categories: rapid eye movement (REM) sleep and non-rapid eye movement (NREM) sleep. NREM sleep is further divided into three stages, each progressively deeper. Stage 1 is a light transitional phase lasting only a few minutes, during which a person can be easily awakened. Stage 2 represents a slightly deeper state where heart rate slows and body temperature drops. Stage 3, often called deep sleep or slow-wave sleep, is the most restorative phase, during which the body repairs tissues, builds bone and muscle, and strengthens the immune system.' },
      { label: 'C', content: 'REM sleep, which typically begins about 90 minutes after falling asleep, is characterised by rapid movements of the eyes beneath closed lids, increased brain activity, and temporary paralysis of most voluntary muscles. This is the stage most closely associated with vivid dreaming. Research conducted at Harvard Medical School has demonstrated that REM sleep plays a critical role in processing emotional experiences and consolidating procedural memories, such as learning to play a musical instrument or ride a bicycle.' },
      { label: 'D', content: 'The importance of adequate sleep has been underscored by numerous studies linking sleep deprivation to serious health consequences. Dr Sarah Chen of the National Sleep Foundation has noted that chronic sleep loss increases the risk of cardiovascular disease, obesity, diabetes, and depression. Even moderate sleep restriction, defined as sleeping fewer than seven hours per night over an extended period, can impair cognitive function to a degree comparable to alcohol intoxication.' },
      { label: 'E', content: 'Circadian rhythms, the internal biological clocks that regulate the sleep-wake cycle, are controlled primarily by a small region of the brain called the suprachiasmatic nucleus (SCN). The SCN responds to light signals received through the eyes, synchronising the body\'s internal clock with the external environment. This is why exposure to bright light in the evening, particularly the blue light emitted by electronic screens, can disrupt the natural sleep cycle by suppressing the production of melatonin, a hormone that promotes sleepiness.' },
      { label: 'F', content: 'Recent research has also highlighted the role of sleep in clearing waste products from the brain. The glymphatic system, discovered in 2012 by researchers at the University of Rochester, functions primarily during deep sleep, flushing out toxic proteins including beta-amyloid, which is associated with Alzheimer\'s disease. This discovery has led scientists to hypothesise that insufficient sleep may contribute to the development of neurodegenerative conditions over time.' },
      { label: 'G', content: 'The optimal amount of sleep varies across the lifespan. Newborns require between 14 and 17 hours of sleep per day, while teenagers need approximately 8 to 10 hours. Most adults function best with 7 to 9 hours, though individual requirements can vary based on genetic factors. Interestingly, a small percentage of the population carries a genetic mutation that allows them to function normally on as few as six hours of sleep, though such individuals are extremely rare.' },
      { label: 'H', content: 'Public health initiatives in several countries have begun to address what many experts describe as a global sleep crisis. In Japan, where chronic sleep deprivation is particularly prevalent, some companies have introduced designated napping rooms and adjusted work schedules to promote better sleep habits among employees. Similar programmes have been adopted by forward-thinking organisations in Europe and North America, reflecting a growing recognition that adequate sleep is not a luxury but a biological necessity.' },
      { label: 'I', content: 'The relationship between sleep and the immune system has received particular attention in recent years. Studies have shown that individuals who sleep fewer than six hours per night are over four times more likely to catch a common cold compared to those who sleep seven hours or more. Vaccines have also been shown to be less effective in sleep-deprived individuals, as the body requires adequate rest to mount a full immune response. This connection between sleep and immunity has become especially relevant in the context of global pandemic preparedness.' },
      { label: 'J', content: 'Sleep disorders, including insomnia, sleep apnoea, and restless leg syndrome, affect a significant proportion of the global population. The World Health Organisation estimates that sleep-related problems affect up to 45 percent of the world\'s population at some point in their lives. Cognitive behavioural therapy for insomnia (CBT-I) has emerged as the gold standard treatment, preferred over pharmaceutical interventions due to its long-lasting effects and absence of side effects. Despite its effectiveness, access to trained CBT-I practitioners remains limited in many regions, prompting the development of digital therapy platforms that can deliver the treatment remotely.' },
    ],
    questionSets: [
      // Set 1: TRUE/FALSE/NOT GIVEN (Questions 1-5)
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'Sleep was historically considered an active process by most scientists.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph A states that "sleep was dismissed as a passive state" for centuries, meaning it was NOT considered active historically.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Stage 3 NREM sleep helps the body build bone and muscle.' },
            correctAnswer: 'TRUE',
            explanation: 'Paragraph B states that Stage 3 "is the most restorative phase, during which the body repairs tissues, builds bone and muscle, and strengthens the immune system."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'REM sleep begins approximately two hours after a person falls asleep.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph C states REM sleep "typically begins about 90 minutes after falling asleep," not two hours.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'Dr Sarah Chen works at Harvard Medical School.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'Dr Sarah Chen is described as being from the National Sleep Foundation. The Harvard research is mentioned separately. There is no connection stated between Dr Chen and Harvard.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 5,
            questionData: { prompt: 'The glymphatic system was discovered before 2010.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph F states the glymphatic system was "discovered in 2012," which is after 2010.',
            skillTested: 'Detail recognition',
          },
        ],
      },
      // Set 2: MULTIPLE CHOICE (Questions 6-9)
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 6,
            questionData: {
              prompt: 'What is the main function of the suprachiasmatic nucleus (SCN)?',
              options: [
                { label: 'A', text: 'Producing melatonin to induce sleep' },
                { label: 'B', text: 'Synchronising the body\'s internal clock with the environment' },
                { label: 'C', text: 'Controlling the stages of REM sleep' },
                { label: 'D', text: 'Regulating body temperature during sleep' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph E explains that the SCN "responds to light signals received through the eyes, synchronising the body\'s internal clock with the external environment."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'According to the passage, moderate sleep restriction can impair cognitive function to a degree comparable to:',
              options: [
                { label: 'A', text: 'severe illness' },
                { label: 'B', text: 'extreme physical exhaustion' },
                { label: 'C', text: 'alcohol intoxication' },
                { label: 'D', text: 'clinical depression' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph D states that moderate sleep restriction "can impair cognitive function to a degree comparable to alcohol intoxication."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'What has been hypothesised as a consequence of insufficient sleep?',
              options: [
                { label: 'A', text: 'Increased production of melatonin' },
                { label: 'B', text: 'Development of neurodegenerative conditions' },
                { label: 'C', text: 'Permanent damage to the suprachiasmatic nucleus' },
                { label: 'D', text: 'Irreversible changes to circadian rhythms' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph F states that the discovery of the glymphatic system "has led scientists to hypothesise that insufficient sleep may contribute to the development of neurodegenerative conditions."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'The writer mentions Japan primarily to illustrate:',
              options: [
                { label: 'A', text: 'the economic costs of sleep deprivation' },
                { label: 'B', text: 'cultural attitudes towards sleeping at work' },
                { label: 'C', text: 'practical responses to the global sleep crisis' },
                { label: 'D', text: 'the superiority of Japanese workplace policies' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph H uses Japan as an example of countries taking action to address "what many experts describe as a global sleep crisis" through practical workplace initiatives.',
            skillTested: 'Inference',
          },
        ],
      },
      // Set 3: SHORT ANSWER (Questions 10-13)
      {
        questionType: 'SHORT_ANSWER',
        instructions: 'Answer the following questions using NO MORE THAN THREE WORDS AND/OR A NUMBER from the passage.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'What type of memories does REM sleep help consolidate, according to Harvard research?' },
            correctAnswer: ['procedural memories'],
            explanation: 'Paragraph C states that REM sleep "plays a critical role in processing emotional experiences and consolidating procedural memories."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'What hormone does blue light suppress that normally promotes sleepiness?' },
            correctAnswer: ['melatonin'],
            explanation: 'Paragraph E mentions that blue light "can disrupt the natural sleep cycle by suppressing the production of melatonin, a hormone that promotes sleepiness."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'How many hours of sleep per day do newborns need at the upper end of the range?' },
            correctAnswer: ['17'],
            explanation: 'Paragraph G states "Newborns require between 14 and 17 hours of sleep per day."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'What toxic protein, linked to Alzheimer\'s disease, is cleared by the glymphatic system?' },
            correctAnswer: ['beta-amyloid', 'beta amyloid'],
            explanation: 'Paragraph F mentions the glymphatic system "flushing out toxic proteins including beta-amyloid, which is associated with Alzheimer\'s disease."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // Passage 2: Technology — AI in Medicine (EASY)
  // Question types: YNNG (4), Sentence Completion (5), MC (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Artificial Intelligence in Modern Medicine',
    content: `The integration of artificial intelligence into healthcare represents one of the most significant technological shifts of the twenty-first century. From diagnostic imaging to drug discovery, AI systems are being deployed across virtually every branch of medicine, raising both excitement and concern among practitioners and patients alike.

In the field of diagnostic imaging, AI algorithms have shown remarkable capabilities. Studies published in the journal Nature Medicine have demonstrated that deep learning systems can detect certain types of cancer in medical images with accuracy rates that match or exceed those of experienced radiologists. At the Royal Melbourne Hospital in Australia, an AI system trained on over 100,000 chest X-rays can identify signs of pneumonia, lung cancer, and heart enlargement within seconds, whereas a human radiologist might take several minutes to reach the same conclusion.

Drug discovery, traditionally a process requiring ten to fifteen years and billions of dollars, is being accelerated by AI. Machine learning algorithms can analyse vast databases of molecular structures to predict which compounds are most likely to be effective against specific diseases. In 2020, a British company called Insilico Medicine used AI to identify a potential drug candidate for fibrosis in just 46 days, a process that would typically take several years using conventional methods.

The application of AI in mental health is another area generating considerable interest. Natural language processing algorithms can analyse patterns in speech and text to identify early signs of conditions such as depression and anxiety. Researchers at Stanford University have developed a chatbot called Woebot, which uses cognitive behavioural therapy techniques to provide immediate support to individuals experiencing mild to moderate psychological distress. While such tools are not intended to replace human therapists, they can serve as a valuable supplement, particularly in regions where access to mental health services is limited.

Despite these advances, the adoption of AI in medicine faces several significant challenges. One of the most pressing concerns is the issue of algorithmic bias. If AI systems are trained primarily on data from certain demographic groups, they may perform less accurately when applied to patients from underrepresented populations. A widely cited study by researchers at the Massachusetts Institute of Technology found that a dermatology AI system trained predominantly on images of lighter skin tones showed significantly reduced accuracy when diagnosing conditions in darker-skinned patients.

The question of accountability also presents difficulties. When an AI system contributes to a medical decision that results in harm, determining legal responsibility becomes complex. Current regulatory frameworks in most countries have not yet been adapted to address this issue comprehensively. The European Union has proposed regulations that would classify certain medical AI applications as high-risk, requiring them to meet strict standards for transparency, accuracy, and human oversight.

Privacy concerns represent another barrier to widespread adoption. AI systems in healthcare typically require access to large volumes of patient data for training and operation. Ensuring that this data is collected, stored, and processed in compliance with privacy regulations such as the General Data Protection Regulation remains a significant technical and organisational challenge.

Medical professionals themselves hold varied opinions on the role of AI. A survey conducted by the British Medical Association in 2023 found that while 72 percent of doctors believed AI would improve diagnostic accuracy, only 38 percent felt comfortable with the idea of AI making treatment recommendations without direct human supervision. This suggests that the most successful implementations of medical AI will likely follow a collaborative model, in which AI systems augment human expertise rather than replace it entirely.

The economic implications of AI in healthcare are substantial. A report by Accenture estimated that AI applications could save the US healthcare system approximately 150 billion dollars annually by 2026. The greatest savings are expected in clinical trials, where AI can identify suitable participants more efficiently, and in administrative tasks, where natural language processing can automate medical coding and claims processing. However, the initial investment required to implement AI systems, including infrastructure upgrades, staff training, and ongoing maintenance, remains a significant barrier for smaller healthcare providers.

Looking ahead, the convergence of AI with other emerging technologies promises to reshape medicine even further. The combination of AI with wearable health devices enables continuous patient monitoring outside clinical settings, allowing for early detection of deteriorating conditions. Genomic medicine, enhanced by AI analysis of vast genetic datasets, is moving towards truly personalised treatment plans tailored to an individual's unique genetic profile. While the full realisation of these possibilities will take years, the trajectory suggests that AI will become an increasingly indispensable component of modern healthcare delivery.`,
    wordCount: 750,
    difficultyLevel: 'EASY',
    testType: 'ACADEMIC',
    topicCategory: 'Technology',
    sourceAttribution: 'Original content for educational purposes',
    vocabularyTerms: [
      { term: 'algorithmic bias', definition: 'Systematic errors in AI output caused by biased assumptions in training data or algorithm design' },
      { term: 'deep learning', definition: 'A subset of machine learning using neural networks with multiple layers to model complex patterns' },
      { term: 'natural language processing', definition: 'A branch of AI concerned with enabling computers to understand and generate human language' },
      { term: 'accountability', definition: 'The obligation to accept responsibility for one\'s actions and their consequences' },
      { term: 'demographic', definition: 'Relating to the statistical characteristics of a population, such as age, race, or gender' },
      { term: 'augment', definition: 'To make something greater by adding to it; to enhance or supplement' },
      { term: 'fibrosis', definition: 'The thickening and scarring of connective tissue, usually as a result of injury' },
      { term: 'cognitive behavioural therapy', definition: 'A type of psychotherapy that aims to change patterns of thinking or behaviour' },
    ],
    paragraphs: [
      { label: 'A', content: 'The integration of artificial intelligence into healthcare represents one of the most significant technological shifts of the twenty-first century. From diagnostic imaging to drug discovery, AI systems are being deployed across virtually every branch of medicine, raising both excitement and concern among practitioners and patients alike.' },
      { label: 'B', content: 'In the field of diagnostic imaging, AI algorithms have shown remarkable capabilities. Studies published in the journal Nature Medicine have demonstrated that deep learning systems can detect certain types of cancer in medical images with accuracy rates that match or exceed those of experienced radiologists. At the Royal Melbourne Hospital in Australia, an AI system trained on over 100,000 chest X-rays can identify signs of pneumonia, lung cancer, and heart enlargement within seconds, whereas a human radiologist might take several minutes to reach the same conclusion.' },
      { label: 'C', content: 'Drug discovery, traditionally a process requiring ten to fifteen years and billions of dollars, is being accelerated by AI. Machine learning algorithms can analyse vast databases of molecular structures to predict which compounds are most likely to be effective against specific diseases. In 2020, a British company called Insilico Medicine used AI to identify a potential drug candidate for fibrosis in just 46 days, a process that would typically take several years using conventional methods.' },
      { label: 'D', content: 'The application of AI in mental health is another area generating considerable interest. Natural language processing algorithms can analyse patterns in speech and text to identify early signs of conditions such as depression and anxiety. Researchers at Stanford University have developed a chatbot called Woebot, which uses cognitive behavioural therapy techniques to provide immediate support to individuals experiencing mild to moderate psychological distress. While such tools are not intended to replace human therapists, they can serve as a valuable supplement, particularly in regions where access to mental health services is limited.' },
      { label: 'E', content: 'Despite these advances, the adoption of AI in medicine faces several significant challenges. One of the most pressing concerns is the issue of algorithmic bias. If AI systems are trained primarily on data from certain demographic groups, they may perform less accurately when applied to patients from underrepresented populations. A widely cited study by researchers at the Massachusetts Institute of Technology found that a dermatology AI system trained predominantly on images of lighter skin tones showed significantly reduced accuracy when diagnosing conditions in darker-skinned patients.' },
      { label: 'F', content: 'The question of accountability also presents difficulties. When an AI system contributes to a medical decision that results in harm, determining legal responsibility becomes complex. Current regulatory frameworks in most countries have not yet been adapted to address this issue comprehensively. The European Union has proposed regulations that would classify certain medical AI applications as high-risk, requiring them to meet strict standards for transparency, accuracy, and human oversight.' },
      { label: 'G', content: 'Privacy concerns represent another barrier to widespread adoption. AI systems in healthcare typically require access to large volumes of patient data for training and operation. Ensuring that this data is collected, stored, and processed in compliance with privacy regulations such as the General Data Protection Regulation remains a significant technical and organisational challenge.' },
      { label: 'H', content: 'Medical professionals themselves hold varied opinions on the role of AI. A survey conducted by the British Medical Association in 2023 found that while 72 percent of doctors believed AI would improve diagnostic accuracy, only 38 percent felt comfortable with the idea of AI making treatment recommendations without direct human supervision. This suggests that the most successful implementations of medical AI will likely follow a collaborative model, in which AI systems augment human expertise rather than replace it entirely.' },
      { label: 'I', content: 'The economic implications of AI in healthcare are substantial. A report by Accenture estimated that AI applications could save the US healthcare system approximately 150 billion dollars annually by 2026. The greatest savings are expected in clinical trials, where AI can identify suitable participants more efficiently, and in administrative tasks, where natural language processing can automate medical coding and claims processing. However, the initial investment required to implement AI systems, including infrastructure upgrades, staff training, and ongoing maintenance, remains a significant barrier for smaller healthcare providers.' },
      { label: 'J', content: 'Looking ahead, the convergence of AI with other emerging technologies promises to reshape medicine even further. The combination of AI with wearable health devices enables continuous patient monitoring outside clinical settings, allowing for early detection of deteriorating conditions. Genomic medicine, enhanced by AI analysis of vast genetic datasets, is moving towards truly personalised treatment plans tailored to an individual\'s unique genetic profile. While the full realisation of these possibilities will take years, the trajectory suggests that AI will become an increasingly indispensable component of modern healthcare delivery.' },
    ],
    questionSets: [
      // Set 1: YES/NO/NOT GIVEN (Questions 1-4)
      {
        questionType: 'YES_NO_NOT_GIVEN',
        instructions: 'Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'AI diagnostic systems are now more accurate than human doctors in all medical fields.' },
            correctAnswer: 'NO',
            explanation: 'The passage states AI can match or exceed radiologists in "certain types of cancer" detection — not all medical fields. The claim is limited to specific areas.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Chatbots like Woebot are designed to completely replace human mental health professionals.' },
            correctAnswer: 'NO',
            explanation: 'Paragraph D explicitly states "such tools are not intended to replace human therapists" but rather serve as a supplement.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'Insilico Medicine is based in the United States.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'The passage describes Insilico Medicine as "a British company" but does not specify its location as being in the United States. It is described as British.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'The most effective approach to medical AI involves combining AI capabilities with human expertise.' },
            correctAnswer: 'YES',
            explanation: 'Paragraph H concludes that "the most successful implementations of medical AI will likely follow a collaborative model, in which AI systems augment human expertise rather than replace it entirely."',
            skillTested: 'Inference',
          },
        ],
      },
      // Set 2: SENTENCE COMPLETION (Questions 5-9)
      {
        questionType: 'SENTENCE_COMPLETION',
        instructions: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        questions: [
          {
            questionNumber: 5,
            questionData: { prompt: 'Deep learning systems were shown to detect cancer with accuracy matching that of experienced _______.' },
            correctAnswer: ['radiologists'],
            explanation: 'Paragraph B states deep learning systems detect cancer "with accuracy rates that match or exceed those of experienced radiologists."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 6,
            questionData: { prompt: 'Insilico Medicine identified a drug candidate for _______ in under two months.' },
            correctAnswer: ['fibrosis'],
            explanation: 'Paragraph C states the company "used AI to identify a potential drug candidate for fibrosis in just 46 days."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 7,
            questionData: { prompt: 'The Woebot chatbot uses _______ therapy techniques to support users.' },
            correctAnswer: ['cognitive behavioural', 'cognitive behavioral'],
            explanation: 'Paragraph D states Woebot "uses cognitive behavioural therapy techniques."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 8,
            questionData: { prompt: 'AI trained on limited demographic data may suffer from algorithmic _______.' },
            correctAnswer: ['bias'],
            explanation: 'Paragraph E identifies "the issue of algorithmic bias" when AI is trained on data from certain demographic groups.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 9,
            questionData: { prompt: 'The EU proposed classifying certain medical AI applications as _______.' },
            correctAnswer: ['high-risk', 'high risk'],
            explanation: 'Paragraph F states the EU "proposed regulations that would classify certain medical AI applications as high-risk."',
            skillTested: 'Scanning',
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
              prompt: 'According to the passage, drug discovery traditionally takes:',
              options: [
                { label: 'A', text: '46 days' },
                { label: 'B', text: 'several months' },
                { label: 'C', text: 'five to ten years' },
                { label: 'D', text: 'ten to fifteen years' },
              ],
            },
            correctAnswer: ['D'],
            explanation: 'Paragraph C states drug discovery is "traditionally a process requiring ten to fifteen years."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 11,
            questionData: {
              prompt: 'The MIT study on dermatology AI found that the system:',
              options: [
                { label: 'A', text: 'could not detect any skin conditions accurately' },
                { label: 'B', text: 'performed worse on darker-skinned patients' },
                { label: 'C', text: 'was equally accurate across all skin tones' },
                { label: 'D', text: 'was only tested on patients with lighter skin' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'Paragraph E states the system "showed significantly reduced accuracy when diagnosing conditions in darker-skinned patients."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 12,
            questionData: {
              prompt: 'What percentage of doctors in the BMA survey believed AI would improve diagnostic accuracy?',
              options: [
                { label: 'A', text: '38 percent' },
                { label: 'B', text: '46 percent' },
                { label: 'C', text: '72 percent' },
                { label: 'D', text: '100 percent' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph H states "72 percent of doctors believed AI would improve diagnostic accuracy."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: {
              prompt: 'The main purpose of the passage is to:',
              options: [
                { label: 'A', text: 'argue that AI should replace doctors entirely' },
                { label: 'B', text: 'present the benefits and challenges of AI in medicine' },
                { label: 'C', text: 'warn against the dangers of using AI in healthcare' },
                { label: 'D', text: 'compare AI systems used in different countries' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'The passage covers both the potential benefits (diagnostic imaging, drug discovery, mental health) and the challenges (bias, accountability, privacy), presenting a balanced overview.',
            skillTested: 'Skimming',
          },
        ],
      },
    ],
  },
];
