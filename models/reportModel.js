const mongoose = require('mongoose');

const reportModelSchema = new mongoose.Schema({

    uploadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Upload',
        required: true
    }, 

    scores: {
        data: {type: Number, required: true},
        coverage: {type: Number, required: true},
        rules: {type: Number, required: true},
        posture: {type: Number, required: true},
        overall: {type: Number, required: true},
    },

    coverage: {
        matched: [String],
        close: [Object],
        missing: [String],
    }, 

    ruleFindings: [Object], 
    createdAt: {
        type: Date,
        default: Date.now
    },


});
module.exports = mongoose.model('Report', reportModelSchema);