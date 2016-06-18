String.prototype.format = function (data) {
    return this.replace(/{{([\w@]+)}}/g, function(match, key) {
        return data[key];
    }).replace(/{\?(\w+)\?}(.*){\?}/g, function(match, key, value) {
        return (data[key] == 'true') ? value : '';

    })
};

document.addEventListener('DOMContentLoaded', function () {
    var store = new DOMStore(),
        tmpl = document.querySelector('template#todo-row').innerHTML;
        input = document.querySelector('input.new-todo'),
        main = document.querySelector('ul.todo-list'),
        footer = document.querySelector('.footer'),
        rowcount = document.querySelector('.todo-count strong');

    FILTER = {'': '', 'active': '[data-completed=false]', 'completed': '[data-completed=true]'}
    function render () {
        var rows = store.query('[type=todo]' + FILTER[filter.value]);
        main.innerHTML = rows.map(function (rec) { return tmpl.format(rec); }).join('');
        rowcount.innerHTML = store.query('[type=todo][data-completed=false]').length;
        footer.classList[(rows.length == 0) ? 'add' : 'remove']('hidden');
    }

    // Make all entries state track 'toggle all' flag
    document.querySelector('.toggle-all').addEventListener('change', function (ev) {
        store.query('[type=todo]').forEach(function (rec) {
            rec.completed = ev.target.checked;
        });
    });
    // Remove all records marked completed
    document.querySelector('.clear-completed').addEventListener('click', function (ev) {
        store.query('[type=todo][data-completed=true]').forEach(function (rec) {
            rec['@el'].parentNode.removeChild(rec['@el'])
        });
    });
    // track routing - controls filtering
    window.addEventListener('hashchange', function () {
        var hash = window.location.hash;
        Array.apply(null, document.querySelectorAll('.filters a')).forEach(function (el) {
            el.classList.remove('selected');
        });
        document.querySelector('.filters a[href="' + hash + '"]').classList.add('selected');
        filter.value = hash.slice(2);
    });

    // catch change of complete status
    main.addEventListener('change', function (ev) {
        if(!ev.target.matches('input[type=checkbox]')) return;
        store.get(ev.target.name).completed = ev.target.checked;
    });
    // catch Click on "done" button
    main.addEventListener('click', function (ev) {
        if(!ev.target.matches('button.destroy')) return;
        var _id = ev.target.parentNode.querySelector('input[type=checkbox]').name;
        store.remove(_id);
    });
    // catch Double Click on todo labels
    main.addEventListener('dblclick', function (ev) {
        if(!ev.target.matches('label')) return;
        ev.target.parentNode.parentNode.classList.add('editing');
        ev.target.parentNode.parentNode.querySelector('input.edit').focus();
    });
    // catch Enter in edit inputs
    main.addEventListener('keyup', function (ev) {
        if(ev.code !== 'Enter') return;
        var val = ev.target.value;
        var _id = ev.target.parentNode.querySelector('input[type=checkbox]').name;
        store.get(_id).message = val;
        ev.target.parentNode.classList.remove('editing');
    });
    // catch Enter in new todo input
    input.addEventListener('keyup', function (ev) {
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
