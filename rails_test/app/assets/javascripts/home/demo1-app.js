﻿var DemoApp;
DemoApp = Ember.Application.create();
window.DemoApp = DemoApp;


/*
 Class definitions
 */

DemoApp.Person = Entity.define(Entity, "Person", {
    first_name:String,
    last_name:String,
    date_of_birth:Date,

    fullName:function () {
        return this.get('last_name') + ", " + this.get('first_name');
    }.property('first_name', 'last_name')
});

DemoApp.Gift = Entity.define(Entity, "Gift", {
    from:DemoApp.Person
});



/* now create some sample people */
function createSamplePersons() {
    var personsDS = Entity.Stores.get(DemoApp.Person);
    var p1 = DemoApp.Person.create({
        id:123,
        first_name:"Aaron",
        last_name:"Bourne",
        date_of_birth:new Date()
    });
    personsDS.add(p1);
    var serialized = p1.serialize();
    personsDS.add(DemoApp.Person.create({
        id:234,
        first_name:"Bonnie",
        last_name:"Highways"
    })
    );
    personsDS.add(DemoApp.Person.create({
        id:345,
        first_name:"Daddy",
        last_name:"Peacebucks"
    })
    );
    personsDS.add(DemoApp.Person.create({
        id:456,
        first_name:"Cotton",
        last_name:"Kandi"
    })
    );
}
createSamplePersons();

function loadPeople(data){
    Entity.Stores.get(DemoApp.Person).bulkLoad(data, DemoApp.Person);
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
        { name:'Shirt', excitement:'1', fromPersonId:234},
        { name:'Game System', excitement:'5', fromPersonId:123},
        { name:'Movie', excitement:'4', fromPersonId:345},
        { name:'Gift Card', excitement:'3', fromPersonId:123},
        { name:'MP3 Player', excitement:'3', fromPersonId:456},
        { name:'Tie', excitement:'1', fromPersonId:456},
        { name:'Candy', excitement:'3', fromPersonId:234},
        { name:'Coffee', excitement:'3', fromPersonId:123},
        { name:'Blanket', excitement:'2', fromPersonId:456},
        { name:'Camera', excitement:'4', fromPersonId:234},
        { name:'Phone', excitement:'5', fromPersonId:234},
        { name:'Socks', excitement:'1', fromPersonId:123},
        { name:'Game', excitement:'5', fromPersonId:456}
    ];

    var moreGiftsIndex = moreGifts.length;

    $.ajax("/person/index", {
       dataType : 'json',
       success: function(data, textStatus, jqXHR) {
           debugger;
           loadPeople(data);
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
    addMoreGifts();
});