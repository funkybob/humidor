/**
 * A minimal template rendering tool
 *
 * {{name}} renders data[name]
 * {?name?}...{?} renders ... IFF data[name] == 'true'
 */
String.prototype.format = function (data) {
    return this.replace(/{{([\w@]+)}}/g, function(match, key) {
        return data[key];
    }).replace(/{\?(\w+)\?}(.*?){\?}/g, function(match, key, value) {
        return (data[key] == 'true') ? value : '';
    });
};

__.onstart(function () {
    var store = new DOMStore();
    var filter,
        tmpl = __.get('template#todo-row').innerHTML,
        input = __.get('input.new-todo'),
        todoList = __.get('ul.todo-list'),
        main = __.get('.main'),
        footer = __.get('.footer'),
        rowcount = __.get('.todo-count strong');

    var FILTER = {'': '', 'active': '[data-completed=false]', 'completed': '[data-completed=true]'};
    function render () {
        if(filter === undefined) return;
        var total = store.query({'@type': 'todo'}).length;
        var rows = store.query('[type=todo]' + FILTER[filter.value]);
        todoList.innerHTML = rows.map(function (rec) { return tmpl.format(rec); }).join('');
        rowcount.innerHTML = store.query({'@type': 'todo', 'completed': 'false'}).length;
        footer.classList[(total === 0) ? 'add' : 'remove']('hidden');
        main.classList[(total === 0) ? 'add' : 'remove']('hidden');
    }

    // Make all entries state track 'toggle all' flag
    __.get('.toggle-all').on('change', function (ev) {
        store.query({'@type': 'todo'}).forEach(function (rec) {
            rec.completed = ev.target.checked;
        });
    });
    // Remove all records marked completed
    __.get('.clear-completed').on('click', function (ev) {
        store.query({'@type': 'todo', 'completed': 'true'}).forEach(store.remove.bind(store));
        __.get('.toggle-all').checked = false;
    });
    // track routing - controls filtering
    window.addEventListener('hashchange', function () {
        var hash = window.location.hash;
        __.select('.filters a').radioClass('selected', '[href="' + hash + '"]');
        filter.value = hash.slice(2);
    });

    // catch change of complete status
    todoList.delegate('change', 'input[type=checkbox]', function (ev) {
        var _id = __(ev.target).parent('li').dataset.id;
        store.get(_id).completed = ev.target.checked;
    });
    // catch Click on "done" button
    todoList.delegate('click', 'button.destroy', function (ev) {
        var _id = __(ev.target).parent('li').dataset.id;
        store.remove(_id);
    });
    // catch Double Click on todo labels
    todoList.delegate('dblclick', 'label', function (ev) {
        store.query({'@type': 'todo'}).forEach(function (rec) {
            rec.editing = 'false';
        });
        var _id = __(ev.target).parent('li').dataset.id;
        store.get(_id).editing = 'true';
    });

    function update_todo(ev) {
        var _id = __(ev.target).parent('li').dataset.id;
        var rec = store.get(_id);
        rec.message = ev.target.value;
        rec.editing = 'false';
    }
    // catch Enter in edit inputs
    todoList.delegate('keyup', '.edit', function (ev) {
        if(ev.code !== 'Enter') return;
        update_todo(ev);
    });
    // also update on blur
    todoList.delegate('focusout', '.edit', update_todo);

    // catch Enter in new todo input
    input.delegate('keyup', '.new-todo', function (ev) {
        if(ev.code !== 'Enter') return;
        var value = input.value.trim();
        if(value) {
            var _id = new Date().valueOf().toString();
            store.add(_id, {"@type": "todo", message: input.value, completed: false});
        }
        input.value = '';
    });

    // watch for state changes
    store.subscribe(null, render);

    // Save state on unload
    window.addEventListener('unload', function () {
        window.localStorage.setItem('todo', JSON.stringify(store.dump()));
    })
    // Record to watch current filter state.  -- also triggers a render
    if(window.localStorage.key('todo') !== undefined) {
        store.load(JSON.parse(window.localStorage.getItem('todo')));
    }
    filter = store.get('filter');
    if(filter === undefined) {
        filter = store.add('filter', {'@type': 'filter', value: window.location.hash.slice(2)});
    }
    input.focus();
});
