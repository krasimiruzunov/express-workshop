const mongoose = require('mongoose')
const deepPopulate = require('mongoose-deep-populate')(mongoose)
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let threadSchema = new mongoose.Schema({
  title: { type: String, required: requiredValidationMessage, unique: true },
  description: { type: String, required: requiredValidationMessage },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: requiredValidationMessage },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  totalAnswers: { type: Number, default: 0 },
  lastAnswer: { type: Date },
  votesUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  votesDown: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalVotes: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

threadSchema.pre('remove', function (next) {
  let Answer = require('mongoose').model('Answer')
  Answer.find({ thread: this._id })
    .exec()
    .then(answers => {
      for (let i = 0; i < answers.length; i++) {
        answers[i].remove()
      }
    })
  next()
})

threadSchema.post('remove', function (doc) {
  let Category = require('mongoose').model('Category')
  Category.findById(this.category)
    .exec()
    .then(category => {
      if (category) {
        category.threads = category.threads.filter(thread => { return thread.toString() !== this._id.toString() })
        category.totalThreads = category.threads.length
        category.save()
      }
    })
})

threadSchema.plugin(deepPopulate)
threadSchema.plugin(uniqueValidator)
threadSchema.plugin(mongoosePaginate)

mongoose.model('Thread', threadSchema)
