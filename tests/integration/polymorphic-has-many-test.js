import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';

import {module, test} from 'qunit';

import DS from 'ember-data';

const { belongsTo, hasMany } = DS;
const { run } = Ember;

let store;

const Person = DS.Model.extend({
  pets: hasMany({ polymorphic: true }),
  addresses: hasMany()
});

const Address = DS.Model.extend({
  person: belongsTo()
});

const Pet = DS.Model.extend({
  person: belongsTo()
});

const Cat = Pet.extend({});

module('integration/polymorphic-has-many - Polymorphic HasMany', {
  beforeEach() {
    let env = setupStore({
      person: Person,
      address: Address,
      pet: Pet,
      cat: Cat
    });
    store = env.store;
  },

  afterEach() {
    run(store, 'destroy');
  }
});


test('deleting child record upates parent relationship correctly - #4434', (assert) => {
  let done = assert.async();
  let person, address, cat;

  run(function() {
    person = store.createRecord('person');
    address = store.createRecord('address', { person });
    cat = store.createRecord('cat', { person });

    person.get("addresses").addObject(address);
    person.get("pets").addObject(cat);

    assert.equal(person.get("addresses.length"), 1);
    assert.equal(person.get("pets.length"), 1);

    address.deleteRecord();
    cat.deleteRecord();

    assert.equal(person.get("addresses.length"), 0);
    assert.equal(person.get("pets.length"), 0);

    done();
  });
});
