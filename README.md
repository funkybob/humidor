# humiDOR

Document Object Repository - store and query your data records in a Document.

## What is it?

humiDOR provides a way to store flat or hierarchical data for your web
application.

It also allows you to subscribe to changes do specific data as accurately as
you can describe it using CSS selectors.


## How to use.

It all starts with a DOMStore (or more than one, if you like.).

This object contains a DocumentFragment, and will store HTML elements in it containing the data of your records.

It also creates a MutationObserver to generate events any time any of the records are modified.

Your code can register to be notified of any records matching a specific selector, or null for all changes.


# DOMStore methods

subscribe(selector, handler)
unsubscribe(selector, handler)
add(id, data, [root]) -> record
get(id) -> record
remove(id|record)
query(selector|object) -> Array(record)
load(Array(object))
dump() -> Array(object)
