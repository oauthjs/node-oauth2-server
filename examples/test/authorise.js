/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var express = require('express'),
  bodyParser = require('body-parser'),
  request = require('supertest'),
  should = require('should');

var app = require('./../postgresql/index').app;

describe('Authorise', function() {

  it('should detect no access token', function (done) {
    request(app)
      .get('/')
      .expect(400, /the access token was not found/i, done);
  });

  it('should allow valid token as query param', function (done){
    request(app)
      .get('/?access_token=thom')
      .expect(200, /nightworld/, done);
  });

  it('should require application/x-www-form-urlencoded when access token is ' +
      'in body', function (done) {
    request(app)
      .post('/')
      .send({ access_token: 'thom' })
      .expect(400, /content type must be application\/x-www-form-urlencoded/i,
        done);
  });

  it('should not allow GET when access token in body', function (done) {
    request(app)
      .get('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: 'thom' })
      .expect(400, /method cannot be GET/i, done);
  });

  it('should allow valid token in body', function (done){
    request(app)
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: 'thom' })
      .expect(200, /nightworld/, done);
  });

  it('should detect malformed header', function (done) {
    request(app)
      .get('/')
      .set('Authorization', 'Invalid')
      .expect(400, /malformed auth header/i, done);
  });

  it('should allow valid token in header', function (done){
    request(app)
      .get('/')
      .set('Authorization', 'Bearer thom')
      .expect(200, /nightworld/, done);
  });

  it('should allow exactly one method (get: query + auth)', function (done) {
    request(app)
      .get('/?access_token=thom')
      .set('Authorization', 'Invalid')
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + body)', function (done) {
    request(app)
      .post('/?access_token=thom')
      .send({
        access_token: 'thom'
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + empty body)', function (done) {
    request(app)
      .post('/?access_token=thom')
      .send({
        access_token: ''
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should detect expired token', function (done){
    request(app)
      .get('/?access_token=thom')
      .expect(401, /the access token provided has expired/i, done);
  });

  it('should passthrough with valid, non-expiring token (token = null)',
      function (done) {
    request(app)
      .get('/?access_token=thom')
      .expect(200, /nightworld/, done);
  });

  it('should expose the user id when setting userId', function (done) {
    app.get('/mockaroute', app.oauth.authorise(), function (req, res) {
      req.should.have.property('user');
      req.user.should.have.property('id');
      req.user.id.should.equal(1);
      res.send('nightworld');
    });

    request(app)
      .get('/mockaroute?access_token=thom')
      .expect(200, /nightworld/, done);
  });

  it('should expose the user id when setting user object', function (done) {
    app.get('/mockarouteforuserobject', app.oauth.authorise(), function (req, res) {
      req.should.have.property('user');
      req.user.should.have.property('id');
      req.user.id.should.equal(1);
      req.user.should.have.property('name');
      req.user.name.should.equal('thom');
      res.send('nightworld');
    });

    request(app)
      .get('/mockarouteforuserobject?access_token=thom')
      .expect(200, /nightworld/, done);
  });

});