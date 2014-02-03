var express = require('express'),
  oauthserver = require('./');

var app = express();

app.configure(function() {
  app.oauth = oauthserver({
    model: {}, // See below for specification
    grants: ['password'],
    debug: true
  });
  app.use(express.bodyParser()); // REQUIRED
});

app.all('/oauth/token', app.oauth.grant);

app.get('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?redirect=' + req.path + '&client_id=' + req.query.client_id +
      '&redirect_uri=' + req.query.redirect_uri);
  }

  res.render('authorise', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

app.post('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?client_id=' + req.query.client_id +
      '&redirect_uri=' + req.query.redirect_uri);
  }

  next();
}, app.oauth.codeGrant);

app.post('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?client_id=' + req.query.client_id +
      '&redirect_uri=' + req.query.redirect_uri);
  }

  next();
}, app.oauth.codeGrant(function (req, next) {
  next(null, req.body.allow === 'yes', req.session.user.id, req.session.user);
}), function (err, req, res, next) {
  res.render('authoriseError');
});

app.get('/login', function (req, res, next) {
  res.render('login', {
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

app.post('/login', function (req, res, next) {
  if (req.body.email !== 'thom@nightworld.com') {
    res.render('login', {
      redirect: req.body.redirect,
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri
    });
  } else {
    return res.redirect((req.body.redirect || '/home') + '?client_id=' + req.body.client_id +
      '&redirect_uri=' + req.body.redirect_uri);
  }
});

app.get('/one', function (req, res) {
  res.send('Secret area');
});


app.get('/two', app.oauth.bypass, function (req, res) {
  res.send('Secret area');
});

app.use(app.oauth.errorHandler());

app.oauth.lockdown(app);
app.listen(3000);