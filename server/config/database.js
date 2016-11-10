const mongoose = require('mongoose')

mongoose.Promise = global.Promise

module.exports = (config) => {
  mongoose.connect(config.db)

  let db = mongoose.connection

  db.once('once', err => {
    if (err) {
      throw err
    }

    console.log('Database ready to use!')
  })

  db.on('error', err => {
    throw err
  })

  require('../models/User').seedAdminUser()
  require('../models/Category')
  require('../models/Thread')
  require('../models/Answer')
  require('../models/Comment')
}
