# Quick Layout Switch

Расширение для GNOME Shell, позволяющее назначать отдельные горячие клавиши для переключения на конкретные раскладки клавиатуры.

## Описание

Quick Layout Switch — это расширение для GNOME Shell, которое расширяет стандартные возможности переключения раскладок клавиатуры. Вместо использования одной комбинации клавиш для циклического переключения между всеми раскладками, данное расширение позволяет назначить уникальные сочетания клавиш для каждой раскладки, что делает процесс переключения более быстрым и точным.

## Функции

- Прямое переключение на нужную раскладку одним сочетанием клавиш
- Поддержка до 5 различных раскладок клавиатуры
- Автоматическое обновление при изменении списка доступных раскладок
- Простой и понятный интерфейс настройки
- Полная интеграция с системой настроек GNOME

## Требования

- GNOME Shell 48
- Несколько настроенных раскладок клавиатуры в системе

## Установка

1. Скопируйте файлы расширения в папку `~/.local/share/gnome-shell/extensions/quick-layout-switch@webcoda.eu/`
2. Перезапустите GNOME Shell (нажмите Alt+F2, введите `r` и нажмите Enter)
3. Включите расширение через приложение «Расширения» или через интерфейс `gnome-extensions-app`

## Использование

1. Откройте настройки расширения через приложение «Расширения»
2. Для каждой доступной раскладки клавиатуры назначьте желаемое сочетание клавиш
3. Используйте настроенные сочетания клавиш для мгновенного переключения на нужную раскладку

## Настройка

В интерфейсе настроек расширения вы увидите список всех доступных раскладок клавиатуры. Для каждой раскладки:
1. Нажмите на кнопку «Назначить сочетание клавиш»
2. Нажмите желаемую комбинацию клавиш (например, Alt+1, Ctrl+Shift+1 и т.д.)
3. Нажмите «Установить» для сохранения

Для удаления назначенного сочетания клавиш нажмите «Очистить».

## Структура проекта

- `extension.js` - Основной код расширения
- `prefs.js` - Код для интерфейса настроек
- `metadata.json` - Метаданные расширения
- `schemas/` - Схемы GSettings для хранения настроек

## Лицензия

Распространяется под лицензией GPL-2.0-or-later.
