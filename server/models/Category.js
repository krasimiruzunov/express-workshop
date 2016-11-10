const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let categorySchema = new mongoose.Schema({
  name: { type: String, required: requiredValidationMessage, unique: true },
  threads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
  totalThreads: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

categorySchema.pre('remove', function (next) {
  let Thread = require('mongoose').model('Thread')
  Thread.find({ category: this._id })
    .exec()
    .then(threads => {
      for (let i = 0; i < threads.length; i++) {
        threads[i].remove()
      }
    })
  next()
})

categorySchema.plugin(uniqueValidator)
categorySchema.plugin(mongoosePaginate)

mongoose.model('Category', categorySchema)
