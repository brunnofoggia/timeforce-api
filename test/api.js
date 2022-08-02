import assert from 'assert';
import { assert as chaiAssert } from 'chai';
import axios from 'axios';
import _ from 'lodash';
import _state from 'timeforce-state';

import { env, timeforce, relation, state, app, appService, jsonToQueryString } from './helpers/setup.js';

const HOST = 'http://127.0.0.1:3000';

// solves do problem when working with listeners
const doneOnce = function (_done) {
    var c = 0;
    return function () {
        if (c > 0) return;
        c++;
        _done.apply(null, arguments);
    }
}

describe('Api start', function () {
    beforeEach((done) => {
        done();
    });

    it('api provider check', async function () {
        var { data } = await axios.get(HOST);
        assert.equal(data, 'api');
        var response = await axios.get(HOST + '/country');
        assert.ok(response.data.length > 0);
    });
});

describe('Api integration', function () {
    var country, person, paginated;

    var PaginatedCollection = timeforce.Collection.extend({
        className: 'paginatedCollection',
        url: HOST + '/paginated',
    });
    var CountryCollection = timeforce.Collection.extend({
        className: 'countryCollection',
        url: HOST + '/country',
    });
    var PersonModel = timeforce.Model.extend({
        className: 'personModel',
        urlRoot: HOST + '/person',
    });
    var HouseModel = timeforce.Model.extend({
        className: 'houseModel',
        urlRoot: HOST + '/house',
    });
    var RentModel = timeforce.Model.extend({
        className: 'rentModel',
        urlRoot: HOST + '/rent',
        relationsMap: [
            {
                name: 'house',
                model: HouseModel,
                type: relation.BELONGSTO,
                foreignKey: 'ativoId'
            },
            {
                name: 'person',
                model: PersonModel,
                type: relation.HASMANY,
                foreignKey: 'envolvidos.usuarioId'
            }
        ]
    });
    var rentId = 68, rent;

    beforeEach((done) => {
        env.dispatch = '';
        done();
    });

    it('API collection', function (_done) {
        var done = doneOnce(_done);

        country = new CountryCollection();

        country.on('fetch:ready', (obj) => {
            try {
                assert.equal(country.state, state.READY);
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(country.models.length, 3);
                assert.equal(_.size(country.toJSON()[0]), 4);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        country.fetch();
        assert.equal(country.state, state.WAITING);
    });

    it('API read', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel({ id: 1 });

        person.on('fetch:ready', (obj) => {
            try {
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(person.state, state.READY);
                assert.ok(_.size(person.attributes) > 1);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        person.fetch();
        assert.equal(person.state, state.WAITING);
    });

    it('API post', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel();
        person.set('email', 'x@x.com');
        person.set('nome', 'nome sobrenome');

        person.on('save:ready', (obj) => {
            try {
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(person.state, state.READY);
                assert.ok(_.size(person.attributes) > 1);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        person.save();
        assert.equal(person.state, state.WAITING);
    });

    it('API put', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel({ id: 4 });

        person.fetch().then(() => {
            try {
                assert.ok(person.isReady());
                assert.ok(_.size(person.attributes) > 1);
                person.set('email', 'y@y.com');
                person.save().then(() => {
                    try {
                        assert.ok(_.size(person.attributes) > 1);
                        var person2 = new PersonModel({ id: 4 });

                        person2.fetch().then(() => {
                            try {
                                assert.equal(person2.get('email'), 'y@y.com');
                                assert.ok(person2.get('updated'));
                                done();
                            } catch (err) {
                                done(err);
                            }
                        });
                    } catch (err) {
                        done(err);
                    }
                });
            } catch (e) {
                console.log('error', e);
            }
        });
        assert.equal(person.state, state.WAITING);
    });

    it('API delete', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel({ id: 4 });

        person.destroy().then(() => {
            try {
                assert.ok(person.checkState(state.READY, state.type.DESTROY));
                person.fetch().catch((error) => {
                    assert.equal(error[1], 404);
                    done();
                });
            } catch (e) {
                console.log('error', e);
            }
        });
    });

    it('API read unexistent', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel({ id: 10 });

        person.on('fetch:broken', (obj) => {
            try {
                assert.equal(obj.state, state.BROKEN);
                assert.ok(!obj.isReady());
                assert.ok(obj.isBroken());
                assert.equal(_.size(person.attributes), 1);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        person.fetch();
        assert.equal(person.state, state.WAITING);
    });

    it('API collection with filters on GET', function (_done) {
        var done = doneOnce(_done);

        country = new CountryCollection();
        country.setForm('filters.region', 'xyz');

        country.on('fetch:ready', (obj) => {
            try {
                assert.equal(env.syncArgs.options.querystring, jsonToQueryString(country.form.toJSON()));
                assert.equal(country.state, state.READY);
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(country.models.length, 3);
                assert.equal(_.size(country.toJSON()[0]), 4);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        country.fetch();
        assert.equal(country.state, state.WAITING);
    });

    it('API collection with filters on POST', function (_done) {
        var done = doneOnce(_done);

        country = new CountryCollection();
        country.setForm('filters.region', 'xyz');
        country.sendFormAsPost = true;

        country.on('fetch:ready', (obj) => {
            try {
                assert.deepEqual(env.syncArgs.options.data, country.form.toJSON());
                assert.equal(country.state, state.READY);
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(country.models.length, 3);
                assert.equal(_.size(country.toJSON()[0]), 4);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        country.fetch();
        assert.equal(country.state, state.WAITING);
    });

    it('API collection with pagination setup', function (_done) {
        var done = doneOnce(_done);

        paginated = new PaginatedCollection();
        paginated.setForm('filters.region', 'xyz');

        paginated.on('fetch:ready', (obj) => {
            try {
                assert.equal(env.syncArgs.options.querystring, jsonToQueryString(_.pick(paginated.form.toJSON(), 'filters')));
                assert.equal(paginated.state, state.READY);
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(paginated.models.length, 3);
                assert.equal(_.size(paginated.toJSON()[0]), 4);
                assert.ok(_.isPlainObject(paginated.form.get('pagination')));
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        paginated.fetch();
        assert.equal(paginated.state, state.WAITING);
    });

    it('API model with hasMany relation sync and state', function (_done) {
        var done = doneOnce(_done);
        var rentId = 68,
            rent = new RentModel({ id: rentId });
        rent.on('fetch:ready', () => {
            try {
                // console.log(rent.attributes.ativoId, rent.getRelation('house')?.id, rent.getRelation('house')?.attributes.id);
                assert.equal(rent.get('id'), rentId);
                assert.equal(rent.state, state.READY);
                assert.ok(rent.isReady());
                done();
            } catch (e) {
                console.log('error', e);
            }

        });
        rent.fetch();
        assert.equal(rent.state, state.WAITING);
    });

});


describe('ES6 classes', function () {
    var country, person;
    class CountryCollection extends timeforce.Collection {
        className = 'countryCollection'
        url = HOST + '/country'
    }
    class PersonModel extends timeforce.Model {
        className = 'personModel'
        urlRoot = HOST + '/person'
    }

    beforeEach((done) => {
        env.dispatch = '';
        done();
    });

    it('API collection', function (_done) {
        var done = doneOnce(_done);

        country = new CountryCollection();

        country.on('fetch:ready', (obj) => {
            try {
                assert.equal(country.state, state.READY);
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(country.models.length, 3);
                assert.equal(_.size(country.toJSON()[0]), 4);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        country.fetch();
        assert.equal(country.state, state.WAITING);
    });

    it('API read', function (_done) {
        var done = doneOnce(_done);

        person = new PersonModel({ id: 1 });

        person.on('fetch:ready', (obj) => {
            try {
                assert.equal(obj.state, state.READY);
                assert.ok(obj.isReady());
                assert.equal(person.state, state.READY);
                assert.ok(_.size(person.attributes) > 1);
                done();
            } catch (e) {
                console.log('error', e);
            }
        });
        person.fetch();
        assert.equal(person.state, state.WAITING);
    });
});

describe('Api close', function () {
    it('api provider close', function () {
        appService.close();
    });
});