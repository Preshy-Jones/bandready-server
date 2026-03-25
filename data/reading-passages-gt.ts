import { ReadingPassageSeed } from './reading-passages-types';

export const generalTrainingPassages: ReadingPassageSeed[] = [
  // ──────────────────────────────────────────────────────────────
  // GT Passage 1: Section 1 — Job Advertisements & Workplace Notices (EASY)
  // Question types: MC (4), TFNG (5), Short Answer (5) = 14 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Workplace Notices and Job Advertisements',
    content: `NOTICE TO ALL STAFF — OFFICE RELOCATION

Please be informed that Greenfield Marketing Solutions will be relocating from our current premises at 45 Park Lane to the new Riverside Business Centre at 120 Thames Street, effective Monday, 15 April. The new office offers significantly more space, improved meeting facilities, and an on-site café. Staff parking will be available in the underground car park, with spaces allocated on a first-come, first-served basis. Public transport access is excellent, with Riverside Station (Northern and District lines) located just a three-minute walk from the building. All employees are expected to report to the new address from 15 April. IT equipment will be moved by the facilities team over the weekend of 12–13 April, and employees should ensure that all personal items are packed into the boxes provided by Friday, 11 April. Any questions should be directed to the Office Manager, Sarah Mitchell, at ext. 204.

HEALTH AND SAFETY REMINDER

Following the recent fire drill, all staff are reminded of the emergency evacuation procedures. When the fire alarm sounds, leave the building immediately via the nearest marked exit. Do not use the lifts. Assemble at the designated meeting point in the rear car park. Department heads are responsible for conducting a headcount of their team members. Personal belongings should not be retrieved during an evacuation. The building's fire wardens are identified by their high-visibility vests and will direct you to the exits. A full list of fire wardens is posted on the notice board in the main corridor. If you discover a fire, activate the nearest alarm call point and call reception on ext. 100. Do not attempt to fight the fire unless you have been trained in the use of fire extinguishers.

JOB VACANCIES — GREENFIELD MARKETING SOLUTIONS

Position: Digital Marketing Coordinator
Department: Online Campaigns
Salary: £28,000–£32,000 depending on experience
Hours: Full-time, Monday to Friday, 9:00 AM – 5:30 PM
Location: Riverside Business Centre, London

We are seeking an enthusiastic and detail-oriented Digital Marketing Coordinator to join our growing online campaigns team. The successful candidate will be responsible for managing social media accounts, creating content for email marketing campaigns, analysing website traffic data, and assisting with paid advertising strategies. A minimum of two years' experience in digital marketing is required, along with proficiency in Google Analytics and at least one social media management platform. A degree in marketing, communications, or a related field is preferred but not essential. Strong writing skills and the ability to work to tight deadlines are essential.

To apply, send your CV and a cover letter to recruitment@greenfieldmarketing.co.uk by 28 March.

Position: Administrative Assistant
Department: Finance
Salary: £22,000–£25,000
Hours: Part-time, Monday to Wednesday, 9:00 AM – 3:00 PM
Location: Riverside Business Centre, London

We require an organised and reliable Administrative Assistant to support the finance department. Duties include processing invoices, maintaining filing systems, scheduling appointments, and providing general administrative support to the finance team. Experience with accounting software such as Xero or QuickBooks is an advantage. Excellent attention to detail and good communication skills are required. This position is ideal for someone seeking a flexible working arrangement.

To apply, send your CV to hr@greenfieldmarketing.co.uk by 4 April.`,
    wordCount: 480,
    difficultyLevel: 'EASY',
    testType: 'GENERAL_TRAINING',
    topicCategory: 'Workplace',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'NOTICE TO ALL STAFF — OFFICE RELOCATION. Please be informed that Greenfield Marketing Solutions will be relocating from our current premises at 45 Park Lane to the new Riverside Business Centre at 120 Thames Street, effective Monday, 15 April. The new office offers significantly more space, improved meeting facilities, and an on-site café. Staff parking will be available in the underground car park, with spaces allocated on a first-come, first-served basis. Public transport access is excellent, with Riverside Station (Northern and District lines) located just a three-minute walk from the building. All employees are expected to report to the new address from 15 April. IT equipment will be moved by the facilities team over the weekend of 12–13 April, and employees should ensure that all personal items are packed into the boxes provided by Friday, 11 April. Any questions should be directed to the Office Manager, Sarah Mitchell, at ext. 204.' },
      { label: 'B', content: 'HEALTH AND SAFETY REMINDER. Following the recent fire drill, all staff are reminded of the emergency evacuation procedures. When the fire alarm sounds, leave the building immediately via the nearest marked exit. Do not use the lifts. Assemble at the designated meeting point in the rear car park. Department heads are responsible for conducting a headcount of their team members. Personal belongings should not be retrieved during an evacuation. The building\'s fire wardens are identified by their high-visibility vests and will direct you to the exits. A full list of fire wardens is posted on the notice board in the main corridor. If you discover a fire, activate the nearest alarm call point and call reception on ext. 100. Do not attempt to fight the fire unless you have been trained in the use of fire extinguishers.' },
      { label: 'C', content: 'JOB VACANCIES — Position: Digital Marketing Coordinator. Department: Online Campaigns. Salary: £28,000–£32,000 depending on experience. Hours: Full-time, Monday to Friday, 9:00 AM – 5:30 PM. Location: Riverside Business Centre, London. We are seeking an enthusiastic and detail-oriented Digital Marketing Coordinator to join our growing online campaigns team. The successful candidate will be responsible for managing social media accounts, creating content for email marketing campaigns, analysing website traffic data, and assisting with paid advertising strategies. A minimum of two years\' experience in digital marketing is required, along with proficiency in Google Analytics and at least one social media management platform. A degree in marketing, communications, or a related field is preferred but not essential. Strong writing skills and the ability to work to tight deadlines are essential. To apply, send your CV and a cover letter to recruitment@greenfieldmarketing.co.uk by 28 March.' },
      { label: 'D', content: 'Position: Administrative Assistant. Department: Finance. Salary: £22,000–£25,000. Hours: Part-time, Monday to Wednesday, 9:00 AM – 3:00 PM. Location: Riverside Business Centre, London. We require an organised and reliable Administrative Assistant to support the finance department. Duties include processing invoices, maintaining filing systems, scheduling appointments, and providing general administrative support to the finance team. Experience with accounting software such as Xero or QuickBooks is an advantage. Excellent attention to detail and good communication skills are required. This position is ideal for someone seeking a flexible working arrangement. To apply, send your CV to hr@greenfieldmarketing.co.uk by 4 April.' },
    ],
    questionSets: [
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 1,
            questionData: {
              prompt: 'What is the new address of Greenfield Marketing Solutions?',
              options: [
                { label: 'A', text: '45 Park Lane' },
                { label: 'B', text: '120 Thames Street' },
                { label: 'C', text: 'Riverside Station' },
                { label: 'D', text: '204 Park Lane' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'The notice states the company is relocating to "the new Riverside Business Centre at 120 Thames Street."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 2,
            questionData: {
              prompt: 'How are parking spaces at the new office allocated?',
              options: [
                { label: 'A', text: 'By seniority' },
                { label: 'B', text: 'By department' },
                { label: 'C', text: 'On a first-come, first-served basis' },
                { label: 'D', text: 'By lottery' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'The notice states "spaces allocated on a first-come, first-served basis."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 3,
            questionData: {
              prompt: 'What should you do if you discover a fire?',
              options: [
                { label: 'A', text: 'Call the fire brigade directly' },
                { label: 'B', text: 'Activate the nearest alarm and call reception' },
                { label: 'C', text: 'Immediately evacuate the building' },
                { label: 'D', text: 'Find a fire warden for instructions' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'The safety notice says: "activate the nearest alarm call point and call reception on ext. 100."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: {
              prompt: 'The Administrative Assistant position is:',
              options: [
                { label: 'A', text: 'full-time, five days a week' },
                { label: 'B', text: 'part-time, three days a week' },
                { label: 'C', text: 'full-time, four days a week' },
                { label: 'D', text: 'part-time, two days a week' },
              ],
            },
            correctAnswer: ['B'],
            explanation: 'The Admin Assistant position is "Part-time, Monday to Wednesday" — three days a week.',
            skillTested: 'Scanning',
          },
        ],
      },
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the text?',
        questions: [
          {
            questionNumber: 5,
            questionData: { prompt: 'Employees must pack their personal items by Thursday, 10 April.' },
            correctAnswer: 'FALSE',
            explanation: 'The notice says personal items must be packed "by Friday, 11 April," not Thursday.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 6,
            questionData: { prompt: 'You should use the lifts during a fire evacuation.' },
            correctAnswer: 'FALSE',
            explanation: 'The safety notice explicitly states: "Do not use the lifts."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 7,
            questionData: { prompt: 'Fire wardens can be recognised by their high-visibility vests.' },
            correctAnswer: 'TRUE',
            explanation: 'The notice states: "The building\'s fire wardens are identified by their high-visibility vests."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 8,
            questionData: { prompt: 'A university degree is required for the Digital Marketing Coordinator role.' },
            correctAnswer: 'FALSE',
            explanation: 'The job ad states a degree "is preferred but not essential."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 9,
            questionData: { prompt: 'The new office is near a railway station.' },
            correctAnswer: 'TRUE',
            explanation: 'The notice states "Riverside Station (Northern and District lines) located just a three-minute walk from the building."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'SHORT_ANSWER',
        instructions: 'Answer the following questions. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the text.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'Who should employees contact with questions about the office move?' },
            correctAnswer: ['Sarah Mitchell'],
            explanation: 'The notice says "Any questions should be directed to the Office Manager, Sarah Mitchell."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'Where is the emergency assembly point?' },
            correctAnswer: ['rear car park', 'the rear car park'],
            explanation: '"Assemble at the designated meeting point in the rear car park."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'What is the minimum experience required for the Digital Marketing Coordinator?' },
            correctAnswer: ['two years', '2 years'],
            explanation: '"A minimum of two years\' experience in digital marketing is required."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'What is the application deadline for the Administrative Assistant position?' },
            correctAnswer: ['4 April'],
            explanation: '"To apply, send your CV to hr@greenfieldmarketing.co.uk by 4 April."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 14,
            questionData: { prompt: 'Name one type of accounting software mentioned as advantageous for the Admin role.' },
            correctAnswer: ['Xero', 'QuickBooks'],
            explanation: '"Experience with accounting software such as Xero or QuickBooks is an advantage."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GT Passage 2: Section 1 — Store Policies & Event Schedules (EASY)
  // Question types: TFNG (6), MC (4), Short Answer (4) = 14 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Oakwood Community Centre: Policies and Events',
    content: `OAKWOOD COMMUNITY CENTRE — MEMBERSHIP AND POLICIES

Welcome to Oakwood Community Centre! We offer a range of facilities and activities for residents of all ages. Membership is available in three tiers:

Standard Membership (£15/month): Access to the fitness room, swimming pool, and one group class per week. Available to individuals aged 16 and over.

Family Membership (£35/month): Includes Standard Membership benefits for up to two adults and three children (aged 5–15) from the same household. Children under 8 must be accompanied by an adult at all times.

Senior Membership (£10/month): Available to individuals aged 65 and over. Includes all Standard Membership benefits plus a complimentary weekly coffee morning every Thursday at 10:00 AM.

All memberships require a minimum commitment of three months. Cancellation must be made in writing at least 30 days before the next payment date. A valid form of identification (passport, driving licence, or utility bill) is required upon registration. Membership cards must be presented upon entry to the centre. Lost cards can be replaced for a fee of £5.

POOL RULES: The swimming pool is open daily from 6:30 AM to 9:00 PM. Lane swimming is available during all hours, with dedicated lanes for fast, medium, and slow swimmers. Children under 12 must be supervised by an adult in the pool area. Diving is not permitted in the shallow end. All swimmers must shower before entering the pool. The pool will be closed for maintenance on the first Monday of each month.

UPCOMING EVENTS — SPRING PROGRAMME

Yoga for Beginners: Every Tuesday and Thursday, 6:00–7:00 PM, Studio 2. Open to all members. No booking required. Mats provided. Instructor: Priya Sharma.

Children's Art Workshop: Saturdays, 10:00 AM–12:00 PM, Room 14. Suitable for ages 6–12. Materials included. Maximum 15 participants per session. Booking essential — register at reception or call 020 7946 0123.

Community Film Night: First Friday of each month, 7:30 PM, Main Hall. Free for all members and their guests. Refreshments available for purchase. This month's film: "The Great Adventure" (PG rating). Doors open at 7:00 PM.

Spring Fair: Saturday, 22 March, 11:00 AM–4:00 PM, Centre Grounds. Open to the public (no membership required). Features local craft stalls, food vendors, live music, and a children's bouncy castle. Entry: £2 for adults, free for children under 12. All proceeds go to the Oakwood Community Fund.

First Aid Course: Saturday, 5 April, 9:00 AM–4:00 PM, Room 8. Open to members and non-members. Cost: £45 per person (includes certificate and manual). Led by St John Ambulance. Limited to 20 places — book via the centre's website.`,
    wordCount: 420,
    difficultyLevel: 'EASY',
    testType: 'GENERAL_TRAINING',
    topicCategory: 'Community',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'Welcome to Oakwood Community Centre! We offer a range of facilities and activities for residents of all ages. Membership is available in three tiers: Standard Membership (£15/month), Family Membership (£35/month), and Senior Membership (£10/month). All memberships require a minimum commitment of three months. Cancellation must be made in writing at least 30 days before the next payment date.' },
      { label: 'B', content: 'Standard Membership (£15/month): Access to the fitness room, swimming pool, and one group class per week. Available to individuals aged 16 and over. Family Membership (£35/month): Includes Standard Membership benefits for up to two adults and three children (aged 5–15) from the same household. Children under 8 must be accompanied by an adult at all times. Senior Membership (£10/month): Available to individuals aged 65 and over. Includes all Standard Membership benefits plus a complimentary weekly coffee morning every Thursday at 10:00 AM.' },
      { label: 'C', content: 'A valid form of identification (passport, driving licence, or utility bill) is required upon registration. Membership cards must be presented upon entry to the centre. Lost cards can be replaced for a fee of £5. POOL RULES: The swimming pool is open daily from 6:30 AM to 9:00 PM. Lane swimming is available during all hours. Children under 12 must be supervised by an adult in the pool area. Diving is not permitted in the shallow end. All swimmers must shower before entering the pool. The pool will be closed for maintenance on the first Monday of each month.' },
      { label: 'D', content: 'UPCOMING EVENTS: Yoga for Beginners — Every Tuesday and Thursday, 6:00–7:00 PM, Studio 2. Children\'s Art Workshop — Saturdays, 10:00 AM–12:00 PM, Room 14. Community Film Night — First Friday of each month, 7:30 PM, Main Hall. Spring Fair — Saturday, 22 March, 11:00 AM–4:00 PM. First Aid Course — Saturday, 5 April, 9:00 AM–4:00 PM, Room 8.' },
    ],
    questionSets: [
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the text?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'A 15-year-old can purchase a Standard Membership.' },
            correctAnswer: 'FALSE',
            explanation: 'Standard Membership is "Available to individuals aged 16 and over."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Family Membership covers up to five family members.' },
            correctAnswer: 'TRUE',
            explanation: 'Family Membership includes "up to two adults and three children" = 5 members.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'Members can cancel their membership at any time without notice.' },
            correctAnswer: 'FALSE',
            explanation: '"Cancellation must be made in writing at least 30 days before the next payment date."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'The swimming pool is open seven days a week.' },
            correctAnswer: 'TRUE',
            explanation: '"The swimming pool is open daily from 6:30 AM to 9:00 PM." Daily means 7 days.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 5,
            questionData: { prompt: 'The yoga classes require advance booking.' },
            correctAnswer: 'FALSE',
            explanation: 'The yoga listing states "No booking required."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 6,
            questionData: { prompt: 'The Spring Fair is only open to centre members.' },
            correctAnswer: 'FALSE',
            explanation: 'The Spring Fair is described as "Open to the public (no membership required)."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 7,
            questionData: {
              prompt: 'How much does it cost to replace a lost membership card?',
              options: [
                { label: 'A', text: '£2' },
                { label: 'B', text: '£5' },
                { label: 'C', text: '£10' },
                { label: 'D', text: '£15' },
              ],
            },
            correctAnswer: ['B'],
            explanation: '"Lost cards can be replaced for a fee of £5."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'What happens to the pool on the first Monday of each month?',
              options: [
                { label: 'A', text: 'It opens later than usual' },
                { label: 'B', text: 'It is reserved for seniors' },
                { label: 'C', text: 'It is closed for maintenance' },
                { label: 'D', text: 'Lane swimming is not available' },
              ],
            },
            correctAnswer: ['C'],
            explanation: '"The pool will be closed for maintenance on the first Monday of each month."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'Who leads the First Aid Course?',
              options: [
                { label: 'A', text: 'Priya Sharma' },
                { label: 'B', text: 'Oakwood Community Centre staff' },
                { label: 'C', text: 'St John Ambulance' },
                { label: 'D', text: 'Local hospital doctors' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'The First Aid Course is "Led by St John Ambulance."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 10,
            questionData: {
              prompt: 'What is the maximum number of children who can attend each Art Workshop session?',
              options: [
                { label: 'A', text: '10' },
                { label: 'B', text: '12' },
                { label: 'C', text: '15' },
                { label: 'D', text: '20' },
              ],
            },
            correctAnswer: ['C'],
            explanation: '"Maximum 15 participants per session."',
            skillTested: 'Scanning',
          },
        ],
      },
      {
        questionType: 'SHORT_ANSWER',
        instructions: 'Answer the following questions. Use NO MORE THAN THREE WORDS AND/OR A NUMBER.',
        questions: [
          {
            questionNumber: 11,
            questionData: { prompt: 'What additional benefit do senior members receive weekly?' },
            correctAnswer: ['coffee morning', 'complimentary coffee morning'],
            explanation: 'Senior Membership includes "a complimentary weekly coffee morning every Thursday."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'What is the entry fee for adults at the Spring Fair?' },
            correctAnswer: ['£2'],
            explanation: '"Entry: £2 for adults, free for children under 12."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'Where do the proceeds from the Spring Fair go?' },
            correctAnswer: ['Oakwood Community Fund', 'the Oakwood Community Fund'],
            explanation: '"All proceeds go to the Oakwood Community Fund."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 14,
            questionData: { prompt: 'How much does the First Aid Course cost per person?' },
            correctAnswer: ['£45'],
            explanation: '"Cost: £45 per person (includes certificate and manual)."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GT Passage 3: Section 2 — Employee Handbook (MEDIUM)
  // Question types: TFNG (5), MC (4), Sentence Completion (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Employee Handbook: Leave Policies and Workplace Conduct',
    content: `ANNUAL LEAVE ENTITLEMENT

All full-time employees are entitled to 25 days of paid annual leave per calendar year, in addition to eight statutory bank holidays. Part-time employees receive a pro-rata entitlement based on their contracted hours. Annual leave accrues from the first day of employment at a rate of approximately 2.08 days per month. New employees may take annual leave during their probationary period, subject to manager approval.

Leave requests must be submitted through the HR portal at least two weeks in advance. Requests for periods of five or more consecutive days require approval from both the employee's line manager and the department head. The company reserves the right to refuse leave requests during peak business periods, which are defined as the last two weeks of each financial quarter. Unused annual leave may be carried forward to the following year, up to a maximum of five days. Any leave carried forward must be taken by 31 March of the following year or it will be forfeited.

SICK LEAVE POLICY

Employees who are unable to work due to illness must notify their line manager before 9:30 AM on the first day of absence, either by telephone or email. A self-certification form must be completed upon return for absences of one to seven calendar days. For absences exceeding seven calendar days, a medical certificate from a registered doctor is required. The company provides full pay for the first 10 days of sick leave in any 12-month rolling period. Beyond this, statutory sick pay applies.

Frequent or patterns of absence may trigger a review under the company's absence management procedure. This process is designed to support employees with health issues, not to penalise them. Reasonable adjustments will be considered for employees with long-term health conditions or disabilities, in accordance with the Equality Act 2010.

WORKPLACE CONDUCT

All employees are expected to maintain professional standards of behaviour in the workplace. The company operates a zero-tolerance policy towards harassment, discrimination, and bullying of any kind. Incidents should be reported to the HR department or through the confidential whistleblowing hotline (0800 555 9999).

The use of company email and internet resources for personal purposes is permitted during break times only. Employees are reminded that all company systems are monitored for security purposes. The downloading of unauthorised software or the accessing of inappropriate websites may result in disciplinary action, up to and including dismissal.

Mobile phones should be switched to silent mode during working hours. Personal calls should be limited to break times except in cases of genuine emergency. The use of personal mobile phones during meetings is not permitted.

DRESS CODE

The company operates a business casual dress code. Smart jeans are acceptable, but ripped or faded jeans are not. T-shirts with logos or slogans are not considered appropriate workwear. On days when clients are visiting the office, employees may be asked to dress more formally. Department managers will provide advance notice of client visits. Employees in customer-facing roles should refer to the specific dress code guidelines issued by their department.`,
    wordCount: 430,
    difficultyLevel: 'MEDIUM',
    testType: 'GENERAL_TRAINING',
    topicCategory: 'Workplace',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'All full-time employees are entitled to 25 days of paid annual leave per calendar year, in addition to eight statutory bank holidays. Part-time employees receive a pro-rata entitlement based on their contracted hours. Annual leave accrues from the first day of employment at a rate of approximately 2.08 days per month. New employees may take annual leave during their probationary period, subject to manager approval.' },
      { label: 'B', content: 'Leave requests must be submitted through the HR portal at least two weeks in advance. Requests for periods of five or more consecutive days require approval from both the employee\'s line manager and the department head. The company reserves the right to refuse leave requests during peak business periods, which are defined as the last two weeks of each financial quarter. Unused annual leave may be carried forward to the following year, up to a maximum of five days. Any leave carried forward must be taken by 31 March of the following year or it will be forfeited.' },
      { label: 'C', content: 'Employees who are unable to work due to illness must notify their line manager before 9:30 AM on the first day of absence, either by telephone or email. A self-certification form must be completed upon return for absences of one to seven calendar days. For absences exceeding seven calendar days, a medical certificate from a registered doctor is required. The company provides full pay for the first 10 days of sick leave in any 12-month rolling period. Beyond this, statutory sick pay applies.' },
      { label: 'D', content: 'Frequent or patterns of absence may trigger a review under the company\'s absence management procedure. This process is designed to support employees with health issues, not to penalise them. Reasonable adjustments will be considered for employees with long-term health conditions or disabilities, in accordance with the Equality Act 2010.' },
      { label: 'E', content: 'All employees are expected to maintain professional standards of behaviour in the workplace. The company operates a zero-tolerance policy towards harassment, discrimination, and bullying of any kind. Incidents should be reported to the HR department or through the confidential whistleblowing hotline (0800 555 9999).' },
      { label: 'F', content: 'The use of company email and internet resources for personal purposes is permitted during break times only. Employees are reminded that all company systems are monitored for security purposes. The downloading of unauthorised software or the accessing of inappropriate websites may result in disciplinary action, up to and including dismissal.' },
      { label: 'G', content: 'Mobile phones should be switched to silent mode during working hours. Personal calls should be limited to break times except in cases of genuine emergency. The use of personal mobile phones during meetings is not permitted.' },
      { label: 'H', content: 'The company operates a business casual dress code. Smart jeans are acceptable, but ripped or faded jeans are not. T-shirts with logos or slogans are not considered appropriate workwear. On days when clients are visiting the office, employees may be asked to dress more formally. Department managers will provide advance notice of client visits.' },
    ],
    questionSets: [
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the text?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'New employees cannot take any leave during their probation.' },
            correctAnswer: 'FALSE',
            explanation: '"New employees may take annual leave during their probationary period, subject to manager approval."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'A request for four consecutive days off only needs line manager approval.' },
            correctAnswer: 'TRUE',
            explanation: 'Only requests for "five or more consecutive days require approval from both the line manager and the department head." Four days needs only line manager approval.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'Employees receive full sick pay for all days of illness.' },
            correctAnswer: 'FALSE',
            explanation: '"Full pay for the first 10 days of sick leave in any 12-month rolling period. Beyond this, statutory sick pay applies."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'The absence management procedure is intended to punish employees who are frequently ill.' },
            correctAnswer: 'FALSE',
            explanation: '"This process is designed to support employees with health issues, not to penalise them."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 5,
            questionData: { prompt: 'Employees may use company internet for personal browsing during lunch.' },
            correctAnswer: 'TRUE',
            explanation: '"The use of company email and internet resources for personal purposes is permitted during break times only." Lunch is a break time.',
            skillTested: 'Inference',
          },
        ],
      },
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 6,
            questionData: {
              prompt: 'How many days of carried-forward leave can expire at the end of March?',
              options: [
                { label: 'A', text: 'Up to 2 days' },
                { label: 'B', text: 'Up to 5 days' },
                { label: 'C', text: 'Up to 10 days' },
                { label: 'D', text: 'Up to 25 days' },
              ],
            },
            correctAnswer: ['B'],
            explanation: '"Unused annual leave may be carried forward... up to a maximum of five days." If not used by 31 March, they are forfeited.',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'When are employees most likely to have leave requests refused?',
              options: [
                { label: 'A', text: 'During the first two weeks of each quarter' },
                { label: 'B', text: 'During bank holidays' },
                { label: 'C', text: 'During the last two weeks of each financial quarter' },
                { label: 'D', text: 'During the summer months' },
              ],
            },
            correctAnswer: ['C'],
            explanation: '"Peak business periods... are defined as the last two weeks of each financial quarter."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'What could happen if an employee downloads unauthorised software?',
              options: [
                { label: 'A', text: 'A verbal warning only' },
                { label: 'B', text: 'A fine will be imposed' },
                { label: 'C', text: 'Their internet access will be restricted' },
                { label: 'D', text: 'They could face disciplinary action including dismissal' },
              ],
            },
            correctAnswer: ['D'],
            explanation: '"may result in disciplinary action, up to and including dismissal."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'Which of the following is acceptable under the dress code?',
              options: [
                { label: 'A', text: 'Ripped jeans' },
                { label: 'B', text: 'Smart jeans' },
                { label: 'C', text: 'T-shirts with brand logos' },
                { label: 'D', text: 'Faded jeans' },
              ],
            },
            correctAnswer: ['B'],
            explanation: '"Smart jeans are acceptable, but ripped or faded jeans are not."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'SENTENCE_COMPLETION',
        instructions: 'Complete the sentences. Choose NO MORE THAN THREE WORDS AND/OR A NUMBER from the text.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'Part-time employees receive annual leave on a _______ basis.' },
            correctAnswer: ['pro-rata', 'pro rata'],
            explanation: '"Part-time employees receive a pro-rata entitlement."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'Sick employees must contact their line manager before _______ on the first day.' },
            correctAnswer: ['9:30 AM'],
            explanation: '"must notify their line manager before 9:30 AM on the first day of absence."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'For absences longer than seven days, a _______ is required.' },
            correctAnswer: ['medical certificate'],
            explanation: '"For absences exceeding seven calendar days, a medical certificate from a registered doctor is required."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'Harassment incidents can be reported via the _______ hotline.' },
            correctAnswer: ['whistleblowing', 'confidential whistleblowing'],
            explanation: '"through the confidential whistleblowing hotline."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GT Passage 4: Section 2 — Rental Agreement & Complaint Procedure (MEDIUM)
  // Question types: YNNG (4), Matching Information (5), Short Answer (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Tenant Guide: Rental Agreement and Complaint Procedures',
    content: `RENTAL AGREEMENT — KEY TERMS

This document outlines the key terms of your tenancy agreement with Parkview Properties Ltd. Please read all sections carefully and retain a copy for your records.

Rent Payment: Monthly rent is due on the first day of each calendar month. Payment should be made by bank transfer to the account details provided in your tenancy agreement. A late payment charge of £25 will be applied if rent is not received within five working days of the due date. Persistent late payment may result in proceedings to end the tenancy.

Deposit: A security deposit equivalent to five weeks' rent is required before the start of the tenancy. This deposit is protected under the government-approved Deposit Protection Service (DPS) and will be returned within 10 working days of the end of the tenancy, subject to deductions for any damage beyond normal wear and tear, unpaid rent, or breach of contract.

Property Maintenance: Tenants are responsible for keeping the property in a clean and habitable condition. This includes regular cleaning, proper disposal of waste, and reporting maintenance issues promptly. The landlord is responsible for structural repairs, plumbing and electrical systems, and heating and hot water systems. Tenants must not make any alterations to the property, including painting walls, installing shelving, or changing locks, without prior written consent from the landlord.

Garden and Exterior: Where the property includes a garden, tenants are expected to maintain it in a reasonable condition, including mowing the lawn and keeping pathways clear. Tenants may plant flowers and vegetables but must not remove or damage any existing trees, hedges, or shrubs. External storage of large items such as caravans or boats is not permitted.

COMPLAINT PROCEDURE

Parkview Properties is committed to providing a high standard of service to all tenants. If you have a complaint, please follow the procedure outlined below:

Step 1 — Informal Resolution: In the first instance, contact your designated property manager by phone or email. Most issues can be resolved informally within five working days.

Step 2 — Formal Written Complaint: If the issue is not resolved satisfactorily, submit a formal complaint in writing to complaints@parkviewproperties.co.uk. Include your tenancy reference number, a clear description of the issue, and any supporting evidence. You will receive an acknowledgement within two working days and a full response within 15 working days.

Step 3 — Internal Review: If you are dissatisfied with the response to your formal complaint, you may request an internal review by a senior manager. This request must be made within 14 days of receiving the formal response. The review will be completed within 20 working days.

Step 4 — External Mediation: If the matter remains unresolved after the internal review, you may refer your complaint to the Property Ombudsman, an independent dispute resolution service. Parkview Properties is a member of the Property Ombudsman scheme and is bound by its decisions. Contact details: www.tpos.co.uk or telephone 01onal 722 333 306.`,
    wordCount: 440,
    difficultyLevel: 'MEDIUM',
    testType: 'GENERAL_TRAINING',
    topicCategory: 'Housing',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'This document outlines the key terms of your tenancy agreement with Parkview Properties Ltd. Please read all sections carefully and retain a copy for your records.' },
      { label: 'B', content: 'Rent Payment: Monthly rent is due on the first day of each calendar month. Payment should be made by bank transfer to the account details provided in your tenancy agreement. A late payment charge of £25 will be applied if rent is not received within five working days of the due date. Persistent late payment may result in proceedings to end the tenancy.' },
      { label: 'C', content: 'Deposit: A security deposit equivalent to five weeks\' rent is required before the start of the tenancy. This deposit is protected under the government-approved Deposit Protection Service (DPS) and will be returned within 10 working days of the end of the tenancy, subject to deductions for any damage beyond normal wear and tear, unpaid rent, or breach of contract.' },
      { label: 'D', content: 'Property Maintenance: Tenants are responsible for keeping the property in a clean and habitable condition. This includes regular cleaning, proper disposal of waste, and reporting maintenance issues promptly. The landlord is responsible for structural repairs, plumbing and electrical systems, and heating and hot water systems. Tenants must not make any alterations to the property, including painting walls, installing shelving, or changing locks, without prior written consent from the landlord.' },
      { label: 'E', content: 'Garden and Exterior: Where the property includes a garden, tenants are expected to maintain it in a reasonable condition, including mowing the lawn and keeping pathways clear. Tenants may plant flowers and vegetables but must not remove or damage any existing trees, hedges, or shrubs. External storage of large items such as caravans or boats is not permitted.' },
      { label: 'F', content: 'Step 1 — Informal Resolution: In the first instance, contact your designated property manager by phone or email. Most issues can be resolved informally within five working days.' },
      { label: 'G', content: 'Step 2 — Formal Written Complaint: If the issue is not resolved satisfactorily, submit a formal complaint in writing to complaints@parkviewproperties.co.uk. Include your tenancy reference number, a clear description of the issue, and any supporting evidence. You will receive an acknowledgement within two working days and a full response within 15 working days.' },
      { label: 'H', content: 'Step 3 — Internal Review: If you are dissatisfied with the response to your formal complaint, you may request an internal review by a senior manager. This request must be made within 14 days of receiving the formal response. The review will be completed within 20 working days. Step 4 — External Mediation: If the matter remains unresolved after the internal review, you may refer your complaint to the Property Ombudsman.' },
    ],
    questionSets: [
      {
        questionType: 'YES_NO_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the text?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'Rent can be paid by cheque.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'The text only mentions "bank transfer" as the payment method. Cheque is not mentioned.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Tenants are allowed to grow vegetables in the garden.' },
            correctAnswer: 'YES',
            explanation: '"Tenants may plant flowers and vegetables."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'Tenants can change the locks on the property without permission.' },
            correctAnswer: 'NO',
            explanation: '"Tenants must not make any alterations to the property, including... changing locks, without prior written consent."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'Parkview Properties must follow the decisions of the Property Ombudsman.' },
            correctAnswer: 'YES',
            explanation: '"Parkview Properties is a member of the Property Ombudsman scheme and is bound by its decisions."',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'MATCHING_INFORMATION',
        instructions: 'Which paragraph contains the following information?',
        questions: [
          {
            questionNumber: 5,
            questionData: {
              prompt: 'The consequences of paying rent late',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'B',
            explanation: 'Paragraph B mentions the £25 late fee and possible proceedings to end the tenancy.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 6,
            questionData: {
              prompt: 'Rules about what tenants can do in the garden',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'E',
            explanation: 'Paragraph E covers garden maintenance, planting, and restrictions.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'Information about how the deposit is protected',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'C',
            explanation: 'Paragraph C describes the Deposit Protection Service.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'What to include when making a formal complaint',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'G',
            explanation: 'Paragraph G instructs tenants to include their reference number, description, and evidence.',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'Who is responsible for plumbing repairs',
              options: [
                { label: 'A', text: 'Paragraph A' }, { label: 'B', text: 'Paragraph B' },
                { label: 'C', text: 'Paragraph C' }, { label: 'D', text: 'Paragraph D' },
                { label: 'E', text: 'Paragraph E' }, { label: 'F', text: 'Paragraph F' },
                { label: 'G', text: 'Paragraph G' }, { label: 'H', text: 'Paragraph H' },
              ],
            },
            correctAnswer: 'D',
            explanation: 'Paragraph D states "The landlord is responsible for structural repairs, plumbing and electrical systems."',
            skillTested: 'Scanning',
          },
        ],
      },
      {
        questionType: 'SHORT_ANSWER',
        instructions: 'Answer the following questions. Use NO MORE THAN THREE WORDS AND/OR A NUMBER.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'How much is the deposit equivalent to?' },
            correctAnswer: ['five weeks rent', "five weeks' rent", '5 weeks rent'],
            explanation: '"A security deposit equivalent to five weeks\' rent."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'Within how many working days will the deposit be returned after the tenancy ends?' },
            correctAnswer: ['10 working days', '10'],
            explanation: '"returned within 10 working days of the end of the tenancy."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'How long do you have to request an internal review after receiving a formal response?' },
            correctAnswer: ['14 days'],
            explanation: '"This request must be made within 14 days of receiving the formal response."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'What independent service can tenants use if the internal review does not resolve their complaint?' },
            correctAnswer: ['Property Ombudsman', 'the Property Ombudsman'],
            explanation: '"you may refer your complaint to the Property Ombudsman, an independent dispute resolution service."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GT Passage 5: Section 3 — General Interest: Climate Change (HARD)
  // Question types: TFNG (5), MC (4), Summary Completion (4) = 13 questions
  // ──────────────────────────────────────────────────────────────
  {
    title: 'Understanding Climate Change: A Practical Guide',
    content: `Climate change refers to long-term shifts in global temperatures and weather patterns. While natural factors such as volcanic eruptions and variations in solar activity have influenced the Earth's climate throughout its history, the term is now primarily used to describe changes caused by human activities, particularly the burning of fossil fuels such as coal, oil, and natural gas. These activities release greenhouse gases, primarily carbon dioxide and methane, into the atmosphere, where they trap heat from the sun and cause the planet's average temperature to rise.

Since the late nineteenth century, the Earth's average surface temperature has risen by approximately 1.1 degrees Celsius, with most of this warming occurring in the past 50 years. While this may seem like a small change, it has had far-reaching consequences for weather patterns, sea levels, and ecosystems around the world. The decade from 2011 to 2020 was the warmest on record, and global temperatures continue to rise.

The effects of climate change are already visible in many parts of the world. Arctic sea ice is declining at a rate of approximately 13 percent per decade, contributing to rising sea levels that threaten coastal communities. Extreme weather events, including heatwaves, droughts, floods, and tropical storms, are becoming more frequent and more intense. In Australia, the 2019–2020 bushfire season, which burned more than 10 million hectares and killed an estimated one billion animals, was directly linked to record-breaking temperatures and prolonged drought conditions exacerbated by climate change.

Agriculture is particularly vulnerable to climate change. Changes in temperature and rainfall patterns can reduce crop yields, increase the spread of pests and diseases, and make previously productive land unsuitable for farming. The United Nations Food and Agriculture Organization has warned that climate change could reduce global food production by up to 25 percent by 2050, disproportionately affecting developing countries where millions of people depend on subsistence farming.

Individuals can take meaningful action to reduce their carbon footprint. Transport is one of the largest sources of personal emissions in developed countries. Choosing to walk, cycle, or use public transport instead of driving can significantly reduce emissions. For longer journeys, trains produce far fewer emissions per passenger than aeroplanes. At home, improving insulation, switching to a renewable energy supplier, and reducing energy consumption through simple measures such as turning off lights and using energy-efficient appliances can all make a difference.

Dietary choices also play a role. The production of meat, particularly beef and lamb, generates significantly more greenhouse gas emissions than the production of plant-based foods. Reducing meat consumption, avoiding food waste, and choosing locally produced seasonal food are effective ways to lower the environmental impact of your diet. Research published in the journal Science found that adopting a plant-based diet could reduce an individual's food-related carbon emissions by up to 73 percent.

At a larger scale, governments and businesses have crucial roles to play. The Paris Agreement, signed by 196 countries in 2015, committed signatories to limiting global warming to well below 2 degrees Celsius above pre-industrial levels, with efforts to limit the increase to 1.5 degrees. Achieving this goal requires rapid decarbonisation of energy systems, investment in renewable technology, protection of forests and natural carbon sinks, and fundamental changes to industrial processes and transportation systems.

The transition to a low-carbon economy presents both challenges and opportunities. While some industries will decline, new sectors such as renewable energy, electric transport, and green building are creating millions of jobs worldwide. Economists argue that the cost of inaction on climate change far exceeds the cost of transition, making decisive action not only an environmental imperative but an economic one as well.`,
    wordCount: 555,
    difficultyLevel: 'HARD',
    testType: 'GENERAL_TRAINING',
    topicCategory: 'Environment',
    sourceAttribution: 'Original content for educational purposes',
    paragraphs: [
      { label: 'A', content: 'Climate change refers to long-term shifts in global temperatures and weather patterns. While natural factors such as volcanic eruptions and variations in solar activity have influenced the Earth\'s climate throughout its history, the term is now primarily used to describe changes caused by human activities, particularly the burning of fossil fuels such as coal, oil, and natural gas. These activities release greenhouse gases, primarily carbon dioxide and methane, into the atmosphere, where they trap heat from the sun and cause the planet\'s average temperature to rise.' },
      { label: 'B', content: 'Since the late nineteenth century, the Earth\'s average surface temperature has risen by approximately 1.1 degrees Celsius, with most of this warming occurring in the past 50 years. While this may seem like a small change, it has had far-reaching consequences for weather patterns, sea levels, and ecosystems around the world. The decade from 2011 to 2020 was the warmest on record, and global temperatures continue to rise.' },
      { label: 'C', content: 'The effects of climate change are already visible in many parts of the world. Arctic sea ice is declining at a rate of approximately 13 percent per decade, contributing to rising sea levels that threaten coastal communities. Extreme weather events, including heatwaves, droughts, floods, and tropical storms, are becoming more frequent and more intense. In Australia, the 2019–2020 bushfire season, which burned more than 10 million hectares and killed an estimated one billion animals, was directly linked to record-breaking temperatures and prolonged drought conditions exacerbated by climate change.' },
      { label: 'D', content: 'Agriculture is particularly vulnerable to climate change. Changes in temperature and rainfall patterns can reduce crop yields, increase the spread of pests and diseases, and make previously productive land unsuitable for farming. The United Nations Food and Agriculture Organization has warned that climate change could reduce global food production by up to 25 percent by 2050, disproportionately affecting developing countries where millions of people depend on subsistence farming.' },
      { label: 'E', content: 'Individuals can take meaningful action to reduce their carbon footprint. Transport is one of the largest sources of personal emissions in developed countries. Choosing to walk, cycle, or use public transport instead of driving can significantly reduce emissions. For longer journeys, trains produce far fewer emissions per passenger than aeroplanes. At home, improving insulation, switching to a renewable energy supplier, and reducing energy consumption through simple measures such as turning off lights and using energy-efficient appliances can all make a difference.' },
      { label: 'F', content: 'Dietary choices also play a role. The production of meat, particularly beef and lamb, generates significantly more greenhouse gas emissions than the production of plant-based foods. Reducing meat consumption, avoiding food waste, and choosing locally produced seasonal food are effective ways to lower the environmental impact of your diet. Research published in the journal Science found that adopting a plant-based diet could reduce an individual\'s food-related carbon emissions by up to 73 percent.' },
      { label: 'G', content: 'At a larger scale, governments and businesses have crucial roles to play. The Paris Agreement, signed by 196 countries in 2015, committed signatories to limiting global warming to well below 2 degrees Celsius above pre-industrial levels, with efforts to limit the increase to 1.5 degrees. Achieving this goal requires rapid decarbonisation of energy systems, investment in renewable technology, protection of forests and natural carbon sinks, and fundamental changes to industrial processes and transportation systems.' },
      { label: 'H', content: 'The transition to a low-carbon economy presents both challenges and opportunities. While some industries will decline, new sectors such as renewable energy, electric transport, and green building are creating millions of jobs worldwide. Economists argue that the cost of inaction on climate change far exceeds the cost of transition, making decisive action not only an environmental imperative but an economic one as well.' },
    ],
    questionSets: [
      {
        questionType: 'TRUE_FALSE_NOT_GIVEN',
        instructions: 'Do the following statements agree with the information given in the passage?',
        questions: [
          {
            questionNumber: 1,
            questionData: { prompt: 'Natural factors no longer play any role in climate change.' },
            correctAnswer: 'NOT GIVEN',
            explanation: 'The passage says the term "is now primarily used to describe changes caused by human activities" but does not say natural factors no longer play any role.',
            skillTested: 'Inference',
          },
          {
            questionNumber: 2,
            questionData: { prompt: 'Most global warming has occurred in the last five decades.' },
            correctAnswer: 'TRUE',
            explanation: '"most of this warming occurring in the past 50 years."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 3,
            questionData: { prompt: 'The Australian bushfires of 2019–2020 destroyed over 10 million hectares.' },
            correctAnswer: 'TRUE',
            explanation: '"burned more than 10 million hectares."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 4,
            questionData: { prompt: 'Climate change will affect all countries equally.' },
            correctAnswer: 'FALSE',
            explanation: 'Paragraph D states the effects will "disproportionately affect developing countries."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 5,
            questionData: { prompt: 'Aeroplanes produce more emissions per passenger than trains.' },
            correctAnswer: 'TRUE',
            explanation: '"trains produce far fewer emissions per passenger than aeroplanes" — so aeroplanes produce more.',
            skillTested: 'Detail recognition',
          },
        ],
      },
      {
        questionType: 'MULTIPLE_CHOICE',
        instructions: 'Choose the correct letter, A, B, C or D.',
        questions: [
          {
            questionNumber: 6,
            questionData: {
              prompt: 'According to the passage, what is the main cause of current climate change?',
              options: [
                { label: 'A', text: 'Volcanic eruptions' },
                { label: 'B', text: 'Variations in solar activity' },
                { label: 'C', text: 'Burning of fossil fuels' },
                { label: 'D', text: 'Deforestation' },
              ],
            },
            correctAnswer: ['C'],
            explanation: 'Paragraph A: changes "caused by human activities, particularly the burning of fossil fuels."',
            skillTested: 'Detail recognition',
          },
          {
            questionNumber: 7,
            questionData: {
              prompt: 'By how much could global food production decrease by 2050?',
              options: [
                { label: 'A', text: 'Up to 13 percent' },
                { label: 'B', text: 'Up to 25 percent' },
                { label: 'C', text: 'Up to 50 percent' },
                { label: 'D', text: 'Up to 73 percent' },
              ],
            },
            correctAnswer: ['B'],
            explanation: '"could reduce global food production by up to 25 percent by 2050."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 8,
            questionData: {
              prompt: 'What does the writer suggest about the cost of tackling climate change?',
              options: [
                { label: 'A', text: 'It is too expensive for most countries' },
                { label: 'B', text: 'It is less than the cost of doing nothing' },
                { label: 'C', text: 'It will be covered by new industries' },
                { label: 'D', text: 'It should be shared equally between all nations' },
              ],
            },
            correctAnswer: ['B'],
            explanation: '"the cost of inaction on climate change far exceeds the cost of transition."',
            skillTested: 'Inference',
          },
          {
            questionNumber: 9,
            questionData: {
              prompt: 'How many countries signed the Paris Agreement?',
              options: [
                { label: 'A', text: '150' },
                { label: 'B', text: '175' },
                { label: 'C', text: '196' },
                { label: 'D', text: '200' },
              ],
            },
            correctAnswer: ['C'],
            explanation: '"The Paris Agreement, signed by 196 countries in 2015."',
            skillTested: 'Scanning',
          },
        ],
      },
      {
        questionType: 'SUMMARY_COMPLETION',
        instructions: 'Complete the summary. Choose NO MORE THAN TWO WORDS from the passage.',
        questions: [
          {
            questionNumber: 10,
            questionData: { prompt: 'The two main greenhouse gases are carbon dioxide and _______.' },
            correctAnswer: ['methane'],
            explanation: '"greenhouse gases, primarily carbon dioxide and methane."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 11,
            questionData: { prompt: 'Arctic sea ice is reducing by about 13 percent per _______.' },
            correctAnswer: ['decade'],
            explanation: '"declining at a rate of approximately 13 percent per decade."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 12,
            questionData: { prompt: 'A plant-based diet can cut food-related carbon emissions by up to _______ percent.' },
            correctAnswer: ['73'],
            explanation: '"could reduce an individual\'s food-related carbon emissions by up to 73 percent."',
            skillTested: 'Scanning',
          },
          {
            questionNumber: 13,
            questionData: { prompt: 'The Paris Agreement aims to limit warming to below _______ degrees Celsius above pre-industrial levels.' },
            correctAnswer: ['2'],
            explanation: '"limiting global warming to well below 2 degrees Celsius above pre-industrial levels."',
            skillTested: 'Scanning',
          },
        ],
      },
    ],
  },
];
