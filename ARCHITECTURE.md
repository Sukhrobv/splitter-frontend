# ARCHITECTURE.md — SPMS (Receipt Splitter — Frontend)

## 1. Платформа и стек

* **Платформа:** React Native + Expo SDK 53 с поддержкой Expo Go.
* **Языки:** TypeScript 5.8.3.
* **Сборка и публикация:** EAS Build + OTA Updates.
* **Навигация:** expo-router v5.1.4 (stack, tabs, modals), deep links.
* **Стейт:** Zustand v5.0.7 (глобальный стейт) + React Query v5.85.3 (серверные данные, кэш, офлайн-режим).
* **Формы и валидация:** React Hook Form v7.62.0 + Zod v4.0.17.
* **Стилизация:** Собственная система стилей на основе StyleSheet, дизайн-токены, поддержка light/dark themes.
* **Локализация:** react-i18next v15.6.1 + expo-localization v16.1.6, поддержка ja/en.
* **Сеть:** Axios v1.11.0 с интерсепторами (auth, lang header, cancellation, retry).
* **Тестирование:** Jest + React Native Testing Library; e2e (Detox или Maestro при необходимости).

## 2. Версии основных зависимостей (SDK 53)

```json
{
  "expo": "~53.0.20",
  "react": "19.0.0", 
  "react-native": "0.79.5",
  "expo-router": "~5.1.4",
  "zustand": "^5.0.7",
  "@tanstack/react-query": "^5.85.3",
  "react-hook-form": "^7.62.0",
  "zod": "^4.0.17",
  "react-i18next": "^15.6.1",
  "i18next": "^25.3.6",
  "expo-localization": "^16.1.6",
  "axios": "^1.11.0",
  "expo-secure-store": "^14.2.3",
  "typescript": "^5.8.3"
}
```

## 3. Архитектурный подход

* **Feature-Sliced Design**:
  * `src/app/` — конфигурация провайдеров (QueryClient, стейт менеджеры).
  * `app/` — роутинг expo-router (layouts, screens).
  * `src/features/*` — экраны и бизнес-логика конкретных функций.
  * `src/entities/*` — модели, схемы валидации Zod, мапперы.
  * `src/shared/*` — UI-компоненты, хуки, утилиты, темы, i18n.

* **Структура папок**:
```
receipt-splitter-frontend/
├── app/                           # Expo Router
│   ├── (tabs)/                   # Tab навигация
│   │   ├── index.tsx            # Home screen
│   │   ├── explore.tsx          # Explore screen
│   │   └── _layout.tsx          # Tabs layout
│   └── _layout.tsx              # Root layout
├── src/                          # Исходный код
│   ├── app/                     # Конфигурация приложения
│   │   ├── providers/           # Провайдеры (Query, Zustand)
│   │   └── config/              # Конфигурации
│   ├── features/                # Бизнес функции
│   │   ├── auth/               # Авторизация
│   │   ├── friends/           # Управление друзьями  
│   │   ├── sessions/          # Сессии разделения счёта
│   │   └── receipt/           # Работа с чеками и OCR
│   ├── entities/              # Доменные модели
│   │   ├── user/             # Пользователь
│   │   ├── session/          # Сессия
│   │   └── receipt/          # Чек
│   └── shared/               # Переиспользуемые ресурсы
│       ├── ui/              # UI Kit компоненты
│       │   ├── theme.ts     # Цвета, размеры, типография
│       │   └── styles.ts    # Базовые стили
│       ├── lib/             # Хуки, утилиты
│       │   ├── hooks/       # Переиспользуемые хуки
│       │   └── utils/       # Утилиты
│       ├── api/             # API клиенты
│       └── config/          # Конфигурации (axios, react-query)
├── assets/                   # Статические файлы
├── DESCRIPTION.md           # Описание проекта
├── ARCHITECTURE.md          # Архитектура (этот файл)
├── ROADMAP.md              # Планы разработки
├── RULES.md                # Правила разработки
└── STATUS.yaml             # Текущий статус
```

* **Система стилизации**:
  * Собственная система на основе React Native StyleSheet.
  * Централизованные цвета, размеры и типография в `theme.ts`.
  * Переиспользуемые стили в `commonStyles`.
  * Поддержка светлой и тёмной темы.

* **Слои данных**:
  * API-клиенты (axios) по доменам (auth, friends, sessions, ocr).
  * DTO ↔ Entity маппинг.
  * Схемы валидации Zod с i18n поддержкой.

## 4. Конфигурации

### TypeScript (tsconfig.json):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Babel (babel.config.js):
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

### Expo (app.json):
```json
{
  "expo": {
    "name": "Receipt Splitter",
    "slug": "receipt-splitter",
    "version": "1.0.0",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## 5. Интеграции

* **Backend:** REST API (Node.js/Express или Python/FastAPI).
* **OCR:** Google Vision API или Tesseract.
* **Share:** React Native Share API.

## 6. Безопасность

* Хранение токенов в expo-secure-store v14.
* Очистка данных при logout.
* Минимизация хранения PII.
* Проверка разрешений (камера, галерея) через expo-permissions.

## 7. Производительность

* Lazy-loading экранов через expo-router.
* Оптимизация списков (FlatList / FlashList).
* Мемоизация вычислений и компонентов.
* Hermes engine с улучшенной поддержкой в SDK 53.
* React Native новая архитектура (опционально).

## 8. Разработка и CI/CD

* **CI:** GitHub Actions — lint, test, build preview.
* **CD:** EAS Build + Expo Publish (каналы preview/prod).
* **Code style:** ESLint, Prettier, Husky, lint-staged, commitlint.

## 9. Тестирование и контроль качества

* Unit-тесты для утилит и хуков (Jest).
* Компонентные тесты для UI (React Native Testing Library).
* Snapshot-тесты для критичных экранов.
* E2E-тесты ключевых сценариев (Detox или Maestro).

## 10. Особенности реализации

### Отказ от NativeWind:
- Изначально планировалось использовать NativeWind для стилизации.
- Из-за конфликтов с Babel и нестабильной работы в SDK 53, было принято решение использовать собственную систему стилей.
- Это обеспечило стабильность сборки и полный контроль над ст