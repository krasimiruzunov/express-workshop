const path = require('path')

const rootPath = path.normalize(path.join(__dirname, '/../../'))
const limits = [5, 10, 20, 50]

module.exports = {
  development: {
    rootPath: rootPath,
    db: 'mongodb://localhost:27017/forum-system-db',
    port: 1234,
    sessionSecret: 'forum-secret',
    limits: limits
  },
  production: {
    rootPath: rootPath,
    db: process.env.MONGO_DB,
    port: process.env.port,
    sessionSecret: process.env.SESSION_SECRET,
    limits: limits
  }
}
