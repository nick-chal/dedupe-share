var mongoose = require('mongoose');

var fileSchema = new mongoose.Schema({
    filename: String,
    user:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        },
        username: String
    }
});

module.exports = mongoose.model("File", fileSchema);