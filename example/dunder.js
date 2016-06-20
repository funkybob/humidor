var ElementProxy = {
    get: function (tgt, key, rcv) {
        switch(key) {
        case '..':
            return __(tgt.parentNode);
        case 'parent':
            return function (sel) {
                for(var node = tgt.parentNode; node && !node.matches(sel); node = node.parentNode) {}
                return node;
            }.bind(tgt);
        case 'delegate':
            return function (event, child, handler) {
                tgt.addEventListener(event, function (ev) {
                    if(ev.target.matches(child)) handler.call(tgt, ev, this);
                });
            };
        case 'on':
            return tgt.addEventListener.bind(tgt);
        default:
            var attr = tgt[key];
            return (typeof attr === 'function') ? attr.bind(tgt) : attr;
        }
    },
    set: function (tgt, key, value, rcv) {
        tgt[key] = value;
    }
};
// ElementProxy.prototype = Object.create(Reflect.prototype);

var ElementListProxy = {
    'get': function (tgt, key, value, rcv) {
        switch(key) {
        case 'filter':
            return function (sel) {
                return Array.prototype.filter.call(tgt, function (el) {
                    return el.matches(sel);
                });
            };
        case 'forEach':
            return Array.apply(null, tgt).forEach;
        case 'map':
            return Array.apply(null, tgt).map;
        case 'addClass':
            return function (cls) {
                Array.prototype.forEach.call(tgt, function (el) {
                    el.classList.add(cls);
                });
            };
        case 'removeClass':
            return function (cls) {
                Array.prototype.forEach.call(tgt, function (el) {
                    el.classList.remove(cls);
                });
            };
        case 'toggleClass':
            return function (cls) {
                Array.prototype.forEach.call(tgt, function (el) {
                    el.classList.toggle(cls);
                });
            };
        case 'radioClass':
            return function (cls, sel) {
                Array.prototype.forEach.call(tgt, function (el) {
                    el.classList[el.matches(sel) ? 'add' : 'remove'](cls);
                });
            };
        default:
        console.log(key, value);
            tgt[key] = value;
        }
    }
};
// ElementListProxy.prototype = Object.create(Reflect.prototype);

function __(el) {
    return new Proxy(el, ElementProxy);
}

__.get = function (sel, root) {
    root = root || document;
    var el = root.querySelector(sel);
    return new Proxy(el, ElementProxy);
};

__.select = function (sel, root) {
    root = root || document;
    var els = root.querySelectorAll(sel);
    return new Proxy(els, ElementListProxy);
};

__.onstart = function(handler) {
    document.addEventListener('DOMContentLoaded', handler);
};
