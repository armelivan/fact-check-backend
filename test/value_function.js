


/*HELPERS*/
// return True or False
const isAssociatedFactlistEmpty = (assFL)=>{
  try{
     return assFL.length==0;
  }catch(error){
   //console.log('not in here')
   console.log(error)
 }
}



// return les infos pertinent si contenus dans le claim 
//@ name
//@ Site
//@ return {"name":name,"site":site}
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





//(string:url)=> responseObject()
const main = (url)=>{
   return urlHandling(url);
}

 //(string:url)=> responseObject()
const urlHandling=(url)=>{
 return urlInDbOperation(url);
}

 //(string:url) => responseObject()
const urlInDbOperation=(url)=>{
   // is my url in the DB
 if(isUrlInDb(url)){
   return isLinkReachableOperation(url)
 }else{
   //the url is not in the DB   
   addUrl(url);
   return reachLinkOperation(url);
 }
}

//(string:url)=>responseObject()
const isLinkReachableOperation=(url)=>{
 if (isLinkReachable(url)){
   return isThereAScoreOperation(url);
 }else{
   return reachLinkOperation(url)
 } 
}

//(string:url)=>responseObject()
const isThereAScoreOperation= (url)=>{
 if(isThereAScore(url)){
   return istheScoreUpdateOperation(url)
 }else{
   return getScoreOperation(url)
 }
}

//string:url) => responseObject()
const istheScoreUpdateOperation=(url)=>{
 if(istheScoreUpdated(url)){
   // 	il faut que je rentre specifiquement le code
   return updateAndGetScore(url,15);
 }else{
   return updateScoreOperation(url);
 }
}

//string:url) => responseObject()	
const updateScoreOperation=(url)=>{
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
 const actualFactCheckList = getScoreField(url) // actual factCheks
 const newFactCheck = getFactsFromMetaData(url)// list of FactClaim found from the elements 
 const difference = containDifferentFactCheck(actualFactCheckList,newFactCheck,url)
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
//(string:url,list[FactCheck])=> responseObject()
const newFactCheckOperation=(url,ListOfClaims)=>{
 
 for(let fact  of ListOfClaims){

   // each fact or claims contain info on it's specific factChecker
   // We need to compute their values 
   const factInfo = getFactCheckInfoFromClaim(fact)
   if(isFactCheckRegistered(factInfo)){ // is the factChecker of this fat registered 
     computeScoreOperation(fact,url) //Need to see if the FactChecker contains already a scoring system
     updateFactChecker(fact) // mets a jour les infos sur l'objet 
   }else{
     createFactChecker(fact,url)
     notifyAdminNewFactCheck(fact,url)
   }
 }
 //Compute the aggregation note 
 return computeAggregationNoteOperation(url); // need a operation here for computing the aggregation note
}

//Compute the aggregation note 
const computeAggregationNoteOperation= (url)=>{
 // Look if their are score associated from 
 // Factcheck in the url(not the aggregateScore)
 if(containsScore(url)){
   return updateAndGetScore(url,13)
 }else{
   computeAggregationNote(url)
   return updateAndGetScore(url,14)
 }
/*
 UrlObject <- get the Url Object()
 score[] = UrlObject.score.scoreField 
 if(score[] empty):
   No values extracted from the existing scoring system
 else: 
   => send all Score to python aggregation note file
     Compute aggregation notes 
     Urlobject<-Update aggregation note to new value 
     
  return the score value 
*/
}


//(string:url)=> responseObject()
const getScoreOperation = (url)=>{
 if(containsMetaData(url)){
     if(containsNlpKeywords(url)){
         // We already have the keywords we want to get New FactCheker from those keywords 
         let associatedFactList = getFactsFromMetaData(url)
         return newFactCheckOperation(url,associatedFactList)
     }else{
       //generate keywords with already existing metadata and update url object 
       return generateNlpOperation(url)
     }
 }else{
   // Trouver la bonne valeur de retour ici 
   return
 }

}

//(string:url)=> responseObject()
const extractMetaDataOperation= (url)=>{
 extractMetaData(url)
 if(containsMetaData(url)){
   return generateNlpOperation(url)
 }else{
   return updateAndGetScore(url,code)
 }
}

//(string:url)=> responseObject()
const generateNlpOperation = (url)=>{
 generateNlpKeywords(url)
 return associatedFactsOperation(url)
}

//(string:url)=> responseObject()
const associatedFactsOperation= (url)=>{
 // find the generate Facts 
 let asociatedFactList = getNewFact(url)
 // case note
 if (isAssociatedFactlistEmpty(asociatedFactList)==false){
   return newFactCheckOperation(url,associatedFactList)
 }else{
   return updateAndGetScore(url,12)
 }									
}


//(url)=>responseObject();
const reachLinkOperation =(url)=>{
 if(canReachLink(url)){
   return extractMetaDataOperation(url)
 }else{
   return updateAndGetScore(url,10)
 }
}

// Find New Facts base on existing NLP facts
const getNewFact = (url)=>{
let keywords = getNlpKeywords(url)["data"] // Look in the already existing keywords
return getNewFactsFromKey(keywords,url)
}


//(url,code)=>responseObject()
const updateAndGetScore= (url,code)=>{
 updateDate(url)//no real need because automatic
 return getScore(url,code); 
}


/**
* Functions related to scoring
*/



const computeScoreOperation=(fact,url)=>{
 if(factContainScore(fact)){
   scoreExtractionOperation(fact,url)
 }
}



const scoreExtractionOperation=(fact,url)=>{
 if(!containsScoreSystem(fact,url)){
    notifyAdmin(fact,url,1)
 }else{
   const FactScore = extractAndTransFormFact(fact)
   claimScoreInFactCheckOperation(FactScore,fact,url)
 }
}


// get the Fact
const claimScoreInFactCheckOperation = (FactScore,fact,url)=>{
 if(!claimScoreInFactCheck(FactScore,fact)){
   notifyAdmin(fact,url,2)
 }else{
   updateScoreInUrl(FactScore,fact,url)
 }
}


// Helpers//

// is there a score field and value in the 
// considered claim
// return boolean value if true 
const factContainScore=(fact)=>{
 if("textualRating" in fact["claimReview"][0]){
   if(fact["claimReview"][0]["textualRating"]!=""){
     return true
   }
 }
 return false
}

// takes a claim extracts it's value
// and transform it in a CamelCase Format
const extractAndTransFormFact= function camalize(fact) {
 const score = fact["claimReview"][0]["textualRating"]
 return score.toLowerCase().replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}




