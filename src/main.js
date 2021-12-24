/**
 * Imports 
 */

//JS Files 
const contain = require('./dataHandling/contain');
const get = require('./dataHandling/get') 
const set = require('./dataHandling/set')
const score= require('./score/scoreHelpers')

//Object Models 
const FactChecker = require('./models/factChecker');
const FactCheckersList = require('./models/factCheckerList');
const Url = require('./models/URL');
const MetaData = require('./models/metadata');
const UrlList = require('./models/urlList');

// variables 
require("dotenv").config()
const LISTNAME = process.env.LISTNAME;
const INTERVAL = process.env.INTERVAL;
const EMAIL= process.env.EMAIL;
const PASS = process.env.PASS;
const TO = process.env.TO; 

// useful modules 
const nodemailer =require('nodemailer');


/**
 * Helpers
 */

// return True or False
//@param {list} assFL
//@return {boolean} 
const isAssociatedFactlistEmpty = (assFL)=>{
  try{
     return assFL.length==0;
  }catch(error){
   //console.log('not in here')
   console.log(error)
 }
}

//return les infos pertinent si contenus dans le claim 
//@ param {claim} claim
//@ return {"name":name,"site":site} returnValue
const getFactCheckInfoFromClaim =(claim)=>{
 let returnValue ={"name":null,"site":null}
 if ("name" in claim["claimReview"][0]["publisher"]){
     const name = claim["claimReview"][0]["publisher"]["name"]
     if(name!=""){
       returnValue["name"]=name
     }
 }
 if ("site" in claim["claimReview"]["publisher"]){
   const site = claim["claimReview"]["publisher"]["site"]
   if(site!=""){
     returnValue["site"]=site
   }
}
return returnValue; 
}

// Is there a score field and value in the fact 
//@param {claim} fact
//@return {boolean} value 
const factContainScore=(fact)=>{
  if("textualRating" in fact["claimReview"][0]){
    if(fact["claimReview"][0]["textualRating"]!=""){
      return true
    }
  }
  return false
 }
 
 //takes a claim extracts it's value
 // and transform it in a CamelCase Format
 //@param {claim} fact 
 //@param {claim} fact 
const extractAndTransFormFact= function camalize(fact) {
  const thescore = fact["claimReview"][0]["textualRating"]
  return thescore.toLowerCase().replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9]+(.)/g, (m, chr) => chr.toUpperCase());
 }

// Find New Facts base on existing NLP facts
//@ param {string} url
//@return {asociatedFactList}
const getNewFact = async (url)=>{
  let keywords = await get.getNlpKeywords(url)["data"] // Look in the already existing keywords
  return await get.getNewFactsFromKey(keywords,url)
}
 


/**
 * Regular Functions
 */

//@param:{Obj} url 
//@return {obj} responseObject
const main = (urlObj)=> {
   console.log("main:")
   return  urlHandling(urlObj["url"]);
}

//@param:{string} url 
//@return {obj} responseObject
const urlHandling= (url)=>{
  console.log("urlHandling:")
 return  urlInDbOperation(url);
}

//@param:{string} url 
//@return {obj} responseObject
const urlInDbOperation = async (url)=>{
 if(await contain.isUrlInDB(url)){
   return isLinkReachableOperation(url)
 }else{
   //the url is not in the DB  
   await set.addUrl(url);
   return reachLinkOperation(url);
 }
}

//@param:{string} url 
//@return {obj} responseObject
const isLinkReachableOperation= async (url)=>{
  console.log("LinkreachOp:ok")
 if (await contain.isLinkReachable(url)){
   return isThereAScoreOperation(url);
 }else{
   return reachLinkOperation(url)
 } 
}

//@param:{string} url 
//@return {obj} responseObject
const isThereAScoreOperation= async (url)=>{
  console.log("isThereAscoreOp:ok")
 if(await contain.isThereAscore(url)){
   return istheScoreUpdateOperation(url)
 }else{
   return getScoreOperation(url)
 }
}

//@param:{string} url 
//@return {obj} responseObject
const istheScoreUpdateOperation= async (url)=>{
  console.log("isTheScoreUpdateOp:ok")
 if(await contain.isTheScoreUpdated(url)){
   console.log("u1")
   return updateAndGetScore(url,15);
 }else{
   return updateScoreOperation(url);
 }
}

/*
1. get the actual score elements in the scoreListScoreField 
 => format them{id:value,date:...},{...}
2. Takes different claims=>
 try to find corresponfing FactChecker in DB: 
   if not possible -> put it in difference 
   if possible->form object of format {id:value,date:dateOfclaim }
   for that particular element look if it's value is founded in the associated element: 
     if so: 
       pass
     else: 
       put it into the difference 
     => return diffence 
*/
//@param:{string} url 
//@return {obj} responseObject
const updateScoreOperation= async (url)=>{
 console.log("updateScoreOperation:ok")
 const actualFactCheckList = await  score.getScoreField(url) // actual factCheks
 const newFactCheck = await get.getFactsFromMetaData(url)// list of FactClaim found from the elements
 const containDifferentFactCheckObject = {"url":url,"factScoresField":actualFactCheckList,"newClaim":newFactCheck}
 const difference = await contain.containDifferentFactCheck(containDifferentFactCheckObject)
 // it is not empty 
 if(difference){ 
   return newFactCheckOperation(url,difference)
 }else{
   return updateAndGetScore(url,16)
 }
}


/* consider Fact object in a list, find the associated Fact-checkers 
to those fact, compute the corresponding score and the agregate score and 
return a response object
*/
//@param{string}:url
//@param{List}:[FactCheck])
//@return {obj} responseObject
const newFactCheckOperation= async (url,ListOfClaims)=>{
  console.log("newFactCheckOperation:ok")

 for(let fact  of ListOfClaims){
   // each fact or claims contain info on it's specific factChecker
   // We need to compute their values 
   const factInfo = getFactCheckInfoFromClaim(fact)
   if(await contain.isFactCheckRegistered(factInfo)){ //is the factChecker of this fat registered 
     computeScoreOperation(fact,url)           //Need to see if the FactChecker contains already a scoring system
     await set.updateFactChecker(factInfo,url)      //mets a jour les infos sur l'objet 
   }else{
    await set.createFactChecker(fact,url)
    await set.notifyAdminNewFactCheck(fact,url)
   }
 }

//Compute the aggregation note 
 return computeAggregationNoteOperation(url); // need a operation here for computing the aggregation note
}


/*Compute the aggregation note 
 // Look if their are score associated from 
 // Factcheck in the url(not the aggregateScore)
 // and find the resulting aggregation note 
*/
//@param{string}:url
//@return {obj} responseObject
const computeAggregationNoteOperation= async (url)=>{

 if(await score.containsScore(url)){
   return updateAndGetScore(url,13)
 }else{
   await score.computeAggregationNote(url)
   return updateAndGetScore(url,14)
 }

} 


/*
*/
//@param{string}:url
//@return {obj} responseObject
const getScoreOperation = async (url)=>{
 if(await contain.containsMetaData(url)){
     if(await contain.containsNlpKeywords(url)){
         // We already have the keywords we want to get New FactCheker from those keywords 
         let associatedFactList = await get.getFactsFromMetaData(url)
         return newFactCheckOperation(url,associatedFactList)
     }else{
       //generate keywords with already existing metadata and update url object 
       return generateNlpOperation(url)
     }
 }else{
   // Trouver la bonne valeur de retour ici 
   return updateAndGetScore(url,11)
 }

}

/**/
//@param{string}:url
//@return {obj} responseObject
const extractMetaDataOperation= async (url)=>{
  await set.extractMetaData(url);
  return await isThereMetaDataOperation(url)
  

}


/**
 * 
 */
const isThereMetaDataOperation= async(url)=>{
  const thereAreMetadata = await contain.containsMetaData(url);
  if(thereAreMetadata){
   console.log("there are MetaData")
    return await generateNlpOperation(url)
  }else{
    console.log("there is no MetaData")
    return await updateAndGetScore(url,11)
  }
}


/*
*/
//@param{string}:url
//@return {obj} responseObject
const generateNlpOperation = async(url)=> {
 await get.generateNlpKeywords(url)
 return associatedFactsOperation(url)
}


/*
 */
//@param{string}:url
//@return {obj} responseObject
const associatedFactsOperation= async (url)=>{
 //find the generate Facts 
 let asociatedFactList = await getNewFact(url)
 //case note
 if (isAssociatedFactlistEmpty(asociatedFactList)==false){
   return newFactCheckOperation(url,associatedFactList)
 }else{
   return updateAndGetScore(url,12)
 }									
}

/*
 */
//@param{string}:url
//@return {obj} responseObject
const reachLinkOperation = async (url)=>{
 if(await contain.canReachLink(url)){
   return extractMetaDataOperation(url)
 }else{
   return updateAndGetScore(url,10)
 }
}


/*
* Functions related to scoring
*/


/*
*/

//@param{claim}:fact
//@param{string}:url
const computeScoreOperation=(fact,url)=>{
 if(factContainScore(fact)){
   scoreExtractionOperation(fact,url)
 }
}

/*
*/
//@param{claim}:fact
//@param{string}:url
const scoreExtractionOperation= async(fact,url)=>{
  //if(!score.containsScoreSystem(fact,url)){
  if(await !score.containsScoreSystem(fact)){
    score.notifyAdmin(fact,url,1)
 }else{
   const FactScore = extractAndTransFormFact(fact)
   claimScoreInFactCheckOperation(FactScore,fact,url)
 }
}


/*
*/
//@param{string} FactScore
//@param{claim} fact 
//@param{string} url 
//const claimScoreInFactCheckOperation = (FactScore,fact,url)=>{
const claimScoreInFactCheckOperation = async (FactScore,fact)=>{
 if(await !score.claimScoreInFactCheck(FactScore,fact)){
   await score.notifyAdmin(fact,url,2)
 }else{
   await score.updateScoreInUrl(FactScore,fact,url)
 }
}

/*
*/
//@param  {string} url 
//@param  {int} code
//@return {object} responseObject()
const updateAndGetScore=async (url,code)=>{
  //set.updateDate(url)//no real need because automatic
  return await get.getScore(url,code); 
 }


/**
 * Exports 
 */

module.exports ={
  updateAndGetScore,
  claimScoreInFactCheckOperation,
  scoreExtractionOperation,
  scoreExtractionOperation,
  computeScoreOperation,
  getNewFact,
  reachLinkOperation,
  associatedFactsOperation,
  generateNlpOperation,
  extractMetaDataOperation,
  getScoreOperation,
  computeAggregationNoteOperation,
  newFactCheckOperation,
  updateScoreOperation,
  istheScoreUpdateOperation,
  isThereAScoreOperation,
  isLinkReachableOperation,
  urlInDbOperation,
  urlHandling,
  main
}