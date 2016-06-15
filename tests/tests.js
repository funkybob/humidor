QUnit.test("Subscribe", function(assert) {
    var store = new DOMStore();

    store.add('1', {'@type': 'test'});
    store.add('2', {'@type': 'other'});
    assert.equal(store.doc.children.length, 2, 'Record count OK');
    var done = assert.async();
    function callback(m, record) {
        assert.ok(record['@id'] == '1', 'Right record');
        done();
    }
    store.subscribe('[type=test]', callback);
    var rec = store.get('1');
    assert.ok(rec['@type'] == 'test', 'Type matches');
    rec.name = 'test';
});
