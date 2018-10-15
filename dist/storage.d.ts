import { IQueue } from './queue';
export interface IJioQueryOptions {
    /**
     * Search with a query.
     * Refer to the jIO documentation in the jIO Query Engine section for details.
     * @see https://jio.nexedi.com/
     */
    query: string;
    /**
     * Limit the results. Leave empty for no limit.
     * @example [10, 20]
     */
    limit?: [number, number];
    /**
     * List of fields to sort on, each specifying the order with ascending/descending.
     * @example [['date', 'ascending'], ['id', 'descending]]
     */
    sort_on?: Array<[string, 'ascending' | 'descending']>;
    /**
     * When provided, the response has a value containing the values of these keys for each document.
     * @example ['id', 'date']
     */
    select_list?: string[];
    /**
     * When true, the response has a doc containing the full metadata for each document.
     */
    include_docs?: boolean;
}
export interface IJioStorage {
    get: (id: string) => IQueue;
    post: (data: any) => IQueue;
    put: (id: string, data: any) => IQueue;
    remove: (id: string) => IQueue;
    getAttachment: (id: string, action: string, options?: any) => IQueue;
    putAttachment: (id: string, name: string, blob: Blob) => IQueue;
    removeAttachment: (id: string) => IQueue;
    allAttachments: (id: string) => IQueue;
    hasCapacity: (name: string) => boolean;
    buildQuery: (options?: IJioQueryOptions) => IQueue;
}
export interface IJioProxyStorage extends IJioStorage {
    allDocs: (options?: IJioQueryOptions) => IQueue;
    repair: () => IQueue;
}
/**
 * Output of `jIO.QueryFactory.create(query)`
 */
export interface IJioSimpleQuery {
    operator?: 'AND' | 'OR';
    key: string;
    value: string;
}
/**
 * Output of `jIO.QueryFactory.create(query)`
 */
export interface IJioComplexQuery {
    operator: 'AND' | 'OR';
    query_list: Array<IJioSimpleQuery | IJioComplexQuery>;
}
