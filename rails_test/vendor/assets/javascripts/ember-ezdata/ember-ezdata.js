/*
Copyright (c) 2012 WiredPrairie.us

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function () {



    if (!Ember) {
        throw new Error("I need me some Ember js to function.");
    }

    var _globalDefinitionTable = {};
    var _stores = {};

    var foreignKeyGenerator = function (targetProperty, table, id) {
        return targetProperty + table + id;
    };

    var _globalSettings = {
        DEFAULT_ID_STRING:'Id',
        FOREIGN_KEY_GENERATOR_FUNCTION:foreignKeyGenerator
    };

    var addDefinitionTableEntryFn = function (type, name, defaultValue, serializeFn, deserializeFn) {
        _globalDefinitionTable[type] = {
            type:type,
            name:(name || "").toLowerCase(),
            defaultValue:defaultValue,
            serializeFn:serializeFn,
            deserializeFn:deserializeFn
        };
    };


    var LiveArray = Ember.ArrayController.extend({

    });

    var Store = Ember.Object.extend({
        name:null,
        keys:null,

        getAutoIncId: function(obj) {
            if (!obj) { return; }

            var id = obj.constructor.__autoIncId;
            if (!id) { id = 0; }
            ++id;
            obj.constructor.__autoIncId = id;
            return id;
        },

        add:function (obj) {
            if (!obj) {
                return;
            }
            var id = obj.get("id");
            if (!id) {
                id = this.getAutoIncId(obj);
                if (typeof id === 'undefined') { return; }
            }
            //this.get('data').addObject(obj);
            this.get('_data')[id] = obj;
            this.get('keys').add(id);// = obj;
            return obj;
        },

        remove:function (obj) {
            if (!obj) {
                return;
            }
            var id = obj.get("id");
            if (!id) {
                return;
            }
            var data = this.get('_data');
            delete data[id];
            var keys = this.get('keys');
            keys.remove(id);
            return obj;
        },

        bulkLoad:function(data, type) {
            if (!type) {
                // grab type from the store (if it's there)
                type = this.__type;
            }
            if (!type || !data) { throw new Error("Need data and a type when bulk data loading.");}

            var keys = this.get('keys');
            var allData = this.get('_data');
            var item;
            var counter = 0;
            var len = data.length;
            if (len) {
                for(;len--;) {
                    item = data[len];
                    // if there already is something, we'll just copy the data ...
                    if (typeof item.id !=='undefined' && keys.contains(item.id) === true) {
                        // is there something existing with that id?
                        var existing = allData[item.id];
                        if (existing) {
                            // check! there was, just grab the data and be done ...
                            for(var p in item) {
                                existing.set(p, item[p]);
                            }
                        }
                    } else if (!this.add(type.create.call(type, item))) {
                        counter ++;
                    }
                }
            } else {
                if (data.id) {
                    if (!this.add(type.create.call(type, data))) {
                        counter = 1;
                    }
                }
            }

            return counter;
        },


        find:function (id, options) {
            if (!id) {
                return;
            }
            var item = this.get('_data')[id];

            options = options || {};
            // if we can't find the record by id, we'll pre-create a stub
            if (!item && !options.nocreate) {
                var type = this.__type;
                if (type) {
                    item = type.store.add(type.create.call(type, { id: id }));
//                    item.set('first_name', "testfirst");
//                    item.set('last_name', 'testlast');
                }
            }
            return item;
        },

        live:function (predicateFn) {
            var liveArray;
            var content = [];
            liveArray = LiveArray.create(/* Ember.EnumerableObserver, */ {
                content:[],
                parentStore:this,

                enumerableWillChange: function(name, removing, adding) {
                    // nothing to do here, quite yet. :)
                },

                enumerableDidChange : function(name, removed, added) {
                    var pFn = this.get('_predicateFn');
                    var content = this.get('content');
                    var store = this.get('parentStore');
                    var idx;
                    var id;
                    var obj;

                    if (added) {
                        var addedLen = added.length;
                        for(idx = 0; idx < addedLen; idx++) {
                            id = added[idx];    // get the id
                            obj = store.find(id, {nocreate: true});   // translate it into a real object
                            // if they've got a predicate defined, call it
                            if (predicateFn) {
                                var result = predicateFn.call(obj)
                                if (result) {
                                    content.addObject(obj);
                                }
                            } else {
                                content.addObject(obj);
                            }
                        }
                    }

                    // if an item was removed from the original
                    // remove it from the live collection
                    if (removed) {
                        var removedLen = removed.length;
                        for(idx = 0; idx < removedLen; idx++) {
                            id = removed[idx];
                            if (id) {
                                obj = store.find(id);
                                if (obj) {
                                    content.removeObject(obj);
                                }
                            }
                        }
                    }
                },

                _predicateFn : null

            });

            var keys = this.get('keys');
            var data = this.get('_data');
            var context = {};
            var idx = 0;
            var id;
            var last = null;
            do {
                last = id;
                id = keys.nextObject(idx++, last, context);
                if (typeof id !== 'undefined') {
                    var obj = _data[id];
                    // return true to include
                    if (predicateFn) {
                        var result = predicateFn.call(obj)
                        if (result) {
                            content.addObject(obj);
                        }
                    } else {
                        content.addObject(obj);
                    }
                }
            } while (typeof id !== 'undefined');

            // observe the original list ...
            keys.addEnumerableObserver(liveArray);
            liveArray.set('content', content);
            liveArray.set('_predicateFn', predicateFn);
            return liveArray;
        }
    });


    _stores.create = function (name, options) {
        var type = null;
        if (typeof name !== 'string') {
            type = name;
        }
        name = _stores._retrieveName(name);
        var s = Store.create({
            _data:{},
            name:name
        });
        s.set('keys', Ember.Set.create({}));
        _stores[name] = s;

        options = options || {};

        // optionally place the data store directly
        // on the type (if it's a type and they
        // didn't turn OFF the feature of course)
        if (type && !options.nostore) {
            type.store = s;
            s.__type = type;
        }
        return s;
    };

    _stores.get = function (name) {
        return _stores[_stores._retrieveName(name)];
    };

    _stores.bulkLoad = function(name, data) {
        var store = _stores[_stores._retrieveName(name)];
        return store.bulkLoad(data, name);
    };

    _stores._retrieveName = function (obj) {
        var n = "";
        if (typeof obj === 'string') {
            n = obj.toLowerCase();
        } else {
            n = obj.__name;
            if (!n) {
                throw new Error("Cannot retrieve store name from: " + (obj ? obj.toString() : "null"));
            }
        }
        return n.toLowerCase();
    };

    _stores.remove = function (name) {
        delete _stores[_stores._retrieveName(name)];
    };

    _stores.clear = function (name) {
        _stores[_stores._retrieveName(name)].set('_data', {});
    };

    _stores.find = function (name, id) {
        var ds = _stores.get(name);
        var entity = ds.find(id);
        if (entity) {
            return entity;
        }
        return null;
    }

    var entityRefFn = function (property, type) {
        // auto build connection if property is in the form
        // of 'typenameID' if type is not specified
        if (arguments.length === 1 && property) {   // [1]
            var l = property.length;
            if (l > 2 && property.substr(l - 2).toLowerCase() === 'id') {
                type = property.substr(0, l - 2);
            } else {
                throw new Error("Type not specified, and cannot automatically determine store name." +
                    " Referenced property name must end with Id.");
            }
        }
        var fn = new Function("return Entity.Stores.find('" + type + "', this.get('" + property + "')); ");
        return Ember.computed(fn).property(property);
    };

    var define = function (BaseClassType, name /*, mixins, properties */) {
        var ignore = false;
        var isArray = false;
        var definitionTable = _globalDefinitionTable;

        if (!name || typeof name !== 'string') {
            throw new Error('ClassName/TableName required');
        }
        // remove leading/trailing spaces
        name = name.replace(/^\s+|\s+$/g, '');
        if (name.length === 0) {
            throw new Error('Non empty ClassName/TableName required');
        }

        // make a copy of the base class structure (if it has one)
        var structure = Ember.copy(BaseClassType.__structure || {});
        var argumentsLen = arguments.length;
        if (argumentsLen > 2) {
            // grab the last argument as the properties
            var properties = arguments[argumentsLen - 1] || {};
            for (var prop in properties) {
                var val = properties[prop];

                if (Ember.isArray(val)) {
                    isArray = true;
                    // grab the zeroth element (which represents the type)
                    val = val[0];
                } else {
                    isArray = false;
                }

                var definition = definitionTable[val];
                if (definition) {
                    if (definition.type.__hasTable) {
                        /* Given a reference to a defined type (Like "Person")
                         This code automatically creates a new property based on a default,
                         yet overridable naming system.

                         So, if there's a property called 'from' and the type is set to 'Person',
                         a new property is automatically added called (again, by default),
                         'fromPersonId' and the 'from' property is converted to a reference
                         type which is automatically synchronized if the 'fromPersonId' property
                         changes value.

                         the 'from' property therefore becomes 'read-only' and a conveneince
                         property for binding to other object's
                         */
                        var foreignKeyName = _globalSettings.FOREIGN_KEY_GENERATOR_FUNCTION.call(val,
                            prop, definition.type.__name, _globalSettings.DEFAULT_ID_STRING);
                        // grab the foreign key type (it's the thing we want to serialize actually)
                        structure[foreignKeyName] = definition.type.__structure["id"].type;
                        properties[foreignKeyName] = definition.type.__structure["id"].type.__defaultValue;
                        properties[prop] = Ember.entityRef(foreignKeyName, definition.type.__name);
                    } else {
                        structure[prop] = definition;
                        properties[prop] = definition.defaultValue;
                    }
                }
            }
        }

        var args = Array.prototype.slice.call(arguments);
        args = args.slice(2);
        // build the new class type based on the provided properties
        // and call it with the context of the BaseClassType
        var NewClass = Ember.Object.extend.apply(BaseClassType, args);
        // store off the data structure we've built
        NewClass.__structure = structure;
        NewClass.__hasTable = true;
        NewClass.__name = name;
        NewClass.__defaultValue = null;

        addDefinitionTableEntryFn(NewClass, name, null);

        _stores.create(NewClass);

        return NewClass;
    };


    function buildDefaultDefinitionTable() {
        var add = addDefinitionTableEntryFn;
        add(String, "string", "");
        add(Number, "number", 0);
        add(Boolean, "boolean", false);
        add(Date, "date", null, function (propertyName) {
            function f(n) {
                // Format integers to have at least two digits.
                return n < 10 ? '0' + n : n;
            }

            return this.getUTCFullYear() + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate()) + 'T' +
                f(this.getUTCHours()) + ':' +
                f(this.getUTCMinutes()) + ':' +
                f(this.getUTCSeconds()) + 'Z';
        }, function (value, propertyName) {
            var a;
            if (typeof value === 'string') {
                a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                if (a) {
                    return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                        +a[5], +a[6]));
                }
            }
            return value;
        });
    }

    buildDefaultDefinitionTable();

    var Entity = define(Ember.Object, "Entity", {
        id:Number,

        serialize:function () {
            var structure = this.constructor.__structure;
            if (!structure) {
                return;
            }

            var values = {};
            for (var prop in structure) {
                var type = structure[prop];
                var val = this.get(prop);
                if (typeof val !== 'undefined' && val !== null) {
                    if (type.serializeFn) {
                        val = type.serializeFn.call(val, prop);
                    }
                    values[prop] = val.toString();
                }
            }

            return JSON.stringify(values);
        }
    });

    var deserializeEntity = function(type, data) {
        if (!type && type.create) { return;}
        var obj = Ember.Object.create.call(type, data );
        return obj;
    };

    // now add some statics
    Entity.define = define;
    Entity.addDefinitionTableEntry = addDefinitionTableEntryFn;
    Entity.Settings = _globalSettings;
    Entity.load = deserializeEntity;

    Ember.entityRef = entityRefFn;
    Entity.Stores = _stores; //Entity.Stores || {};

    window.Entity = Entity;
})();