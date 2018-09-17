import { expect } from 'chai';
import * as sinon from 'sinon';
import 'mocha';

const jIO = require('@nexedi/jio');

import { ClearRoad } from './';

const url = '//fake-url';

let stubs: sinon.SinonStub[] = [];

class FakeJio {
  put() {}
  allDocs() {}
  repair() {}
  getAttachment() {}
  allAttachments() {}
}

describe('ClearRoad', () => {
  beforeEach(() => {
    stubs = [];
    stubs.push(sinon.stub(jIO, 'createJIO').returns(new FakeJio()));
  });

  afterEach(() => {
    stubs.forEach(stub => stub.restore());
  });

  describe('constructor', () => {
    it('should init a messages storage', () => {
      const cr = new ClearRoad(url, null, {});
      expect((cr as any).messagesStorage != undefined).to.equal(true);
    });

    it('should init a ingestionReport storage', () => {
      const cr = new ClearRoad(url, null, {});
      expect((cr as any).ingestionReportStorage != undefined).to.equal(true);
    });

    it('should init a directory storage', () => {
      const cr = new ClearRoad(url, null, {});
      expect((cr as any).directoryStorage != undefined).to.equal(true);
    });

    it('should init a report storage', () => {
      const cr = new ClearRoad(url, null, {});
      expect((cr as any).reportStorage != undefined).to.equal(true);
    });

    it('should defaul to local storage', () => {
      const cr = new ClearRoad(url, null, {
        localStorage: {}
      });
      expect((cr as any).useLocalStorage).to.equal(true);
    });
  });

  describe('.post', () => {
    let cr;
    let portalType;
    let putStub: sinon.SinonStub;

    beforeEach(() => {
      cr = new ClearRoad(url, null, {});
      putStub = sinon.stub((cr as any).messagesStorage, 'put').callsFake((_id, data) => data);
      stubs.push(putStub);
    });

    describe('Road Account Message', () => {
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
        expect(data.parent_relative_url).to.equal('road_account_message_module');
        expect(putStub.called).to.equal(true);
      });
    });

    describe('Road Event Message', () => {
      beforeEach(() => {
        portalType = 'Road Event Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          request: {
            vehicle_reference: '1GTG6BE38F1262119',
            obu_reference: '977298026d50a5b1795c6563',
            event_details: [{
              type: 12,
              date: '2018-01-04T00:00:00Z'
            }, {
              type: 5,
              date: '2018-01-03T00:00:00Z'
            }]
          }
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).to.equal('road_event_message_module');
        expect(putStub.called).to.equal(true);
      });
    });

    describe('Road Message', () => {
      beforeEach(() => {
        portalType = 'Road Message';
      });

      it('should put a message', async () => {
        const options = {
          portal_type: portalType,
          request: {
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
          }
        };
        const data = await cr.post(options);
        expect(data.parent_relative_url).to.equal('road_message_module');
        expect(putStub.called).to.equal(true);
      });
    });

    describe('Billing Period Message', () => {
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
        expect(data.parent_relative_url).to.equal('billing_period_message_module');
        expect(putStub.called).to.equal(true);
      });
    });

    describe('Road Report Request', () => {
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
        expect(data.parent_relative_url).to.equal('road_report_request_module');
        expect(putStub.called).to.equal(true);
      });
    });
  });

  describe('.sync', () => {
    let cr;
    let repairStub: sinon.SinonStub;

    beforeEach(() => {
      cr = new ClearRoad(url, null, {});
      repairStub = sinon.stub((cr as any).messagesStorage, 'repair').returns({
        push: callback => callback()
      });
      stubs.push(repairStub);
    });

    it('should repair all storages', async () => {
      await cr.sync();
      expect(repairStub.callCount).to.equal(4);
    });

    describe('progress', () => {
      it('should call progress for all storages', async () => {
        const progressStub = sinon.stub();
        await cr.sync(progressStub);
        expect(progressStub.callCount).to.equal(4);
      });
    });
  });

  describe('.allDocs', () => {
    let cr;
    let queryStub: sinon.SinonStub;

    beforeEach(() => {
      cr = new ClearRoad(url, null, {});
      queryStub = sinon.stub((cr as any).messagesStorage, 'allDocs').callsFake(options => options);
      stubs.push(queryStub);
    });

    it('should query the messages', async () => {
      await cr.allDocs({});
      expect(queryStub.called).to.equal(true);
    });
  });

  describe('.getReport', () => {
    let cr;
    let getAttachmentStub: sinon.SinonStub;
    let allAttachmentsStub: sinon.SinonStub;
    const id = 'reportId';

    beforeEach(() => {
      cr = new ClearRoad(url, null, {});
      getAttachmentStub = sinon.stub((cr as any).reportStorage, 'getAttachment').callsFake(options => options);
      stubs.push(getAttachmentStub);
      allAttachmentsStub = sinon.stub((cr as any).reportStorage, 'allAttachments').callsFake(options => options);
      stubs.push(allAttachmentsStub);
    });

    describe('not using local storage', () => {
      beforeEach(() => {
        cr.useLocalStorage = false;
      });

      it('should get the report', async () => {
        await cr.getReport(id);
        expect(allAttachmentsStub.called).to.equal(true);
      });
    });

    describe('using local storage', () => {
      beforeEach(() => {
        cr.useLocalStorage = true;
      });

      it('should get the report', async () => {
        await cr.getReport(id);
        expect(getAttachmentStub.called).to.equal(true);
      });
    });
  });

  describe('.getReportFromRequest', () => {
    let cr;
    let getReportStub: sinon.SinonStub;
    const id = 'reportId';
    const result: any = {
      data: {}
    };

    beforeEach(() => {
      cr = new ClearRoad(url, null, {});
      stubs.push(sinon.stub(cr, 'allDocs').returns({
        push: (callback) => callback(result)
      }));
      getReportStub = sinon.stub(cr, 'getReport').returns({});
      stubs.push(getReportStub);
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
        expect(getReportStub.called).to.equal(true);
      });
    });

    describe('when the report does not exist', () => {
      beforeEach(() => {
        result.data.rows = [];
      });

      it('should get the report', async () => {
        await cr.getReportFromRequest(id);
        expect(getReportStub.called).to.equal(false);
      });
    });
  });
});
