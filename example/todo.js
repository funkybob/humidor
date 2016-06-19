/**
 * A minimal template rendering tool
 *
 * {{name}} renders data[name]
 * {?name?}...{?} renders ... IFF data[name] == 'true'
 */
String.prototype.format = function (data) {
    return this.replace(/{{([\w@]+)}}/g, function(match, key) {
        return data[key];
    }).replace(/{\?(\w+)\?}(.*){\?}/g, function(match, key, value) {
        return (data[key] == 'true') ? value : '';
    })
};

document.addEventListener('DOMContentLoaded', function () {
    var store = new DOMStore(),
        tmpl = __.get('template#todo-row').innerHTML;
        input = __.get('input.new-todo'),
        main = __.get('ul.todo-list'),
        footer = __.get('.footer'),
        rowcount = __.get('.todo-count strong');

    FILTER = {'': '', 'active': '[data-completed=false]', 'completed': '[data-completed=true]'}
    function render () {
        var rows = store.query('[type=todo]' + FILTER[filter.value]);
        main.innerHTML = rows.map(function (rec) { return tmpl.format(rec); }).join('');
        rowcount.innerHTML = store.query({'@type': 'todo', 'completed': 'false'}).length;
        footer.classList[(rows.length == 0) ? 'add' : 'remove']('hidden');
    }

    // Make all entries state track 'toggle all' flag
    __.get('.toggle-all').on('change', function (ev) {
        store.query({'@type': 'todo'}).forEach(function (rec) {
            rec.completed = ev.target.checked;
        });
    });
    // Remove all records marked completed
    __.get('.clear-completed').on('click', function (ev) {
        store.query({'@type': 'todo', 'completed': 'true'}).forEach(function (rec) {
            // XXX This is clumsy!
            rec['@el'].parentNode.removeChild(rec['@el'])
        });
    });
    // track routing - controls filtering
    window.addEventListener('hashchange', function () {
        var hash = window.location.hash;
        __.select('.filters a').forEach(function (el) {
            el.classList.remove('selected');
        })
        __.get('.filters a[href="' + hash + '"]').classList.add('selected');
        filter.value = hash.slice(2);
    });

    // catch change of complete status
    main.delegate('change', 'input[type=checkbox]', function (ev) {
        store.get(ev.target.name).completed = ev.target.checked;
    });
    // catch Click on "done" button
    main.delegate('click', 'button.destroy', function (ev) {
        var _id = __.get('input[type=checkbox]', ev.target.parentNode).name;
        store.remove(_id);
    });
    // catch Double Click on todo labels
    main.delegate('dblclick', 'label', function (ev) {
        __.select('li.editing').forEach(function (el) {
            el.classList.remove('editing');
        });
        var le = __(ev.target).parent('li');
        le.classList.add('editing');
        __.get('input.edit', le).focus();
    });
    // catch Enter in edit inputs
    main.on('keyup', function (ev) {
        if(ev.code !== 'Enter') return;
        var val = ev.target.value;
        var _id = __.get('input[type=checkbox]', ev.target.parentNode).name;
        store.get(_id).message = val;
        __(ev.target).parent('li').classList.remove('editing');
    });
    // catch Enter in new todo input
    input.on('keyup', function (ev) {
        if(ev.code !== 'Enter') return;
        var _id = new Date().valueOf().toString();
        store.add(_id, {"@type": "todo", message: input.value, completed: false});
        input.value = '';
    });

    // watch for state changes
    store.subscribe(null, render);

    // Record to watch current filter state.  -- also triggers a render
    var filter = store.add('filter', {'@type': 'filter', value: window.location.hash.slice(2)});

    input.focus();
});
