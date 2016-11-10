const mongoose = require('mongoose')
const requiredValidationMessage = '{PATH} is required'

let commentSchema = new mongoose.Schema({
  text: { type: String, required: requiredValidationMessage },
  answer: {type: mongoose.Schema.Types.ObjectId, ref: 'Answer'},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

mongoose.model('Comment', commentSchema)
