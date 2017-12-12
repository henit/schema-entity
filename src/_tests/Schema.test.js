import test from 'ava';
import Schema from '../Schema';
import schema from './TestSchema';

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.text;
    const actual = Schema.getPathSchema(schema, 'text');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.sub;
    const actual = Schema.getPathSchema(schema, 'sub');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.sub.properties.foo;
    const actual = Schema.getPathSchema(schema, 'sub.foo');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.list;
    const actual = Schema.getPathSchema(schema, 'list');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.collection;
    const actual = Schema.getPathSchema(schema, 'collection');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.collection.items.properties.fo;
    const actual = Schema.getPathSchema(schema, 'collection.0.fo');
    t.deepEqual(actual, expected);
});

test('.getPathSchema return the correct schema', t => {
    const expected = schema.properties.collection.items.properties.ba.properties.baba;
    const actual = Schema.getPathSchema(schema, 'collection.2.ba.baba');
    t.deepEqual(actual, expected);
});
