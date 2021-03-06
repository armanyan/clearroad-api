const json = {
    type: 'object',
    definitions: {
        datetime: {
            pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T ?[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{4})?$',
            type: 'string',
            examples: [
                '2018-01-01T00:00:00Z'
            ]
        }
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
    required: [
        'reference',
        'start_date',
        'stop_date',
        'portal_type'
    ],
    properties: {
        reference: {
            type: 'string',
            title: 'Reference',
            description: 'The reference given to the new billing period',
            default: '',
            examples: [
                '2018Q1'
            ]
        },
        start_date: {
            $ref: '#/definitions/datetime',
            title: 'Start Date',
            description: 'The date, starting which, the billing period is going to be active. Should be in UTC.',
            default: ''
        },
        stop_date: {
            $ref: '#/definitions/datetime',
            title: 'Stop Date',
            description: 'The date, starting which, the billing period will become inactive. Should be UTC. If it is left empty, the billing period will never turn inactive, once activated.',
            default: ''
        },
        portal_type: {
            type: 'string',
            title: 'Portal Type',
            description: 'The type of message in the ClearRoad ERP5 instance. Only one type possible',
            default: 'Billing Period Message',
            enum: [
                'Billing Period Message'
            ],
            examples: [
                'Billing Period Message'
            ]
        }
    }
};
export default json;
//# sourceMappingURL=billing-period-message.js.map