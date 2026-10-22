import { allFacultyIds } from './faculties';
import { resourceSchema, type Resource } from '../domain/resources';

const commonScope: Pick<
  Resource,
  'facultyIds' | 'degreeTypes' | 'lastCheckedAt' | 'verificationStatus' | 'createdAt'
> = {
  facultyIds: allFacultyIds,
  degreeTypes: ['bachelor', 'master'],
  lastCheckedAt: '2026-10-21',
  verificationStatus: 'verified' as const,
  createdAt: null,
};

const prdSource = (title: string, url: string) => ({
  title: {
    'zh-CN': `FAU 官方入口；项目 PRD §3.2：${title}`,
    en: `Official FAU destination; project PRD §3.2: ${title}`,
  },
  url,
});

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
    source: prdSource('Campo', 'https://campo.fau.de'),
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
    source: prdSource('StudOn', 'https://www.studon.fau.de'),
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
    source: prdSource('StudOn-Exam', 'https://www.studon-exam.fau.de'),
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
    source: prdSource('IdM', 'https://www.idm.fau.de'),
    priority: 40,
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
    source: prdSource('University Library', 'https://www.ub.fau.de'),
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
    source: prdSource('Prüfungsordnungen', 'https://www.fau.de/universitaet/universitaetsorganisation/rechtliche-grundlagen/pruefungsordnungen/'),
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
    source: prdSource('Academic dates', 'https://www.fau.de/studium/bewerbung-und-zulassung/alle-fristen-und-termine/'),
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
    source: prdSource('Exam registration windows', 'https://www.fau.de/glossary/anmeldezeitraeume-fuer-pruefungen/'),
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
    source: prdSource('Campo module descriptions', 'https://www.fau.de/studium/studienorganisation/studienstart/stundenplan-und-vorlesungsverzeichnis/modulbeschreibungen-in-campo-suchen-und-anzeigen/'),
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
    source: prdSource('Campo study planner', 'https://www.fau.de/studium/studienorganisation/pruefungen/pruefungen-und-wahlfaecher-im-studienplaner-mit-modulplan-in-campo-verwalten/'),
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
    source: prdSource('First-year FAQ', 'https://www.fau.de/studium/studienorganisation/studienstart/faqs-zum-studienstart-und-zum-ersten-studienjahr/faqs-semesterbeginn/'),
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
    source: prdSource('Faculties', 'https://www.fau.eu/university/university-organization/faculties/'),
    priority: 120,
  },
];

export const officialResources = resourceSeeds.map((resource) => resourceSchema.parse(resource));
