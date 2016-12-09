/**
 * function TyperEntry
 *  - type:typer|callback
 *  - back:typer
 *  - revert:typer|callback
 *  - stop:
 *  - toString:
 */

/**
 * Typer helper methods
 */
var TyperHelper = {
    random: function(min, max) {
        // inclusive min, max random
        return Math.floor((Math.random()*(max-min+1)+min));
    },
    addEventSupport: function(cls) {
        cls.prototype.addEventListener = function addEventListener(evnt, func) {
            if(!('_events' in this)) {
                this._events = {};
            }

            if(!(evnt in this._events)) {
                this._events[evnt] = [];
            }
            this._events[evnt].push(func);
        };
        cls.prototype.dispatchEvent = function dispatch(evnt) {
            if(!('_events' in this)) {
                this._events = {};
            }

            var ev = evnt;
            if(typeof ev == 'object' && 'type' in ev) {
                ev = ev.type;
            }
            if(ev in this._events) {
                for(var i = 0; i < this._events[ev].length; i++) {
                    this._events[ev][i].call(this, evnt);
                }
            }
        };
    }
};

/**
 * Typer types (typer types start without delay)
 */
var Text_TyperEntry = function Text_TyperEntry(text, min, max) {
    // set text
    if(typeof text == 'string') {
        this.text = text.toString();
    } else { this.text = text; }
    // config (intervals are inclusive on both ends)
    this.intervalMin = (!min) ? 30 : min;
    this.intervalMax = (!max) ? 60 : max;
    // tracking variables
    this.currentIndex = -1;
    this.timeout = false;

    // type method
    this.type = function type(typer, callback) {
        // only type if not exceeded the index and length
        if(this.text.length>0 && this.currentIndex<this.text.length-1) {
            // type 1 character
            this.currentIndex++;
            typer.element.innerHTML += this.text[this.currentIndex];
            // type next character at random interval
            var interval = TyperHelper.random(this.intervalMin, this.intervalMax);
            // set timeout
            this.timeout = setTimeout(this.type.bind(this, typer, callback), interval);
        } else if(this.currentIndex==this.text.length-1 && !!callback) {
            // dispatch event
            this.dispatchEvent(Typer.EVENT_TYPEEND);
            callback.call(this, typer);
        }
    };
    // steps 1 character back
    this.back = function back(typer) {
        if(this.currentIndex>-1) {
            this.currentIndex--;
            typer.element.innerHTML = typer.element.innerHTML.substring(0, typer.element.innerHTML.length - 1);
            // dispatch event
            this.dispatchEvent(Typer.EVENT_BACK);
        }
    };
    // reverts the whole string
    this.revert = function revert(typer, callback) {
        if(this.currentIndex>-1) {
            // remove 1 character
            this.back(typer);
            // set timeout for next one
            var interval = TyperHelper.random(this.intervalMin, this.intervalMax);
            this.timeout = setTimeout(this.revert.bind(this, typer, callback), interval);
        } else if(this.currentIndex==-1 && !!callback) {
            // dispatch event
            this.dispatchEvent(Typer.EVENT_REVERTEND);
            callback.call(this, typer);
        }
    };
    // stops typing if busy
    this.stop = function stop() {
        // dispatch event
        this.dispatchEvent(Typer.EVENT_STOP);
        window.clearInterval(this.timeout);
    };
    // set to string
    this.toString = function toString() {
        return this.text;
    };
};
TyperHelper.addEventSupport(Text_TyperEntry);


// stops the typing
var Stop_TyperEntry = function Stop_TyperEntry() {
    this.type = function type(typer, callback) {
        typer.stop();
        // no need to call callback since this is a stop
        // do dispatch event
        this.dispatchEvent(Typer.EVENT_TYPEEND);
    };
    this.back = function back(typer) {
        this.dispatchEvent(Typer.EVENT_BACK);
    };
    this.revert = function revert(typer, callback) {
        this.dispatchEvent(Typer.EVENT_REVERTEND);
    };
    this.stop = function stop() {
        this.dispatchEvent(Typer.EVENT_STOP);
    };
    this.toString = function() {
        return 'Stop';
    };
};
TyperHelper.addEventSupport(Stop_TyperEntry);

// Pauses for x amount of miliseconds
var Pause_TyperEntry = function Pause_TyperEntry(time) {
    this.time = time;
    this.type = function type(typer, callback) {
        setTimeout((function() {
            // dispatch event
            this.entry.dispatchEvent(Typer.EVENT_TYPEEND);
            this.callback.call(this.typer, this.typer);
        }).bind({
            entry: this,
            typer: typer,
            callback: callback
        }), this.time);
    }
    this.back = function back(typer) {
        this.dispatchEvent(Typer.EVENT_BACK);
    };
    this.revert = function revert(typer, callback){
        this.dispatchEvent(Typer.EVENT_REVERTEND);
        callback.call(this, typer);
    };
    this.stop = function stop() {
        this.dispatchEvent(Typer.EVENT_STOP);
    };
    this.toString = function() {
        return 'Pause';
    };
};
TyperHelper.addEventSupport(Pause_TyperEntry);

var Element_TyperEntry = function Element_TyperEntry(name, text, options, events, min, max) {
    this.typer = false;
    this.element = false;
    this.name = name;
    this.text = text;
    // options and events
    this.options = (!options) ? {} : options;
    this.events = (!events) ? {} : events;
    // timing config
    this.intervalMin = (!min) ? 30 : min;
    this.intervalMax = (!max) ? 60 : max;

    // creates html element from options
    this.html = function html() {
        // create input
        var el = document.createElement(this.name);
        // bind attritbutes
        for(var i in this.options) {
            el.setAttribute(i, this.options[i]);
        };
        // bind events
        for(var i in this.events) {
            el.addEventListener(i, this.events[i]);
        }
        return el;
    };

    this.type = function type(typer, callback) {
        // add element
        this.element = typer.element.appendChild(this.html());
        // initialize sub typer
        this.typer = new Typer(this.element, this.intervalMin, this.intervalMax);
        // add text entry
        this.typer.add(Typer.TYPE_TEXT, this.text, this.intervalMin, this.intervalMax);
        // type it out
        this.typer.type((function() {
            this.entry.dispatchEvent(Typer.EVENT_TYPEEND);
            this.callback.call(this.entry, this.typer);
        }).bind({
            entry: this,
            typer: typer,
            callback: callback
        }));
    };

    this.back = function back(typer) {
        if(this.typer.currentIndex>-1) {
            this.typer.back((function() {
                this.entry.dispatchEvent(Typer.EVENT_BACK);
            }).bind({
                entry: this
            }));
        } else if(this.typer.currentIndex==-1) {
            // remove element and typer
            this.element.parentNode.removeChild(this.element);
            this.typer = false;
            this.dispatchEvent(Typer.EVENT_BACK);
        }
    };
    this.revert = function revert(typer, callback) {
        this.typer.revert((function() {
            this.entry.back(this.typer);
            this.entry.dispatchEvent(Typer.EVENT_REVERTEND);
            if(!!this.callback) {
                this.callback.call(this.entry, this.typer);
            }
        }).bind({
            entry: this,
            typer: typer,
            callback: callback
        }));
    };
    this.stop = function stop() {
        this.typer.stop();
        this.dispatchEvent(Typer.EVENT_STOP);
    };
};
TyperHelper.addEventSupport(Element_TyperEntry);

/**
 * Typer core class
 */
var Typer = function Typer(element, min, max) {
    // check element 
    if(typeof element == 'string') {
        this.element = document.querySelector(element);
    } else { this.element = element; }
    // initialize entries
    this.entries = [];
    // config min , max
    this.intervalMin = (!min) ? 30 : min;
    this.intervalMax = (!max) ? 60 : max;
    // initialize current index
    this.currentIndex = -1;
    this.timeout = false;

    // throw
    this.invalidTyperType = function invalidTyperType(type) {
        return new Error('The Typer Type you passed  is invalid ('+type+')');
    };

    // to add an entry
    this.add = function add(entry) {
        if(typeof entry == 'object') {
            // check whether object is a valid type
            if(entry.constructor.name in Typer.TYPE_NAMES) {
                this.entries.push(entry);
            } else { throw this.invalidTyperType(entry.constructor.name); }
        } else if(typeof entry == 'string') {
            // given a type name
            if(entry in window) {
                var cls = window[entry];
                this.entries.push(new (cls.bind.apply(cls, arguments))());
            } else { throw this.invalidTyperType(entry); }
        }
        // return last entry
        return this.entries[this.entries.length - 1];
    };

    // types out all entries
    this.type = function type(callback) {
        if(this.currentIndex<this.entries.length-1 && this.entries.length>0) {
            // execute 1 step
            this.currentIndex++;
            this.entries[this.currentIndex].type(this, (function() {
                // set timeout
                var interval = TyperHelper.random(this.typer.intervalMin, this.typer.intervalMax);
                this.typer.timeout = setTimeout(this.typer.type.bind(this.typer, this.callback), interval);
            }).bind({
                typer: this,
                callback: callback
            }));
        } else if(this.currentIndex==this.entries.length-1 && !!callback) {
            callback.call(this, this);
        }
    };

    // reverts all entries
    this.revertTo = function revertTo(index, callback) {
        if(this.currentIndex>index) {
            // revert one entry
            this.entries[this.currentIndex].revert(this, (function() {
                // set timeout
                var interval = TyperHelper.random(this.typer.intervalMin, this.typer.intervalMax);
                this.typer.timeout = setTimeout(this.typer.revertTo.bind(this.typer, this.index, this.callback), interval);
            }).bind({
                typer: this,
                index: index,
                callback: callback
            }));
            this.currentIndex--;
        } else if(this.currentIndex==index && !!callback) {
            callback.call(this, this);
        }
    };

    // revert all the way back to the start
    this.revert = function revert(callback) {
        this.revertTo(-1, callback);
    };
    
    // steps 1 back
    this.back = function back(callback) {
        this.revertTo(this.currentIndex-1, callback);
    };

    // stops typing or reverting
    this.stop = function stop() {
        window.clearInterval(this.timeout);
    }
};

Typer.TYPE_TEXT = 'Text_TyperEntry';
Typer.TYPE_STOP = 'Stop_TyperEntry';
Typer.TYPE_PAUSE = 'Pause_TyperEntry';
Typer.TYPE_ELEMENT = 'Element_TyperEntry';

Typer.EVENT_TYPEEND = new Event('typeend');
Typer.EVENT_BACK = new Event('back');
Typer.EVENT_REVERTEND = new Event('revertend');
Typer.EVENT_STOP = new Event('stop');