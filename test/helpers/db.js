class DB {
  constructor () {
    this.users = new Map();
    this.clients = [];
    this.accessTokens = new Map();
    this.refreshTokens= new Map();
  }

  saveUser (user) {
    this.users.set(user.id, user);

    return user;
  }

  findUser (username, password) {
    return Array.from(this.users.values()).find(user => {
      return user.username === username && user.password === password;
    });
  }

  findUserById (id) {
    return this.users.get(id);
  }

  saveClient (client) {
    this.clients.push(client);

    return client;
  }

  findClient (clientId, clientSecret) {
    return this.clients.find(client => {
      if (clientSecret) {
        return client.id === clientId && client.secret === clientSecret;
      } else {
        return client.id === clientId;
      }
    });
  }

  findClientById (id) {
    return this.clients.find(client => client.id === id);
  }

  saveAccessToken (accessToken, meta) {
    this.accessTokens.set(accessToken, meta);
  }

  findAccessToken (accessToken) {
    return this.accessTokens.get(accessToken);
  }

  deleteAccessToken (accessToken) {
    this.accessTokens.delete(accessToken);
  }

  saveRefreshToken (refreshToken, meta) {
    this.refreshTokens.set(refreshToken, meta);
  }

  findRefreshToken (refreshToken) {
    return this.refreshTokens.get(refreshToken);
  }

  deleteRefreshToken (refreshToken) {
    this.refreshTokens.delete(refreshToken);
  }
}

module.exports = DB;
