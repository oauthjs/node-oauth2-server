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
  should = require('should'),
  model = require('../model');

var oauth2server = require('../../../');

var bootstrap = function (oauthConfig) {
  var app = express(),
    oauth = oauth2server(oauthConfig || {
      model: model,
      grants: ['password', 'refresh_token']
    });

  app.set('json spaces', 0);
  app.use(bodyParser());

  app.all('/oauth/token', oauth.grant());

  app.use(oauth.errorHandler());

  return app;
};

describe('Granting with refresh_token grant type', function () {
  it('should detect missing refresh_token parameter', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['password', 'refresh_token']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'refresh_token',
                      client_id: client.clientId,
                      client_secret: client.clientSecret
                    })
                    .expect(400, /no \\"refresh_token\\" parameter/i, done);
              }
            });
          }
        });
      }
    });
  });

  it('should detect invalid refresh_token', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['password', 'refresh_token']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'refresh_token',
                      client_id: client.clientId,
                      client_secret: client.clientSecret,
                      refresh_token: 'abc1234'
                    })
                    .expect(400, /invalid refresh token/i, done);
              }
            });
          }
        });
      }
    });




  });

  it('should detect wrong client id', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {


                var refreshToken = {};
                refreshToken.refreshToken = 'clientRefresh' + new Date().getTime();
                refreshToken.user = { id: 'username', username: 'username' };
                refreshToken.expires = new Date();
                refreshToken.expires.setSeconds(refreshToken.expires.getSeconds() + 60 * 60); //1hr
                refreshToken.clientId = 'clientName';

                model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function(err){
                  if(err){
                    console.log(err);
                    done();
                  } else {
                    var app = bootstrap({
                      model: model,
                      grants: ['password', 'refresh_token']
                    });

                    request(app)
                        .post('/oauth/token')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                          grant_type: 'refresh_token',
                          client_id: client.clientId,
                          client_secret: client.clientSecret,
                          refresh_token: refreshToken.refreshToken
                        })
                        .expect(400, /invalid refresh token/i, done);
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('should detect expired refresh token', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {


                var refreshToken = {};
                refreshToken.refreshToken = 'clientRefresh' + new Date().getTime();
                refreshToken.user = {id: 'username', username: 'username'};
                refreshToken.expires = new Date();
                refreshToken.expires.setSeconds(refreshToken.expires.getSeconds() - 60); //expired
                refreshToken.clientId = client.clientId;

                model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function (err) {
                  if (err) {
                    console.log(err);
                    done();
                  } else {
                    var app = bootstrap({
                      model: model,
                      grants: ['password', 'refresh_token']
                    });

                    request(app)
                        .post('/oauth/token')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                          grant_type: 'refresh_token',
                          client_id: client.clientId,
                          client_secret: client.clientSecret,
                          refresh_token: refreshToken.refreshToken
                        })
                        .expect(400, /refresh token has expired/i, done);
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('should allow valid request', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {


                var refreshToken = {};
                refreshToken.refreshToken = 'clientRefresh' + new Date().getTime();
                refreshToken.user = {id: 'username', username: 'username'};
                refreshToken.expires = new Date();
                refreshToken.expires.setSeconds(refreshToken.expires.getSeconds() + 3600);
                refreshToken.clientId = client.clientId;

                model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function (err) {
                  if (err) {
                    console.log(err);
                    done();
                  } else {

                    var app = bootstrap({
                      model: model,
                      grants: ['password', 'refresh_token']
                    });

                    request(app)
                        .post('/oauth/token')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                          grant_type: 'refresh_token',
                          client_id: client.clientId,
                          client_secret: client.clientSecret,
                          refresh_token: refreshToken.refreshToken
                        })
                        .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('should allow valid request with user object', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {


                var refreshToken = {};
                refreshToken.refreshToken = 'clientRefresh' + new Date().getTime();
                refreshToken.user = {id: 'username', username: 'username'};
                refreshToken.expires = new Date();
                refreshToken.expires.setSeconds(refreshToken.expires.getSeconds() + 3600);
                refreshToken.clientId = client.clientId;

                model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function (err) {
                  if (err) {
                    console.log(err);
                    done();
                  } else {
                    var app = bootstrap({
                      model: model,
                      grants: ['password', 'refresh_token']
                    });

                    request(app)
                        .post('/oauth/token')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                          grant_type: 'refresh_token',
                          client_id: client.clientId,
                          client_secret: client.clientSecret,
                          refresh_token: refreshToken.refreshToken
                        })
                        .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);
                  }
                });
              }
            });
          }
        });
      }
    });

  });

  it('should allow valid request with non-expiring token (token= null)', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            model.saveAuthorizedClientIds('refresh_token', client.clientId, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {


                var refreshToken = {};
                refreshToken.refreshToken = 'clientRefresh' + new Date().getTime();
                refreshToken.user = {id: 'username', username: 'username'};
                refreshToken.expires = null;
                refreshToken.clientId = client.clientId;

                model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function (err) {
                  if (err) {
                    console.log(err);
                    done();
                  } else {
                    var app = bootstrap({
                      model: model,
                      grants: ['password', 'refresh_token']
                    });

                    request(app)
                        .post('/oauth/token')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                          grant_type: 'refresh_token',
                          client_id: client.clientId,
                          client_secret: client.clientSecret,
                          refresh_token: refreshToken.refreshToken
                        })
                        .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);
                  }
                });
              }
            });
          }
        });
      }
    });


  });
});
