const mongoose = require('mongoose');
const FactChecker = require('./factChecker') 
const Schema = mongoose.Schema;

const factCheckerList = new Schema({
name:{
  type:String,
  required:true
},
factCheckers:{
  type:[{
  type: mongoose.SchemaTypes.ObjectId,
  ref:'FactChecker',
}],
default:[]
},
numberOfFactChek:Number
}, {
  timestamps: true
});

const FactChekersList = mongoose.model('FactCheckerList',factCheckerList);
module.exports = FactChekersList;