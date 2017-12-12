export default {
    type: 'object',
    properties: {
        numeric: {
            type: 'number',
            readOnly: true
        },
        text: {
            type: 'string'
        },
        sub: {
            type: 'object',
            properties: {
                foo: { type: 'string', readOnly: true },
                bar: { type: 'number', readOnly: true }
            }
        },
        list: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        collection: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    fo: { type: 'string' },
                    ba: { type: 'object', properties: {
                        baba: { type: 'string' }
                    }}
                }
            }
        }
    },
    required: ['text'],
    additionalProperties: false
};
