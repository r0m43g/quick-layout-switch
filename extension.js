/* extension.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict';

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { getInputSourceManager } from 'resource:///org/gnome/shell/ui/status/keyboard.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class QuickLayoutSwitchExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._updateInputSources();
        this._bindSettings();
        this._addKeybindings();
        
        // Подписываемся на изменения раскладок клавиатуры
        const sourceman = getInputSourceManager();
        this._inputSourcesChangedId = sourceman.connect('sources-changed', () => {
            this._updateInputSources();
            this._removeKeybindings();
            this._addKeybindings();
        });
        
        this._log('Расширение Quick Layout Switch включено');
    }

    disable() {
        this._removeKeybindings();
        
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        
        if (this._inputSourcesChangedId) {
            const sourceman = getInputSourceManager();
            sourceman.disconnect(this._inputSourcesChangedId);
            this._inputSourcesChangedId = null;
        }
        
        this._settings = null;
        this._log('Расширение Quick Layout Switch отключено');
    }

    // Обновляем информацию о доступных раскладках
    _updateInputSources() {
        try {
            const sourceman = getInputSourceManager();
            if (!sourceman) {
                this._error('Input source manager недоступен');
                return;
            }
            
            const sources = sourceman._inputSources;
            if (!sources) {
                this._error('Input sources недоступны');
                return;
            }
            
            const sourceIds = Object.keys(sources);
            
            // Сохраняем информацию о доступных раскладках
            let layoutInfo = [];
            for (let i = 0; i < sourceIds.length; i++) {
                const source = sources[sourceIds[i]];
                if (source) {
                    layoutInfo.push({
                        index: parseInt(sourceIds[i]),
                        id: source.id || `layout-${i}`,
                        name: source.displayName || `Layout ${i}`
                    });
                }
            }
            
            // Сохраняем как JSON-строку в настройках
            this._settings.set_string('layout-info', JSON.stringify(layoutInfo));
        } catch (e) {
            this._error(`Ошибка при обновлении источников ввода: ${e}`);
        }
    }

    _bindSettings() {
        this._settingsChangedId = this._settings.connect('changed', (settings, key) => {
            if (key.startsWith('switch-to-layout-')) {
                this._removeKeybindings();
                this._addKeybindings();
            }
        });
    }

    _addKeybindings() {
        // Получаем информацию о раскладках
        const layoutInfoStr = this._settings.get_string('layout-info');
        let layoutInfo = [];
        try {
            layoutInfo = JSON.parse(layoutInfoStr);
        } catch (e) {
            this._error(`Не удалось разобрать информацию о раскладках: ${e}`);
            return;
        }
        
        // Для каждой раскладки добавляем привязку клавиш, если настроена
        for (const layout of layoutInfo) {
            const layoutId = `layout-${layout.index}`;
            const binding = this._settings.get_strv(`switch-to-${layoutId}`);
            
            if (binding && binding.length > 0 && binding[0].trim() !== '') {
                Main.wm.addKeybinding(
                    `switch-to-${layoutId}`,
                    this._settings,
                    Meta.KeyBindingFlags.NONE,
                    Shell.ActionMode.ALL,
                    () => this._switchToLayout(layout.index)
                );
                this._log(`Добавлена привязка клавиш для раскладки ${layout.name}: ${binding[0]}`);
            }
        }
    }

    _removeKeybindings() {
        // Получаем информацию о раскладках
        const layoutInfoStr = this._settings.get_string('layout-info');
        let layoutInfo = [];
        try {
            layoutInfo = JSON.parse(layoutInfoStr);
        } catch (e) {
            // Если не можем разобрать информацию, попробуем удалить привязки на основе разумного количества раскладок
            for (let i = 0; i < 5; i++) {
                Main.wm.removeKeybinding(`switch-to-layout-${i}`);
            }
            return;
        }
        
        // Удаляем все настроенные привязки клавиш
        for (const layout of layoutInfo) {
            const layoutId = `layout-${layout.index}`;
            Main.wm.removeKeybinding(`switch-to-${layoutId}`);
        }
    }

    // Переключение на указанную раскладку
    _switchToLayout(index) {
        const sourceman = getInputSourceManager();
        const sources = sourceman._inputSources;
        
        if (sources[index]) {
            sources[index].activate(true);
            this._log(`Переключено на раскладку с индексом: ${index}`);
        } else {
            this._error(`Не удалось переключиться на раскладку с индексом: ${index}, источник не найден`);
        }
    }

    _log(msg) {
        console.log(`[QuickLayoutSwitch]: ${msg}`);
    }

    _error(msg) {
        console.error(`[QuickLayoutSwitch]: ${msg}`);
    }
}
