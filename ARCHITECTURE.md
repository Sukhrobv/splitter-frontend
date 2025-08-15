# ARCHITECTURE.md — SPMS (Receipt Splitter — Frontend)

## 1. Платформа и стек

* **Платформа:** React Native + Expo SDK 53 с поддержкой Expo Go.
* **Языки:** TypeScript.
* **Сборка и публикация:** EAS Build + OTA Updates.
* **Навигация:** expo-router v4 (stack, tabs, modals), deep links.
* **Стейт:** Zustand v5 (глобальный стейт) + React Query v5 (серверные данные, кэш, офлайн-режим).
* **Формы и валидация:** React Hook Form v7 + Zod v3.
* **Стилизация:** NativeWind v4 + Tailwind CSS v3, дизайн-токены, поддержка light/dark themes.
* **Локализация:** react-i18next v14 + expo-localization, поддержка ja/en.
* **Сеть:** Axios v1 с интерсепторами (auth, lang header, cancellation, retry).
* **Тестирование:** Jest + React Native Testing Library; e2e (Detox или Maestro при необходимости).

## 2. Версии основных зависимостей (SDK 53)

```json
{
  "expo": "~53.0.0",
  "react": "18.3.1", 
  "react-native": "0.75.3",
  "expo-router": "~4.0.0",
  "zustand": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.53.0",
  "zod": "^3.23.0",
  "nativewind": "^4.0.0",
  "tailwindcss": "^3.4.0",
  "react-i18next": "^14.0.0",
  "axios": "^1.7.0"
}
```

## 3. Архитектурный подход

* **Feature-Sliced Design**:
  * `src/app/` — роутинг (expo-router) и глобальные провайдеры.
  * `src/features/*` — экраны и бизнес-логика конкретных функций.
  * `src/entities/*` — модели, схемы валидации Zod, мапперы.
  * `src/shared/*` — UI-компоненты, хуки, утилиты, темы, i18n.

* **Структура папок**:
```
src/
  app/                    # Expo Router + провайдеры
    (tabs)/              # Tab навигация
    _layout.tsx          # Root layout
  features/              # Бизнес функции
    auth/               # Авторизация
    friends/           # Управление друзьями  
    sessions/          # Сессии разделения счёта
    receipt/           # Работа с чеками и OCR
  entities/             # Доменные модели
    user/
    session/  
    receipt/
  shared/              # Переиспользуемые ресурсы
    ui/               # UI Kit компоненты
    lib/              # Хуки, утилиты
    config/           # Конфигурация
    api/              # API клиенты
```

* **UI Kit**:
  * Базовые компоненты (Button, Input, Card, Modal, List, Toast).
  * Композитные компоненты (Form, DatePicker, Stepper).
  * NativeWind классы для консистентной стилизации.

* **Слои данных**:
  * API-клиенты (axios) по доменам (auth, friends, sessions, ocr).
  * DTO ↔ Entity маппинг.
  * Схемы валидации Zod с i18n поддержкой.

## 4. Изменения от базовой версии

### Обновления для SDK 53:
- React Native 0.75.x с поддержкой новой архитектуры
- Metro bundler 0.81.x для улучшенной производительности
- Expo Router v4 для стабильной навигации
- Обновлённые типы TypeScript

### Проектная структура:
- Создан blank-typescript шаблон на SDK 53
- Настроена Feature-Sliced Design архитектура
- Подготовлена интеграция с backend API

## 5. Интеграции (без изменений)

* **Backend:** REST API (Node.js/Express или Python/FastAPI).
* **OCR:** Google Vision API или Tesseract.
* **Share:** React Native Share API.

## 6. Безопасность (обновлено для SDK 53)

* Хранение токенов в expo-secure-store v13.
* Очистка данных при logout.
* Минимизация хранения PII.
* Проверка разрешений (камера, галерея) через expo-permissions.

## 7. Производительность (улучшения SDK 53)

* Lazy-loading экранов через expo-router.
* Оптимизация списков (FlatList / FlashList v1.7).
* Мемоизация вычислений и компонентов.
* Hermes engine с улучшенной поддержкой.
* Новая архитектура React Native (опционально).

## 8. Разработка и CI/CD (без изменений)

* **CI:** GitHub Actions — lint, test, build preview.
* **CD:** EAS Build + Expo Publish (каналы preview/prod).
* **Code style:** ESLint, Prettier, Husky, lint-staged, commitlint.

## 9. Тестирование и контроль качества (обновлено)

* Unit-тесты для утилит и хуков (Jest v29).
* Компонентные тесты для UI (React Native Testing Library v12).
* Snapshot-тесты для критичных экранов.
* E2E-тесты ключевых сценариев (Detox v20 или Maestro).

## 10. Открытые вопросы

* Подтверждение точного протокола авторизации (JWT/OAuth2).
* Решение по push-уведомлениям.
* Уточнение требований к офлайн-режиму (read-only/full sync).
* Выбор между Detox и Maestro для E2E тестирования.