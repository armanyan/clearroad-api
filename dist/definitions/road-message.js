const json = {
    type: 'object',
    definitions: {
        datetime: {
            pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T ?[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{4})?$',
            type: 'string',
            examples: [
                '2017-01-02T14:21:20Z'
            ]
        }
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
    required: [
        'request',
        'portal_type'
    ],
    properties: {
        request: {
            type: 'object',
            required: [
                'description',
                'vehicle_reference',
                'obu_reference',
                'type',
                'transaction_date',
                'mileage_details'
            ],
            properties: {
                description: {
                    type: 'string',
                    title: 'Description',
                    description: 'The description of the reported mileage',
                    default: '',
                    examples: [
                        'Mileage data'
                    ]
                },
                vehicle_reference: {
                    title: 'Vehicle Reference',
                    description: 'The Vehicle Identification Number of the vehicle for which the message is reported.',
                    type: 'string',
                    pattern: '^[0-9A-Z]{17}$',
                    default: '',
                    examples: [
                        '1GTG6BE38F1262119'
                    ]
                },
                obu_reference: {
                    type: 'string',
                    title: 'The On Board Unit Reference',
                    description: 'The On Board Unit reference of the device for which the message is reported',
                    default: '',
                    pattern: '^[0-9a-z]{24}$',
                    examples: [
                        '977298026d50a5b1795c6563'
                    ]
                },
                type: {
                    type: 'string',
                    description: 'The type of mileage : reported, adjustement... ',
                    default: '',
                    examples: [
                        'MRP'
                    ]
                },
                transaction_date: {
                    $ref: '#/definitions/datetime',
                    title: 'Transaction Date',
                    description: 'The date at which miles were traveled. Should be in UTC.',
                    default: ''
                },
                mileage_details: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [],
                        properties: {
                            fuel_price: {
                                type: 'number',
                                title: 'Fuel Price',
                                description: 'The price of the fuel consumed during the trip',
                                default: 0,
                                examples: [
                                    -0.30000001192092896
                                ]
                            },
                            fuel_quantity: {
                                type: 'number',
                                title: 'Fuel Quantity',
                                description: 'The quantity of fuel consumed during the trip',
                                default: 0,
                                examples: [
                                    0.14000000059604645
                                ]
                            },
                            miles_price: {
                                type: 'number',
                                title: 'Miles Price',
                                description: 'The price of the fuel per mile consumed during the trip.',
                                default: 0,
                                examples: [
                                    0.014999999664723873
                                ]
                            },
                            miles_quantity: {
                                type: 'number',
                                title: 'Miles Quantity',
                                description: 'The number of miles traveled during the trip',
                                default: 0,
                                examples: [
                                    3.700000047683716
                                ]
                            },
                            rule_id: {
                                type: 'integer',
                                title: 'Rule ID',
                                description: 'The Rule ID of the state where the trip is made. Each state has its own rule ID.',
                                default: 0,
                                examples: [
                                    41
                                ]
                            },
                            sub_rule_id: {
                                type: 'integer',
                                title: 'Sub Rule ID',
                                description: '0 if the travel was on public roads, 1 if it was on private roads',
                                default: 0,
                                examples: [
                                    1
                                ]
                            }
                        }
                    }
                }
            }
        },
        portal_type: {
            type: 'string',
            title: 'Portal Type',
            description: 'The type of message in the ClearRoad Platform. Only one type possible',
            default: 'Road Message',
            enum: [
                'Road Message'
            ],
            examples: [
                'Road Message'
            ]
        }
    }
};
export default json;
//# sourceMappingURL=road-message.js.map