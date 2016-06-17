
/**
 * Wraps a DOM node to make it behave more like an Object
 */
var RecordProxy = {
    has: function (tgt, key) {
        switch(key) {
        case '@el':
            return true;
        case '@children':
            return tgt.children.length > 0;
        default:
            return (key.charAt(0) === '@') ? tgt.hasAttribute(key.slice(1)) : key in tgt.dataset;
        }
    },
    get: function (tgt, key, rcv) {
        switch(key) {
        case '@el':
            return tgt;
        case '@children':
            return Array.apply(null, tgt.children).map(function (el) { return new Proxy(el, RecordProxy); });
        default:
            return (key.charAt(0) === '@') ? tgt.getAttribute(key.slice(1)) : tgt.dataset[key];
        }
    },
    set: function (tgt, key, value, rcv) {
        switch(key) {
        case '@el':
        case '@children':
            throw 'ReadOnly';
        default:
            if(key.charAt(0) === '@') {
                tgt.setAttribute(key.slice(1), value);
            } else {
                tgt.dataset[key] = value;
            }
        }
    },
    deleteProperty: function (tgt, key) {
        if(key.charAt(0) === '@') {
            throw 'AttributeError';
        } else {
            delete tgt.dataset[key];
        }
    }
};

/**
 * @class
 */
function DOMStore() {
    this.doc = new DocumentFragment();
    // A map of selector: [list of handlers]
    this.register = {null: []};
    this._mo = new MutationObserver(this.handleMutation.bind(this));
    this._mo.observe(this.doc, {
        childList: true,
        attributes: true,
        subtree: true
    });
}

/**
 * Internal callback for mutation
 * @callback
 */
DOMStore.prototype.handleMutation = function (mutations) {
    mutations.forEach(function (m) {
        if(m.target === this.doc) {
            this.register[null].forEach(function (h) {
                h(m, new Proxy(m.target, RecordProxy));
            }, this);
        } else {
            Object.keys(this.register).forEach(function (selector) {
                if(selector === null || !m.target.matches(selector)) return;
                this.register[selector].forEach(function (h) {
                    h(m, new Proxy(m.target, RecordProxy));
                });
            }, this);
        }
    }, this);
};

/**
 * Subscribe to events on records matching the given selector
 * @param {string} selector
 * @param {function} handler
 */
DOMStore.prototype.subscribe = function (selector, handler) {
    if (!(selector in this.register)) {
        this.register[selector] = [];
    }
    this.register[selector].push(handler);
};

/**
 * Unsubscribe
 * @param {string} selector
 * @param {function} handler
 */
DOMStore.prototype.unsubscribe = function (selector, handler) {
    if (!(selector in this.register)) return;
    var idx = this.register[selector].indexOf(handler);
    if(idx != -1) {
        this.register[selector].splice(idx, 1);
    }
};

/**
 * Add/update a record
 * @param {string} _id - Unique identifier for this record
 * @param {Object} data
 * @param {element} [root=this.doc] - The element to add this record to
 * @returns {record}
 */
DOMStore.prototype.add = function(_id, data, root) {
    if(root === undefined) {
        root = this.doc;
    }
    else {
        root = root['@el'] || root;
    }
    var rec = this.doc.getElementById(_id);
    if(rec === null) {
        rec = document.createElement('record');
        rec.setAttribute('id', _id);
    }
    Object.keys(data).forEach(function (k) {
        if(k.charAt(0) === '@') {
            rec.setAttribute(k.slice(1), data[k]);
        } else {
            rec.dataset[k] = data[k];
        }
    });
    root.appendChild(rec);
    return new Proxy(rec, RecordProxy);
};

/**
 * Retrieve a record by ID
 * @param {string} _id
 * @returns {record|undefined}
 */
DOMStore.prototype.get = function (_id) {
    var rec = this.doc.getElementById(_id);
    if(rec !== null) return new Proxy(rec, RecordProxy);
};

/**
 * Remove a record by ID
 * @param {string} _id
 */
DOMStore.prototype.remove = function (_id) {
    var rec = this.doc.getElementById(_id);
    rec.parentNode.removeChild(rec);
};

/**
 * Select records matching a selector
 * @param {string} selector
 * @returns {Array}
 */
DOMStore.prototype.query = function (selector) {
    return Array.apply(null, this.doc.querySelectorAll(selector)).map(function (el) { return new Proxy(el, RecordProxy); });
};