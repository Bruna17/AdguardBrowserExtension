import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { Editor } from '../Editor';
import { rootStore } from '../../stores/RootStore';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../common/log';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { AllowlistSavingButton } from './AllowlistSavingButton';

const Allowlist = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        (async () => {
            await settingsStore.getAllowlist();
        })();
    }, []);

    useEffect(() => {
        editorRef.current.editor.session.setValue(settingsStore.allowlist);
    }, [settingsStore.allowlist]);

    const { settings } = settingsStore;

    const { DEFAULT_ALLOWLIST_MODE } = settings.names;

    const settingChangeHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
        await settingsStore.getAllowlist();
    };

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const exportClickHandler = async () => {
        window.open('/pages/export.html#wl', '_blank');
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'txt');
            await settingsStore.saveAllowlist(content);
        } catch (e) {
            log.debug(e.message);
            uiStore.addNotification({ description: e.message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const saveClickHandler = async () => {
        if (settingsStore.allowlistEditorContentChanged) {
            const value = editorRef.current.editor.session.getValue();
            await settingsStore.saveAllowlist(value);
        }
    };

    const editorChangeHandler = () => {
        settingsStore.setAllowlistEditorContentChangedState(true);
    };

    const shortcuts = [{
        name: 'save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: async () => {
            await saveClickHandler();
        },
    }];

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_allowlist')}
                description={reactTranslator.getMessage('options_allowlist_desc')}
            >
                <SettingsSet
                    title={reactTranslator.getMessage('options_allowlist_invert')}
                    description={reactTranslator.getMessage('options_allowlist_invert_desc')}
                    inlineControl={(
                        <Setting
                            id={DEFAULT_ALLOWLIST_MODE}
                            label={reactTranslator.getMessage('options_allowlist_invert')}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[DEFAULT_ALLOWLIST_MODE]}
                            handler={settingChangeHandler}
                            inverted
                        />
                    )}
                />
            </SettingsSection>
            <Editor
                name="allowlist"
                editorRef={editorRef}
                shortcuts={shortcuts}
                onChange={editorChangeHandler}
            />
            <div className="actions actions--divided">
                <div className="actions__group">
                    <input
                        type="file"
                        id="inputEl"
                        accept="text/plain"
                        ref={inputRef}
                        onChange={inputChangeHandler}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="button button--m button--green actions__btn"
                        onClick={importClickHandler}
                    >
                        {reactTranslator.getMessage('options_userfilter_import')}
                    </button>
                    <button
                        type="button"
                        className="button button--m button--green-bd actions__btn"
                        onClick={exportClickHandler}
                        disabled={!settingsStore.allowlist}
                    >
                        {reactTranslator.getMessage('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions__group">
                    <AllowlistSavingButton onClick={saveClickHandler} />
                </div>
            </div>
        </>
    );
});

export { Allowlist };