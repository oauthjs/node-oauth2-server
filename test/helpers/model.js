const scopes = ['read', 'write'];

function createModel (db) {
  async function getUser (username, password) {
    return db.findUser(username, password);
  }

  async function getClient (clientId, clientSecret) {
    return db.findClient(clientId, clientSecret);
  }

  async function saveToken (token, client, user) {
    const meta = {
      clientId: client.id,
      userId: user.id,
      scope: token.scope,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt
    };

    token.client = client;
    token.user = user;

    if (token.accessToken) {
      db.saveAccessToken(token.accessToken, meta);
    }

    if (token.refreshToken) {
      db.saveRefreshToken(token.refreshToken, meta);
    }

    return token;
  }

  async function getAccessToken (accessToken) {
    const meta = db.findAccessToken(accessToken);

    if (!meta) {
      return false;
    }

    return {
      accessToken,
      accessTokenExpiresAt: meta.accessTokenExpiresAt,
      user: db.findUserById(meta.userId),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    };
  }

  async function getRefreshToken (refreshToken) {
    const meta = db.findRefreshToken(refreshToken);

    if (!meta) {
      return false;
    }

    return {
      refreshToken,
      refreshTokenExpiresAt: meta.refreshTokenExpiresAt,
      user: db.findUserById(meta.userId),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    };
  }

  async function revokeToken (token) {
    db.deleteRefreshToken(token.refreshToken);

    return true;
  }

  async function verifyScope (token, scope) {
    if (typeof scope === 'string') {
      return scopes.includes(scope);
    } else {
      return scope.every(s => scopes.includes(s));
    }
  }

  return  {
    getUser,
    getClient,
    saveToken,
    getAccessToken,
    getRefreshToken,
    revokeToken,
    verifyScope
  };
}

module.exports = createModel;
