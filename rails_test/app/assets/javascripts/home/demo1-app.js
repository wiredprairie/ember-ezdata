var DemoApp;
DemoApp = Ember.Application.create();
window.DemoApp = DemoApp;


/*
 Class definitions
 */

DemoApp.Person = Entity.define(Entity, "Person", {
    first_name:String,
    last_name:String,
    date_of_birth:Date,

    full_name:function () {
        return this.get('last_name') + ", " + this.get('first_name');
    }.property('first_name', 'last_name')
});

// create the "GIFT" entity class
DemoApp.Gift = Entity.define(Entity, "Gift", {
    from:DemoApp.Person
});

function loadPeople(data){
    // use the shortcut method to loading data (just saves a line)

    DemoApp.Person.store.bulkLoad(data);
    //Entity.Stores.bulkLoad(DemoApp.Person, );
}


DemoApp.mainController = Ember.Object.create({
    gifts:null,
    giftsFiltered:null,
    newGift:function (details) {
        var gift = DemoApp.Gift.create(details);
        Entity.Stores.get(DemoApp.Gift).add(gift);
        return gift;
    }
});

// create some "live" connections to the data store
DemoApp.mainController.set('gifts', Entity.Stores.get(DemoApp.Gift).live());
// create a live connection with a filter (returns true if it contains the letter 'o')
DemoApp.mainController.set('giftsFiltered', Entity.Stores.get(DemoApp.Gift).live(
    function () {
        return this.get('name').indexOf('o') > -1;
    }));

var giftsView = Ember.View.create({
    templateName:'gifts',
    giftsBinding:'DemoApp.mainController.gifts',
    giftsFilteredBinding:'DemoApp.mainController.giftsFiltered',
    giftReason:'Birthday 2011'
});

$(function () {
    var moreGifts = [
        { name:'Book', excitement:'3', fromPersonId:3 },
        { name:'Shirt', excitement:'1', fromPersonId:1},
        { name:'Game System', excitement:'5', fromPersonId:2},
        { name:'Movie', excitement:'4', fromPersonId:3},
        { name:'Gift Card', excitement:'3', fromPersonId:3},
        { name:'MP3 Player', excitement:'3', fromPersonId:2},
        { name:'Tie', excitement:'1', fromPersonId:4},
        { name:'Candy', excitement:'3', fromPersonId:3},
        { name:'Coffee', excitement:'3', fromPersonId:4},
        { name:'Blanket', excitement:'2', fromPersonId:2},
        { name:'Camera', excitement:'4', fromPersonId:1},
        { name:'Phone', excitement:'5', fromPersonId:2},
        { name:'Socks', excitement:'1', fromPersonId:3},
        { name:'Game', excitement:'5', fromPersonId:3}
    ];

    var moreGiftsIndex = moreGifts.length;

    $.ajax("/person/index", {
       dataType : 'json',
       success: function(data, textStatus, jqXHR) {
           loadPeople(data);
           addMoreGifts();
       }

    });

    function addMoreGifts() {
        moreGiftsIndex--;
        if (moreGiftsIndex >= 0) {
            DemoApp.mainController.newGift(moreGifts[moreGiftsIndex]);
        }
        setTimeout(addMoreGifts, 750);
    }

    giftsView.append();
});