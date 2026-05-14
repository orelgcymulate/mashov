// Mock dataset for seeding. Same content as the previous src/mock.ts on the
// legacy Express server, restructured for the new collections.

export type MashovDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface KidProfile {
  slug: string;
  name: string;
  color: string;
  subjects: string[];
  teachers: Record<string, string>;
  schedule: Record<MashovDay, Array<{ lesson: number; subject: string; room: string }>>;
  homework: Array<{ subject: string; homework: string; lessonOffset: number }>;
  grades: Array<{ subject: string; event: string; grade: number; daysAgo: number }>;
  behavior: Array<{ subject: string; eventType: string; note: string; daysAgo: number; justified: boolean }>;
  messages: Array<{ subject: string; sender: string; daysAgo: number; isNew: boolean; body?: string }>;
  notifications: Array<{ text: string; daysAgo: number }>;
}

export const AYALA: KidProfile = {
  slug: 'ayala',
  name: 'איילה',
  color: '#ff6f9c',
  subjects: ['חשבון', 'עברית', 'אנגלית', 'מדעים', 'תנ״ך', 'אמנות', 'חינוך גופני', 'מוזיקה'],
  teachers: {
    'חשבון': 'מורה רחל לוי',
    'עברית': 'מורה דנה כהן',
    'אנגלית': 'מורה Sarah Klein',
    'מדעים': 'מורה יעל אברהם',
    'תנ״ך': 'מורה מרים שפירא',
    'אמנות': 'מורה תמר רוזן',
    'חינוך גופני': 'מורה אורן בן-דוד',
    'מוזיקה': 'מורה ענת פרץ',
  },
  schedule: {
    1: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'חשבון', room: 'כיתה ג2' },
      { lesson: 3, subject: 'חשבון', room: 'כיתה ג2' },
      { lesson: 4, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 5, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 6, subject: 'אמנות', room: 'סדנת אמנות' },
    ],
    2: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 3, subject: 'תנ״ך', room: 'כיתה ג2' },
      { lesson: 4, subject: 'מדעים', room: 'מעבדה' },
      { lesson: 5, subject: 'מדעים', room: 'מעבדה' },
      { lesson: 6, subject: 'חינוך גופני', room: 'אולם ספורט' },
    ],
    3: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'חשבון', room: 'כיתה ג2' },
      { lesson: 3, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 4, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 5, subject: 'מוזיקה', room: 'חדר מוזיקה' },
      { lesson: 6, subject: 'חינוך גופני', room: 'אולם ספורט' },
    ],
    4: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'תנ״ך', room: 'כיתה ג2' },
      { lesson: 3, subject: 'חשבון', room: 'כיתה ג2' },
      { lesson: 4, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 5, subject: 'מדעים', room: 'מעבדה' },
      { lesson: 6, subject: 'אמנות', room: 'סדנת אמנות' },
    ],
    5: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 3, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 4, subject: 'חשבון', room: 'כיתה ג2' },
      { lesson: 5, subject: 'מוזיקה', room: 'חדר מוזיקה' },
    ],
    6: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ג2' },
      { lesson: 2, subject: 'פרשת שבוע', room: 'כיתה ג2' },
      { lesson: 3, subject: 'עברית', room: 'כיתה ג2' },
      { lesson: 4, subject: 'חברה', room: 'כיתה ג2' },
    ],
    7: [],
  },
  homework: [
    { subject: 'חשבון', homework: 'דף עבודה 14 - שברים פשוטים, תרגילים 1-12', lessonOffset: 0 },
    { subject: 'עברית', homework: 'לקרוא את הסיפור "הילד והעץ" ולענות על השאלות בעמוד 87', lessonOffset: 1 },
    { subject: 'אנגלית', homework: 'ללמוד את 10 המילים החדשות לבוחן ביום חמישי', lessonOffset: 2 },
    { subject: 'תנ״ך', homework: 'לשנן את פסוקים א-ה בפרק יב', lessonOffset: 1 },
    { subject: 'מדעים', homework: 'להביא 3 עלים שונים מהבית לשיעור על צמחים', lessonOffset: 3 },
    { subject: 'אמנות', homework: 'להביא תמונה של חיה שאוהבים לציור', lessonOffset: 4 },
    { subject: 'חשבון', homework: 'תרגול חיבור וחיסור עד 1000 - חוברת עמ׳ 42', lessonOffset: -2 },
    { subject: 'מוזיקה', homework: 'לתרגל את השיר "ארץ ישראל יפה" לקראת הופעה', lessonOffset: 7 },
  ],
  grades: [
    { subject: 'חשבון', event: 'מבחן שברים', grade: 92, daysAgo: 4 },
    { subject: 'עברית', event: 'בוחן הבנת הנקרא', grade: 88, daysAgo: 9 },
    { subject: 'אנגלית', event: 'Spelling test', grade: 95, daysAgo: 14 },
    { subject: 'תנ״ך', event: 'בוחן בעל פה', grade: 90, daysAgo: 18 },
    { subject: 'מדעים', event: 'פרויקט הצמחים', grade: 96, daysAgo: 22 },
    { subject: 'חשבון', event: 'בוחן לוח הכפל', grade: 85, daysAgo: 28 },
    { subject: 'אמנות', event: 'פורטפוליו רבעון', grade: 100, daysAgo: 33 },
    { subject: 'מוזיקה', event: 'הופעה כיתתית', grade: 95, daysAgo: 40 },
  ],
  behavior: [
    { subject: 'עברית', eventType: 'ציון לשבח', note: 'השתתפה יפה בדיון על הסיפור', daysAgo: 2, justified: true },
    { subject: 'אמנות', eventType: 'ציון לשבח', note: 'עזרה לחברה בכיתה', daysAgo: 7, justified: true },
    { subject: 'חשבון', eventType: 'שיעורי בית חסרים', note: 'לא הגישה דף עבודה 12', daysAgo: 15, justified: false },
  ],
  messages: [
    { subject: 'תזכורת: הופעת סוף שנה ביום שישי', sender: 'מורה ענת פרץ', daysAgo: 0, isNew: true, body: 'בוקר טוב הורים, מזכירה ששוקדים על השיר לקראת ההופעה ביום שישי. נא להלביש לבן.' },
    { subject: 'סיכום אסיפת הורים', sender: 'מורה דנה כהן (מחנכת)', daysAgo: 1, isNew: true },
    { subject: 'יום ספורט - הזמנה', sender: 'הנהלת בית הספר', daysAgo: 2, isNew: true },
    { subject: 'תוצאות מבחן השברים', sender: 'מורה רחל לוי', daysAgo: 4, isNew: false },
    { subject: 'טיול שנתי - אישור הורים', sender: 'מורה דנה כהן (מחנכת)', daysAgo: 6, isNew: false },
    { subject: 'אספת הורים - תזכורת', sender: 'הנהלת בית הספר', daysAgo: 9, isNew: false },
    { subject: 'חוזר: חופשת שבועות', sender: 'הנהלת בית הספר', daysAgo: 12, isNew: false },
    { subject: 'משוב חיובי - שיעור אמנות', sender: 'מורה תמר רוזן', daysAgo: 15, isNew: false },
    { subject: 'בוחן באנגלית - דחיה', sender: 'מורה Sarah Klein', daysAgo: 19, isNew: false },
    { subject: 'תרומה לבית הספר', sender: 'ועד ההורים', daysAgo: 23, isNew: false },
  ],
  notifications: [
    { text: 'ציון חדש בחשבון: 92', daysAgo: 4 },
    { text: 'הודעה חדשה ממורה ענת פרץ', daysAgo: 0 },
    { text: 'שיעורי בית חדשים בעברית', daysAgo: 1 },
  ],
};

export const YISHAI: KidProfile = {
  slug: 'yishai-yosef',
  name: 'ישי יוסף',
  color: '#4a90e2',
  subjects: ['מתמטיקה', 'עברית', 'אנגלית', 'מדעים', 'היסטוריה', 'תנ״ך', 'תושב״ע', 'גאוגרפיה', 'מחשבים', 'חינוך גופני'],
  teachers: {
    'מתמטיקה': 'מורה אבי מזרחי',
    'עברית': 'מורה רותי שלום',
    'אנגלית': 'מורה Jennifer Cohen',
    'מדעים': 'מורה אורנה דהן',
    'היסטוריה': 'מורה יוסי גולן',
    'תנ״ך': 'מורה הרב לוי',
    'תושב״ע': 'מורה הרב לוי',
    'גאוגרפיה': 'מורה דוד אלמליח',
    'מחשבים': 'מורה גיא אדרי',
    'חינוך גופני': 'מורה איציק עמר',
  },
  schedule: {
    1: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'מתמטיקה', room: 'כיתה ו1' },
      { lesson: 3, subject: 'מתמטיקה', room: 'כיתה ו1' },
      { lesson: 4, subject: 'תנ״ך', room: 'כיתה ו1' },
      { lesson: 5, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 6, subject: 'מחשבים', room: 'מעבדת מחשבים' },
      { lesson: 7, subject: 'חינוך גופני', room: 'אולם ספורט' },
    ],
    2: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'תושב״ע', room: 'כיתה ו1' },
      { lesson: 3, subject: 'עברית', room: 'כיתה ו1' },
      { lesson: 4, subject: 'מדעים', room: 'מעבדת מדעים' },
      { lesson: 5, subject: 'מדעים', room: 'מעבדת מדעים' },
      { lesson: 6, subject: 'היסטוריה', room: 'כיתה ו1' },
      { lesson: 7, subject: 'גאוגרפיה', room: 'כיתה ו1' },
    ],
    3: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'מתמטיקה', room: 'כיתה ו1' },
      { lesson: 3, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 4, subject: 'תנ״ך', room: 'כיתה ו1' },
      { lesson: 5, subject: 'עברית', room: 'כיתה ו1' },
      { lesson: 6, subject: 'חינוך גופני', room: 'אולם ספורט' },
      { lesson: 7, subject: 'מחשבים', room: 'מעבדת מחשבים' },
    ],
    4: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'תושב״ע', room: 'כיתה ו1' },
      { lesson: 3, subject: 'מתמטיקה', room: 'כיתה ו1' },
      { lesson: 4, subject: 'עברית', room: 'כיתה ו1' },
      { lesson: 5, subject: 'היסטוריה', room: 'כיתה ו1' },
      { lesson: 6, subject: 'מדעים', room: 'מעבדת מדעים' },
      { lesson: 7, subject: 'גאוגרפיה', room: 'כיתה ו1' },
    ],
    5: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'אנגלית', room: 'חדר אנגלית' },
      { lesson: 3, subject: 'מתמטיקה', room: 'כיתה ו1' },
      { lesson: 4, subject: 'תנ״ך', room: 'כיתה ו1' },
      { lesson: 5, subject: 'עברית', room: 'כיתה ו1' },
      { lesson: 6, subject: 'מחשבים', room: 'מעבדת מחשבים' },
    ],
    6: [
      { lesson: 1, subject: 'תפילה', room: 'כיתה ו1' },
      { lesson: 2, subject: 'פרשת שבוע', room: 'כיתה ו1' },
      { lesson: 3, subject: 'תושב״ע', room: 'כיתה ו1' },
      { lesson: 4, subject: 'חברה', room: 'כיתה ו1' },
    ],
    7: [],
  },
  homework: [
    { subject: 'מתמטיקה', homework: 'תרגילים 3-15 בעמוד 142 - יחס ופרופורציה', lessonOffset: 0 },
    { subject: 'אנגלית', homework: 'Read chapter 7 in "The Magic Tree House" + answer questions', lessonOffset: 1 },
    { subject: 'תנ״ך', homework: 'סיכום פרק יב - לרשום 5 רעיונות מרכזיים', lessonOffset: 1 },
    { subject: 'עברית', homework: 'חיבור: "מה אני רוצה להיות כשאגדל" - 200-300 מילים', lessonOffset: 2 },
    { subject: 'תושב״ע', homework: 'ללמוד למבחן בפרק "ברכות הנהנין"', lessonOffset: 3 },
    { subject: 'מדעים', homework: 'הכנת מצגת על מערכת השמש - 8 שקופיות', lessonOffset: 5 },
    { subject: 'היסטוריה', homework: 'לקרוא עמודים 88-94 על תקופת הבית השני', lessonOffset: 2 },
    { subject: 'גאוגרפיה', homework: 'מפה של ישראל - לסמן 10 ערים מרכזיות', lessonOffset: 4 },
    { subject: 'מתמטיקה', homework: 'דף עבודה - אחוזים ושברים עשרוניים', lessonOffset: -1 },
    { subject: 'מחשבים', homework: 'פרויקט Scratch - להגיש קישור לעבודה', lessonOffset: 6 },
  ],
  grades: [
    { subject: 'מתמטיקה', event: 'מבחן יחס ופרופורציה', grade: 87, daysAgo: 5 },
    { subject: 'אנגלית', event: 'Reading comprehension test', grade: 91, daysAgo: 8 },
    { subject: 'תנ״ך', event: 'מבחן פרקים י-יב', grade: 89, daysAgo: 11 },
    { subject: 'עברית', event: 'חיבור - אקטואליה', grade: 84, daysAgo: 14 },
    { subject: 'מדעים', event: 'בוחן חשמל', grade: 93, daysAgo: 18 },
    { subject: 'תושב״ע', event: 'בעל פה - משנה ברכות', grade: 95, daysAgo: 21 },
    { subject: 'היסטוריה', event: 'מבחן תקופת בית ראשון', grade: 82, daysAgo: 26 },
    { subject: 'מתמטיקה', event: 'בוחן אחוזים', grade: 78, daysAgo: 32 },
    { subject: 'גאוגרפיה', event: 'מבחן מפת אירופה', grade: 90, daysAgo: 38 },
    { subject: 'מחשבים', event: 'פרויקט גמר Scratch', grade: 98, daysAgo: 45 },
  ],
  behavior: [
    { subject: 'תושב״ע', eventType: 'ציון לשבח', note: 'תשובה מצוינת בכיתה על המשנה', daysAgo: 3, justified: true },
    { subject: 'מתמטיקה', eventType: 'איחור לשיעור', note: 'איחר 10 דקות', daysAgo: 8, justified: true },
    { subject: 'חינוך גופני', eventType: 'ציון לשבח', note: 'מנהיגות במשחק כדורסל', daysAgo: 12, justified: true },
    { subject: 'עברית', eventType: 'שיעורי בית חסרים', note: 'לא הגיש חיבור בזמן', daysAgo: 20, justified: false },
  ],
  messages: [
    { subject: 'מסיבת סיום כיתה ו - לוח זמנים', sender: 'מורה רותי שלום (מחנכת)', daysAgo: 0, isNew: true, body: 'הורים יקרים, מצורף לוח הזמנים למסיבת סיום ו׳. אנא אשרו השתתפות עד יום ראשון.' },
    { subject: 'מבחן מתמטיקה - הכנה', sender: 'מורה אבי מזרחי', daysAgo: 1, isNew: true },
    { subject: 'הזמנה לטקס בר מצווה כיתתי', sender: 'הנהלת בית הספר', daysAgo: 2, isNew: true },
    { subject: 'משוב חיובי - תושב״ע', sender: 'מורה הרב לוי', daysAgo: 3, isNew: false },
    { subject: 'תוצאות מבחן יחס ופרופורציה', sender: 'מורה אבי מזרחי', daysAgo: 5, isNew: false },
    { subject: 'הזמנה לאסיפת הורים פרטנית', sender: 'מורה רותי שלום (מחנכת)', daysAgo: 7, isNew: false },
    { subject: 'חוברת לימוד אנגלית לשנה הבאה', sender: 'מורה Jennifer Cohen', daysAgo: 10, isNew: false },
    { subject: 'טיול שנתי לירושלים', sender: 'הנהלת בית הספר', daysAgo: 14, isNew: false },
    { subject: 'תזכורת: חופשת שבועות', sender: 'הנהלת בית הספר', daysAgo: 18, isNew: false },
    { subject: 'פרויקט סוף שנה במחשבים', sender: 'מורה גיא אדרי', daysAgo: 22, isNew: false },
  ],
  notifications: [
    { text: 'ציון חדש במתמטיקה: 87', daysAgo: 5 },
    { text: 'הודעה חדשה ממחנכת הכיתה', daysAgo: 0 },
    { text: 'מטלה חדשה בעברית - חיבור', daysAgo: 2 },
    { text: 'מבחן מתקרב בתושב״ע', daysAgo: 1 },
  ],
};

export const PROFILES = [AYALA, YISHAI];
