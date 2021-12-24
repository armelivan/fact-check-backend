const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const metaDataSchema = new Schema({
  title:{
    type:String,
    required:true,
    unique:true
  },
  author:String,
  keywords:{
    type:[String]
  },
  description:String,
  publishedTime:Date,
  modifiedTime:Date,
  sourceUrl:{
    type:String,
    required:true
  }
}, {
  timestamps: true
});

const MetaData = mongoose.model('MetaData',metaDataSchema);
module.exports = MetaData;