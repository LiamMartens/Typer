# Typer
Javascript library to type out stuff

## How to use
### Create an instance
First you need to create a new `Typer` instance as shown below
```
var t = new Typer(element, {min interval}, {max interval});
```
The `Typer` takes at most 3 parameters being the `element` which can be a string or an `HTMLElement`, the `min interval` which is de minimum type interval in miliseconds and the `max interval` which is the maximum type interval in miliseconds. The intervals are optional and `Typer` is initialized with 30 and 60 miliseconds by default.

### Add types
Now you have an instance you can start adding types. At this point in time there are 5 different types.

#### Text type
Use the text type to type out plain old text. You can add a text entry like so
```
t.add(Typer.TYPE_TEXT, 'I want to type out this text', {min interval}, {max interval});
// or
t.add('Text_TyperEntry', 'I want to type out this text', {min interval}, {max interval});
// or
t.add(new Text_TyperEntry('I want to type out this text', {min interval}, {max interval}),
```

#### Stop type
Use the stop type to stop typing at a certain point in the text. This can be useful when you need input from the user for example. Add a stop entry like so
```
t.add(Typer.TYPE_STOP);
// or
t.add('Stop_TyperEntry');
// or
t.add(new Stop_TyperEntry());
```

### Pause type
Use the pause type to pause typing for a certain amount of time, but not stop completely. Add a pause entry like so
```
t.add(Typer.TYPE_PAUSE, {time in ms});
// or
t.add('Pause_TyperEntry', {time in ms});
// or
t.add(new Pause_TyperEntry({time in ms}));
```

### Element type
Use the element type to insert a DOM element with text, options and events. Add one like so
```
t.add(Typer.TYPE_INPUT, {element type}, {text}, {attributes}, {events});
// or
t.add('Input_TyperEntry', {element type}, {text}, {attributes}, {events});
// or
t.add(new Input_TyperEntry({element type}, {text}, {attributes}, {events}));
```
Both the `attributes` and `events` arguments are objects like this
```
// attributes
{
    'attr-name': 'value',
}
// events
{
    'eventname': function() {}
}
```

## Events
All types dispatch certain events at certain points. These are `typeend`, `revertend`, `back` and `stop`. You can attach to an event like so
```
t.add(Typer.TYPE_TEXT, 'Hello world').addEventListener('typeend', function(event) {
    // event code
});
```

## Creating custom Typer types
Adding a custom Typer type is fairly straightforward and requires only a little bit of code. Look at the template below
```
var Custom_TyperEntry = function Custom_TyperEntry(arg0, arg1, arg2) {
    // types out your type and executes a callback
    this.type = function type(typer, callback) {
        this.dispatchEvent(Typer.EVENT_TYPEEND);
        callback.call(this, typer);
    }

    // goes 1 step back
    this.back = function back(typer) {
        this.dispatchEvent(Typer.EVENT_BACK);
    };

    // reverts the whole type instance
    this.revert = function revert(typer, callback){
        this.dispatchEvent(Typer.EVENT_REVERTEND);
        callback.call(this, typer);
    };

    // stops typing if busy
    this.stop = function stop() {
        this.dispatchEvent(Typer.EVENT_STOP);
    };
};
TyperHelper.addEventSupport(Custom_TyperEntry);
Typer.TYPE_CUSTOM = 'Custom_TyperEntry';
```
As you can see in the template you need a couple of things. First off you'll need a function to initialize your type. The custom type is expected to contain at least 4 methods being `type`, `back`, `revert` and `stop`. Secondly, you call the `TyperHelper.addEventSupport` method to add event support to your type. This is not mandatory, but if you want to use `dispatchEvent` and `addEventListener` you will have add the support. Lastly you have to register the type in the `Typer` core and that's it!