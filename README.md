# EmberJS - EZData

EZData is a library intended to a simple way of accessing data from a relational database when using [Ember.js](http://emberjs.com/). It will
never try to be everything to everyone. :)  Instead, it's intended to be small, efficient, and easy to learn and use
javascript library.

The basic functionality is that it's designed to manipulate individual entities (or Records), not a complex object
structure that is often stored as JavaScript objects. This mirrors what's found in many web systems today in the data model.

Right now, the project is brand new and quite in flux.

## Essentials

Create types by calling `Entity.define` (instead of the typical Ember.Object.extend).

```javascript
DemoApp.Person = Entity.define(Entity, "Person", {
    firstName:String,
    lastName:String,
    DOB:Date,

    fullName:function () {
        return this.get('lastName') + ", " + this.get('firstName');
    }.property('firstName', 'lastName')
});
```

This will create a new Class internally by using `Ember.extend` but it also does some other magic (e.g., creating
a data store for all entities of a given type). First and foremost, by calling `define`, it's expected that
you're mirroring a relational data structure of some sort which may have foreign key relationships to other tables.

In the example above, the `Person` entity is expected to have the following columns in a database table:

* id => Number (from the basic Entity type)
* firstName => String
* lastName => String
* DOB => DOB

Each property is assigned the basic data type that it will contain. The data type is used for linking and serialization.

## Linking

The second example is a `Gift`:

```javascript
DemoApp.Gift = Entity.define(Entity, "Gift", {
    from:DemoApp.Person
});
```

The Gift class is more interesting as one of the properties links to another type/Class (Person). As a direct connection
to a Person as an object instance isn't possible in traditional relational tables, some automatic linking occurs by
declaring this linkage.

The `from` property is mapped to a second, hidden property that is only used for the foreign key relationship. By default,
the hidden property will be called `fromPersonId`. This can be overridden by creating a custom naming function, replacing
the default stored at `Entity.Settings.FOREIGN_KEY_GENERATOR_FUNCTION`.

By making the linkage between the two types in the way demonstrated above, the standard Ember.js handlebar templating engine
(and automatic value updating) features just work (see `from.fullName` below).

```html
{{#each gifts}}
<tr>
    <td>
        {{ name }}
    </td>
    <td>
        {{ excitement }}
    </td>
    <td>
        {{ from.fullName }}
    </td>
</tr>
```
The `fullName` property of Person is a computed property, and continues to work as expected.

## Getting the Data

If you want to retrieve a list from one of the data stores (or data tables), it's a simple as calling the `live` function
for one of the stores.

In the example below, there are two live collections. The first returns all of the gifts, and the second only returns
gifts that have a lowercase letter `o` in the name.

```javascript
// create some "live" connections to the data store
DemoApp.mainController.set('gifts', Entity.Stores.get(DemoApp.Gift).live());
// create a live connection with a filter (returns true if it contains the letter 'o')
DemoApp.mainController.set('giftsFiltered', Entity.Stores.get(DemoApp.Gift).live(
    function () {
        return this.get('name').indexOf('o') > -1;
    }));
```
To get access to one of the automatically created data stores, call `Entity.Stores.get({Class})` where `{Class}` is the type
that was created using the `define` method.

## Notes / Cautions
Right now, all entities are required to have a property called id and be of type Number.