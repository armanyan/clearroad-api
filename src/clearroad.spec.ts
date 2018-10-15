/* tslint:disable: no-console */
import * as jioImport from '../node/lib/jio.js';
import { ClearRoad } from './clearroad';
import * as definitions from './definitions';

const url = '//fake-url';

class FakeJio {
  put() {}
  allDocs() {}
  repair() {}
  getAttachment() {}
  allAttachments() {}
}

describe('ClearRoad', () => {
  beforeEach(() => {
    spyOn(jioImport.jIO, 'createJIO').and.returnValue(new FakeJio());
  });

  describe('constructor', () => {
    it('should init a messages storage', () => {
      const cr = new ClearRoad(url);
      expect((cr as any).messagesStorage != undefined).toEqual(true);
    });

    it('should init a ingestionReport storage', () => {
      const cr = new ClearRoad(url);
      expect((cr as any).ingestionReportStorage != undefined).toEqual(true);
    });

    it('should init a directory storage', () => {
      const cr = new ClearRoad(url);
      expect((cr as any).directoryStorage != undefined).toEqual(true);
    });

    it('should init a report storage', () => {
      const cr = new ClearRoad(url);
      expect((cr as any).reportStorage != undefined).toEqual(true);
    });

    it('should defaul to local storage', () => {
      const cr = new ClearRoad(url);
      expect((cr as any).useLocalStorage).toEqual(true);
    });
  });

  describe('.queryMaxDate', () => {
    let cr;
    let maxDate: Date;

    beforeEach(() => {
      cr = new ClearRoad(url);
      maxDate = new Date();
    });

    describe('with a maxDate', () => {
      beforeEach(() => {
        cr.options = {maxDate};
      });

      it('should return a subquery', () => {
        expect(cr.queryMaxDate()).toEqual(`modification_date: >= "${maxDate.toJSON()}"`);
      });
    });

    describe('without a maxDate', () => {
      beforeEach(() => {
        cr.options = {};
      });

      it('should return an empty string', () => {
        expect(cr.queryMaxDate()).toEqual('');
      });
    });
  });

  describe('.localSubStorage', () => {
    let cr;
    const reference = 'reference';

    beforeEach(() => {
      cr = new ClearRoad(url);
    });

    describe('using "dropbox"', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'dropbox'
          }
        };
      });

      it('should surround with a query storage', () => {
        expect(cr.localSubStorage(reference)).toEqual({
          type: 'mapping',
          sub_storage: {
            type: 'query',
            sub_storage: {
              type: 'dropbox'
            }
          },
          mapping_dict: {
            portal_type: ['equalSubProperty', reference]
          }
        });
      });
    });

    describe('using "indexeddb"', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'indexeddb'
          }
        };
      });

      it('should surround with a query storage', () => {
        expect(cr.localSubStorage(reference)).toEqual({
          type: 'query',
          sub_storage: {
            type: 'indexeddb',
            database: 'clearroad'
          }
        });
      });
    });

    describe('using any other storage', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'storage'
          }
        };
      });

      it('should return the config', () => {
        expect(cr.localSubStorage(reference)).toEqual({
          type: 'storage'
        });
      });
    });
  });

  describe('.signatureSubStorage', () => {
    let cr;
    const database = 'database';

    beforeEach(() => {
      cr = new ClearRoad(url);
    });

    describe('using "dropbox"', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'dropbox'
          }
        };
      });

      it('should surround with a query storage', () => {
        expect(cr.signatureSubStorage(database)).toEqual({
          type: 'query',
          sub_storage: {
            type: 'memory'
          }
        });
      });
    });

    describe('using "indexeddb"', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'indexeddb'
          }
        };
      });

      it('should surround with a query storage', () => {
        expect(cr.signatureSubStorage(database)).toEqual({
          type: 'query',
          sub_storage: {
            type: 'indexeddb',
            database
          }
        });
      });
    });

    describe('using any other storage', () => {
      beforeEach(() => {
        cr.options = {
          localStorage: {
            type: 'storage'
          }
        };
      });

      it('should set the database', () => {
        expect(cr.signatureSubStorage(database)).toEqual({
          type: 'storage',
          database
        });
      });
    });
  });

  describe('.post', () => {
    let cr;
    let portalType;
    let putSpy: jasmine.Spy;

    beforeEach(() => {
      cr = new ClearRoad(url);
      spyOn(definitions, 'validateDefinition');
      putSpy = spyOn((cr as any).messagesStorage, 'put').and.callFake((_id, data) => data);
    });

    it('should validate message', async () => {
      await cr.post({});
      expect(definitions.validateDefinition).toHaveBeenCalled();
    });

    describe('road account', () => {
      beforeEach(() => {
        portalType = 'Road Account Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          account_manager: 'testamref',
          data_collector: 'testmpref',
          condition: 'test-stc-1',
          cert_id: '1051',
          account_reference: 'USER000011',
          effective_date: '2017-01-02T14:21:20Z',
          fuel_consumption: '12.0',
          fuel_taxable: '1',
          obu_reference: '123456789MRDID',
          vehicle_reference: '2C1MR2295T6789740',
          product_line: 'ruc_metrics'
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).toEqual('road_account_message_module');
        expect(putSpy).toHaveBeenCalled();
      });
    });

    describe('road event', () => {
      beforeEach(() => {
        portalType = 'Road Event Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          request: JSON.stringify({
            vehicle_reference: '1GTG6BE38F1262119',
            obu_reference: '977298026d50a5b1795c6563',
            event_details: [{
              type: 12,
              date: '2018-01-04T00:00:00Z'
            }, {
              type: 5,
              date: '2018-01-03T00:00:00Z'
            }]
          })
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).toEqual('road_event_message_module');
        expect(putSpy).toHaveBeenCalled();
      });
    });

    describe('road message', () => {
      beforeEach(() => {
        portalType = 'Road Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          request: JSON.stringify({
            description: 'Mileage data',
            vehicle_reference: '1GTG6BE38F1262119',
            obu_reference: '977298026d50a5b1795c6563',
            type: 'MRP',
            transaction_date: '2018-05-03T00:00:00Z',
            mileage_details: [{
              fuel_price: -0.3,
              fuel_quantity: 0.14,
              miles_price: 0.015,
              miles_quantity: 3.7,
              rule_id: 41,
              sub_rule_id: 1
            }, {
              fuel_quantity: 0.07,
              miles_quantity: 2,
              rule_id: 0,
              sub_rule_id: 1
            }]
          })
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).toEqual('road_message_module');
        expect(putSpy).toHaveBeenCalled();
      });
    });

    describe('billing period', () => {
      beforeEach(() => {
        portalType = 'Billing Period Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          reference: '2018Q1',
          start_date: '2018-01-01T00:00:00Z',
          stop_date: '2018-04-01T00:00:00Z'
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).toEqual('billing_period_message_module');
        expect(putSpy).toHaveBeenCalled();
      });
    });

    describe('road report', () => {
      beforeEach(() => {
        portalType = 'Road Report Request';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          report_type: 'AccountBalance',
          billing_period_reference: '2018Q1',
          request_date: '2018-07-13T00:00:00Z'
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).toEqual('road_report_request_module');
        expect(putSpy).toHaveBeenCalled();
      });
    });
  });

  describe('.sync', () => {
    let cr;
    let repairSpy: jasmine.Spy;

    beforeEach(() => {
      cr = new ClearRoad(url);
      repairSpy = spyOn((cr as any).messagesStorage, 'repair').and.returnValue({
        push: callback => callback()
      });
    });

    it('should repair all storages', async () => {
      await cr.sync();
      expect(repairSpy.calls.count()).toEqual(4);
    });

    describe('progress', () => {
      it('should call progress for all storages', async () => {
        const progressSpy = jasmine.createSpy();
        await cr.sync(progressSpy);
        expect(progressSpy.calls.count()).toEqual(4);
      });
    });
  });

  describe('.allDocs', () => {
    let cr;
    let querySpy: jasmine.Spy;

    beforeEach(() => {
      cr = new ClearRoad(url);
      querySpy = spyOn((cr as any).messagesStorage, 'allDocs').and.callFake(options => options);
    });

    it('should query the messages', async () => {
      await cr.allDocs({});
      expect(querySpy).toHaveBeenCalled();
    });
  });

  describe('.getReport', () => {
    let cr;
    let getAttachmentSpy: jasmine.Spy;
    let allAttachmentsSpy: jasmine.Spy;
    const id = 'reportId';

    beforeEach(() => {
      cr = new ClearRoad(url);
      getAttachmentSpy = spyOn((cr as any).reportStorage, 'getAttachment').and.callFake(options => options);
      allAttachmentsSpy = spyOn((cr as any).reportStorage, 'allAttachments').and.callFake(options => options);
    });

    describe('not using local storage', () => {
      beforeEach(() => {
        cr.useLocalStorage = false;
      });

      it('should get the report', async () => {
        await cr.getReport(id);
        expect(allAttachmentsSpy).toHaveBeenCalledWith(id);
      });
    });

    describe('using local storage', () => {
      beforeEach(() => {
        cr.useLocalStorage = true;
      });

      it('should get the report', async () => {
        await cr.getReport(id);
        expect(getAttachmentSpy).toHaveBeenCalledWith(id, 'data');
      });
    });
  });

  describe('.getReportFromRequest', () => {
    let cr;
    let getReportSpy: jasmine.Spy;
    const id = 'reportId';
    const result: any = {
      data: {}
    };

    beforeEach(() => {
      cr = new ClearRoad(url);
      spyOn(cr, 'allDocs').and.returnValue({
        push: (callback) => callback(result)
      });
      getReportSpy = spyOn(cr, 'getReport').and.returnValue({});
    });

    describe('when the report exists', () => {
      beforeEach(() => {
        result.data.rows = [{
          value: {
            source_reference: id,
            reference: 'reference'
          }
        }];
      });

      it('should get the report', async () => {
        await cr.getReportFromRequest(id);
        expect(getReportSpy).toHaveBeenCalledWith('reference');
      });
    });

    describe('when the report does not exist', () => {
      beforeEach(() => {
        result.data.rows = [];
      });

      it('should get the report', async () => {
        await cr.getReportFromRequest(id);
        expect(getReportSpy).not.toHaveBeenCalled();
      });
    });
  });
});
