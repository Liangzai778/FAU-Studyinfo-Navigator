import { allFacultyIds } from './faculties';
import { resourceSchema, type Resource } from '../domain/resources';

const commonScope: Pick<
  Resource,
  | 'facultyIds'
  | 'degreeTypes'
  | 'lastCheckedAt'
  | 'verificationStatus'
  | 'createdAt'
  | 'opportunityKind'
  | 'audience'
  | 'benefit'
  | 'deadline'
  | 'documents'
> = {
  facultyIds: allFacultyIds,
  degreeTypes: ['bachelor', 'master'],
  lastCheckedAt: '2026-10-21',
  verificationStatus: 'verified' as const,
  createdAt: null,
  // Plain link entries are not opportunities, so these stay empty; the
  // opportunity fields are only filled where they are actually known.
  opportunityKind: null,
  audience: [],
  benefit: null,
  deadline: null,
  documents: [],
};

/**
 * Scope for entries that exist for international students specifically.
 *
 * Everything here was read off the official page listed as its source, and
 * `lastCheckedAt` records when. Anything that could not be confirmed from the
 * official text (amounts, deadlines) is left null rather than guessed.
 */
const internationalScope: Pick<
  Resource,
  | 'facultyIds'
  | 'degreeTypes'
  | 'lastCheckedAt'
  | 'verificationStatus'
  | 'createdAt'
  | 'benefit'
  | 'deadline'
  | 'documents'
> = {
  ...commonScope,
  lastCheckedAt: '2026-10-24',
};

const officialSource = (title: string, url: string) => ({
  title: {
    'zh-CN': `FAU 官方页面：${title}`,
    en: `Official FAU page: ${title}`,
  },
  url,
});

/** Shorthand for the bilingual strings every entry needs. */
const zh = (cn: string, en: string) => ({ 'zh-CN': cn, en });

const resourceSeeds: Resource[] = [
  {
    ...commonScope,
    id: 'campo',
    kind: 'official',
    name: { 'zh-CN': 'Campo', en: 'Campo' },
    description: {
      'zh-CN': '学籍、官方课程目录、成绩与考试相关操作入口。真实操作仅在 Campo 完成。',
      en: 'Student records, official course catalogue, grades, and exam-related actions. Real actions happen only in Campo.',
    },
    categoryId: 'study',
    url: 'https://campo.fau.de',
    keywords: {
      'zh-CN': ['学籍', '课程目录', '成绩', '考试报名', '模块'],
      en: ['student records', 'course catalogue', 'grades', 'exam registration', 'modules'],
    },
    source: officialSource('Campo', 'https://campo.fau.de'),
    priority: 10,
  },
  {
    ...commonScope,
    id: 'studon',
    kind: 'official',
    name: { 'zh-CN': 'StudOn', en: 'StudOn' },
    description: {
      'zh-CN': 'FAU 课程资料、学习小组和课程活动平台。',
      en: 'FAU platform for course materials, learning groups, and course activities.',
    },
    categoryId: 'study',
    url: 'https://www.studon.fau.de',
    keywords: { 'zh-CN': ['课程资料', '学习平台', '选课'], en: ['course materials', 'learning platform', 'courses'] },
    source: officialSource('StudOn', 'https://www.studon.fau.de'),
    priority: 20,
  },
  {
    ...commonScope,
    id: 'studon-exam',
    kind: 'official',
    name: { 'zh-CN': 'StudOn-Exam', en: 'StudOn-Exam' },
    description: {
      'zh-CN': 'FAU 数字化考试平台；具体考试安排仍须核对课程与官方通知。',
      en: 'FAU digital examination platform. Always confirm the actual arrangement with the course and official notices.',
    },
    categoryId: 'exams',
    url: 'https://www.studon-exam.fau.de',
    keywords: { 'zh-CN': ['数字考试', '线上考试'], en: ['digital exams', 'online exams'] },
    source: officialSource('StudOn-Exam', 'https://www.studon-exam.fau.de'),
    priority: 30,
  },
  {
    ...commonScope,
    id: 'idm',
    kind: 'official',
    name: { 'zh-CN': 'IdM 身份管理', en: 'IdM identity management' },
    description: {
      'zh-CN': 'FAU 身份、账号与相关自助服务入口。本工具不会读取或保存登录信息。',
      en: 'FAU identity, account, and related self-service entry point. This tool never reads or stores login details.',
    },
    categoryId: 'services',
    url: 'https://www.idm.fau.de',
    keywords: { 'zh-CN': ['账号', '密码', '身份管理'], en: ['account', 'password', 'identity'] },
    source: officialSource('IdM', 'https://www.idm.fau.de'),
    priority: 40,
  },
  {
    // Students reach for this every day and it sits next to IdM in practice: the
    // mailbox only exists once the IdM identifier is activated, so the two belong
    // together in the list.
    ...commonScope,
    id: 'faumail',
    kind: 'official',
    name: { 'zh-CN': 'FAUmail 邮箱', en: 'FAUmail mailbox' },
    description: {
      'zh-CN':
        '学生邮箱网页版入口。邮箱在 IdM 账号激活后自动开通，学校通知、考试与课程邮件都会寄到这里；本工具不会读取或保存你的登录信息。',
      en: 'Web mail for your student mailbox. The mailbox opens once your IdM account is activated, and university notices, exam and course mail arrive here. This tool never reads or stores your login details.',
    },
    categoryId: 'services',
    url: 'https://faumail.fau.de',
    keywords: {
      'zh-CN': ['邮箱', '邮件', 'FAUmail', 'webmail', '学校通知', '收件箱'],
      en: ['mail', 'email', 'FAUmail', 'webmail', 'university notices', 'inbox'],
    },
    source: officialSource('FAUmail', 'https://www.fau.de/glossary/webmail/'),
    priority: 45,
  },
  {
    ...commonScope,
    id: 'library',
    kind: 'official',
    name: { 'zh-CN': 'FAU 图书馆', en: 'FAU University Library' },
    description: {
      'zh-CN': '图书馆检索、开放时间与学习支持的官方入口。',
      en: 'Official entry point for library search, opening hours, and study support.',
    },
    categoryId: 'services',
    url: 'https://www.ub.fau.de',
    keywords: { 'zh-CN': ['图书馆', '文献', '开放时间', '学习空间'], en: ['library', 'literature', 'opening hours', 'study spaces'] },
    source: officialSource('University Library', 'https://www.ub.fau.de'),
    priority: 50,
  },
  {
    ...commonScope,
    id: 'regulations',
    kind: 'official',
    name: { 'zh-CN': '考试条例总入口', en: 'Examination regulations' },
    description: {
      'zh-CN': 'FAU Prüfungsordnungen 官方总入口。必须继续核对适用于本人专业和入学批次的版本。',
      en: 'Official FAU entry point for Prüfungsordnungen. You must still confirm the version for your programme and cohort.',
    },
    categoryId: 'exams',
    url: 'https://www.fau.de/universitaet/universitaetsorganisation/rechtliche-grundlagen/pruefungsordnungen/',
    keywords: { 'zh-CN': ['考试条例', 'PO', '毕业要求'], en: ['examination regulations', 'PO', 'graduation requirements'] },
    source: officialSource('Prüfungsordnungen', 'https://www.fau.de/universitaet/universitaetsorganisation/rechtliche-grundlagen/pruefungsordnungen/'),
    priority: 60,
  },
  {
    ...commonScope,
    id: 'academic-dates',
    kind: 'official',
    name: { 'zh-CN': '学年重要日期', en: 'Academic dates and deadlines' },
    description: {
      'zh-CN': 'FAU 学期、申请和其他重要日期的官方总览；专业特殊日期需另行核对。',
      en: 'Official FAU overview of semester, application, and other important dates; programme-specific dates require separate confirmation.',
    },
    categoryId: 'study',
    url: 'https://www.fau.de/studium/bewerbung-und-zulassung/alle-fristen-und-termine/',
    keywords: { 'zh-CN': ['校历', '学期日期', '截止日期'], en: ['academic calendar', 'semester dates', 'deadlines'] },
    source: officialSource('Academic dates', 'https://www.fau.de/studium/bewerbung-und-zulassung/alle-fristen-und-termine/'),
    priority: 70,
  },
  {
    ...commonScope,
    id: 'exam-registration-windows',
    kind: 'official',
    name: { 'zh-CN': '考试报名窗口说明', en: 'Exam registration windows' },
    description: {
      'zh-CN': 'FAU 通用考试报名时间说明；不覆盖所有专业特殊安排、口试或补考。',
      en: 'General FAU guidance on exam registration periods; it does not cover every programme-specific arrangement, oral exam, or resit.',
    },
    categoryId: 'exams',
    url: 'https://www.fau.de/glossary/anmeldezeitraeume-fuer-pruefungen/',
    keywords: { 'zh-CN': ['考试报名', '报名窗口', 'Anmeldezeitraum'], en: ['exam registration', 'registration period', 'Anmeldezeitraum'] },
    source: officialSource('Exam registration windows', 'https://www.fau.de/glossary/anmeldezeitraeume-fuer-pruefungen/'),
    priority: 80,
  },
  {
    ...commonScope,
    id: 'module-descriptions-guide',
    kind: 'official',
    name: { 'zh-CN': 'Campo 模块描述指南', en: 'Campo module description guide' },
    description: {
      'zh-CN': 'FAU 关于在 Campo 中查找和查看模块描述的官方说明。',
      en: 'Official FAU guidance for finding and viewing module descriptions in Campo.',
    },
    categoryId: 'study',
    url: 'https://www.fau.de/studium/studienorganisation/studienstart/stundenplan-und-vorlesungsverzeichnis/modulbeschreibungen-in-campo-suchen-und-anzeigen/',
    keywords: { 'zh-CN': ['模块手册', '模块描述', 'Campo'], en: ['module handbook', 'module description', 'Campo'] },
    source: officialSource('Campo module descriptions', 'https://www.fau.de/studium/studienorganisation/studienstart/stundenplan-und-vorlesungsverzeichnis/modulbeschreibungen-in-campo-suchen-und-anzeigen/'),
    priority: 90,
  },
  {
    ...commonScope,
    id: 'study-planner-guide',
    kind: 'official',
    name: { 'zh-CN': 'Campo 学习规划指南', en: 'Campo study planner guide' },
    description: {
      'zh-CN': 'FAU 关于在 Campo Studienplaner 中管理考试和选修内容的官方指南。',
      en: 'Official FAU guidance on managing examinations and electives in the Campo Studienplaner.',
    },
    categoryId: 'exams',
    url: 'https://www.fau.de/studium/studienorganisation/pruefungen/pruefungen-und-wahlfaecher-im-studienplaner-mit-modulplan-in-campo-verwalten/',
    keywords: { 'zh-CN': ['Studienplaner', '考试', '选修课'], en: ['Studienplaner', 'exams', 'electives'] },
    source: officialSource('Campo study planner', 'https://www.fau.de/studium/studienorganisation/pruefungen/pruefungen-und-wahlfaecher-im-studienplaner-mit-modulplan-in-campo-verwalten/'),
    priority: 100,
  },
  {
    ...commonScope,
    id: 'first-year-faq',
    kind: 'official',
    name: { 'zh-CN': '新生 FAQ', en: 'First-year FAQ' },
    description: {
      'zh-CN': 'FAU 关于开学和第一学年常见问题的官方说明。',
      en: 'Official FAU answers to common questions about starting university and the first year.',
    },
    categoryId: 'services',
    url: 'https://www.fau.de/studium/studienorganisation/studienstart/faqs-zum-studienstart-und-zum-ersten-studienjahr/faqs-semesterbeginn/',
    keywords: { 'zh-CN': ['新生', '开学', '第一学年', 'FAQ'], en: ['first year', 'semester start', 'new students', 'FAQ'] },
    source: officialSource('First-year FAQ', 'https://www.fau.de/studium/studienorganisation/studienstart/faqs-zum-studienstart-und-zum-ersten-studienjahr/faqs-semesterbeginn/'),
    priority: 110,
  },
  {
    ...commonScope,
    id: 'faculties-overview',
    kind: 'official',
    name: { 'zh-CN': 'FAU 五学院总览', en: 'FAU faculties overview' },
    description: {
      'zh-CN': 'FAU 官方组织页面中的五大学院入口总览。',
      en: 'Official FAU overview of the university’s five faculties.',
    },
    categoryId: 'faculty',
    url: 'https://www.fau.eu/university/university-organization/faculties/',
    keywords: { 'zh-CN': ['学院', '组织', '五大学院'], en: ['faculties', 'organisation', 'five faculties'] },
    source: officialSource('Faculties', 'https://www.fau.eu/university/university-organization/faculties/'),
    priority: 120,
  },

  // ---------------------------------------------------------------------------
  // Opportunities for international students.
  //
  // The goal is to close an information gap, so every entry here was checked
  // against its official page on 2026-10-24 before being written down. Amounts,
  // eligibility and windows are quoted from that page and not inferred. Where a
  // page states no figure, the field stays null.
  // ---------------------------------------------------------------------------
  {
    ...internationalScope,
    id: 'intl-scholarships-overview',
    kind: 'official',
    opportunityKind: 'funding',
    name: { 'zh-CN': 'FAU 资助总览（奖学金与助学金）', en: 'FAU funding overview (scholarships and grants)' },
    description: {
      'zh-CN':
        'FAU 把所有资助渠道集中在这一页：奖学金、助学金、德国助学贷款（BAföG）以及针对国际学生的专项说明。不知道从哪找钱的时候，从这里开始，而不是直接去搜某个奖学金名字。',
      en: 'FAU collects every funding route on this one page: scholarships, grants, BAföG, and notes specifically for international students. Start here rather than searching for a scholarship name.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/',
    keywords: {
      'zh-CN': ['奖学金', '助学金', '资助', 'BAföG', '学费', '生活费', 'Stipendium'],
      en: ['scholarship', 'funding', 'grant', 'BAföG', 'tuition', 'cost of living', 'Stipendium'],
    },
    source: {
      title: zh('FAU Funding your studies（官方资助总览）', 'FAU Funding your studies'),
      url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/',
    },
    audience: [zh('所有 FAU 学生，含国际学生', 'All FAU students, including international students')],
    priority: 200,
  },
  {
    ...internationalScope,
    id: 'intl-deutschlandstipendium',
    kind: 'official',
    opportunityKind: 'funding',
    name: { 'zh-CN': 'Deutschlandstipendium（德国奖学金）', en: 'Deutschlandstipendium (Germany Scholarship)' },
    description: {
      'zh-CN':
        '每月 300 欧元的资助，由联邦政府与私人资助方各出一半，不按国籍而是按成绩与个人经历选拔，国际学生可以申请。FAU 明确说明：在 FAU 第一学期开始之前就可以申请。',
      en: 'A monthly 300 EUR grant, half from the federal government and half from a private sponsor. Awarded on achievement and personal circumstances rather than nationality, and open to international students. FAU states that you may apply before your first semester at FAU.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/fau-deutschlandstipendium/',
    keywords: {
      'zh-CN': ['德国奖学金', 'Deutschlandstipendium', '每月 300 欧', '成绩奖学金', '新生可申请'],
      en: ['Deutschlandstipendium', 'Germany Scholarship', '300 EUR monthly', 'merit', 'apply before first semester'],
    },
    source: {
      title: zh('FAU Deutschlandstipendium（官方页面）', 'FAU Deutschlandstipendium'),
      url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/fau-deutschlandstipendium/',
    },
    audience: [zh('已注册或即将注册的 FAU 学生', 'Enrolled or incoming FAU students')],
    benefit: zh('每月 300 Euro', '300 EUR per month'),
    deadline: zh(
      '2027/28 冬季学期：2027 年 9 月 15 日 – 2027 年 10 月 15 日（以官方页面为准）',
      'Winter semester 2027/28: 15 September 2027 to 15 October 2027 (check the official page)',
    ),
    priority: 210,
  },
  {
    ...internationalScope,
    id: 'intl-daad-scholarship-database',
    kind: 'external',
    opportunityKind: 'funding',
    name: { 'zh-CN': 'DAAD 奖学金数据库', en: 'DAAD scholarship database' },
    description: {
      'zh-CN':
        '德国学术交流中心（DAAD）的官方数据库，可按国籍、专业、学位和资助类型筛选。绝大多数面向国际学生的德国奖学金都要从这里查，FAU 自然科学学院也直接把它列为申请资助的首选入口。',
      en: 'The official DAAD database, filterable by country of origin, subject, degree and funding type. It is where most scholarships for international students in Germany are listed, and the FAU Faculty of Sciences points students to it directly.',
    },
    categoryId: 'international',
    url: 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/',
    keywords: {
      'zh-CN': ['DAAD', '奖学金数据库', '按国籍筛选', '硕士资助', '国际学生'],
      en: ['DAAD', 'scholarship database', 'filter by country', 'master funding', 'international students'],
    },
    source: {
      title: zh('DAAD Scholarship Database（官方数据库）', 'DAAD Scholarship Database'),
      url: 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/',
    },
    audience: [zh('按项目不同，需逐条核对', 'Varies by programme; check each entry')],
    priority: 220,
  },
  {
    ...internationalScope,
    id: 'intl-daad-study-scholarships',
    kind: 'external',
    opportunityKind: 'funding',
    name: { 'zh-CN': 'DAAD 学习奖学金项目概览', en: 'DAAD study scholarships for graduates' },
    description: {
      'zh-CN':
        'DAAD 面向本科毕业生攻读硕士的奖学金（Study Scholarships），通常覆盖整个硕士阶段，含每月生活补助、保险与旅行补贴。这是国际学生读德国硕士最常申请的一类，申请时间往往比入学早一年。',
      en: 'DAAD study scholarships for graduates starting a master\'s degree, usually covering the full programme with a monthly allowance, insurance and travel subsidy. This is the most commonly used route for international master students, and applications typically open a year ahead of enrolment.',
    },
    categoryId: 'international',
    url: 'https://www.daad.de/en/studying-in-germany/scholarships/',
    keywords: {
      'zh-CN': ['DAAD 硕士奖学金', '全额资助', '生活补助', '保险', '提前一年申请'],
      en: ['DAAD master scholarship', 'full funding', 'monthly allowance', 'insurance', 'apply a year ahead'],
    },
    source: {
      title: zh('DAAD Scholarships（官方概览）', 'DAAD Scholarships'),
      url: 'https://www.daad.de/en/studying-in-germany/scholarships/',
    },
    audience: [zh('已在读或即将入学的硕士生', 'Incoming and current master students')],
    priority: 230,
  },
  {
    ...internationalScope,
    id: 'intl-scholarships-for-graduates',
    kind: 'official',
    opportunityKind: 'funding',
    name: {
      'zh-CN': '临近毕业的国际学生奖学金',
      en: 'Scholarships for international students about to graduate',
    },
    description: {
      'zh-CN':
        '专门给“快要毕业”的国际学生的资助，用来支撑最后阶段（写论文、实习、找工作）。这个页面大多数人毕业前才听说，通常已经错过截止日期。',
      en: 'Funding aimed at international students in their final phase (thesis, internship, job hunt). Most students hear about this page too late to apply.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/scholarships-for-international-students-about-to-graduate/',
    keywords: {
      'zh-CN': ['毕业前资助', '论文阶段', '最后学期', '国际学生奖学金'],
      en: ['final phase funding', 'thesis phase', 'last semester', 'scholarship for international students'],
    },
    source: {
      title: zh('FAU Scholarships for international students about to graduate', 'FAU Scholarships for international students about to graduate'),
      url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/funding-your-studies/scholarships-for-international-students-about-to-graduate/',
    },
    audience: [zh('临近毕业的国际学生', 'International students close to graduating')],
    priority: 240,
  },
  {
    ...internationalScope,
    id: 'intl-welcome-week',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': '国际学生欢迎周（Welcome Week）', en: 'Welcome Week for international students' },
    description: {
      'zh-CN':
        '国际事务处（Referat für Internationale Angelegenheiten）在每年 10 月为刚到 FAU 的国际学位生和交换生组织的一周活动：注册与居留手续讲解、图书馆导览、城市参观、“My FAU Story”在校国际学生分享。九月还会为提前到达参加语言课的学生安排 Welcome Day 和城市导览。',
      en: 'A week of events the Office of International Affairs runs each October for newly arrived international degree-seeking and exchange students: registration and residence-permit walkthroughs, library tours, city tours, and "My FAU Story" talks by current international students. A Welcome Day and city tours are also offered in September for students arriving early for language courses.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/welcome-events-for-international-students/',
    keywords: {
      'zh-CN': ['欢迎周', '开学活动', 'Orientation', '图书馆导览', '注册手续', '城市参观'],
      en: ['Welcome Week', 'orientation', 'library tour', 'registration', 'city tour', 'newly arrived'],
    },
    source: {
      title: zh('FAU Welcome events for international students', 'FAU Welcome events for international students'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/welcome-events-for-international-students/',
    },
    audience: [zh('新到校的国际学位生与交换生', 'Newly arrived international degree-seeking and exchange students')],
    documents: [
      {
        title: zh('2026 年 Welcome Week 活动日程（PDF）', 'Welcome Week 2026 programme (PDF)'),
        url: 'https://www.fau.de/wp-content/uploads/sites/4/2026/07/Welcome-Week_Program.pdf',
        format: 'PDF',
      },
    ],
    priority: 250,
  },
  {
    ...internationalScope,
    id: 'intl-buddy-program',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': 'Buddy 项目（老生带新生）', en: 'Buddy programme' },
    description: {
      'zh-CN':
        '由在读高年级学生一对一带你熟悉埃尔朗根和 FAU：怎么办手续、去哪上课、哪家咖啡馆能找到同学。FAU 自然科学学院专门为国际学生设立了该项目，报名就能配对，不需要成绩门槛。',
      en: 'An experienced student is paired with you to help you find your feet in Erlangen and at FAU: formalities, where classes are, which café students actually go to. The Faculty of Sciences runs its own version for international students; signing up is all it takes.',
    },
    categoryId: 'international',
    url: 'https://www.nat.fau.de/international/buddy-program/incomer/',
    keywords: {
      'zh-CN': ['Buddy', '结对', '老生带新生', '融入', '自然科学学院'],
      en: ['buddy', 'pairing', 'mentor', 'settling in', 'Faculty of Sciences'],
    },
    source: {
      title: zh('FAU 自然科学学院 Buddy-Programm（Incomer）', 'FAU Faculty of Sciences Buddy Programme (Incomer)'),
      url: 'https://www.nat.fau.de/international/buddy-program/incomer/',
    },
    audience: [zh('刚到 FAU 的国际学生', 'International students new to FAU')],
    priority: 260,
  },
  {
    ...internationalScope,
    id: 'intl-buddy-program-central',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': 'Buddy 项目（国际事务处版）', en: 'Buddy programme (International Affairs)' },
    description: {
      'zh-CN':
        '国际事务处另有一个全校范围的 Buddy 项目，与学院版本互相独立。如果学院的报名时间已过，这里通常还能报名；两边都申请也不会冲突。',
      en: 'International Affairs runs a university-wide buddy programme independent of the faculty one. If the faculty round has closed, this one is often still open; applying to both does not conflict.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/networking-opportunities-for-students/buddy-program/',
    keywords: {
      'zh-CN': ['Buddy 全校版', '国际事务处', '备选报名'],
      en: ['university-wide buddy', 'International Affairs', 'alternative signup'],
    },
    source: {
      title: zh('FAU Buddy program（国际事务处）', 'FAU Buddy program (International Affairs)'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/networking-opportunities-for-students/buddy-program/',
    },
    audience: [zh('全体国际学生', 'All international students')],
    priority: 270,
  },
  {
    ...internationalScope,
    id: 'intl-student-network',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': 'International Student Network（国际学生网络）', en: 'International Student Network' },
    description: {
      'zh-CN':
        '国际事务处组织的跨文化交流活动与朋辈网络：聊天角、文化活动、短途出游。想认识德国学生或其他国家的同学，这类活动比课堂更快。',
      en: 'Cross-cultural events and a peer network organised by International Affairs: conversation evenings, cultural events, short trips. Meeting German and other international students happens faster here than in class.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/networking-opportunities-for-students/international-student-network/',
    keywords: {
      'zh-CN': ['学生网络', '交流活动', '认识德国学生', '文化活动'],
      en: ['student network', 'meet German students', 'cultural events', 'social'],
    },
    source: {
      title: zh('FAU International Student Network', 'FAU International Student Network'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/networking-opportunities-for-students/international-student-network/',
    },
    audience: [zh('全体国际学生', 'All international students')],
    priority: 280,
  },
  {
    ...internationalScope,
    id: 'intl-arrival-checklist',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': '到校前后要办的事（总清单）', en: 'Everything you need to know about coming to FAU' },
    description: {
      'zh-CN':
        '从签证、居留许可、注册、保险到开银行账户，国际事务处把到 FAU 之前和之后要办的事按顺序列在这里。很多新生栽在同一件事上：以为注册完就没事了，结果居留许可的预约排到了几个月后。',
      en: 'From visa and residence permit to enrolment, insurance and a bank account, International Affairs lists what to do before and after arriving, in order. New students trip over the same thing: assuming enrolment is the finish line, then finding residence-permit appointments booked out for months.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/',
    keywords: {
      'zh-CN': ['行前准备', '签证', '居留许可', '注册', '保险', '银行账户', 'Anmeldung'],
      en: ['arrival checklist', 'visa', 'residence permit', 'enrolment', 'insurance', 'bank account', 'Anmeldung'],
    },
    source: {
      title: zh('FAU Coming to FAU（官方清单）', 'FAU Everything you need to know about coming to FAU'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/',
    },
    audience: [zh('即将入学与刚到校的国际学生', 'Incoming and newly arrived international students')],
    priority: 290,
  },
  {
    ...internationalScope,
    id: 'intl-visa-residence',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': '签证与居留许可', en: 'Visa and residence permit' },
    description: {
      'zh-CN':
        '学生签证、居留许可的申请与延长、需要准备的材料，以及常见出错的地方。这条和上一条不同：这里只讲签证与居留这一个主题，办到哪一步就查哪一条。',
      en: 'Student visa, applying for and extending a residence permit, the documents required, and where things usually go wrong. Narrower than the checklist above: this is only about visa and residence status.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/visa-and-residence-permit/',
    keywords: {
      'zh-CN': ['签证', '居留许可', '延签', 'Aufenthaltstitel', '材料清单'],
      en: ['visa', 'residence permit', 'extension', 'documents', 'Aufenthaltstitel'],
    },
    source: {
      title: zh('FAU Visa and residence permit', 'FAU Visa and residence permit'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/visa-and-residence-permit/',
    },
    audience: [zh('非欧盟国际学生', 'Non-EU international students')],
    priority: 300,
  },
  {
    ...internationalScope,
    id: 'intl-learning-german',
    kind: 'official',
    opportunityKind: 'programme',
    name: { 'zh-CN': '德语课程（免费与低价）', en: 'Learning German' },
    description: {
      'zh-CN':
        'FAU 面向国际学生的德语课程、分班考试与语言证明。英语硕士项目也用得上：埃尔朗根的实习、兼职和毕业后找工作，德语水平往往比成绩更决定机会。',
      en: 'German courses for international students at FAU, including placement tests and certificates. Even on an English-taught master it matters: in Erlangen, German often decides internships, part-time jobs and hiring more than grades do.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/learning-german/',
    keywords: {
      'zh-CN': ['德语课', '语言班', '分班考试', '语言证明', 'Deutschkurs'],
      en: ['German course', 'language class', 'placement test', 'certificate', 'Deutschkurs'],
    },
    source: {
      title: zh('FAU Learning German', 'FAU Learning German'),
      url: 'https://www.fau.eu/studying/international-students/everything-you-need-to-know-about-coming-to-fau/learning-german/',
    },
    audience: [zh('全体国际学生', 'All international students')],
    priority: 310,
  },
  {
    ...internationalScope,
    id: 'intl-faculty-services',
    kind: 'official',
    opportunityKind: 'support',
    name: {
      'zh-CN': '自然科学学院给国际学生的入口',
      en: 'Faculty of Sciences: entry point for international students',
    },
    description: {
      'zh-CN':
        '自然科学学院自己整理的英文硕士项目清单（CAM、Data Science、Integrated Immunology、Integrated Life Sciences、Molecular Science、Physics、Paleobiology、Physical Geography 等），并列出学院的 Buddy 项目、DAAD 奖学金数据库和国际化负责人的联系方式。想确认某个专业是不是全英文授课，看这里比看大学总页面快。',
      en: 'The Faculty of Sciences lists its English-taught master\'s programmes (CAM, Data Science, Integrated Immunology, Integrated Life Sciences, Molecular Science, Physics, Paleobiology, Physical Geography and others) together with its buddy programme, the DAAD database and the contact for internationalisation. Faster than the university-wide pages for checking whether a programme is fully English-taught.',
    },
    categoryId: 'international',
    url: 'https://www.nat.fau.de/studium/internationales/aus-dem-ausland/',
    keywords: {
      'zh-CN': ['自然科学学院', '英文硕士', '全英文授课', 'B2 英语', '学院联系人'],
      en: ['Faculty of Sciences', 'English-taught master', 'B2 English', 'faculty contact'],
    },
    source: {
      title: zh('FAU Naturwissenschaftliche Fakultät – Aus dem Ausland', 'FAU Faculty of Sciences – From abroad'),
      url: 'https://www.nat.fau.de/studium/internationales/aus-dem-ausland/',
    },
    audience: [zh('申请自然科学学院硕士的国际学生', 'International applicants to Faculty of Sciences master\'s programmes')],
    priority: 320,
  },
  {
    ...internationalScope,
    id: 'intl-faculty-events',
    kind: 'official',
    opportunityKind: 'programme',
    name: { 'zh-CN': '自然科学学院活动日历', en: 'Faculty of Sciences events calendar' },
    description: {
      'zh-CN':
        '学院的讲座、研讨会、导览和国际学生专场活动都在这里（包括欢迎周里在 Anatomie 1 举行的 “My FAU Story” 分享）。想参加活动却不知道有哪些，先看日历。',
      en: 'The faculty\'s talks, seminars, tours and international-student events live here, including the "My FAU Story" session in Anatomie 1 during Welcome Week. If you do not know what is on, start with the calendar.',
    },
    categoryId: 'international',
    url: 'https://www.nat.fau.de/termine/',
    keywords: {
      'zh-CN': ['活动日历', '讲座', '研讨会', 'My FAU Story', '学院活动'],
      en: ['events calendar', 'talks', 'seminars', 'My FAU Story', 'faculty events'],
    },
    source: {
      title: zh('FAU Naturwissenschaftliche Fakultät – Termine', 'FAU Faculty of Sciences – Events'),
      url: 'https://www.nat.fau.de/termine/',
    },
    audience: [zh('全体学生', 'All students')],
    priority: 330,
  },
  {
    ...internationalScope,
    id: 'intl-career-service',
    kind: 'official',
    opportunityKind: 'career',
    name: { 'zh-CN': '就业服务（Career Service）', en: 'Career Service' },
    description: {
      'zh-CN':
        '简历与求职信修改、面试练习、企业宣讲会与实习信息。对国际学生最有用的是关于在德国求职的规则说明：工作许可、蓝卡、毕业后的找工作签证。',
      en: 'CV and cover-letter feedback, interview practice, company presentations and internship listings. Most useful for international students: the rules for working in Germany, work permits, the Blue Card and the post-study job-seeking visa.',
    },
    categoryId: 'international',
    url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/career-service/',
    keywords: {
      'zh-CN': ['就业服务', '简历', '面试', '实习', '蓝卡', '找工作签证'],
      en: ['career service', 'CV', 'interview', 'internship', 'Blue Card', 'job-seeking visa'],
    },
    source: {
      title: zh('FAU Career Service', 'FAU Career Service'),
      url: 'https://www.fau.eu/studying/organizing-your-studies-and-where-to-go-for-advice/career-service/',
    },
    audience: [zh('全体学生，含国际学生', 'All students, including international students')],
    priority: 340,
  },
  {
    ...internationalScope,
    id: 'intl-office-of-international-affairs',
    kind: 'official',
    opportunityKind: 'support',
    name: { 'zh-CN': '国际事务处（国际学生的主管部门）', en: 'Office of International Affairs' },
    description: {
      'zh-CN':
        '国际学生所有非学业问题的中央对接部门：入境、居留、保险、资助、交换与融入项目。遇到说不清该找谁的问题，先问这里。',
      en: 'The central contact for everything non-academic that affects international students: entry, residence, insurance, funding, exchange and integration programmes. When it is unclear who to ask, ask here.',
    },
    categoryId: 'international',
    url: 'https://www.fau.de/internationales/',
    keywords: {
      'zh-CN': ['国际事务处', 'RIA', '主管部门', '咨询', '联系方式'],
      en: ['International Affairs', 'RIA', 'contact', 'advice'],
    },
    source: {
      title: zh('FAU Internationales（国际事务处）', 'FAU International Affairs'),
      url: 'https://www.fau.de/internationales/',
    },
    audience: [zh('全体国际学生与申请人', 'All international students and applicants')],
    priority: 350,
  },
  {
    ...internationalScope,
    id: 'intl-study-in-germany',
    kind: 'external',
    opportunityKind: 'support',
    name: { 'zh-CN': 'Study in Germany（DAAD 官方信息站）', en: 'Study in Germany (official DAAD portal)' },
    description: {
      'zh-CN':
        'DAAD 的官方德国留学门户，英文与中文都有：签证流程、生活费预算、住宿、保险、毕业后留德工作。适合在决定来德国之前用来算清楚成本和手续，不适合查 FAU 的具体专业要求。',
      en: 'The DAAD portal on studying in Germany, available in English and Chinese: visa process, cost-of-living budget, housing, insurance, staying on to work after graduating. Good for working out cost and paperwork before deciding to come; not the place for FAU programme requirements.',
    },
    categoryId: 'international',
    url: 'https://www.study-in-germany.de/en/',
    keywords: {
      'zh-CN': ['德国留学', '生活费预算', '住宿', '保险', '毕业后留德', 'DAAD 门户'],
      en: ['study in Germany', 'cost of living', 'housing', 'insurance', 'work after graduation', 'DAAD portal'],
    },
    source: {
      title: zh('Study in Germany（DAAD 官方门户）', 'Study in Germany (DAAD)'),
      url: 'https://www.study-in-germany.de/en/',
    },
    audience: [zh('考虑来德国留学的学生', 'Students considering studying in Germany')],
    priority: 360,
  },
];

export const officialResources = resourceSeeds.map((resource) => resourceSchema.parse(resource));
