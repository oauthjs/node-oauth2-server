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
      .expect(400, /The access token was not found/i, done);
  });

  it('should not allow invalid token as query param', function (done){
    request(app)
      .get('/?access_token=JKNW-9382j-JK83h2-notarealtoken')
      .expect(401, /The access token provided is invalid/, done);
  });

  it('should allow valid token as query param', function (done){
    request(app)
      .get('/?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .expect(200, /Secret area/, done);
  });

  it('should require application/x-www-form-urlencoded when access token is ' +
      'in body', function (done) {
    request(app)
      .post('/')
      .send({ access_token: 'JKNW-9382j-JK83h2-ak3aiUIW' })
      .expect(400, /content type must be application\/x-www-form-urlencoded/i,
        done);
  });

  it('should not allow GET when access token in body', function (done) {
    request(app)
      .get('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: 'JKNW-9382j-JK83h2-ak3aiUIW' })
      .expect(400, /method cannot be GET/i, done);
  });

  it('should allow valid token in body', function (done){
    request(app)
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: 'JKNW-9382j-JK83h2-ak3aiUIW' })
      .expect(200, /Secret area/, done);
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
      .set('Authorization', 'Bearer JKNW-9382j-JK83h2-ak3aiUIW')
      .expect(200, /Secret area/, done);
  });

  it('should allow exactly one method (get: query + auth)', function (done) {
    request(app)
      .get('/?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .set('Authorization', 'Invalid')
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + body)', function (done) {
    request(app)
      .post('/?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .send({
        access_token: 'JKNW-9382j-JK83h2-ak3aiUIW'
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + empty body)', function (done) {
    request(app)
      .post('/?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .send({
        access_token: ''
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should detect expired token', function (done){
    request(app)
      .get('/?access_token=test-9382j-JK83h2-expired')
      .expect(401, /the access token provided has expired/i, done);
  });

  it('should passthrough with valid, non-expiring token (token = null)', 
      function (done) {
    request(app)
      .get('/?access_token=test-9382j-never-expired')
      .expect(200, /Secret area/, done);
  });

  it('should expose the user id when setting userId', function (done) {
    app.get('/mockaroute', app.oauth.authorise(), function (req, res) {
      req.should.have.property('user');
      req.user.should.have.property('id');
      req.user.id.should.equal('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      res.send('Testing if user id is present internally');
    });

    request(app)
      .get('/mockaroute?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .expect(200, /Testing if user id is present internally/, done);
  });

  it('should expose the user id when setting user object', function (done) {
    app.get('/mockarouteforuserobject', app.oauth.authorise(), function (req, res) {
      req.should.have.property('user');
      req.user.should.have.property('id');
      req.user.id.should.equal('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      req.user.should.have.property('firstname');
      req.user.firstname.should.equal('Thom');
      res.send('Testing if user details are present internally');
    });

    request(app)
      .get('/mockarouteforuserobject?access_token=JKNW-9382j-JK83h2-ak3aiUIW')
      .expect(200, /Testing if user details are present internally/, done);
  });

});