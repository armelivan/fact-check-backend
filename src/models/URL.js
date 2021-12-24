const mongoose = require('mongoose');
const MetaData = require('./metadata');
const FactChecker = require('./factChecker') 
const Schema = mongoose.Schema;

const url = new Schema({
  reachable:{
    type:Boolean,
    required:true
  },
  // specific to when a FactCheck value is added 
  latTimeScoreUpdated:Date,
  containsKeywords:{
    type:Boolean,
    default:false
  },
  containsMetadata:{
    type:Boolean,
    default:false
  },
  // Looks if contains fact score,not aggregateScore
  containsScore:{
    type:Boolean,
    default:false
  },
  containsAssociatedFactCheck:{
    type:Boolean,
    default:false
  },
  numberOfTimeReached:Number,
  // Kewords Generated From the NLP algorithms they have to be added in 
  keyWordsList :{
    type :[String],
    default:[]
  },
  // contains the claims taken from the API
  associatedFactCheckers:{
   type:[{
    type: mongoose.SchemaTypes.ObjectId,
    ref:'FactChecker',
   }],
   default:[]
  },
  sourceUrl:{
    type:String,
    required:true,
    unique:true // only one identifier by url object 
  },
  metaData: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'MetaData',
    default:null
  },
  score:{
    aggregated:{
      type:Number,
      default:0
    },
    scoreField:{
      type:[{
        type:String
      }
      ],
      default:[]
    }
      
  }
}, {
  timestamps: true
});

const Url = mongoose.model('Url',url);
module.exports = Url;