
// Wraps a DOM node to make it behave more like an Object
var RecordProxy = {
    has: function (tgt, key) {
        return (key.charAt(0) === '@') ? tgt.hasAttribute(key.slice(1)) : key in tgt.dataset;
    },
    get: function (tgt, key, rcv) {
        switch(key) {
        case '@el':
            return tgt;
        case '@children':
            return Array.apply(null, tgt.children).map(function (el) { return new Proxy(el, RecordProxy); });
        default:
            return (key.charAt(0) === '@') ? tgt[key.slice(1)] : tgt.dataset[key];
        }
    },
    set: function (tgt, key, value, rcv) {
        if(key.charAt(0) === '@') {
            tgt.setAttribute(key.slice(1), value);
        } else {
            tgt.dataset[key] = value;
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

function DOMStore() {
    this.doc = new DocumentFragment();
    // A map of selector: [list of handlers]
    this.register = {};
    this._mo = new MutationObserver(this.handleMutation);
    this._mo.observe(this.doc, {
        childList: true,
        attributes: true,
        // characterData:
        subtree: true
        // attributeOldValue:
        // characterDataOldValue:
       // attributeFilter: []
    });
}

DOMStore.prototype.handleMutation = function (mutations) {
    mutations.forEach(function (m) {
        Object.keys(this.register).map(m.target.matches).forEach(function(k) {
            this.register[k].forEach(function (h) { h(m, new Proxy(m.target, RecordProxy)); });
        }, this);
    }, this);
};

// Allows monitoring of changes on records matching specific selectors.
DOMStore.prototype.subscribe = function (selector, handler) {
    if (!(selector in this.register)) {
        this.register[selector] = [];
    }
    this.register[selector].push(handler);
};

DOMStore.prototype.unsubscribe = function (selector, handler) {
    if (!(selector in this.register)) return;
    var idx = this.register[selector].indexOf(handler);
    if(idx != -1) {
        this.register[selector].splice(idx, 1);
    }
};

DOMStore.prototype.add = function(_id, record, root) {
    if(root === undefined) { root = this.doc; }
    var rec = root.getElementById(_id);
    if(rec === undefined) { rec = document.createElement('record'); }
    Object.keys(record).forEach(function (k) {
        if(k.charAt(0) === '@') {
            record.setAttribute(k.slice(1), record[k]);
        } else {
            record.dataset[k] = record[k];
        }
    });
    root.appendChild(rec);
};

DOMStore.prototype.get = function (_id) {
    var rec = this.doc.getElementById(_id);
    if(rec === undefined) return;
    return new Proxy(rec, RecordProxy);
};

DOMStore.prototype.query = function (selector) {
    return Array.apply(null, this.doc.querySelectAll(selector)).map(function (el) { return new Proxy(el, RecordProxy); });
};
