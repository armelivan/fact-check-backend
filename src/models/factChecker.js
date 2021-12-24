const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const factChecker = new Schema({
  name:{
    type:String,
    unique:true,
    default:null
  },
  source: {
    type:String,
    unique:true,
    default:null
  },
  IFCN_member:Boolean,
  containsScore:{
    type:Boolean,
    default:false
  },
  scoreSystem:{
    type:String
  },
  numberOfAssociatedUrl:{
    type:Number,
    default:0
  },
  averageScore:Number,
  associatedFactsUrl:{
    type:[{
      type: mongoose.SchemaTypes.ObjectId,
      ref:'Url'
    }],
    default:[]
  } 
}, {
  timestamps: true
});

const FactChecker = mongoose.model('FactChecker',factChecker);
module.exports = FactChecker;