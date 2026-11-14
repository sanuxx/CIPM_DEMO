/**
 * Fictional demo course content for the CIPM LMS demo.
 * Written for demonstration purposes only — not official CIPM curriculum or legal advice.
 */
import type { Progression } from '@/types'

export type QSeed =
  | { k: 'mcq'; q: string; o: string[]; a: number; e: string }
  | { k: 'multi'; q: string; o: string[]; a: number[]; e: string }
  | { k: 'tf'; q: string; a: boolean; e: string }
  | { k: 'blank'; q: string; a: string[]; e: string }

export interface LessonSeed {
  title: string
  summary: string
  minutes: number
  /** [heading, explanation] */
  points: [string, string][]
  quiz: QSeed[]
}

export interface ModuleSeed {
  title: string
  description: string
  progression: Progression
  lessons: LessonSeed[]
}

const mcq = (q: string, o: string[], e: string, a = 0): QSeed => ({ k: 'mcq', q, o, a, e })
const multi = (q: string, o: string[], a: number[], e: string): QSeed => ({ k: 'multi', q, o, a, e })
const tf = (q: string, a: boolean, e: string): QSeed => ({ k: 'tf', q, a, e })
const blank = (q: string, a: string[], e: string): QSeed => ({ k: 'blank', q, a, e })

export const COURSE_SEED = {
  code: 'CHRM',
  title: 'Certificate in Human Resource Management',
  subtitle: 'CIPM Professional Programme · Demo Course',
  description:
    'A practical foundation programme for early-career HR practitioners and line managers. Across eight modules you will build a working knowledge of the employee life cycle, Sri Lankan labour law essentials, HR analytics, workplace wellbeing and professional practice. Modules 1–4 build on each other and are completed in sequence; Modules 5–8 are stand-alone and can be studied at any time. This is fictional demonstration content prepared for the LMS demo.',
  level: 'Foundation',
  fee: 85000,
  durationMonths: 6,
  outcomes: [
    'Explain the role of HRM and how people practices support organisational strategy',
    'Plan, recruit, select and onboard talent using fair, evidence-based methods',
    'Design learning interventions and run an effective performance management cycle',
    'Apply reward, engagement and employee relations principles in day-to-day HR work',
    'Identify the key Sri Lankan labour statutes and employer obligations such as EPF, ETF and gratuity',
    'Use HR metrics and HR information systems to support better decisions',
    'Promote health, safety and wellbeing in the workplace',
    'Communicate professionally and act ethically as an HR practitioner',
  ],
}

export const MODULE_SEEDS: ModuleSeed[] = [
  {
    title: 'Foundations of Human Resource Management',
    description: 'How the HR function evolved, what it is accountable for and how it fits the wider organisation.',
    progression: 'sequential',
    lessons: [
      {
        title: 'The Evolution and Role of HRM',
        summary: 'How personnel administration grew into strategic HRM, and what the HR function is accountable for today.',
        minutes: 6,
        points: [
          ['From personnel administration to HRM', 'Early personnel departments concentrated on record keeping, payroll and welfare. Modern HRM treats people as a source of competitive advantage and links people practices to business goals.'],
          ['Core HR functions', 'Workforce planning, recruitment, learning and development, performance, reward, employee relations and compliance together cover the full employee life cycle.'],
          ['Line managers as people managers', 'Day-to-day people management sits with line managers. HR designs the frameworks, coaches managers and safeguards fairness and consistency.'],
          ['Measuring HR\'s contribution', 'Indicators such as turnover, time to hire, engagement and productivity help demonstrate how people practices influence organisational results.'],
        ],
        quiz: [
          mcq('Which statement best describes modern HRM compared with traditional personnel administration?', ['It aligns people practices with business strategy', 'It focuses only on payroll accuracy', 'It removes all people responsibilities from line managers', 'It applies only to large multinational companies'], 'HRM is distinguished by its strategic focus: people practices are designed to support organisational goals.'),
          tf('Line managers have no role in people management once an HR department exists.', false, 'Line managers handle day-to-day people management; HR provides frameworks, advice and oversight.'),
          multi('Which of the following are core HR functions?', ['Recruitment and selection', 'Learning and development', 'Reward management', 'Product pricing'], [0, 1, 2], 'Recruitment, learning and reward are all stages of the employee life cycle. Product pricing is a commercial function.'),
          blank('The sequence of stages from joining to leaving an organisation is known as the employee life ____.', ['cycle', 'lifecycle'], 'The employee life cycle covers attraction, recruitment, onboarding, development, retention and exit.'),
        ],
      },
      {
        title: 'Strategic HRM and Organisational Alignment',
        summary: 'Linking HR strategy to business strategy, and making HR practices reinforce one another.',
        minutes: 7,
        points: [
          ['Vertical alignment', 'HR strategy should flow from business strategy. A company competing on service quality, for example, needs hiring, training and reward practices that build service capability.'],
          ['Horizontal alignment', 'HR practices work best as a coherent bundle. Recruitment, development and reward should send the same message about what the organisation values.'],
          ['Best practice versus best fit', 'The best practice view says some HR practices help every organisation. The best fit view argues practices must be tailored to context, strategy and culture.'],
          ['The HR business partner model', 'Dave Ulrich described HR roles as strategic partner, change agent, administrative expert and employee champion, moving HR closer to the business.'],
        ],
        quiz: [
          mcq('Vertical alignment in strategic HRM refers to:', ['Linking HR strategy to the organisation\'s business strategy', 'Aligning job titles across departments', 'Standardising office layouts', 'Reporting HR data to regulators'], 'Vertical alignment (or vertical fit) means HR strategy supports and is derived from business strategy.'),
          tf('The "best fit" approach argues that HR practices should be tailored to an organisation\'s context.', true, 'Best fit, also called the contingency approach, holds that there is no universal set of practices.'),
          multi('Which roles are part of Dave Ulrich\'s original HR model?', ['Strategic partner', 'Change agent', 'Employee champion', 'Financial auditor'], [0, 1, 2], 'Ulrich\'s four roles are strategic partner, change agent, administrative expert and employee champion.'),
          blank('When recruitment, reward and development practices reinforce one another, this is called ____ alignment.', ['horizontal'], 'Horizontal alignment describes consistency between HR practices themselves.'),
        ],
      },
      {
        title: 'Organisational Culture and Structure',
        summary: 'What culture is, how structures shape work, and the levers HR can use to influence both.',
        minutes: 6,
        points: [
          ['Understanding culture', 'Edgar Schein described three levels of culture: visible artefacts, espoused values and deeply held underlying assumptions about "how things are done here".'],
          ['Common organisation structures', 'Functional structures group people by specialism, divisional structures by product or region, and matrix structures combine both with dual reporting lines.'],
          ['Span of control and hierarchy', 'The span of control is the number of people reporting to one manager. Wider spans create flatter organisations with fewer layers.'],
          ['HR\'s influence on culture', 'Hiring criteria, induction, recognition schemes and the behaviour leaders model all signal what the organisation truly values.'],
        ],
        quiz: [
          mcq('In Schein\'s model, which level of culture is the most visible?', ['Artefacts', 'Underlying assumptions', 'Espoused values', 'Informal networks'], 'Artefacts — dress, office layout, rituals — can be seen directly, although their meaning may be hard to interpret.'),
          tf('In a matrix structure, employees always have a single reporting line.', false, 'Matrix structures typically involve dual reporting, for example to a functional head and a project or product head.'),
          multi('Which HR levers help shape organisational culture?', ['Induction programmes', 'Recognition schemes', 'Leadership role modelling', 'Changing the corporate tax rate'], [0, 1, 2], 'Culture is reinforced through people practices and leadership behaviour.'),
          blank('The number of employees who report directly to one manager is called the span of ____.', ['control'], 'A wide span of control means many direct reports per manager.'),
        ],
      },
    ],
  },
  {
    title: 'Talent Acquisition and Workforce Planning',
    description: 'Forecasting workforce needs, attracting candidates and selecting and onboarding the right people.',
    progression: 'sequential',
    lessons: [
      {
        title: 'Workforce Planning and Job Analysis',
        summary: 'Forecasting demand and supply for talent, and defining jobs clearly before recruiting.',
        minutes: 7,
        points: [
          ['Forecasting demand and supply', 'Workforce planning compares the skills and numbers the organisation will need with those it is likely to have, taking turnover, retirements and growth plans into account.'],
          ['Gap analysis and action plans', 'The workforce gap drives decisions to recruit, develop, redeploy or restructure. Plans should be reviewed whenever the business strategy changes.'],
          ['Job analysis', 'Job analysis gathers information about duties, working conditions and required capabilities through interviews, observation and questionnaires.'],
          ['Job description and person specification', 'The job description sets out purpose and responsibilities. The person specification lists the knowledge, skills and attributes needed to perform the job.'],
        ],
        quiz: [
          mcq('Which document sets out the knowledge, skills and attributes required of a job holder?', ['Person specification', 'Job description', 'Organisation chart', 'Letter of appointment'], 'The person specification describes the person; the job description describes the job.'),
          tf('Workforce planning compares the future demand for labour with the expected supply.', true, 'The comparison reveals surpluses or shortages that HR must address.'),
          multi('Which of the following are outputs of job analysis?', ['Job description', 'Person specification', 'Annual financial statements', 'Customer invoices'], [0, 1], 'Job analysis produces the job description and person specification, and informs job evaluation and training.'),
          blank('The difference between the workforce an organisation needs and the workforce it has is known as the workforce ____.', ['gap'], 'Gap analysis is the basis of the workforce action plan.'),
        ],
      },
      {
        title: 'Recruitment Channels and Employer Branding',
        summary: 'Choosing sourcing channels, building an employer brand and measuring recruitment effectiveness.',
        minutes: 6,
        points: [
          ['Internal and external recruitment', 'Internal recruitment rewards loyalty and is quicker; external recruitment brings in new skills and perspectives. Most organisations use a mix of both.'],
          ['Choosing channels', 'Job portals, employee referrals, campus recruitment, agencies and professional social networks each suit different roles, budgets and urgency.'],
          ['Employer value proposition', 'The EVP is the set of benefits, opportunities and experiences an employer offers in return for an employee\'s skills and commitment.'],
          ['Recruitment metrics', 'Time to fill, cost per hire, quality of hire and source effectiveness show whether the recruitment process is delivering value.'],
        ],
        quiz: [
          mcq('An employee referral scheme is an example of:', ['A recruitment channel', 'A selection test', 'A reward benchmark', 'A disciplinary procedure'], 'Referrals are a sourcing channel that draws on employees\' networks.'),
          tf('Internal recruitment can improve morale by showing that career progression is possible.', true, 'Visible internal moves signal that the organisation invests in its people.'),
          multi('Which of these are common recruitment metrics?', ['Time to fill', 'Cost per hire', 'Quality of hire', 'Debtor days'], [0, 1, 2], 'Debtor days is a finance measure, not a recruitment metric.'),
          blank('The set of benefits and experiences an employer offers in return for an employee\'s skills is the employer value ____.', ['proposition'], 'A clear EVP underpins the employer brand.'),
        ],
      },
      {
        title: 'Selection Methods and Onboarding',
        summary: 'Using structured, fair selection methods and helping new hires become productive quickly.',
        minutes: 8,
        points: [
          ['Structured interviews', 'Asking every candidate the same job-related questions and scoring answers against agreed criteria improves consistency and reduces bias.'],
          ['Assessment tools', 'Work samples, ability tests and assessment centres add evidence. A good method is reliable (consistent) and valid (predicts job performance).'],
          ['Fair selection', 'Decisions should rest on job-related criteria only. Keep records of how each decision was reached so that it can be explained.'],
          ['Onboarding', 'A structured induction, a buddy or mentor and clear probation objectives help new employees settle in during their first 90 days.'],
        ],
        quiz: [
          mcq('Which interview type generally gives the most consistent and comparable results?', ['Structured interview', 'Unstructured conversation', 'Informal lunch meeting', 'Telephone small talk'], 'Structured interviews use the same questions and scoring for all candidates.'),
          tf('Reliability refers to whether a selection method produces consistent results.', true, 'Reliability is about consistency; validity is about measuring what matters for the job.'),
          multi('Which are elements of effective onboarding?', ['A structured induction', 'Clear probation objectives', 'A buddy or mentor', 'Withholding job information until confirmation'], [0, 1, 2], 'New hires need information and support early, not after confirmation.'),
          blank('The extent to which a selection method predicts future job performance is called predictive ____.', ['validity'], 'Predictive validity is the key test of a selection method\'s usefulness.'),
        ],
      },
    ],
  },
  {
    title: 'Learning, Development and Performance Management',
    description: 'Identifying learning needs, managing performance and developing people for future roles.',
    progression: 'sequential',
    lessons: [
      {
        title: 'Learning Needs Analysis and Programme Design',
        summary: 'Diagnosing capability gaps and designing learning that closes them.',
        minutes: 7,
        points: [
          ['Three levels of need', 'Learning needs arise at organisational level (strategy and change), job level (role requirements) and individual level (personal performance and aspirations).'],
          ['Setting learning objectives', 'Clear objectives state what learners will be able to do after the programme, and make later evaluation possible.'],
          ['The 70-20-10 principle', 'Roughly 70% of learning comes from on-the-job experience, 20% from other people and 10% from formal courses, so design should blend all three.'],
          ['The ADDIE model', 'Analysis, Design, Development, Implementation and Evaluation provide a systematic route from identified need to measured outcome.'],
        ],
        quiz: [
          mcq('ADDIE stands for Analysis, Design, Development, Implementation and:', ['Evaluation', 'Engagement', 'Enrolment', 'Examination'], 'Evaluation closes the loop by checking whether the learning met its objectives.'),
          tf('Learning needs can be identified at organisational, job and individual levels.', true, 'A complete analysis looks at all three levels.'),
          multi('In the 70-20-10 principle, learning comes from:', ['On-the-job experience', 'Learning from other people', 'Formal courses', 'Annual leave'], [0, 1, 2], 'Experience, social learning and formal learning make up the 70, 20 and 10.'),
          blank('A learning needs analysis identifies the ____ between current and required capability.', ['gap'], 'Learning interventions are designed to close the capability gap.'),
        ],
      },
      {
        title: 'Performance Management Systems',
        summary: 'Running the performance cycle, setting objectives and avoiding common rating errors.',
        minutes: 8,
        points: [
          ['The performance cycle', 'Performance management is a continuous cycle of planning objectives, monitoring progress, reviewing results and recognising achievement.'],
          ['SMART objectives', 'Good objectives are specific, measurable, achievable, relevant and time-bound, and link individual effort to team and business goals.'],
          ['Continuous feedback', 'Regular check-ins make feedback timely and reduce surprises at the formal review. Feedback should be specific and focused on behaviour.'],
          ['Rating errors', 'Halo effect, recency effect, central tendency and leniency distort ratings. Calibration meetings and evidence logs help reduce them.'],
        ],
        quiz: [
          mcq('Judging an employee\'s whole year mainly on the last few weeks is known as:', ['The recency effect', 'The halo effect', 'Central tendency', 'Leniency bias'], 'The recency effect over-weights recent events. Keeping notes through the year helps.'),
          tf('Performance management should be a once-a-year event.', false, 'It is a continuous cycle; the annual review is only one part.'),
          multi('Which of these are elements of a SMART objective?', ['Specific', 'Measurable', 'Time-bound', 'Subjective'], [0, 1, 2], 'SMART stands for specific, measurable, achievable, relevant and time-bound.'),
          blank('When one positive trait influences the rating of all other areas, it is called the ____ effect.', ['halo'], 'The halo effect lets one strong impression colour the whole appraisal.'),
        ],
      },
      {
        title: 'Coaching, Mentoring and Career Development',
        summary: 'Developing people through coaching and mentoring, and planning for future talent needs.',
        minutes: 6,
        points: [
          ['Coaching and mentoring', 'Coaching is usually short-term and focused on specific performance goals. Mentoring is a longer relationship in which an experienced person supports wider career growth.'],
          ['The GROW model', 'A coaching conversation can follow Goal, Reality, Options and Will (or Way forward) to move from aim to committed action.'],
          ['Succession planning', 'Identifying critical roles and preparing potential successors reduces risk when key people leave or retire.'],
          ['Evaluating learning', 'Kirkpatrick\'s four levels — reaction, learning, behaviour and results — show whether development has made a real difference.'],
        ],
        quiz: [
          mcq('In the GROW coaching model, the "R" stands for:', ['Reality', 'Reward', 'Review', 'Responsibility'], 'Reality explores the current situation before options are generated.'),
          tf('Mentoring is usually a longer-term relationship focused on overall career growth.', true, 'Mentors share experience and perspective over an extended period.'),
          multi('Which are levels in Kirkpatrick\'s evaluation model?', ['Reaction', 'Behaviour', 'Results', 'Recruitment'], [0, 1, 2], 'The four levels are reaction, learning, behaviour and results.'),
          blank('Identifying and preparing employees to fill key roles in the future is known as ____ planning.', ['succession'], 'Succession planning protects continuity in critical roles.'),
        ],
      },
    ],
  },
  {
    title: 'Reward Management and Employee Relations',
    description: 'Designing fair reward, sustaining engagement and handling workplace issues constructively.',
    progression: 'sequential',
    lessons: [
      {
        title: 'Total Reward and Pay Structures',
        summary: 'The components of total reward and how pay structures balance internal fairness with market rates.',
        minutes: 7,
        points: [
          ['Total reward', 'Total reward combines financial elements — base pay, variable pay and benefits — with non-financial elements such as recognition, development and flexibility.'],
          ['Job evaluation and internal equity', 'Job evaluation compares jobs systematically to establish their relative worth inside the organisation and to support equal pay for work of equal value.'],
          ['Market benchmarking', 'Salary surveys show what other employers pay for comparable roles so that the organisation can decide where to position itself.'],
          ['Pay structures and variable pay', 'Grades or bands give a framework for pay progression. Bonuses, commission and profit sharing link part of pay to results.'],
        ],
        quiz: [
          mcq('Job evaluation is primarily used to establish:', ['The relative worth of jobs within the organisation', 'An individual employee\'s performance rating', 'The company\'s annual training budget', 'The number of leave days per employee'], 'Job evaluation ranks jobs, not people, to support internal equity.'),
          tf('Total reward includes non-financial elements such as recognition and development opportunities.', true, 'Non-financial rewards are an important part of the overall package.'),
          multi('Which of the following are examples of variable pay?', ['Sales commission', 'Annual performance bonus', 'Profit sharing', 'Basic salary'], [0, 1, 2], 'Basic salary is fixed pay; the others vary with results.'),
          blank('Comparing pay levels with those of other employers is called market ____.', ['benchmarking'], 'Benchmarking supports external competitiveness.'),
        ],
      },
      {
        title: 'Employee Engagement and Motivation',
        summary: 'What drives engagement, classic motivation theory and how to measure and act on engagement.',
        minutes: 6,
        points: [
          ['What engagement means', 'Engaged employees are committed to the organisation\'s goals and willing to put in discretionary effort. Meaningful work, good managers and a voice at work are key drivers.'],
          ['Herzberg\'s two-factor theory', 'Hygiene factors such as pay and working conditions prevent dissatisfaction. Motivators such as achievement, recognition and responsibility create satisfaction.'],
          ['Measuring engagement', 'Annual surveys, short pulse surveys, eNPS and exit interview themes all help HR understand how people feel about work.'],
          ['Acting on results', 'Sharing results openly and agreeing a small number of visible actions builds trust. Surveying without acting damages it.'],
        ],
        quiz: [
          mcq('In Herzberg\'s two-factor theory, which of these is a motivator?', ['Recognition for achievement', 'Salary', 'Working conditions', 'Company policy'], 'Recognition is a motivator. Salary, conditions and policy are hygiene factors.'),
          tf('According to Herzberg, improving hygiene factors alone creates lasting motivation.', false, 'Hygiene factors prevent dissatisfaction but do not by themselves motivate.'),
          multi('Which tools can be used to measure engagement?', ['Annual engagement survey', 'Pulse surveys', 'Exit interview analysis', 'Stock count'], [0, 1, 2], 'Surveys and exit data are common sources of engagement insight.'),
          blank('eNPS stands for employee Net ____ Score.', ['promoter'], 'eNPS asks how likely employees are to recommend the organisation as a place to work.'),
        ],
      },
      {
        title: 'Grievance, Discipline and Industrial Relations',
        summary: 'Handling grievances and discipline fairly, and working constructively with trade unions.',
        minutes: 8,
        points: [
          ['Grievance handling', 'A grievance procedure gives employees a formal, staged route to raise concerns and have them considered promptly and impartially.'],
          ['Discipline and natural justice', 'Fair discipline requires clear rules, written notice of the allegations, an opportunity to be heard and an unbiased decision maker.'],
          ['The domestic inquiry', 'A properly conducted domestic inquiry records the evidence on both sides and helps show that any disciplinary decision was reached fairly.'],
          ['Collective bargaining', 'Employers and trade unions negotiate terms and conditions through collective bargaining, which can result in a collective agreement.'],
        ],
        quiz: [
          mcq('Which principle requires that an employee be given a chance to respond to allegations before a decision is made?', ['Natural justice', 'Market equity', 'Span of control', 'Horizontal alignment'], 'The right to be heard is a core rule of natural justice.'),
          tf('A grievance procedure gives employees a formal way to raise workplace concerns.', true, 'Staged procedures help resolve concerns early and consistently.'),
          multi('Which steps belong in a fair disciplinary process?', ['Written notice of the allegations', 'An impartial inquiry', 'An opportunity to present a defence', 'Immediate dismissal without investigation'], [0, 1, 2], 'Dismissal without investigation breaches natural justice.'),
          blank('Negotiation between an employer and a trade union on terms of employment is called collective ____.', ['bargaining'], 'Collective bargaining may lead to a collective agreement.'),
        ],
      },
    ],
  },
  {
    title: 'Sri Lankan Labour Law Essentials',
    description: 'An orientation to the main employment statutes and employer obligations in Sri Lanka. For learning purposes only — not legal advice.',
    progression: 'independent',
    lessons: [
      {
        title: 'The Employment Law Framework',
        summary: 'The main statutes that regulate employment in Sri Lanka and the institutions that administer them.',
        minutes: 8,
        points: [
          ['Key statutes', 'Important laws include the Shop and Office Employees Act No. 19 of 1954, the Wages Boards Ordinance, the Factories Ordinance and the Industrial Disputes Act No. 43 of 1950.'],
          ['The contract of employment', 'A letter of appointment normally records the job title, remuneration, hours of work, leave entitlements and other key terms agreed between employer and employee.'],
          ['Categories of employment', 'Employees may be engaged on probation, on a permanent basis, for a fixed term or as casual workers. The category affects rights on termination.'],
          ['Institutions', 'The Department of Labour administers most labour statutes, while Labour Tribunals established under the Industrial Disputes Act hear termination disputes.'],
        ],
        quiz: [
          mcq('Which Act mainly regulates terms and conditions for employees in shops and offices in Sri Lanka?', ['Shop and Office Employees Act', 'Factories Ordinance', 'Companies Act', 'Inland Revenue Act'], 'The Shop and Office Employees (Regulation of Employment and Remuneration) Act No. 19 of 1954 covers shop and office workers.'),
          tf('Labour Tribunals in Sri Lanka are established under the Industrial Disputes Act.', true, 'Labour Tribunals were introduced through the Industrial Disputes Act.'),
          multi('Which items are typically stated in a letter of appointment?', ['Job title', 'Remuneration', 'Hours of work', 'The employer\'s annual profit'], [0, 1, 2], 'The letter records the key terms of the employment relationship.'),
          blank('A trial period at the start of employment used to assess suitability is called ____.', ['probation', 'a probation', 'probation period', 'the probation period'], 'Probation lets both parties assess suitability before confirmation.'),
        ],
      },
      {
        title: 'Statutory Contributions: EPF, ETF and Gratuity',
        summary: 'Employer and employee obligations for superannuation funds and gratuity.',
        minutes: 7,
        points: [
          ['Employees\' Provident Fund', 'Under the EPF Act No. 15 of 1958 the employee contributes a minimum of 8% and the employer a minimum of 12% of the employee\'s total earnings.'],
          ['Employees\' Trust Fund', 'Under the ETF Act No. 46 of 1980 the employer contributes 3% of total earnings. Nothing is deducted from the employee for ETF.'],
          ['Gratuity', 'The Payment of Gratuity Act No. 12 of 1983 applies to employers with 15 or more workmen. An employee with at least five years\' completed service generally receives half a month\'s salary for each completed year, if paid monthly.'],
          ['Records and remittances', 'Employers must keep accurate earnings records and remit contributions on time. Late payment attracts surcharges.'],
        ],
        quiz: [
          mcq('What is the minimum employer contribution to the Employees\' Provident Fund?', ['12% of total earnings', '3% of total earnings', '8% of total earnings', '20% of total earnings'], 'The employer contributes at least 12% and the employee at least 8% to the EPF.'),
          tf('ETF contributions are deducted from the employee\'s salary.', false, 'ETF is paid entirely by the employer at 3% of total earnings.'),
          multi('Which statements are correct?', ['The employee contributes a minimum of 8% to the EPF', 'The employer contributes 3% to the ETF', 'Gratuity generally requires at least five years of completed service', 'The ETF contribution is paid by the employee'], [0, 1, 2], 'The ETF is an employer-only contribution.'),
          blank('Under the Payment of Gratuity Act, a monthly-paid employee generally earns ____ a month\'s salary for each completed year of service.', ['half', '1/2', 'one half'], 'Gratuity for monthly-rated employees is half a month\'s salary per completed year.'),
        ],
      },
      {
        title: 'Termination of Employment and Dispute Resolution',
        summary: 'The rules on ending employment and the routes available for resolving disputes.',
        minutes: 8,
        points: [
          ['Non-disciplinary termination', 'The Termination of Employment of Workmen (Special Provisions) Act No. 45 of 1971 generally requires the employee\'s prior written consent or the approval of the Commissioner General of Labour for covered employers.'],
          ['Disciplinary termination', 'Dismissal on disciplinary grounds should rest on just cause established through a fair inquiry that follows the rules of natural justice.'],
          ['Labour Tribunals', 'An employee who believes a termination was unjust may apply to a Labour Tribunal, which can order reinstatement or compensation.'],
          ['Conciliation and arbitration', 'The Industrial Disputes Act provides for conciliation by labour officers, voluntary and compulsory arbitration and reference to Industrial Courts.'],
        ],
        quiz: [
          mcq('Under the Termination of Employment of Workmen (Special Provisions) Act, non-disciplinary termination generally requires:', ['The employee\'s prior written consent or the approval of the Commissioner General of Labour', 'One week\'s verbal notice only', 'Approval from the company\'s auditors', 'No formal steps at all'], 'Covered employers need written consent or the Commissioner General\'s prior approval.'),
          tf('A domestic inquiry helps demonstrate that a disciplinary dismissal was reached fairly.', true, 'The inquiry record shows the employee was heard and the evidence was considered.'),
          multi('Which are dispute resolution mechanisms under the Industrial Disputes Act?', ['Conciliation', 'Arbitration', 'Labour Tribunals', 'Customs clearance'], [0, 1, 2], 'The Act provides for conciliation, arbitration, Industrial Courts and Labour Tribunals.'),
          blank('A Labour Tribunal may order compensation or ____ of an employee whose termination was unjust.', ['reinstatement', 'the reinstatement'], 'Reinstatement returns the employee to their job.'),
        ],
      },
    ],
  },
  {
    title: 'HR Analytics and Digital HR',
    description: 'Using HR metrics, information systems and data to support better people decisions.',
    progression: 'independent',
    lessons: [
      {
        title: 'HR Metrics and Dashboards',
        summary: 'The essential HR measures, how to calculate them and how to present them clearly.',
        minutes: 6,
        points: [
          ['Essential metrics', 'Headcount, turnover rate, absenteeism rate, time to hire and training hours per employee give a basic picture of workforce health.'],
          ['Calculating turnover', 'Turnover rate equals the number of leavers in a period divided by average headcount, multiplied by 100. Thirty leavers from an average headcount of 200 gives 15%.'],
          ['Leading and lagging indicators', 'Lagging indicators report outcomes that have already happened, such as turnover. Leading indicators, such as engagement scores, signal what may happen next.'],
          ['Dashboard design', 'A good dashboard shows a small number of measures tied to business questions, with trends and targets rather than isolated numbers.'],
        ],
        quiz: [
          mcq('An organisation with an average headcount of 200 has 30 leavers in a year. Its annual turnover rate is:', ['15%', '30%', '6.7%', '20%'], '30 ÷ 200 × 100 = 15%.'),
          tf('A lagging indicator reports on outcomes that have already happened.', true, 'Turnover and absence are typical lagging indicators.'),
          multi('Which of these are common HR metrics?', ['Absenteeism rate', 'Time to hire', 'Training hours per employee', 'Gross profit margin'], [0, 1, 2], 'Gross profit margin is a financial measure.'),
          blank('Turnover rate is calculated by dividing the number of leavers by the average ____ and multiplying by 100.', ['headcount', 'head count'], 'Average headcount is the usual denominator.'),
        ],
      },
      {
        title: 'HR Information Systems',
        summary: 'What an HRIS does, how to implement one and why data protection matters.',
        minutes: 7,
        points: [
          ['HRIS modules', 'Typical modules cover core employee records, payroll, leave and attendance, recruitment through an applicant tracking system, performance and learning.'],
          ['Self-service', 'Employee and manager self-service lets people update details, apply for leave and approve requests directly, reducing administration for HR.'],
          ['Implementation', 'Successful implementation depends on clear requirements, clean data migration, user training and managing the change for employees and managers.'],
          ['Data protection', 'Sri Lanka\'s Personal Data Protection Act No. 9 of 2022 sets obligations for organisations that collect and process personal data, including employee data.'],
        ],
        quiz: [
          mcq('In recruitment technology, ATS stands for:', ['Applicant Tracking System', 'Annual Training Schedule', 'Attendance Time Sheet', 'Automated Tax Service'], 'An ATS manages vacancies, applications and candidate communication.'),
          tf('Employee self-service lets staff apply for leave without HR entering the data for them.', true, 'Self-service moves routine transactions to employees and managers.'),
          multi('Which activities are part of a sound HRIS implementation?', ['Requirements gathering', 'Data migration', 'User training', 'Deleting all historic records without review'], [0, 1, 2], 'Historic data should be cleaned and migrated carefully, not deleted without review.'),
          blank('Sri Lanka\'s Personal Data ____ Act No. 9 of 2022 governs how organisations handle personal data.', ['protection'], 'The PDPA applies to employee data as well as customer data.'),
        ],
      },
      {
        title: 'Data-Driven Decision Making',
        summary: 'Moving from reporting to insight, and presenting people data responsibly.',
        minutes: 6,
        points: [
          ['Levels of analytics', 'Descriptive analytics shows what happened, diagnostic explains why, predictive estimates what is likely to happen and prescriptive suggests what to do about it.'],
          ['Start with the business question', 'Useful analysis begins with a decision the business needs to make, not with the data that happens to be available.'],
          ['Data quality and ethics', 'Incomplete or inconsistent data produces misleading conclusions. People data must also be used transparently and fairly.'],
          ['Storytelling with data', 'Combine a clear message, a simple visual and a recommendation, and be open about the limitations of the data.'],
        ],
        quiz: [
          mcq('Which type of analytics answers the question "what is likely to happen?"', ['Predictive', 'Descriptive', 'Diagnostic', 'Historic'], 'Predictive analytics uses patterns in past data to estimate future outcomes.'),
          tf('Poor data quality can lead to misleading HR insights.', true, 'Analysis is only as reliable as the data behind it.'),
          multi('Which are good practices when presenting HR data?', ['Start from the business question', 'Use clear visuals', 'Explain the limitations of the data', 'Hide unfavourable results'], [0, 1, 2], 'Hiding unfavourable results undermines trust and decision quality.'),
          blank('Analytics that explains why something happened is called ____ analytics.', ['diagnostic'], 'Diagnostic analytics looks for causes behind the numbers.'),
        ],
      },
    ],
  },
  {
    title: 'Occupational Health, Safety and Wellbeing',
    description: 'Keeping people safe and well at work, from legal duties to practical wellbeing support.',
    progression: 'independent',
    lessons: [
      {
        title: 'Workplace Health and Safety Fundamentals',
        summary: 'The employer\'s duty of care, the main legislation and the difference between hazard and risk.',
        minutes: 6,
        points: [
          ['Duty of care', 'Employers have a legal and moral obligation to provide a safe place of work, safe equipment, safe systems of work and adequate training.'],
          ['Legislation', 'The Factories Ordinance No. 45 of 1942 sets safety, health and welfare standards for factories. The Workmen\'s Compensation Ordinance provides for compensation for work injuries.'],
          ['Hazard and risk', 'A hazard is anything with the potential to cause harm. Risk is the likelihood that harm will occur, combined with how severe it would be.'],
          ['Involving employees', 'Safety committees, toolbox talks and open reporting channels give employees a voice and help spot problems early.'],
        ],
        quiz: [
          mcq('A hazard is best defined as:', ['Something with the potential to cause harm', 'The likelihood that harm will occur', 'An insurance policy', 'A completed accident report'], 'Hazard is the source of potential harm; risk is its likelihood and severity.'),
          tf('Risk combines the likelihood of harm and the severity of its consequences.', true, 'Both dimensions are assessed when rating a risk.'),
          multi('Which legislation is relevant to workplace safety and work injuries in Sri Lanka?', ['Factories Ordinance', 'Workmen\'s Compensation Ordinance', 'Customs Ordinance', 'Excise Ordinance'], [0, 1], 'The Factories Ordinance and the Workmen\'s Compensation Ordinance address safety and injury compensation.'),
          blank('An employer\'s legal and moral obligation to protect employees from harm is known as the duty of ____.', ['care'], 'The duty of care underpins all health and safety practice.'),
        ],
      },
      {
        title: 'Risk Assessment and Incident Management',
        summary: 'Assessing risks systematically, choosing controls and learning from incidents.',
        minutes: 7,
        points: [
          ['Five steps to risk assessment', 'Identify the hazards, decide who might be harmed and how, evaluate the risks and decide on controls, record the findings, and review the assessment regularly.'],
          ['Hierarchy of controls', 'In order of effectiveness: elimination, substitution, engineering controls, administrative controls and, last of all, personal protective equipment.'],
          ['Incident and near-miss reporting', 'Reporting near misses, where no one was hurt, reveals weaknesses before they lead to injury.'],
          ['Investigation', 'A good investigation looks for root causes in systems and conditions rather than stopping at who made the mistake.'],
        ],
        quiz: [
          mcq('Which control is the most effective in the hierarchy of controls?', ['Elimination', 'Personal protective equipment', 'Administrative controls', 'Warning signs'], 'Removing the hazard altogether is the most effective control.'),
          tf('Near misses should be reported even when nobody is injured.', true, 'Near misses are early warnings of what could go wrong.'),
          multi('Which are steps in a risk assessment?', ['Identify the hazards', 'Evaluate the risks', 'Review the assessment regularly', 'Assign blame to the injured person'], [0, 1, 2], 'Risk assessment is about prevention, not blame.'),
          blank('PPE stands for personal protective ____.', ['equipment'], 'PPE is the last line of defence in the hierarchy of controls.'),
        ],
      },
      {
        title: 'Employee Wellbeing and Mental Health',
        summary: 'Understanding wellbeing, the causes of work-related stress and practical support options.',
        minutes: 6,
        points: [
          ['Dimensions of wellbeing', 'Wellbeing spans physical, mental, financial and social health. Problems in one area often affect the others.'],
          ['Work-related stress', 'Excessive workload, low control, poor support, strained relationships, unclear roles and badly managed change are common causes of stress.'],
          ['Support options', 'Employee assistance programmes, flexible working, trained managers and access to counselling give people practical help.'],
          ['A wellbeing strategy', 'Start from data such as absence and survey results, agree priorities with leaders and review the impact of each initiative.'],
        ],
        quiz: [
          mcq('EAP stands for:', ['Employee Assistance Programme', 'Employee Appraisal Process', 'Employer Accreditation Plan', 'Emergency Action Procedure'], 'An EAP offers confidential support such as counselling to employees.'),
          tf('Excessive workload and low job control are recognised causes of work-related stress.', true, 'Demands and control are two of the best-known stress factors.'),
          multi('Which are dimensions of wellbeing?', ['Physical', 'Mental', 'Financial', 'Contractual'], [0, 1, 2], 'Wellbeing is usually described as physical, mental, financial and social.'),
          blank('Arrangements such as remote work and adjustable hours are examples of ____ working.', ['flexible'], 'Flexible working can help employees balance work and personal demands.'),
        ],
      },
    ],
  },
  {
    title: 'Professional Ethics and Business Communication',
    description: 'Acting with integrity as an HR practitioner and communicating clearly with every audience.',
    progression: 'independent',
    lessons: [
      {
        title: 'Ethics and Professional Conduct in HR',
        summary: 'The values expected of HR practitioners and how to handle common ethical dilemmas.',
        minutes: 6,
        points: [
          ['Professional values', 'Integrity, confidentiality, fairness and competence are the foundation of trust in the HR profession.'],
          ['Conflicts of interest', 'When personal interests could influence a decision, declare the conflict and step back from the decision.'],
          ['Handling confidential information', 'Employee records, medical details and salary data should be shared only with those who have a legitimate need to know.'],
          ['Speaking up', 'Whistleblowing channels allow serious wrongdoing to be reported safely. HR should protect those who raise concerns in good faith.'],
        ],
        quiz: [
          mcq('An HR officer shortlisting candidates finds a close relative among the applicants. The most appropriate action is to:', ['Declare the conflict of interest and step aside from the decision', 'Shortlist the relative quietly', 'Reject the relative without reviewing the application', 'Delete the application'], 'Declaring the conflict and withdrawing protects the fairness of the process.'),
          tf('Sharing an employee\'s medical information with colleagues without consent breaches confidentiality.', true, 'Medical information is sensitive and must be tightly controlled.'),
          multi('Which are core professional values for HR practitioners?', ['Integrity', 'Confidentiality', 'Fairness', 'Favouritism'], [0, 1, 2], 'Favouritism is the opposite of fair treatment.'),
          blank('Reporting serious wrongdoing in an organisation through protected channels is known as ____.', ['whistleblowing', 'whistle blowing', 'whistle-blowing'], 'Whistleblowing helps organisations detect and address misconduct.'),
        ],
      },
      {
        title: 'Business Writing and Reporting',
        summary: 'Writing clear emails, policies and management reports.',
        minutes: 6,
        points: [
          ['Purpose and audience', 'Before writing, decide what you want the reader to know or do, and how much they already understand.'],
          ['Structure', 'Lead with the main point, use headings and short paragraphs, and put supporting detail in appendices.'],
          ['Plain language', 'Short sentences, familiar words and an active voice make policies and letters easier to understand and apply.'],
          ['Management reports', 'An executive summary at the start presents the key findings and recommendations for readers who will not read the full report.'],
        ],
        quiz: [
          mcq('Where should the key recommendation appear in a management report?', ['In the executive summary at the beginning', 'Only in an appendix', 'In a footnote', 'In the final sentence only'], 'Busy readers should find the main message immediately.'),
          tf('Plain language makes HR policies easier to understand and apply.', true, 'Clear wording reduces misunderstanding and inconsistent application.'),
          multi('Which are good practices in business emails?', ['A clear subject line', 'A specific call to action', 'Proofreading before sending', 'Writing the whole message in capital letters'], [0, 1, 2], 'Capital letters read as shouting and are harder to read.'),
          blank('A short overview at the start of a report presenting the main findings and recommendations is the executive ____.', ['summary'], 'The executive summary may be the only part some readers see.'),
        ],
      },
      {
        title: 'Presentation and Stakeholder Communication',
        summary: 'Engaging stakeholders, presenting with impact and handling difficult conversations.',
        minutes: 7,
        points: [
          ['Stakeholder mapping', 'A power–interest grid helps prioritise engagement. Stakeholders with high power and high interest should be managed closely.'],
          ['Structuring a presentation', 'Open with the purpose, support each key message with evidence and close with a clear call to action.'],
          ['Active listening', 'Listening without interrupting, asking open questions and summarising what was said show respect and confirm understanding.'],
          ['Difficult conversations', 'Prepare the facts, describe the behaviour and its impact, listen to the response and agree the next steps.'],
        ],
        quiz: [
          mcq('A power–interest grid is used to:', ['Prioritise how to engage different stakeholders', 'Calculate payroll tax', 'Schedule annual leave', 'Grade jobs'], 'The grid groups stakeholders by their influence and their interest in the outcome.'),
          tf('Active listening includes summarising what the speaker said to confirm understanding.', true, 'Summarising checks that the message has been understood correctly.'),
          multi('Which features make a presentation effective?', ['An opening that states the purpose', 'Evidence that supports each key message', 'A closing call to action', 'Reading every slide word for word'], [0, 1, 2], 'Reading slides aloud disengages the audience.'),
          blank('Stakeholders with high power and high interest should be managed ____.', ['closely'], 'They are the key players and need the most attention.'),
        ],
      },
    ],
  },
]
