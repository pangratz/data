import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';

import {module, test} from 'qunit';

import DS from 'ember-data';

var Post, env;
var run = Ember.run;

module("integration/records/save - Save Record", {
  beforeEach() {
    Post = DS.Model.extend({
      title: DS.attr('string')
    });

    Post.toString = function() { return "Post"; };

    env = setupStore({ post: Post });
  },

  afterEach() {
    run(env.container, 'destroy');
  }
});

test("Will resolve save on success", function(assert) {
  assert.expect(4);
  var post;
  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  var deferred = Ember.RSVP.defer();
  env.adapter.createRecord = function(store, type, snapshot) {
    return deferred.promise;
  };

  run(function() {
    var saved = post.save();

    // `save` returns a PromiseObject which allows to call get on it
    assert.equal(saved.get('id'), undefined);

    deferred.resolve({ id: 123 });
    saved.then(function(model) {
      assert.ok(true, 'save operation was resolved');
      assert.equal(saved.get('id'), 123);
      assert.equal(model, post, "resolves with the model");
    });
  });
});

test("Will reject save on error", function(assert) {
  var post;
  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  env.adapter.createRecord = function(store, type, snapshot) {
    var error = new DS.InvalidError([{ title: 'not valid' }]);

    return Ember.RSVP.reject(error);
  };

  run(function() {
    post.save().then(function() {}, function() {
      assert.ok(true, 'save operation was rejected');
    });
  });
});

test("Retry is allowed in a failure handler", function(assert) {
  var post;
  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  var count = 0;

  env.adapter.createRecord = function(store, type, snapshot) {
    var error = new DS.InvalidError([{ title: 'not valid' }]);

    if (count++ === 0) {
      return Ember.RSVP.reject(error);
    } else {
      return Ember.RSVP.resolve({ id: 123 });
    }
  };

  run(function() {
    post.save().then(function() {}, function() {
      return post.save();
    }).then(function(post) {
      assert.equal(post.get('id'), '123', "The post ID made it through");
    });
  });
});

test("Repeated failed saves keeps the record in uncommited state", function(assert) {
  assert.expect(4);
  var post;

  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  env.adapter.createRecord = function(store, type, snapshot) {
    return Ember.RSVP.reject();
  };

  run(function() {
    post.save().then(null, function() {
      assert.ok(post.get('isError'));
      assert.equal(post.get('currentState.stateName'), 'root.loaded.created.uncommitted');

      post.save().then(null, function() {
        assert.ok(post.get('isError'));
        assert.equal(post.get('currentState.stateName'), 'root.loaded.created.uncommitted');
      });
    });
  });
});

test("Repeated failed saves with invalid error marks the record as invalid", function(assert) {
  assert.expect(2);
  var post;

  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  env.adapter.createRecord = function(store, type, snapshot) {
    var error = new DS.InvalidError([
      {
        detail: 'is invalid',
        source: { pointer: 'data/attributes/title' }
      }
    ]);

    return Ember.RSVP.reject(error);
  };

  run(function() {
    post.save().then(null, function() {
      assert.equal(post.get('isValid'), false);

      post.save().then(null, function() {
        assert.equal(post.get('isValid'), false);
      });
    });
  });
});

test("Repeated failed saves with invalid error without payload marks the record as invalid", function(assert) {
  assert.expect(2);
  var post;

  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  env.adapter.createRecord = function(store, type, snapshot) {
    var error = new DS.InvalidError();

    return Ember.RSVP.reject(error);
  };

  run(function() {
    post.save().then(null, function() {
      assert.equal(post.get('isValid'), false);

      post.save().then(null, function() {
        assert.equal(post.get('isValid'), false);
      });
    });
  });
});

test("Will reject save on invalid", function(assert) {
  assert.expect(1);
  var post;
  run(function() {
    post = env.store.createRecord('post', { title: 'toto' });
  });

  env.adapter.createRecord = function(store, type, snapshot) {
    var error = new DS.InvalidError([{ title: 'not valid' }]);

    return Ember.RSVP.reject(error);
  };

  run(function() {
    post.save().then(function() {}, function() {
      assert.ok(true, 'save operation was rejected');
    });
  });
});

test("save while a created record is inFlight raises an assertion", function(assert) {
  var post;

  run(function() {
    post = env.store.createRecord('post', {});
  });

  var firstSave;
  env.adapter.createRecord = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      firstSave = resolve;
    });
  };

  run(function() {
    post.save();
  });

  env.adapter.createRecord = function() {
    assert.ok(false, "createRecord should not be called");
  };

  run(function() {
    assert.expectAssertion(function() {
      post.save();
    }, "You cannot save a record which is currently inFlight; wait until the previous save() is finished");
  });

  run(function() {
    // resolve the first save, so the record is not in the inFlight state
    // anymore; this is needed as records in the inFlight state cannot be
    // unloaded which raises an exception when the store is destroyed in the
    // tests' afterEach
    firstSave();
  });
});

test("save while an updated record is inFlight raises an assertion", function(assert) {
  var post;

  run(function() {
    post = env.store.push({
      data: {
        type: 'post',
        id: 1
      }
    });

    post.set("title", "new title");
  });

  var firstSave;
  env.adapter.updateRecord = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      firstSave = resolve;
    });
  };

  run(function() {
    post.save();
  });

  env.adapter.updateRecord = function() {
    assert.ok(false, "updateRecord should not be called");
  };

  run(function() {
    assert.expectAssertion(function() {
      post.save();
    }, "You cannot save a record which is currently inFlight; wait until the previous save() is finished");
  });

  run(function() {
    // resolve the first save, so the record is not in the inFlight state
    // anymore; this is needed as records in the inFlight state cannot be
    // unloaded which raises an exception when the store is destroyed in the
    // tests' afterEach
    firstSave();
  });
});

test("save while a deleted record is inFlight raises an assertion", function(assert) {
  var post;

  run(function() {
    post = env.store.push({
      data: {
        type: 'post',
        id: 1
      }
    });

    post.deleteRecord();
  });

  var firstSave;
  env.adapter.deleteRecord = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      firstSave = resolve;
    });
  };

  run(function() {
    post.save();
  });

  env.adapter.deleteRecord = function() {
    assert.ok(false, "deleteRecord should not be called");
  };

  run(function() {
    assert.expectAssertion(function() {
      post.save();
    }, "You cannot save a record which is currently inFlight; wait until the previous save() is finished");
  });

  run(function() {
    // resolve the first save, so the record is not in the inFlight state
    // anymore; this is needed as records in the inFlight state cannot be
    // unloaded which raises an exception when the store is destroyed in the
    // tests' afterEach
    firstSave();
  });
});
