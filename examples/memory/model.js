var model = module.exports;

// In-memory datastores:
var _oauth_access_tokens = [],
    _oauth_refresh_tokens = [],
    _oauth_clients = [
        {
            client_id : "demo_client",
            client_secret : "0000deadbeef0000",
            redirect_uri : "http://www.demowebservice.com/landingpage"
        },
        {
            client_id : "johndoes_pc",
            client_secret : "ffff0000dddd",
            redirect_uri : null
        }
    ],
    _authorizedClientIds = {
        password: [
            "demo_client", 
            "johndoes_pc"
        ],
        refresh_token: [
            "demo_client"
        ]
    },
    _users = [
        {
            id : "1337",
            username: "johndoe123",
            password: "johni5C00L"
        },
        {
            id: "1234",
            username: "apiuser@someclient.com",
            password: "client123"
        }
    ];

// Debug function to dump the state of the data stores
model.dump = function() {
    console.log("_oauth_access_tokens", _oauth_access_tokens);
    console.log("_oauth_clients", _oauth_clients);
    console.log("_authorizedClientIds", _authorizedClientIds);
    console.log("_oauth_refresh_tokens", _oauth_refresh_tokens);
    console.log("_users", _users);
};

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
    var found = _oauth_access_tokens.some(function(o,i,a) {
        if(o.access_token === bearerToken) {
            callback(null, o);
            return true;
        }
        return false;
    });
    
    if(!found) {
        callback(null, found);
    }
};

model.getRefreshToken = function (bearerToken, callback) {
    var found = _oauth_refresh_tokens.some(function(o,i,a) {
        if(o.refresh_token === bearerToken) {
            callback(null, o);
            return true;
        }
        return false;
    });
    
    if(!found) {
        callback(null, found);
    }
};

model.getClient = function (clientId, clientSecret, callback) {
    var found = _oauth_clients.some(function(o,i,a) {
        if(o.client_id === clientId && o.client_secret === clientSecret) {
            callback(null, o);
            return true;
        }
        return false;
    });
    
    if(!found) {
        callback(null, found);
    }
};

model.grantTypeAllowed = function (clientId, grantType, callback) {
    callback(false, 
             _authorizedClientIds[grantType] && 
             _authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0
            );
};

model.saveAccessToken = function (accessToken, clientId, userId, expires, callback) {
    _oauth_access_tokens.unshift({
        access_token: accessToken,
        client_id: clientId,
        user_id: userId,
        expires: expires
    });

    callback(false);
};

model.saveRefreshToken = function (refreshToken, clientId, userId, expires, callback) {
    _oauth_refresh_tokens.unshift({
        refresh_token: refreshToken,
        client_id: clientId,
        user_id: userId,
        expires: expires
    });

    callback(false);
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
    var found = _users.some(function(o,i,a) {
        if(o.username === username && o.password === password) {
            callback(null, o);
            return true;
        }
        return false;
    });
    
    if(!found) {
        callback(null, found);
    }
};
