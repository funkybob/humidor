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

QUnit.test('Iterate children', function(assert) {
    var store = new DOMStore();

    var par = store.add('_', {'@type': 'root'});
    for(var i=0; i<10; i++) {
        store.add(i.toString(), {'@type': 'test', val: i}, par);
    }
    assert.ok(par['@children'].length = 10, 'Child count');
    var seq = par['@children'].map(function (el) { return el['val']; });
    assert.deepEqual(seq, ['0','1','2','3','4','5','6','7','8','9'], 'Correct values');
});

QUnit.test('Query', function(assert) {
    var store = new DOMStore();

    for(var i=0; i<100; i++) {
        store.add(i.toString(), {'@type': (i % 2) ? 'odd' : 'even', val: i});
    }
    var result = store.query('[type=odd]');
    assert.equal(result.length, 50, 'Odd count');

    var result = store.query({'@type': 'even'});
    assert.equal(result.length, 50, 'Query builder');
});
