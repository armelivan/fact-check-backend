const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const urlList = new Schema({
// to specify 
urls:{
  type:{
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Url',
  }
},
numberOfUrls:{
  type:Number,
  default:0
}
}, {
  timestamps: true
});

const UrlList = mongoose.model('UrlList',urlList);
module.exports = UrlList;