var mongoose = require('mongoose');

var fileSchema = new mongoose.Schema({
    filename: String,
    user:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        },
        username: String
    },
   date: { type: String},
    hashArray : [String],
    size: Number,
   description: String
});

module.exports = mongoose.model("File", fileSchema);