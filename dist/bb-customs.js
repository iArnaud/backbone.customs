;(function (name, context, definition) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = definition(); }
  else if (typeof define === 'function' && define.amd) { define(['jquery, underscore, backbone'], definition); }
  else { context[name] = definition(); }
})('bbCustoms', this, function (jquery, underscore, backbone) {
(function () {
    var Cocktail = {};
    if (typeof exports !== 'undefined') {
        Cocktail = exports;
    } else if (true) {
        var cocktail = function (require) {
                return Cocktail;
            }({});
    } else {
        this.Cocktail = Cocktail;
    }
    Cocktail.mixins = {};
    Cocktail.mixin = function mixin(klass) {
        var mixins = _.chain(arguments).toArray().rest().flatten().value();
        var obj = klass.prototype || klass;
        var collisions = {};
        _(mixins).each(function (mixin) {
            if (_.isString(mixin)) {
                mixin = Cocktail.mixins[mixin];
            }
            _(mixin).each(function (value, key) {
                if (_.isFunction(value)) {
                    if (obj[key] === value)
                        return;
                    if (obj[key]) {
                        collisions[key] = collisions[key] || [obj[key]];
                        collisions[key].push(value);
                    }
                    obj[key] = value;
                } else if (_.isObject(value)) {
                    obj[key] = _.extend({}, value, obj[key] || {});
                } else if (!(key in obj)) {
                    obj[key] = value;
                }
            });
        });
        _(collisions).each(function (propertyValues, propertyName) {
            obj[propertyName] = function () {
                var that = this, args = arguments, returnValue;
                _(propertyValues).each(function (value) {
                    var returnedValue = _.isFunction(value) ? value.apply(that, args) : value;
                    returnValue = typeof returnedValue === 'undefined' ? returnValue : returnedValue;
                });
                return returnValue;
            };
        });
    };
    var originalExtend;
    Cocktail.patch = function patch(Backbone) {
        originalExtend = Backbone.Model.extend;
        var extend = function (protoProps, classProps) {
            var klass = originalExtend.call(this, protoProps, classProps);
            var mixins = klass.prototype.mixins;
            if (mixins && klass.prototype.hasOwnProperty('mixins')) {
                Cocktail.mixin(klass, mixins);
            }
            return klass;
        };
        _([
            Backbone.Model,
            Backbone.Collection,
            Backbone.Router,
            Backbone.View
        ]).each(function (klass) {
            klass.mixin = function mixin() {
                Cocktail.mixin(this, _.toArray(arguments));
            };
            klass.extend = extend;
        });
    };
    Cocktail.unpatch = function unpatch(Backbone) {
        _([
            Backbone.Model,
            Backbone.Collection,
            Backbone.Router,
            Backbone.View
        ]).each(function (klass) {
            klass.mixin = undefined;
            klass.extend = originalExtend;
        });
    };
}());
(function (root, factory) {
    if (typeof exports !== 'undefined') {
        module.exports = factory(underscore, backbone);
    } else if (true) {
        var backboneepoxy = function (underscore, backbone) {
                return factory();
            }(underscore, backbone);
    } else {
        factory(root._, root.Backbone);
    }
}(this, function (_, Backbone) {
    var Epoxy = Backbone.Epoxy = {};
    var array = Array.prototype;
    var isUndefined = _.isUndefined;
    var isFunction = _.isFunction;
    var isObject = _.isObject;
    var isArray = _.isArray;
    var isModel = function (obj) {
        return obj instanceof Backbone.Model;
    };
    var isCollection = function (obj) {
        return obj instanceof Backbone.Collection;
    };
    var blankMethod = function () {
    };
    var mixins = {
            mixin: function (extend) {
                extend = extend || {};
                for (var i in this.prototype) {
                    if (this.prototype.hasOwnProperty(i) && i !== 'constructor') {
                        extend[i] = this.prototype[i];
                    }
                }
                return extend;
            }
        };
    function _super(instance, method, args) {
        return instance._super.prototype[method].apply(instance, args);
    }
    var modelMap;
    var modelProps = ['computeds'];
    Epoxy.Model = Backbone.Model.extend({
        _super: Backbone.Model,
        constructor: function (attributes, options) {
            _.extend(this, _.pick(options || {}, modelProps));
            _super(this, 'constructor', arguments);
            this.initComputeds(attributes, options);
        },
        getCopy: function (attribute) {
            return _.clone(this.get(attribute));
        },
        get: function (attribute) {
            modelMap && modelMap.push([
                'change:' + attribute,
                this
            ]);
            if (this.hasComputed(attribute)) {
                return this.c()[attribute].get();
            }
            return _super(this, 'get', arguments);
        },
        set: function (key, value, options) {
            var params = key;
            if (params && !isObject(params)) {
                params = {};
                params[key] = value;
            } else {
                options = value;
            }
            options = options || {};
            if (!options.unset) {
                params = deepModelSet(this, params, {}, []);
            }
            return _super(this, 'set', [
                params,
                options
            ]);
        },
        toJSON: function (options) {
            var json = _super(this, 'toJSON', arguments);
            if (options && options.computed) {
                _.each(this.c(), function (computed, attribute) {
                    json[attribute] = computed.value;
                });
            }
            return json;
        },
        destroy: function () {
            this.clearComputeds();
            return _super(this, 'destroy', arguments);
        },
        c: function () {
            return this._c || (this._c = {});
        },
        initComputeds: function (attributes, options) {
            this.clearComputeds();
            var computeds = _.result(this, 'computeds') || {};
            computeds = _.extend(computeds, _.pick(attributes || {}, _.keys(computeds)));
            _.each(computeds, function (params, attribute) {
                params._init = 1;
                this.addComputed(attribute, params);
            }, this);
            _.invoke(this.c(), 'init');
        },
        addComputed: function (attribute, getter, setter) {
            this.removeComputed(attribute);
            var params = getter;
            var delayInit = params._init;
            if (isFunction(getter)) {
                var depsIndex = 2;
                params = {};
                params._get = getter;
                if (isFunction(setter)) {
                    params._set = setter;
                    depsIndex++;
                }
                params.deps = array.slice.call(arguments, depsIndex);
            }
            this.c()[attribute] = new EpoxyComputedModel(this, attribute, params, delayInit);
            return this;
        },
        hasComputed: function (attribute) {
            return this.c().hasOwnProperty(attribute);
        },
        removeComputed: function (attribute) {
            if (this.hasComputed(attribute)) {
                this.c()[attribute].dispose();
                delete this.c()[attribute];
            }
            return this;
        },
        clearComputeds: function () {
            for (var attribute in this.c()) {
                this.removeComputed(attribute);
            }
            return this;
        },
        modifyArray: function (attribute, method, options) {
            var obj = this.get(attribute);
            if (isArray(obj) && isFunction(array[method])) {
                var args = array.slice.call(arguments, 2);
                var result = array[method].apply(obj, args);
                options = options || {};
                if (!options.silent) {
                    this.trigger('change:' + attribute + ' change', this, array, options);
                }
                return result;
            }
            return null;
        },
        modifyObject: function (attribute, property, value, options) {
            var obj = this.get(attribute);
            var change = false;
            if (isObject(obj)) {
                options = options || {};
                if (isUndefined(value) && obj.hasOwnProperty(property)) {
                    delete obj[property];
                    change = true;
                } else if (obj[property] !== value) {
                    obj[property] = value;
                    change = true;
                }
                if (change && !options.silent) {
                    this.trigger('change:' + attribute + ' change', this, obj, options);
                }
                return obj;
            }
            return null;
        }
    }, mixins);
    function deepModelSet(model, toSet, toReturn, stack) {
        for (var attribute in toSet) {
            if (toSet.hasOwnProperty(attribute)) {
                var value = toSet[attribute];
                if (model.hasComputed(attribute)) {
                    if (!stack.length || !_.contains(stack, attribute)) {
                        value = model.c()[attribute].set(value);
                        if (value && isObject(value)) {
                            toReturn = deepModelSet(model, value, toReturn, stack.concat(attribute));
                        }
                    } else {
                        throw 'Recursive setter: ' + stack.join(' > ');
                    }
                } else {
                    toReturn[attribute] = value;
                }
            }
        }
        return toReturn;
    }
    function EpoxyComputedModel(model, name, params, delayInit) {
        params = params || {};
        if (params.get && isFunction(params.get)) {
            params._get = params.get;
        }
        if (params.set && isFunction(params.set)) {
            params._set = params.set;
        }
        delete params.get;
        delete params.set;
        _.extend(this, params);
        this.model = model;
        this.name = name;
        this.deps = this.deps || [];
        if (!delayInit)
            this.init();
    }
    _.extend(EpoxyComputedModel.prototype, Backbone.Events, {
        init: function () {
            var bindings = {};
            var deps = modelMap = [];
            this.get(true);
            modelMap = null;
            if (deps.length) {
                _.each(deps, function (value) {
                    var attribute = value[0];
                    var target = value[1];
                    if (!bindings[attribute]) {
                        bindings[attribute] = [target];
                    } else if (!_.contains(bindings[attribute], target)) {
                        bindings[attribute].push(target);
                    }
                });
                _.each(bindings, function (targets, binding) {
                    for (var i = 0, len = targets.length; i < len; i++) {
                        this.listenTo(targets[i], binding, _.bind(this.get, this, true));
                    }
                }, this);
            }
        },
        val: function (attribute) {
            return this.model.get(attribute);
        },
        get: function (update) {
            if (update === true && this._get) {
                var val = this._get.apply(this.model, _.map(this.deps, this.val, this));
                this.change(val);
            }
            return this.value;
        },
        set: function (val) {
            if (this._get) {
                if (this._set)
                    return this._set.apply(this.model, arguments);
                else
                    throw 'Cannot set read-only computed attribute.';
            }
            this.change(val);
            return null;
        },
        change: function (value) {
            if (!_.isEqual(value, this.value)) {
                this.value = value;
                this.model.trigger('change:' + this.name + ' change', this.model);
            }
        },
        dispose: function () {
            this.stopListening();
            this.off();
            this.model = this.value = null;
        }
    });
    var bindingSettings = {
            optionText: 'label',
            optionValue: 'value'
        };
    var bindingCache = {};
    function readAccessor(accessor) {
        if (isFunction(accessor)) {
            return accessor();
        } else if (isObject(accessor)) {
            accessor = _.clone(accessor);
            _.each(accessor, function (value, key) {
                accessor[key] = readAccessor(value);
            });
        }
        return accessor;
    }
    function makeHandler(handler) {
        return isFunction(handler) ? { set: handler } : handler;
    }
    var bindingHandlers = {
            attr: makeHandler(function ($element, value) {
                $element.attr(value);
            }),
            checked: makeHandler({
                get: function ($element, currentValue) {
                    var checked = !!$element.prop('checked');
                    var value = $element.val();
                    if (this.isRadio($element)) {
                        return value;
                    } else if (isArray(currentValue)) {
                        currentValue = currentValue.slice();
                        var index = _.indexOf(currentValue, value);
                        if (checked && index < 0) {
                            currentValue.push(value);
                        } else if (!checked && index > -1) {
                            currentValue.splice(index, 1);
                        }
                        return currentValue;
                    }
                    return checked;
                },
                set: function ($element, value) {
                    var checked = !!value;
                    if (this.isRadio($element)) {
                        checked = value == $element.val();
                    } else if (isArray(value)) {
                        checked = _.contains(value, $element.val());
                    }
                    $element.prop('checked', checked);
                },
                isRadio: function ($element) {
                    return $element.attr('type').toLowerCase() === 'radio';
                }
            }),
            classes: makeHandler(function ($element, value) {
                _.each(value, function (enabled, className) {
                    $element.toggleClass(className, !!enabled);
                });
            }),
            collection: makeHandler({
                init: function ($element, collection) {
                    if (!isCollection(collection) || !isFunction(collection.view)) {
                        throw 'Binding "collection" requires a Collection with a "view" constructor.';
                    }
                    this.v = {};
                },
                set: function ($element, collection, target) {
                    var view;
                    var views = this.v;
                    var models = collection.models;
                    var mapCache = viewMap;
                    viewMap = null;
                    target = target || collection;
                    if (isModel(target)) {
                        if (!views.hasOwnProperty(target.cid)) {
                            views[target.cid] = view = new collection.view({ model: target });
                            var index = _.indexOf(models, target);
                            var $children = $element.children();
                            if (index < $children.length) {
                                $children.eq(index).before(view.$el);
                            } else {
                                $element.append(view.$el);
                            }
                        } else {
                            views[target.cid].remove();
                            delete views[target.cid];
                        }
                    } else if (isCollection(target)) {
                        var sort = models.length === _.size(views) && collection.every(function (model) {
                                return views.hasOwnProperty(model.cid);
                            });
                        $element.children().detach();
                        var frag = document.createDocumentFragment();
                        if (sort) {
                            collection.each(function (model) {
                                frag.appendChild(views[model.cid].el);
                            });
                        } else {
                            this.clean();
                            collection.each(function (model) {
                                views[model.cid] = view = new collection.view({ model: model });
                                frag.appendChild(view.el);
                            });
                        }
                        $element.append(frag);
                    }
                    viewMap = mapCache;
                },
                clean: function () {
                    for (var id in this.v) {
                        if (this.v.hasOwnProperty(id)) {
                            this.v[id].remove();
                            delete this.v[id];
                        }
                    }
                }
            }),
            css: makeHandler(function ($element, value) {
                $element.css(value);
            }),
            disabled: makeHandler(function ($element, value) {
                $element.prop('disabled', !!value);
            }),
            enabled: makeHandler(function ($element, value) {
                $element.prop('disabled', !value);
            }),
            html: makeHandler(function ($element, value) {
                $element.html(value);
            }),
            options: makeHandler({
                init: function ($element, value, context, bindings) {
                    this.e = bindings.optionsEmpty;
                    this.d = bindings.optionsDefault;
                    this.v = bindings.value;
                },
                set: function ($element, value) {
                    var self = this;
                    var optionsEmpty = readAccessor(self.e);
                    var optionsDefault = readAccessor(self.d);
                    var currentValue = readAccessor(self.v);
                    var options = isCollection(value) ? value.models : value;
                    var numOptions = options.length;
                    var enabled = true;
                    var html = '';
                    if (!numOptions && !optionsDefault && optionsEmpty) {
                        html += self.opt(optionsEmpty, numOptions);
                        enabled = false;
                    } else {
                        if (optionsDefault) {
                            options = [optionsDefault].concat(options);
                        }
                        _.each(options, function (option, index) {
                            html += self.opt(option, numOptions);
                        });
                    }
                    $element.html(html).prop('disabled', !enabled).val(currentValue);
                    var revisedValue = $element.val();
                    if (self.v && !_.isEqual(currentValue, revisedValue)) {
                        self.v(revisedValue);
                    }
                },
                opt: function (option, numOptions) {
                    var label = option;
                    var value = option;
                    var textAttr = bindingSettings.optionText;
                    var valueAttr = bindingSettings.optionValue;
                    if (isObject(option)) {
                        label = isModel(option) ? option.get(textAttr) : option[textAttr];
                        value = isModel(option) ? option.get(valueAttr) : option[valueAttr];
                    }
                    return [
                        '<option value="',
                        value,
                        '">',
                        label,
                        '</option>'
                    ].join('');
                },
                clean: function () {
                    this.d = this.e = this.v = 0;
                }
            }),
            template: makeHandler({
                init: function ($element, value, context) {
                    var raw = $element.find('script,template');
                    this.t = _.template(raw.length ? raw.html() : $element.html());
                    if (isArray(value)) {
                        return _.pick(context, value);
                    }
                },
                set: function ($element, value) {
                    value = isModel(value) ? value.toJSON({ computed: true }) : value;
                    $element.html(this.t(value));
                },
                clean: function () {
                    this.t = null;
                }
            }),
            text: makeHandler(function ($element, value) {
                $element.text(value);
            }),
            toggle: makeHandler(function ($element, value) {
                $element.toggle(!!value);
            }),
            value: makeHandler({
                get: function ($element) {
                    return $element.val();
                },
                set: function ($element, value) {
                    try {
                        if ($element.val() != value)
                            $element.val(value);
                    } catch (error) {
                    }
                }
            })
        };
    function makeFilter(handler) {
        return function () {
            var params = arguments;
            var read = isFunction(handler) ? handler : handler.get;
            var write = handler.set;
            return function (value) {
                return isUndefined(value) ? read.apply(this, _.map(params, readAccessor)) : params[0]((write ? write : read).call(this, value));
            };
        };
    }
    var bindingFilters = {
            all: makeFilter(function () {
                var params = arguments;
                for (var i = 0, len = params.length; i < len; i++) {
                    if (!params[i])
                        return false;
                }
                return true;
            }),
            any: makeFilter(function () {
                var params = arguments;
                for (var i = 0, len = params.length; i < len; i++) {
                    if (params[i])
                        return true;
                }
                return false;
            }),
            length: makeFilter(function (value) {
                return value.length || 0;
            }),
            none: makeFilter(function () {
                var params = arguments;
                for (var i = 0, len = params.length; i < len; i++) {
                    if (params[i])
                        return false;
                }
                return true;
            }),
            not: makeFilter(function (value) {
                return !value;
            }),
            format: makeFilter(function (str) {
                var params = arguments;
                for (var i = 1, len = params.length; i < len; i++) {
                    str = str.replace(new RegExp('\\$' + i, 'g'), params[i]);
                }
                return str;
            }),
            select: makeFilter(function (condition, truthy, falsey) {
                return condition ? truthy : falsey;
            }),
            csv: makeFilter({
                get: function (value) {
                    value = String(value);
                    return value ? value.split(',') : [];
                },
                set: function (value) {
                    return isArray(value) ? value.join(',') : value;
                }
            }),
            integer: makeFilter(function (value) {
                return value ? parseInt(value, 10) : 0;
            }),
            decimal: makeFilter(function (value) {
                return value ? parseFloat(value) : 0;
            })
        };
    var allowedParams = {
            events: 1,
            optionsDefault: 1,
            optionsEmpty: 1
        };
    Epoxy.binding = {
        allowedParams: allowedParams,
        addHandler: function (name, handler) {
            bindingHandlers[name] = makeHandler(handler);
        },
        addFilter: function (name, handler) {
            bindingFilters[name] = makeFilter(handler);
        },
        config: function (settings) {
            _.extend(bindingSettings, settings);
        },
        emptyCache: function () {
            bindingCache = {};
        }
    };
    var viewMap;
    var viewProps = [
            'viewModel',
            'bindings',
            'bindingFilters',
            'bindingHandlers',
            'bindingSources',
            'computeds'
        ];
    Epoxy.View = Backbone.View.extend({
        _super: Backbone.View,
        constructor: function (options) {
            _.extend(this, _.pick(options || {}, viewProps));
            _super(this, 'constructor', arguments);
            this.applyBindings();
        },
        b: function () {
            return this._b || (this._b = []);
        },
        bindings: 'data-bind',
        setterOptions: null,
        applyBindings: function () {
            this.removeBindings();
            var self = this;
            var sources = _.clone(_.result(self, 'bindingSources'));
            var declarations = self.bindings;
            var options = self.setterOptions;
            var handlers = _.clone(bindingHandlers);
            var filters = _.clone(bindingFilters);
            var context = self._c = {};
            _.each(_.result(self, 'bindingHandlers') || {}, function (handler, name) {
                handlers[name] = makeHandler(handler);
            });
            _.each(_.result(self, 'bindingFilters') || {}, function (filter, name) {
                filters[name] = makeFilter(filter);
            });
            self.model = addSourceToViewContext(self, context, options, 'model');
            self.viewModel = addSourceToViewContext(self, context, options, 'viewModel');
            self.collection = addSourceToViewContext(self, context, options, 'collection');
            if (sources) {
                _.each(sources, function (source, sourceName) {
                    sources[sourceName] = addSourceToViewContext(sources, context, options, sourceName, sourceName);
                });
                self.bindingSources = sources;
            }
            _.each(_.result(self, 'computeds') || {}, function (computed, name) {
                var getter = isFunction(computed) ? computed : computed.get;
                var setter = computed.set;
                var deps = computed.deps;
                context[name] = function (value) {
                    return !isUndefined(value) && setter ? setter.call(self, value) : getter.apply(self, getDepsFromViewContext(self._c, deps));
                };
            });
            if (isObject(declarations)) {
                _.each(declarations, function (elementDecs, selector) {
                    var $element = queryViewForSelector(self, selector);
                    if ($element.length) {
                        bindElementToView(self, $element, elementDecs, context, handlers, filters);
                    }
                });
            } else {
                queryViewForSelector(self, '[' + declarations + ']').each(function () {
                    var $element = Backbone.$(this);
                    bindElementToView(self, $element, $element.attr(declarations), context, handlers, filters);
                });
            }
        },
        getBinding: function (attribute) {
            return accessViewContext(this._c, attribute);
        },
        setBinding: function (attribute, value) {
            return accessViewContext(this._c, attribute, value);
        },
        removeBindings: function () {
            this._c = null;
            if (this._b) {
                while (this._b.length) {
                    this._b.pop().dispose();
                }
            }
        },
        remove: function () {
            this.removeBindings();
            _super(this, 'remove', arguments);
        }
    }, mixins);
    function addSourceToViewContext(source, context, options, name, prefix) {
        source = _.result(source, name);
        if (!source)
            return;
        if (isModel(source)) {
            prefix = prefix ? prefix + '_' : '';
            context['$' + name] = function () {
                viewMap && viewMap.push([
                    source,
                    'change'
                ]);
                return source;
            };
            _.each(source.toJSON({ computed: true }), function (value, attribute) {
                context[prefix + attribute] = function (value) {
                    return accessViewDataAttribute(source, attribute, value, options);
                };
            });
        } else if (isCollection(source)) {
            context['$' + name] = function () {
                viewMap && viewMap.push([
                    source,
                    'reset add remove sort update'
                ]);
                return source;
            };
        }
        return source;
    }
    function accessViewDataAttribute(source, attribute, value, options) {
        viewMap && viewMap.push([
            source,
            'change:' + attribute
        ]);
        if (!isUndefined(value)) {
            if (!isObject(value) || isArray(value) || _.isDate(value)) {
                var val = value;
                value = {};
                value[attribute] = val;
            }
            return options && options.save ? source.save(value, options) : source.set(value, options);
        }
        return source.get(attribute);
    }
    function queryViewForSelector(view, selector) {
        if (selector === ':el')
            return view.$el;
        var $elements = view.$(selector);
        if (view.$el.is(selector)) {
            $elements = $elements.add(view.$el);
        }
        return $elements;
    }
    function bindElementToView(view, $element, declarations, context, handlers, filters) {
        try {
            var parserFunct = bindingCache[declarations] || (bindingCache[declarations] = new Function('$f', '$c', 'with($f){with($c){return{' + declarations + '}}}'));
            var bindings = parserFunct(filters, context);
        } catch (error) {
            throw 'Error parsing bindings: "' + declarations + '"\n>> ' + error;
        }
        var events = _.map(_.union(bindings.events || [], ['change']), function (name) {
                return name + '.epoxy';
            }).join(' ');
        _.each(bindings, function (accessor, handlerName) {
            if (handlers.hasOwnProperty(handlerName)) {
                view.b().push(new EpoxyBinding($element, handlers[handlerName], accessor, events, context, bindings));
            } else if (!allowedParams.hasOwnProperty(handlerName)) {
                throw 'binding handler "' + handlerName + '" is not defined.';
            }
        });
    }
    function accessViewContext(context, attribute, value) {
        if (context && context.hasOwnProperty(attribute)) {
            return isUndefined(value) ? readAccessor(context[attribute]) : context[attribute](value);
        }
    }
    function getDepsFromViewContext(context, attributes) {
        var values = [];
        if (attributes && context) {
            for (var i = 0, len = attributes.length; i < len; i++) {
                values.push(attributes[i] in context ? context[attributes[i]]() : null);
            }
        }
        return values;
    }
    function EpoxyBinding($element, handler, accessor, events, context, bindings) {
        var self = this;
        var tag = $element[0].tagName.toLowerCase();
        var changable = tag == 'input' || tag == 'select' || tag == 'textarea' || $element.prop('contenteditable') == 'true';
        var triggers = [];
        var reset = function (target) {
            self.set(self.$el, readAccessor(accessor), target);
        };
        self.$el = $element;
        self.evt = events;
        _.extend(self, handler);
        accessor = self.init(self.$el, readAccessor(accessor), context, bindings) || accessor;
        viewMap = triggers;
        reset();
        viewMap = null;
        if (changable && handler.get && isFunction(accessor)) {
            self.$el.on(events, function (evt) {
                accessor(self.get(self.$el, readAccessor(accessor), evt));
            });
        }
        if (triggers.length) {
            for (var i = 0, len = triggers.length; i < len; i++) {
                self.listenTo(triggers[i][0], triggers[i][1], reset);
            }
        }
    }
    _.extend(EpoxyBinding.prototype, Backbone.Events, {
        init: blankMethod,
        get: blankMethod,
        set: blankMethod,
        clean: blankMethod,
        dispose: function () {
            this.clean();
            this.stopListening();
            this.$el.off(this.evt);
            this.$el = null;
        }
    });
    return Epoxy;
}));
(function (name, context, definition) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = definition();
    } else if (true) {
        var customs = function () {
                return definition();
            }();
    } else {
        context[name] = definition();
    }
}('customs', this, function () {
    var utils = function () {
            return {
                isEmpty: function (obj) {
                    if (Object.prototype.toString.call(obj) === '[object Array]') {
                        return obj.length > 0;
                    }
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            return false;
                        }
                    }
                    return true;
                },
                formatStr: function (str, obj) {
                    return str.replace(/{([^{}]*)}/g, function (a, b) {
                        var r = obj[b];
                        return typeof r === 'string' ? r : a;
                    });
                }
            };
        }();
    var checks = function (utils) {
            var regExs = {
                    numeric: /^[0-9]+$/,
                    integer: /^\-?[0-9]+$/,
                    decimal: /^\-?[0-9]*\.?[0-9]+$/,
                    email: /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
                    alpha: /^[a-z]+$/i,
                    alphaNumeric: /^[a-z0-9]+$/i,
                    alphaDash: /^[a-z0-9_\-]+$/i,
                    natural: /^[0-9]+$/i,
                    naturalNoZero: /^[1-9][0-9]*$/i,
                    ip: /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
                    base64: /[^a-zA-Z0-9\/\+=]/i,
                    numericDash: /^[\d\-\s]+$/,
                    url: /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
                };
            var checks = {};
            checks['required'] = {
                'msg': 'The {0} field is required.',
                'check': function (val) {
                    return val !== null && typeof val == 'object' ? utils.isEmpty(val) : val !== null && val !== '';
                }
            };
            checks['default'] = {
                'msg': 'The {0} field is still set to default, please change.',
                'check': function (val, name) {
                    return val !== name;
                }
            };
            checks['email'] = {
                'msg': 'The {0} field must contain a valid email address.',
                'check': function (val) {
                    return regExs['email'].test(val);
                }
            };
            checks['emails'] = {
                'msg': 'The {0} field must contain all valid email addresses.',
                'check': function (val) {
                    var result = val.split(',');
                    for (var i = 0; i < result.length; i++) {
                        var stripped = String(result[i]).replace(/^\s+|\s+$/g, '');
                        if (!regExs['email'].test(stripped)) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            checks['minLength'] = {
                'msg': 'The {0} field must be at least {1} characters in length.',
                'check': function (val, length) {
                    return !regExs['numeric'].test(length) ? false : val.length >= parseInt(length, 10);
                }
            };
            checks['maxLength'] = {
                'msg': 'The {0} field must not exceed {1} characters in length.',
                'check': function (val, length) {
                    return !regExs['numeric'].test(length) ? false : val.length <= parseInt(length, 10);
                }
            };
            checks['exactLength'] = {
                'msg': 'The {0} field must be exactly {1} characters in length.',
                'check': function (val, length) {
                    return !regExs['numeric'].test(length) ? false : val.length === parseInt(length, 10);
                }
            };
            checks['greaterThan'] = {
                'msg': 'The {0} field must contain a number greater than {1}.',
                'check': function (val, param) {
                    return !regExs['decimal'].test(val) ? false : parseFloat(val) > parseFloat(param);
                }
            };
            checks['lessThan'] = {
                'msg': 'The {0} field must contain a number less than {1}.',
                'check': function (val, param) {
                    return !regExs['decimal'].test(val) ? false : parseFloat(val) < parseFloat(param);
                }
            };
            checks['alpha'] = {
                'msg': 'The {0} field must only contain alphabetical characters.',
                'check': function (val) {
                    return regExs['alpha'].test(val);
                }
            };
            checks['alphaNumeric'] = {
                'msg': 'The {0} field must only contain alpha-numeric characters.',
                'check': function (val) {
                    return regExs['alphaNumeric'].test(val);
                }
            };
            checks['alphaDash'] = {
                'msg': 'The {0} field must only contain alpha-numeric characters, underscores, and dashes.',
                'check': function (val) {
                    return regExs['alphaDash'].test(val);
                }
            };
            checks['numeric'] = {
                'msg': 'The {0} field must contain only numbers.',
                'check': function (val) {
                    return regExs['numeric'].test(val);
                }
            };
            checks['integer'] = {
                'msg': 'The {0} field must contain an integer.',
                'check': function (val) {
                    return regExs['integer'].test(val);
                }
            };
            checks['decimal'] = {
                'msg': 'The {0} field must contain a decimal number.',
                'check': function (val) {
                    return regExs['decimal'].test(val);
                }
            };
            checks['natural'] = {
                'msg': 'The {0} field must contain only positive numbers.',
                'check': function (val) {
                    return regExs['natural'].test(val);
                }
            };
            checks['naturalNoZero'] = {
                'msg': 'The {0} field must contain a number greater than zero.',
                'check': function (val) {
                    return regExs['naturalNoZero'].test(val);
                }
            };
            checks['url'] = {
                'msg': 'The {0} field must contain a valid URL.',
                'check': function (val) {
                    return regExs['url'].test(val);
                }
            };
            checks['creditCard'] = {
                'msg': 'The {0} field must contain a valid credit card number.',
                'check': function (val) {
                    if (!regExs['numericDash'].test(val)) {
                        return false;
                    }
                    var str = val.replace(/[ -]+/g, ''), len = str.length, mul = 0, sum = 0, prodArr = [
                            [
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7,
                                8,
                                9
                            ],
                            [
                                0,
                                2,
                                4,
                                6,
                                8,
                                1,
                                3,
                                5,
                                7,
                                9
                            ]
                        ];
                    while (len--) {
                        sum += prodArr[mul][parseInt(str.charAt(len), 10)];
                        mul ^= 1;
                    }
                    return sum % 10 === 0 && sum > 0;
                }
            };
            checks['fileType'] = {
                'msg': 'The {0} field must contain only {1} files.',
                'check': function (val, type) {
                    var ext = val.substr(val.lastIndexOf('.') + 1);
                    var types = type.split(',');
                    for (var i = 0; i < types.length; i++) {
                        var stripped = String(types[i]).replace(/^\s+|\s+$/g, '');
                        if (ext == stripped) {
                            return true;
                        }
                    }
                    return false;
                }
            };
            return checks;
        }(utils);
    var customs = function (checks, utils) {
            return {
                checks: checks,
                check: function (data, rules) {
                    var result = {
                            isValid: false,
                            errs: {}
                        };
                    for (var key in data) {
                        if (rules && rules[key]) {
                            var keyErrs = this._checkKey(key, data[key], rules[key]);
                            if (keyErrs.length) {
                                result.errs[key] = keyErrs;
                            }
                        }
                    }
                    if (utils.isEmpty(result.errs)) {
                        result.isValid = true;
                        delete result.errs;
                    }
                    return result;
                },
                _checkKey: function (name, val, rule) {
                    var ruleChecks = rule.split('|'), errs = [];
                    if (rule.indexOf('required') == -1 && val === '') {
                        return true;
                    }
                    for (var i = 0, l = ruleChecks.length; i < l; i++) {
                        var ruleCheck = this._getRuleCheckParts(ruleChecks[i]), result = this._checkRule(val, ruleCheck.rule, ruleCheck.args);
                        if (!result) {
                            var formatArgs = [name];
                            if (typeof ruleCheck.args !== 'undefined') {
                                formatArgs = formatArgs.concat(ruleCheck.args);
                            }
                            var msg = utils.formatStr(checks[ruleCheck.rule].msg, formatArgs);
                            errs.push({
                                rule: ruleCheck.rule,
                                msg: msg
                            });
                        }
                    }
                    return errs;
                },
                _checkRule: function (val, rule, args) {
                    if (!checks[rule]) {
                        throw new Error('There is no check defined by the name: ' + rule);
                    }
                    return args ? checks[rule].check.apply(checks, [
                        val,
                        args
                    ]) : checks[rule].check.apply(checks, [val]);
                },
                _getRuleCheckParts: function (ruleCheck) {
                    var parts = /^(.+?)\[(.+)\]$/.exec(ruleCheck);
                    return parts ? {
                        rule: parts[1],
                        args: parts[2]
                    } : { rule: ruleCheck };
                }
            };
        }(checks, utils);
    return customs;
}));
var bb_customs = function (_, cocktail, Epoxy, customs) {
        var createMixin = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var mixin = args.pop();
            args.unshift(mixin);
            cocktail.mixin.apply(this, args);
            return mixin;
        };
        var model = createMixin(Epoxy.View.mixin(), {
                validate: function (attrs, options) {
                    if (!attrs) {
                        attrs = this.toJSON();
                    }
                    if (!options) {
                        options = {};
                    }
                    var validation = customs.check(attrs, _.extend(this.customs, options.customs || {}));
                    if (!validation.isValid) {
                        this._addValidationErr(validation.errs);
                        return validation.errs;
                    }
                },
                _addValidationErr: function (errs) {
                    for (var key in errs) {
                        this.validationErr = this.validationErr || {};
                        this.validationErr[key] = errs[key];
                        this.trigger('invalid:attribute', key, this.validationErr[key]);
                    }
                }
            });
        var view = createMixin(Epoxy.View.mixin(), {
                initialize: function (opts) {
                    if (typeof this.bindings !== 'object') {
                        this._createFormBindings();
                    }
                    this.applyBindings();
                },
                _createFormBindings: function () {
                    this.bindings = {};
                    this._bindType('input[type="radio"]', {
                        defaultFn: this._defaultRadio,
                        bindFn: this._bindRadioCheckbox
                    });
                    this._bindType('input[type="checkbox"]', {
                        defaultFn: this._defaultCheckbox,
                        bindFn: this._bindRadioCheckbox
                    });
                    this._bindType('select', {
                        defaultFn: this._defaultSelect,
                        bindFn: this._bindDefault
                    });
                    this._bindType('input[type!="radio"][type!="checkbox"], textarea', {
                        defaultFn: this._defaultDefault,
                        bindFn: this._bindDefault
                    });
                },
                _bindType: function (selector, opts) {
                    var self = this;
                    self.$el.find(selector).each(function () {
                        if (!self.model.attributes[this.name]) {
                            self.model.attributes[this.name] = opts.defaultFn.call(self, this);
                        }
                        opts.bindFn.call(self, this);
                    });
                },
                _defaultRadio: function (el) {
                    return this.$el.find(this._createAttrSel('name', el.name) + ':checked').val() || '';
                },
                _defaultCheckbox: function (el) {
                    var value = [];
                    this.$el.find(this._createAttrSel('name', el.name) + ':checked').each(function () {
                        value.append(this.value);
                    });
                    return value;
                },
                _defaultSelect: function (el) {
                    var selected = $(el).find(':selected')[0];
                    return selected.value || selected.text;
                },
                _defaultDefault: function (el) {
                    return el.value;
                },
                _bindRadioCheckbox: function (el) {
                    var nameSel = this._createAttrSel('name', el.name), valSel = this._createAttrSel('value', el.value);
                    this.bindings[nameSel + valSel] = 'checked:' + el.name;
                },
                _bindDefault: function (el) {
                    var nameSel = this._createAttrSel('name', el.name);
                    this.bindings[nameSel] = 'value:' + el.name + ',events:["keyup"]';
                },
                _createAttrSel: function (name, val) {
                    return '[' + name + '="' + val + '"]';
                }
            });
        return {
            model: model,
            view: view
        };
    }(underscore, cocktail, backboneepoxy, customs);
return bb_customs;

});