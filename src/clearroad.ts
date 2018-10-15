import RSVP from 'rsvp';
import Rusha from 'rusha';
const jIO = require('../node/lib/jio.js').jIO;

import { portalType } from './message-types';
import { validateDefinition } from './definitions/index';
import { IQueue } from './queue';
import { IJioProxyStorage, IJioQueryOptions } from './storage';

const queryPortalType = 'portal_type';

enum PortalTypes {
  BillingPeriodMessage = 'Billing Period Message',
  File = 'File',
  RoadAccount = 'Road Account',
  RoadAccountMessage = 'Road Account Message',
  RoadEvent = 'Road Event',
  RoadEventMessage = 'Road Event Message',
  RoadMessage = 'Road Message',
  RoadReportRequest = 'Road Report Request',
  RoadTransaction = 'Road Transaction'
}

const queryPortalTypes = [
  `"${PortalTypes.BillingPeriodMessage}"`,
  `"${PortalTypes.RoadAccountMessage}"`,
  `"${PortalTypes.RoadEventMessage}"`,
  `"${PortalTypes.RoadMessage}" `,
  `"${PortalTypes.RoadReportRequest}"`
].join(' OR ');

enum ValidationStates {
  Processed = 'processed',
  Rejected = 'rejected'
  // TODO: submitted does not work yet
  // Submitted = 'submitted'
}

const queryValidationStates = Object.keys(ValidationStates)
  .map(key => ValidationStates[key]).map(val => `"${val}"`).join(' OR ');

export type storageName = 'messages' | 'ingestion-reports' | 'directories' | 'reports';

export type localStorageType = 'indexeddb' | 'dropbox' | 'gdrive';
export interface IOptions {
  localStorage?: {
    type: localStorageType|string;
    accessToken?: string;
  };
  maxDate?: Date|number|string;
}

export interface IAttachmentOptions {
  format: 'text' | 'json' | 'blob' | 'data_url' | 'array_buffer';
}

export type syncProgressCallback = (type: storageName) => void;

export interface IPostData {
  portal_type: portalType;
}
export interface IPostRoadAccountMessage extends IPostData {
  portal_type: PortalTypes.RoadAccountMessage;
  account_manager: string;
  data_collector: string;
  condition: string;
  cert_id: string;
  account_reference: string;
  effective_date: string;
  expiration_date: string;
  fuel_consumption: string;
  fuel_taxable: string;
  obu_reference: string;
  vehicle_reference: string;
  product_line: string;
}
export interface IPostBillingPeriodMessage extends IPostData {
  portal_type: PortalTypes.BillingPeriodMessage;
  reference: string;
  start_date: string;
  stop_date: string;
}
export interface IPostRoadReportRequest extends IPostData {
  portal_type: PortalTypes.RoadReportRequest;
  report_type: string;
  billing_period_reference: string;
  request_date: string;
  request: string;
}
export interface IPostRoadEventMessage extends IPostData {
  portal_type: PortalTypes.RoadEventMessage;
  request: string;
}
export interface IPostRoadMessage extends IPostData {
  portal_type: PortalTypes.RoadMessage;
  request: string;
}
export type postData = IPostRoadAccountMessage | IPostBillingPeriodMessage | IPostRoadReportRequest |
  IPostRoadEventMessage | IPostRoadMessage;

const database = 'clearroad';

const jsonIdRec = (keyValueSpace: string, key: string | number, value: any, deep = 0) => {
  let res;
  if (value && typeof value.toJSON === 'function') {
    value = value.toJSON();
  }

  if (Array.isArray(value)) {
    res = [];
    for (let i = 0; i < value.length; i += 1) {
      res[res.length] = jsonIdRec(keyValueSpace, i, value[i], deep + 1);
      if (res[res.length - 1] === undefined) {
        res[res.length - 1] = 'null';
      }
    }
    if (res.length === 0) {
      return '[]';
    }
    return `[${res.join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    res = Object.keys(value);
    res.sort();
    for (let i = 0, l = res.length; i < l; i += 1) {
      key = res[i];
      res[i] = jsonIdRec(keyValueSpace, key, value[key], deep + 1);
      if (res[i] !== undefined) {
        res[i] = `${JSON.stringify(key)}: ${keyValueSpace}${res[i]}`;
      }
      else {
        res.splice(i, 1);
        l -= 1;
        i -= 1;
      }
    }
    if (res.length === 0) {
      return '{}';
    }
    return `{${res.join(', ')}`;
  }
  return JSON.stringify(value);
};

const jsonId = (value: any) => {
  return jsonIdRec('', '', value);
};

const merge = (obj1, obj2) => {
  const obj3 = {};
  for (const attrname in obj1) {
    if (obj1.hasOwnProperty(attrname)) {
      obj3[attrname] = obj1[attrname];
    }
  }
  for (const attrname in obj2) {
    if (obj2.hasOwnProperty(attrname)) {
      obj3[attrname] = obj2[attrname];
    }
  }
  return obj3;
};

const joinQueries = (queries: string[], joinType = 'AND') => queries.filter(query => !!query).join(` ${joinType} `);

export class ClearRoad {
  private messagesStorage: IJioProxyStorage;
  private ingestionReportStorage: IJioProxyStorage;
  private directoryStorage: IJioProxyStorage;
  private reportStorage: IJioProxyStorage;
  private useLocalStorage = false;

  /**
   * Instantiate a ClearRoad api instance.
   * @param url ClearRoad API url
   * @param accessToken ClearRoad API access token (required when using Node)
   * @param options Override default options
   */
  constructor(
    private url: string,
    private accessToken?: string,
    private options: IOptions = {}
  ) {
    if (!options.localStorage || !options.localStorage.type) {
      options.localStorage = {
        type: 'indexeddb'
      };
    }

    if (options.localStorage.type === 'dropbox' || options.localStorage.type === 'gdrive') {
      options.localStorage = {
        type: 'drivetojiomapping',
        sub_storage: {
          type: options.localStorage.type,
          access_token: options.localStorage.accessToken
        }
      } as any;
    }
    else {
      this.useLocalStorage = true;
    }

    this.initMessagesStorage();
    this.initIngestionReportStorage();
    this.initDirectoryStorage();
    this.initReportStorage();
  }

  /**
   * @internal
   */
  private queryMaxDate() {
    // only retrieve the data since xxx
    if (this.options.maxDate) {
      const from = new Date(this.options.maxDate);
      return `modification_date: >= "${from.toJSON()}"`;
    }
    return '';
  }

  /**
   * @internal
   */
  private signatureSubStorage(db: string) {
    switch (this.options.localStorage!.type) {
      case 'dropbox':
      case 'gdrive':
        return {
          type: 'query',
          sub_storage: {
            type: 'memory'
          }
        };
      case 'indexeddb':
        return {
          type: 'query',
          sub_storage: {
            type: 'indexeddb',
            database: db
          }
        };
      default:
        return merge(this.options.localStorage!, {
          database: db
        });
    }
  }

  /**
   * @internal
   */
  private localSubStorage(key: string) {
    switch (this.options.localStorage!.type) {
      case 'dropbox':
      case 'gdrive':
        return {
          type: 'mapping',
          sub_storage: {
            type: 'query',
            sub_storage: this.options.localStorage!
          },
          mapping_dict: {
            portal_type: ['equalSubProperty', key]
          }
        };
      case 'indexeddb':
        return {
          type: 'query',
          sub_storage: {
            type: 'indexeddb',
            database
          }
        };
      default:
        return merge({}, this.options.localStorage!);
    }
  }

  /**
   * @internal
   */
  private initMessagesStorage() {
    const refKey = 'source_reference';
    const query = joinQueries([
      `${queryPortalType}:(${queryPortalTypes})`,
      'grouping_reference:"data"',
      this.queryMaxDate()
    ]);
    const signatureStorage = this.signatureSubStorage(`${database}-messages-signatures`);
    const localStorage = this.localSubStorage(refKey);

    this.messagesStorage = jIO.createJIO({
      type: 'replicate',
      parallel_operation_amount: 1,
      use_remote_post: false,
      conflict_handling: 1,
      signature_hash_key: refKey,
      signature_sub_storage: signatureStorage,
      query: {
        query,
        sort_on: [['modification_date', 'descending']],
        limit: [0, 1234567890]
      },
      check_local_modification: false, // we only create new message
      check_local_creation: true,
      check_local_deletion: false, // once created, message are not deleted
      check_remote_modification: false, // ERP5 does not modify the message
      check_remote_creation: true, // we want message back in case we delete our local db
      check_remote_deletion: false, // ERP5 does not delete message
      local_sub_storage: localStorage,
      remote_sub_storage: {
        type: 'mapping',
        id: ['equalSubProperty', refKey],
        sub_storage: {
          type: 'erp5',
          url: this.url,
          default_view_reference: 'jio_view',
          access_token: this.accessToken
        }
      }
    });
  }

  /**
   * @internal
   */
  private initIngestionReportStorage() {
    const refKey = 'destination_reference';
    const query = joinQueries([
      `${queryPortalType}:(${queryPortalTypes})`,
      `validation_state:(${queryValidationStates})`,
      this.queryMaxDate()
    ]);
    const signatureStorage = this.signatureSubStorage(`${database}-ingestion-signatures`);
    const localStorage = this.localSubStorage(refKey);

    this.ingestionReportStorage = jIO.createJIO({
      type: 'replicate',
      parallel_operation_amount: 1,
      use_remote_post: false,
      conflict_handling: 1,
      signature_hash_key: refKey,
      signature_sub_storage: signatureStorage,
      query: {
        query,
        sort_on: [['modification_date', 'descending']],
        limit: [0, 1234567890]
      },
      check_local_modification: false, // local modification will always be erased
      check_local_creation: false,
      check_local_deletion: false,
      check_remote_modification: false, // there is no modification, only creation of report
      check_remote_creation: true,
      check_remote_deletion: false,
      local_sub_storage: localStorage,
      remote_sub_storage: {
        type: 'mapping',
        id: ['equalSubProperty', refKey],
        sub_storage: {
          type: 'erp5',
          url: this.url,
          default_view_reference: 'jio_ingestion_report_view',
          access_token: this.accessToken
        }
      }
    });
  }

  /**
   * @internal
   */
  private initDirectoryStorage() {
    const refKey = 'source_reference';
    const query = joinQueries([`${queryPortalType}:(` + [
      `"${PortalTypes.RoadAccount}"`,
      `"${PortalTypes.RoadEvent}"`,
      `"${PortalTypes.RoadTransaction}"`
    ].join('OR') + ')', this.queryMaxDate()]);
    const signatureStorage = this.signatureSubStorage(`${database}-directory-signatures`);
    const localStorage = this.localSubStorage(refKey);

    this.directoryStorage = jIO.createJIO({
      type: 'replicate',
      parallel_operation_amount: 1,
      use_remote_post: false,
      conflict_handling: 1,
      signature_hash_key: refKey,
      signature_sub_storage: signatureStorage,
      query: {
        query,
        sort_on: [['modification_date', 'descending']],
        limit: [0, 200]
      },
      check_local_modification: false, // local modification will always be erased
      check_local_creation: false,
      check_local_deletion: false,
      check_remote_modification: false,
      check_remote_creation: true,
      check_remote_deletion: false,
      local_sub_storage: localStorage,
      remote_sub_storage: {
        type: 'mapping',
        id: ['equalSubProperty', refKey],
        sub_storage: {
          type: 'erp5',
          url: this.url,
          default_view_reference: 'jio_directory_view',
          access_token: this.accessToken
        }
      }
    });
  }

  /**
   * @internal
   */
  private initReportStorage() {
    const refKey = 'reference';
    const query = joinQueries([
      `${queryPortalType}:("${PortalTypes.File}")`,
      this.queryMaxDate()
    ]);
    const signatureStorage = this.signatureSubStorage(`${database}-files-signatures`);
    const localStorage = this.localSubStorage(refKey);

    const mappingStorageWithEnclosure = {
      type: 'mapping',
      sub_storage: {
        type: 'query',
        sub_storage: this.options.localStorage
      },
      attachment_list: ['data'],
      attachment: {
        data: {
          get: {uri_template: 'enclosure'},
          put: {uri_template: 'enclosure'}
        }
      }
    };

    this.reportStorage = jIO.createJIO({
      type: 'replicate',
      parallel_operation_amount: 1,
      use_remote_post: false,
      conflict_handling: 1,
      signature_hash_key: 'source_reference',
      signature_sub_storage: this.useLocalStorage ? signatureStorage : merge(mappingStorageWithEnclosure, {
        mapping_dict: {
          portal_type: ['equalSubProperty', 'source_reference']
        }
      }),
      query: {
        query,
        sort_on: [['modification_date', 'descending']],
        limit: [0, 1234567890]
      },
      check_local_modification: false, // local modification will always be erased
      check_local_creation: false,
      check_local_deletion: false,
      check_remote_modification: false,
      check_remote_creation: true,
      check_remote_deletion: false,
      check_remote_attachment_creation: true,
      check_remote_attachment_modification: false,
      check_remote_attachment_deletion: true,
      check_local_attachment_creation: false,
      check_local_attachment_modification: false,
      check_local_attachment_deletion: false,
      local_sub_storage: this.useLocalStorage ? localStorage : merge(mappingStorageWithEnclosure, {
        mapping_dict: {
          portal_type: ['equalSubProperty', refKey]
        }
      }),
      remote_sub_storage: {
        type: 'mapping',
        id: ['equalSubProperty', refKey],
        attachment_list: ['data'],
        attachment: {
          data: {
            get: {
              uri_template: `${this.url}/{+id}/Base_downloadWithCors`
            },
            put: {
              erp5_put_template: `${this.url}/{+id}/Base_edit`
            }
          }
        },
        sub_storage: {
          type: 'erp5',
          url: this.url,
          default_view_reference: 'jio_report_view',
          access_token: this.accessToken
        }
      }
    });
  }

  /**
   * Post a message to the ClearRoad API.
   * If not currently connected, messages will be put in the local storage and sent later when using `.sync()`
   * @param data The message
   */
  post(data: postData): IQueue {
    validateDefinition(data.portal_type, data);

    const options: any = merge({}, data);

    switch (data.portal_type) {
      case PortalTypes.RoadAccountMessage:
        options.parent_relative_url = 'road_account_message_module';
        break;
      case PortalTypes.RoadEventMessage:
        options.parent_relative_url = 'road_event_message_module';
        break;
      case PortalTypes.RoadMessage:
        options.parent_relative_url = 'road_message_module';
        break;
      case PortalTypes.BillingPeriodMessage:
        options.parent_relative_url = 'billing_period_message_module';
        break;
      case PortalTypes.RoadReportRequest:
        options.parent_relative_url = 'road_report_request_module';
        break;
    }

    options.grouping_reference = 'data';
    const dataAsString = jsonId(options);
    const rusha = new Rusha();
    const reference = rusha.digestFromString(dataAsString);
    options.source_reference = reference;
    options.destination_reference = reference;

    const queue = new (RSVP as any).Queue() as IQueue;
    return queue.push(() => {
      return this.messagesStorage.put(options.source_reference, options);
    });
  }

  /**
   * Synchronize local data and API data:
   *  - send local data to API if not present yet
   *  - retrieve API data in your local storage
   * @param progress Function to get notified of progress. There are 4 storages to sync.
   */
  sync(progress: syncProgressCallback = () => {}): IQueue {
    const queue = new (RSVP as any).Queue() as IQueue;
    return queue
      .push(() => {
        return this.messagesStorage.repair().push(() => progress('messages'));
      })
      .push(() => {
        return this.ingestionReportStorage.repair().push(() => progress('ingestion-reports'));
      })
      .push(() => {
        return this.directoryStorage.repair().push(() => progress('directories'));
      })
      .push(() => {
        return this.reportStorage.repair().push(() => progress('reports'));
      });
  }

  /**
   * Query for documents in the local storage. Make sure `.sync()` is called before.
   * @param options Query options. If none set, return all documents.
   */
  allDocs(options?: IJioQueryOptions): IQueue {
    return this.messagesStorage.allDocs(options);
  }

  /**
   * Get a report using the Report Request reference
   * @param sourceReference The reference of the Report Request
   */
  getReportFromRequest(sourceReference: string) {
    return this.allDocs({
      query: `${queryPortalType}:"${PortalTypes.File}"`,
      select_list: ['source_reference', 'reference']
    }).push(result => {
      const report = result.data.rows.find(row => row.value.source_reference === sourceReference);
      if (report) {
        return this.getReport(report.value.reference);
      }
      return {};
    });
  }

  /**
   * Get a report using the reference.
   * If you do not have the Report reference, use `getReportFromRequest` with the Report Request reference instead.
   * @param reference The reference of the Report
   */
  getReport(reference: string): IQueue {
    if (this.useLocalStorage) {
      return this.reportStorage.getAttachment(reference, 'data');
    }

    return this.reportStorage.allAttachments(reference);
  }
}
