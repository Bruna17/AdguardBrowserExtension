/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useTable } from 'react-table';
import { rootStore } from '../../stores/RootStore';

import './filtering-events.pcss';

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const handleEventClick = (row) => (e) => {
        e.preventDefault();
        logStore.setSelectedEventById(row.eventId);
    };

    // FIXME display element escaped, waits when css hits counter would be fixed
    const columns = useMemo(() => [
        {
            Header: 'URL',
            accessor: (props) => {
                const {
                    requestUrl,
                    cookieName,
                    cookieValue,
                    element,
                } = props;

                if (cookieName) {
                    return `${cookieName} = ${cookieValue}`;
                }

                if (element) {
                    return element;
                }

                return requestUrl;
            },
        },
        {
            Header: 'Type',
            accessor: (props) => {
                const { requestType, requestThirdParty } = props;

                if (requestThirdParty) {
                    // TODO waits for design
                    return (
                        <>
                            {requestType}
                            <small>Third party</small>
                        </>
                    );
                }

                return requestType;
            },
        },
        {
            Header: 'Filtering  rule',
            accessor: 'ruleText',
        },
        {
            Header: 'Filter',
            accessor: 'filterName',
        },
        {
            Header: 'Source',
            accessor: 'frameDomain',
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: logStore.events });

    const getRowProps = (row) => {
        const event = row.original;

        let className = null;

        if (event.replaceRules) {
            className = 'yellow';
        }

        if (event.requestRule && !event.replaceRules) {
            if (event.requestRule.whitelistRule) {
                className = 'green';
            // eslint-disable-next-line max-len
            } else if (event.requestRule.cssRule || event.requestRule.scriptRule || event.removeParam) {
                className = 'yellow';
            } else if (event.requestRule.cookieRule) {
                if (event.requestRule.isModifyingCookieRule) {
                    className = 'yellow';
                } else {
                    className = 'red';
                }
            } else {
                className = 'red';
            }
        }

        return ({
            className,
        });
    };

    return (
        <table {...getTableProps()} className="filtering-log">
            <thead>
                {
                    headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {
                                headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps()}>
                                        {
                                            column.render('Header')
                                        }
                                    </th>
                                ))
                            }
                        </tr>
                    ))
                }
            </thead>
            <tbody {...getTableBodyProps()}>
                {
                    rows.map((row) => {
                        prepareRow(row);
                        return (
                            <tr
                                {...row.getRowProps(getRowProps(row))}
                                onClick={handleEventClick(row.original)}
                            >
                                {
                                    row.cells.map((cell) => {
                                        return (
                                            <td {...cell.getCellProps()}>
                                                {
                                                    cell.render('Cell')
                                                }
                                            </td>
                                        );
                                    })
                                }
                            </tr>
                        );
                    })
                }
            </tbody>
        </table>
    );
});

export { FilteringEvents };