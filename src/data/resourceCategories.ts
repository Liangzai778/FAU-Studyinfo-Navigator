import { resourceCategorySchema, type ResourceCategory } from '../domain/resources';

export const builtInResourceCategories: ResourceCategory[] = [
  { id: 'study', name: { 'zh-CN': '学习', en: 'Study' }, builtIn: true },
  { id: 'exams', name: { 'zh-CN': '考试', en: 'Exams' }, builtIn: true },
  { id: 'services', name: { 'zh-CN': '校园服务', en: 'University services' }, builtIn: true },
  { id: 'faculty', name: { 'zh-CN': '学院', en: 'Faculty' }, builtIn: true },
  { id: 'life', name: { 'zh-CN': '校园生活', en: 'Campus life' }, builtIn: true },
  {
    // Kept separate from "campus life" because a scholarship deadline and a
    // buddy programme are the two things international students miss most,
    // and mixing them into general life links buries them.
    id: 'international',
    name: { 'zh-CN': '国际学生', en: 'For international students' },
    builtIn: true,
  },
  { id: 'personal', name: { 'zh-CN': '个人网站', en: 'Personal sites' }, builtIn: true },
].map((category) => resourceCategorySchema.parse(category));

export const defaultCategoryOrder = builtInResourceCategories.map((category) => category.id);
