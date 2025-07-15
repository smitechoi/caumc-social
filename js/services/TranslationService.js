import ko from './locales/ko.js';
import en from './locales/en.js';
import ja from './locales/ja.js';
import zh from './locales/zh.js';
import vn from './locales/vn.js';
import th from './locales/th.js';

export class TranslationService {
  constructor() {
    this.currentLanguage = 'ko';
    this.translations = {
      ko,
      en,
      ja,
      zh,
      vn,
      th
    };
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // Fallback to Korean if translation not found
        value = this.translations.ko;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          }
        }
        break;
      }
    }
    if (typeof value !== 'string') {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    // Replace parameters
    let result = value;
    for (const [param, val] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${param}}`, 'g'), val);
    }
    return result;
  }

  setLanguage(language) {
    if (this.translations[language]) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language ${language} not supported, falling back to Korean`);
      this.currentLanguage = 'ko';
    }
  }

  getLanguageName(code) {
    const languageNames = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
      vn: 'Tiếng Việt',
      th: 'ไทย'
    };
    return languageNames[code] || code;
  }
}

// 인스턴스 export 추가
export const translationService = new TranslationService();