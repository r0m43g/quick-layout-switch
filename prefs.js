/* prefs.js
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';

// Определяем класс для модуля настроек
export default class PrefsModule {
    constructor() {
        // Пустой конструктор
    }
    
    // Метод настройки окна предпочтений, поддерживающий разные API
    fillPreferencesWindow(window) {
        // Создаем настройки напрямую, используя идентификатор схемы
        const settings = this._getSettings();
        
        if (settings) {
            const widget = new QuickLayoutSwitchPrefsWidget(settings);
            window.add(widget);
        } else {
            // Если не удалось получить настройки, показываем ошибку
            const errorPage = new Adw.PreferencesPage({
                title: 'Error',
                icon_name: 'dialog-error-symbolic',
            });
            
            const errorGroup = new Adw.PreferencesGroup({
                title: 'Не удалось загрузить настройки',
                description: 'Произошла ошибка при загрузке настроек расширения. Проверьте журнал системы для получения дополнительной информации.'
            });
            
            errorPage.add(errorGroup);
            window.add(errorPage);
            
            console.error('Не удалось получить объект настроек для расширения quick-layout-switch@webcoda.eu');
        }
    }
    
    // Получение настроек без зависимости от переданного объекта расширения
    _getSettings() {
        try {
            // Создаем настройки напрямую с помощью идентификатора схемы
            const schemaId = 'org.gnome.shell.extensions.quick-layout-switch';
            const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
                `${import.meta.url.slice(7, import.meta.url.lastIndexOf('/'))}/schemas`,
                Gio.SettingsSchemaSource.get_default(),
                false
            );
            
            const schema = schemaSource.lookup(schemaId, true);
            if (!schema) {
                console.error(`Схема ${schemaId} не найдена`);
                return null;
            }
            
            return new Gio.Settings({ settings_schema: schema });
        } catch (e) {
            console.error(`Ошибка при получении настроек: ${e}`);
            return null;
        }
    }
}

// Регистрируем виджет настроек
const QuickLayoutSwitchPrefsWidget = GObject.registerClass(
class QuickLayoutSwitchPrefsWidget extends Adw.PreferencesPage {
    _init(settings) {
        super._init({
            title: 'Quick Layout Switch',
            icon_name: 'preferences-desktop-keyboard-symbolic',
        });

        this._settings = settings;
        this._buildUI();
    }

    _buildUI() {
        // Создаем группу настроек
        const group = new Adw.PreferencesGroup({
            title: 'Сочетания клавиш для раскладок клавиатуры',
            description: 'Настройте сочетания клавиш для переключения на конкретные раскладки'
        });
        this.add(group);

        // Получаем информацию о раскладках из настроек
        const layoutInfoStr = this._settings.get_string('layout-info');
        let layoutInfo = [];
        try {
            layoutInfo = JSON.parse(layoutInfoStr);
        } catch (e) {
            const row = new Adw.ActionRow({
                title: 'Ошибка',
                subtitle: 'Не удалось загрузить информацию о раскладках. Убедитесь, что расширение включено.'
            });
            group.add(row);
            return;
        }

        if (layoutInfo.length === 0) {
            const row = new Adw.ActionRow({
                title: 'Раскладки не найдены',
                subtitle: 'Раскладки клавиатуры не обнаружены. Убедитесь, что вы настроили раскладки клавиатуры в настройках GNOME.'
            });
            group.add(row);
            return;
        }

        // Для каждой раскладки создаем строку настройки сочетания клавиш
        for (const layout of layoutInfo) {
            const layoutId = `layout-${layout.index}`;
            const layoutName = layout.name;
            
            // Создаем строку с сочетанием клавиш
            const row = new Adw.ActionRow({
                title: layoutName,
                subtitle: 'Нажмите, чтобы настроить сочетание клавиш'
            });
            
            // Создаем кнопку для отображения/настройки сочетания клавиш
            const shortcutLabel = new Gtk.Label({
                valign: Gtk.Align.CENTER,
            });
            const shortcutButton = new Gtk.Button({
                valign: Gtk.Align.CENTER,
                child: shortcutLabel
            });
            
            this._updateShortcutLabel(shortcutLabel, layoutId);
            
            shortcutButton.connect('clicked', () => {
                this._showShortcutDialog(layoutId, layoutName, shortcutLabel);
            });
            
            row.add_suffix(shortcutButton);
            group.add(row);
        }
    }

    _updateShortcutLabel(label, layoutId) {
        const shortcut = this._settings.get_strv(`switch-to-${layoutId}`);
        label.set_text(shortcut && shortcut.length > 0 && shortcut[0].trim() !== '' 
            ? shortcut[0] 
            : 'Назначить сочетание клавиш');
    }

    _showShortcutDialog(layoutId, layoutName, label) {
        const dialog = new Gtk.Dialog({
            title: `Сочетание клавиш для ${layoutName}`,
            modal: true,
            use_header_bar: 1,
            transient_for: this.get_root()
        });
        
        dialog.add_button('Отмена', Gtk.ResponseType.CANCEL);
        dialog.add_button('Очистить', Gtk.ResponseType.REJECT);
        dialog.add_button('Установить', Gtk.ResponseType.ACCEPT);
        
        const content = dialog.get_content_area();
        content.spacing = 10;
        content.margin_top = 10;
        content.margin_bottom = 10;
        content.margin_start = 10;
        content.margin_end = 10;
        
        const infoLabel = new Gtk.Label({
            label: 'Нажмите сочетание клавиш для установки',
            margin_bottom: 10
        });
        content.append(infoLabel);
        
        const entry = new Gtk.Entry({
            text: this._settings.get_strv(`switch-to-${layoutId}`)[0] || '',
            editable: false,
            can_focus: true
        });
        content.append(entry);
        
        // Обработка нажатий клавиш
        const eventController = new Gtk.EventControllerKey();
        entry.add_controller(eventController);
        
        eventController.connect('key-pressed', (controller, keyval, keycode, state) => {
            // Фильтруем клавишу Escape
            if (keyval === Gdk.KEY_Escape) {
                dialog.response(Gtk.ResponseType.CANCEL);
                return true; // Событие обработано
            }
            
            // Получаем модификаторы
            const mask = state & Gtk.accelerator_get_default_mod_mask();
            
            // Принимаем только комбинации клавиш с модификаторами
            if (mask !== 0) {
                const accelerator = Gtk.accelerator_name(keyval, mask);
                entry.set_text(accelerator);
                return true; // Событие обработано
            }
            
            return false; // Позволяем событию распространяться дальше
        });
        
        dialog.connect('response', (dialog, response) => {
            if (response === Gtk.ResponseType.ACCEPT) {
                const accelerator = entry.get_text();
                if (accelerator && accelerator.trim() !== '') {
                    this._settings.set_strv(`switch-to-${layoutId}`, [accelerator]);
                    this._updateShortcutLabel(label, layoutId);
                }
            } else if (response === Gtk.ResponseType.REJECT) {
                this._settings.set_strv(`switch-to-${layoutId}`, []);
                this._updateShortcutLabel(label, layoutId);
            }
            
            dialog.destroy();
        });
        
        dialog.present();
        entry.grab_focus();
    }
});
