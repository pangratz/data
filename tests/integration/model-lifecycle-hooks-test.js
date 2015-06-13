import { setupStore } from 'dummy/tests/helpers/store';
import Ember from 'ember';

import {module, test} from 'qunit';

import DS from 'ember-data';
import isEnabled from 'ember-data/-private/features';

if (isEnabled('ds-references')) {
  var Person, Family, env;

  const { attr, belongsTo, hasMany } = DS;
  const { run } = Ember;

  var didInitRelationshipCallCount, didReceiveRelationshipCallCount, didUpdateRelationshipCallCount;
  var didInitDataCallCount, didReceiveDataCallCount, didUpdateDataCallCount;

  const resetCounter = function() {
    didInitRelationshipCallCount = didReceiveRelationshipCallCount = didUpdateRelationshipCallCount = 0;
    didInitDataCallCount = didReceiveDataCallCount = didUpdateDataCallCount = 0;
  };

  module("integration/model-lifecycle-hooks", {
    setup: function() {
      Person = DS.Model.extend({
        name: attr('string'),
        family: belongsTo('family')
      });

      Family = DS.Model.extend({
        persons: hasMany('person')
      });

      env = setupStore({
        person: Person,
        family: Family
      });

      resetCounter();
    },

    teardown: function() {
      run(env.container, 'destroy');
    }
  });

  test('did[XXX]Relationship hooks are called when initializing a new belongsTo relationship', function(assert) {
    let familyReference;

    Person.reopen({
      didInitRelationship: function(name, reference) {
        didInitRelationshipCallCount++;
        assert.equal(name, 'family');
        assert.deepEqual(reference, familyReference);
      },

      didReceiveRelationship: function(name, reference) {
        didReceiveRelationshipCallCount++;
        assert.equal(name, 'family');
        assert.deepEqual(reference, familyReference);
      },

      didUpdateRelationship: function() {
        didUpdateRelationshipCallCount++;
      }
    });

    run(function() {
      var family = env.store.push({ data: { type: 'family', id: 1 } });
      var person = env.store.createRecord('person', { id: 1, family: family });
      familyReference = person.belongsTo('family');
    });

    assert.equal(didInitRelationshipCallCount, 1);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 0);
  });

  test('did[XXX]Relationship hooks are called when changing a belongsTo relationship', function(assert) {
    let person, familyReference;

    run(function() {
      var family = env.store.push({ data: { type: 'family', id: 1 } });
      person = env.store.createRecord('person', { id: 1, family: family });
      familyReference = person.belongsTo('family');
    });

    person.reopen({
      didInitRelationship: function(name, reference) {
        didInitRelationshipCallCount++;
      },

      didReceiveRelationship: function(name, reference) {
        didReceiveRelationshipCallCount++;
        assert.equal(name, 'family');
        assert.deepEqual(reference, familyReference);
      },

      didUpdateRelationship: function(name, reference) {
        didUpdateRelationshipCallCount++;
        assert.equal(name, 'family');
        assert.deepEqual(reference, familyReference);
      }
    });

    run(function() {
      var newFamily = env.store.push({ data: { type: 'family', id: 2 } });
      person.set('family', newFamily);
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);

    resetCounter();

    run(function() {
      person.set('family', null);
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);
  });

  test('did[XXX]Relationship hooks are called when initializing a new hasMany relationship', function(assert) {
    let personsReference;

    Family.reopen({
      didInitRelationship: function(name, reference) {
        didInitRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      },

      didReceiveRelationship: function(name, reference) {
        didReceiveRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      },

      didUpdateRelationship: function() {
        didUpdateRelationshipCallCount++;
      }
    });

    run(function() {
      var person = env.store.push({ data: { type: 'person', id: 1 } });
      var family = env.store.createRecord('family', { id: 1, persons: [person] });
      personsReference = family.hasMany('persons');
    });

    assert.equal(didInitRelationshipCallCount, 1);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 0);
  });

  test('did[XXX]Relationship hooks are called when changing a hasMany relationship', function(assert) {
    let family, personsReference;

    run(function() {
      var person = env.store.push({ data: { type: 'person', id: 1 } });
      family = env.store.createRecord('family', { id: 1, persons: [person] });
      personsReference = family.hasMany('persons');
    });

    family.reopen({
      didInitRelationship: function(name, reference) {
        didInitRelationshipCallCount++;
      },

      didReceiveRelationship: function(name, reference) {
        didReceiveRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      },

      didUpdateRelationship: function(name, reference) {
        didUpdateRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      }
    });

    run(function() {
      var person = env.store.push({ data: { type: 'person', id: 2 } });
      family.set('persons', [person]);
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);

    resetCounter();

    run(function() {
      family.set('persons', []);
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);
  });

  test('did[XXX]Relationship hooks are called when updating a hasMany relationship', function(assert) {
    let family, personsReference;

    run(function() {
      var person = env.store.push({ data: { type: 'person', id: 1 } });
      family = env.store.createRecord('family', { id: 1, persons: [person] });
      personsReference = family.hasMany('persons');
    });

    family.reopen({
      didInitRelationship: function(name, reference) {
        didInitRelationshipCallCount++;
      },

      didReceiveRelationship: function(name, reference) {
        didReceiveRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      },

      didUpdateRelationship: function(name, reference) {
        didUpdateRelationshipCallCount++;
        assert.equal(name, 'persons');
        assert.deepEqual(reference, personsReference);
      }
    });

    run(function() {
      family.get('persons').createRecord({ id: 2 });
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);

    resetCounter();

    run(function() {
      family.get('persons').clear();
    });

    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 1);
    assert.equal(didUpdateRelationshipCallCount, 1);

    resetCounter();

    run(function() {
      family.get('persons').clear();
    });

    // hooks are not invoked when content doesn't change anymore
    assert.equal(didInitRelationshipCallCount, 0);
    assert.equal(didReceiveRelationshipCallCount, 0);
    assert.equal(didUpdateRelationshipCallCount, 0);
  });

  test('did[XXX]Relationship hooks are not called when relationship is not specified upon creating a record', function(assert) {
    assert.expect(0);

    Person.reopen({
      didInitRelationship: function(name, relationship) {
        assert.ok(false, "didInitRelationship should not be triggered");
      },

      didReceiveRelationship: function(name, relationship) {
        assert.ok(false, "didReceiveRelationship should not be triggered");
      },

      didUpdateRelationship: function(name, relationship) {
        assert.ok(false, "didUpdateRelationship should not be triggered");
      }
    });

    run(function() {
      env.store.createRecord('person', { id: 1 });
    });
  });

  test('did[XXX]Data hooks are invoked when data by adapter is provided', function(assert) {
    let personReference;

    const expectedPayload = {
      data: {
        type: 'person',
        id: '1'
      }
    };

    env.adapter.findRecord = function() {
      return { id: 1 };
    };

    Person.reopen({
      didInitData: function(reference, payload) {
        didInitDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      },

      didReceiveData: function(reference, payload) {
        didReceiveDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      },

      didUpdateData: function(reference, payload) {
        didUpdateDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      }
    });

    run(function() {
      personReference = env.store.getReference('person', 1);

      env.store.findRecord('person', 1).then(function(person) {
        assert.equal(didInitDataCallCount, 1);
        assert.equal(didReceiveDataCallCount, 1);
        assert.equal(didUpdateDataCallCount, 0);

        resetCounter();

        return person.reload();
      }).then(function() {
        assert.equal(didInitDataCallCount, 0);
        assert.equal(didReceiveDataCallCount, 1);
        assert.equal(didUpdateDataCallCount, 1);
      });
    });
  });

  test('did[XXX]Data hooks are invoked when record is created and updated', function(assert) {
    let person, personReference;

    const expectedPayload = {
      data: {
        type: 'person',
        id: '1'
      }
    };

    env.adapter.createRecord = function() {
      return { id: 1 };
    };

    env.adapter.updateRecord = function() {
      return { id: 1 };
    };

    Person.reopen({
      didInitData: function(reference, payload) {
        didInitDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      },

      didReceiveData: function(reference, payload) {
        didReceiveDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      },

      didUpdateData: function(reference, payload) {
        didUpdateDataCallCount++;
        assert.deepEqual(reference, personReference);
        assert.deepEqual(payload, expectedPayload);
      }
    });

    run(function() {
      person = env.store.createRecord('person', {});

      // check that hooks are not invoked when a new record is created
      assert.equal(didInitDataCallCount, 0);
      assert.equal(didReceiveDataCallCount, 0);
      assert.equal(didUpdateDataCallCount, 0);
    });

    run(function() {
      personReference = env.store.getReference('person', 1);

      person.save().then(function() {
        assert.equal(didInitDataCallCount, 1);
        assert.equal(didReceiveDataCallCount, 1);
        assert.equal(didUpdateDataCallCount, 0);

        resetCounter();

        return person.save();
      }).then(function() {
        assert.equal(didInitDataCallCount, 0);
        assert.equal(didReceiveDataCallCount, 1);
        assert.equal(didUpdateDataCallCount, 1);
      });
    });
  });

}
