import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import sortBy from 'lodash/sortBy';
import { Group } from './Group';
import { Filter } from './Filter';
import { EmptyCustom } from './EmptyCustom';
import { Search } from './Search';
import { FiltersUpdate } from './FiltersUpdate';
import { rootStore } from '../../stores/RootStore';
import { i18n } from '../../../services';
import { AddCustomModal } from './AddCustomModal';
import { CUSTOM_FILTERS_GROUP_ID } from '../../../../common/constants';

const Filters = observer(() => {
    const SEARCH_FILTERS = {
        ALL: 'all',
        ENABLED: 'enabled',
        DISABLED: 'disabled',
    };

    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchSelect, setSearchSelect] = useState(SEARCH_FILTERS.ALL);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const { settingsStore, uiStore } = useContext(rootStore);

    const {
        categories,
        filters,
        rulesCount,
        lastUpdateTime,
        filtersUpdating,
    } = settingsStore;

    const handleGroupSwitch = async ({ id, enabled }) => {
        await settingsStore.updateGroupSetting(id, enabled);
    };

    const groupClickHandler = (groupId) => (e) => {
        if (!e.target.closest('.checkbox')) {
            setSelectedGroupId(groupId);
        }
    };

    const getEnabledFiltersByGroup = (group) => (
        filters.filter((filter) => filter.groupId === group.groupId && filter.enabled)
    );

    const renderGroups = (groups) => {
        const sortedGroups = sortBy(groups, 'displayNumber');
        return sortedGroups.map((group) => {
            const enabledFilters = getEnabledFiltersByGroup(group);
            return (
                <Group
                    key={group.groupId}
                    groupName={group.groupName}
                    groupId={group.groupId}
                    enabledFilters={enabledFilters}
                    groupClickHandler={groupClickHandler(group.groupId)}
                    checkboxHandler={handleGroupSwitch}
                    checkboxValue={!!group.enabled}
                />
            );
        });
    };

    const handleFilterSwitch = async ({ id, enabled }) => {
        await settingsStore.updateFilterSetting(id, enabled);
    };

    const renderFilters = (filtersList) => filtersList.map((filter) => (
        <Filter
            key={filter.filterId}
            filter={filter}
            tags={filter.tagsDetails}
            checkboxHandler={handleFilterSwitch}
            checkboxValue={!!filter.enabled}
        />
    ));

    const handleReturnToGroups = () => {
        setSelectedGroupId(null);
    };

    // TODO add validation
    const searchInputHandler = (e) => {
        const { value } = e.target;
        setSearchInput(value);
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        setSearchSelect('all');
    };

    const searchSelectHandler = (e) => {
        const { value } = e.target;
        setSearchSelect(value);
    };

    const renderSearchResult = () => {
        const searchQuery = new RegExp(searchInput, 'ig');

        let searchFilters = filters;
        if (Number.isInteger(selectedGroupId)) {
            searchFilters = filters.filter((filter) => filter.groupId === selectedGroupId);
        }

        return searchFilters.map((filter) => {
            let searchMod;
            switch (searchSelect) {
                case SEARCH_FILTERS.ENABLED:
                    searchMod = filter.enabled;
                    break;
                case SEARCH_FILTERS.DISABLED:
                    searchMod = !filter.enabled;
                    break;
                default:
                    searchMod = true;
            }

            if ((filter.name.match(searchQuery) && searchMod) || searchMod) {
                return (
                    <Filter
                        key={filter.filterId}
                        filter={filter}
                        tags={filter.tagsDetails}
                        checkboxHandler={handleFilterSwitch}
                        checkboxValue={!!filter.enabled}
                    />
                );
            }
            return null;
        });
    };

    const updateFiltersHandler = async () => {
        const updates = await settingsStore.updateFilters();
        uiStore.addNotification({ description: updates });
    };

    const renderSearch = () => (
        <Search
            searchInputHandler={searchInputHandler}
            searchSelectHandler={searchSelectHandler}
            searchInput={searchInput}
            searchSelect={searchSelect}
            searchCloseHandler={searchCloseHandler}
        />
    );

    const renderFiltersUpdate = () => {
        const buttonClass = filtersUpdating ? 'loading' : 'loaded';
        return (
            <FiltersUpdate
                handler={updateFiltersHandler}
                rulesCount={rulesCount}
                buttonClass={buttonClass}
                lastUpdateDate={lastUpdateTime}
            />
        );
    };

    const openModalHandler = () => {
        setModalIsOpen(true);
    };

    const closeModalHandler = () => {
        setModalIsOpen(false);
    };

    const renderAddFilterBtn = () => {
        if (selectedGroupId === CUSTOM_FILTERS_GROUP_ID) {
            return (
                <div>
                    <button
                        type="button"
                        onClick={openModalHandler}
                        className="button button--add-custom-filter button--m button--green"
                    >
                        {i18n.translate('options_add_custom_filter')}
                    </button>
                    {modalIsOpen && (
                        <AddCustomModal
                            closeModalHandler={closeModalHandler}
                            modalIsOpen={modalIsOpen}
                        />
                    )}
                </div>
            );
        }
    };

    if (Number.isInteger(selectedGroupId)) {
        const groupFilters = filters.filter((filter) => filter.groupId === selectedGroupId);
        const { groupName } = categories.find((group) => group.groupId === selectedGroupId);
        if (selectedGroupId === CUSTOM_FILTERS_GROUP_ID && groupFilters.length === 0) {
            return (
                <>
                    <div className="title-btn">
                        <button
                            type="button"
                            className="button button--back"
                            onClick={handleReturnToGroups}
                        />
                        <h2 className="title title--back-btn">{groupName}</h2>
                    </div>
                    <EmptyCustom />
                </>
            );
        }
        return (
            <>
                <div className="title-btn">
                    <button
                        type="button"
                        className="button button--back"
                        onClick={handleReturnToGroups}
                    />
                    <h2 className="title title--back-btn">{groupName}</h2>
                </div>
                {renderSearch()}
                <div>
                    {
                        searchInput || searchSelect !== SEARCH_FILTERS.ALL
                            ? renderSearchResult()
                            : filters && renderFilters(groupFilters)
                    }
                </div>
                {renderAddFilterBtn()}
            </>
        );
    }
    return (
        <>
            <div className="title-btn">
                {renderFiltersUpdate()}
                <h2 className="title title--filters-up">{i18n.translate('options_antibanner')}</h2>
            </div>
            {renderSearch()}
            {
                searchInput || searchSelect !== SEARCH_FILTERS.ALL
                    ? renderSearchResult()
                    : categories && renderGroups(categories)
            }
        </>
    );
});

export { Filters };