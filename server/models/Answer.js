const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate')
const requiredValidationMessage = '{PATH} is required'

let answerSchema = new mongoose.Schema({
  text: { type: String, required: requiredValidationMessage },
  thread: {type: mongoose.Schema.Types.ObjectId, ref: 'Thread'},
  comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
  votesUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  votesDown: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalVotes: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

answerSchema.pre('remove', function (next) {
  let Comment = require('mongoose').model('Comment')
  Comment.find({ answer: this._id })
    .exec()
    .then(comments => {
      for (let i = 0; i < comments.length; i++) {
        comments[i].remove()
      }
    })
  next()
})

answerSchema.post('remove', function (doc) {
  let Thread = require('mongoose').model('Thread')
  Thread.findById(this.thread)
    .exec()
    .then(thread => {
      if (thread) {
        thread.answers = thread.answers.filter(answer => { return answer.toString() !== this._id.toString() })
        thread.totalAnswers = thread.answers.length
        thread.save()
      }
    })
})

answerSchema.plugin(uniqueValidator)
answerSchema.plugin(mongoosePaginate)

mongoose.model('Answer', answerSchema)
