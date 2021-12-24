/**
 * Handle creation of different object
 */
const express= require('express');

/***
 * Objects models  imports
 */
const FactChecker = require('../models/factChecker');
const FactCheckersList = require('../models/factCheckerList');
const Url = require('../models/URL');
const MetaData = require('../models/metadata');
const LISTNAME = process.env.LISTNAME;
const INTERVAL = process.env.INTERVAL;
const EMAIL= process.env.EMAIL;
const PASS = process.env.PASS;
const TO = process.env.TO; 

const test =()=>{
	return("heroiquement soie")
}



/***
 * Helpers 
 */

 //returns a boolean value (true or false)
 // en comparant la difference entre la date actuelle et la date passee en parametre
// Objet: date et distance 


// Peux etre simplifier parceque la meme fonction 
//est aussi dans indexedDB.js
const getFactCheckInfoFromClaim =(claim)=>{

	
	let returnValue ={"name":null,"site":null}
	if ("name" in claim["claimReview"][0]["publisher"]){
			const name = claim["claimReview"][0]["publisher"]["name"]
			if(name!=""){
				returnValue["name"]=name
			}
	}
	if ("site" in claim["claimReview"][0]["publisher"]){
		const site = claim["claimReview"][0]["publisher"]["site"]
		if(site!=""){
			returnValue["site"]=site
		}
 }
 //console.log(returnValue)
 return returnValue; 
}



const claimInList =(claimFormat,factScoresFieldComp)=>{	
	for(let element of factScoresFieldComp){
		console.log(element)
		console.log(claimFormat)
		if ((claimFormat["factId"]==element["factId"])&&(claimFormat["date"]==element["date"])){
			return true
		}
	}
	return false
}


const formatClaimForDifference = (claim,id)=>{
	//console.log("in")
	const returnValue = {"factId":id,"date":claim["claimReview"][0]["reviewDate"]}
	//console.log(returnValue)
	//console.log("\n")
	return returnValue
}


 const isUpDate=(date,interval)=>{
	let dateNowMs = Date.now()
	let diff = dateNowMs-date.getTime();
	return msToDay(diff)<=interval;
}

// convert miliseconds into days 
const msToDay = (time) =>{
	return Math.ceil(time/ (1000 * 3600 * 24));	
}

// Look in the dataBase and see if the url is in it 
// @param {string} url
// @return {boolean} value
const isUrlInDB = async(url)=>{
	
	try{
		const theUrl = url
		const value = await Url.exists({sourceUrl: theUrl})
		return value;
	}catch(error){
    console.log({success:false, data:[],error:error.message,code:409})
    return {success:false, data:[],error:error.message,code:409}
	}
}



//Try directly to connect to the link and see if a value can be found
// @param {string} url
// @return {boolean} value
const canReachLink= async (url)=>{
	try{
		const link = url 
		const isReachable = require('is-reachable');
		console.log(link)
		const value = await isReachable(link)
		return value 
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}

}	

//Look at url in dataBase and return True if the value score  was able to be found
// @param {string} url
// @return {boolean} value
const isThereAscore= async(url)=>{
	try{
		//console.log("url: "+url)
		const value = await Url.exists({sourceUrl: url,isThereAscore:true})
		//console.log(value)
		return value
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}
}



//Look at the last time the score in the Url Object was update and the Current date 
// return true if day inferior at date we specified.
// Look at theLastDateUpdate only because the built date function change even when 
// other value change 
// @param {string} url
// @return {boolean} value
const isTheScoreUpdated= async(url)=>{
	try{
		const interval = INTERVAL
		//console.log("url: "+url)
		const UrlObj = await Url.find({sourceUrl: url})
		const theDate = UrlObj[0].latTimeScoreUpdated
		//console.log(theDate)
		value = isUpDate(theDate,interval);
		return value

	}catch(error){
   	console.log({success:false, data:[],error:error.message})
	}
}


//Check if The factCheck element is already in the FactChecklist DB
//@ param {FactCheckInfoObjet} req // can consider it's name 
//@ return {boolean} returnValue 
const isFactCheckRegistered= async(req)=>{
	try{
		//console.log("okok")
		const FactName = req['name']
		const siteName =req['site']
		// a specifier par defaut 
		//cherche l'eleement pour trouver son id 
		//const FactChecker = await FactChecker.find({name:name})
		//const id = FactChecker[0]._id.toString()
		let returnValue =false
		if(FactName!=null){
			returnValue= await FactChecker.exists({name:FactName})
			//console.log("score according to name:")
			//console.log(returnValue)
		}
		if(returnValue ==false){
			if(siteName!=null){
				returnValue= await FactChecker.exists({source:siteName})
				//console.log("score according to site:")
			//	console.log(returnValue)
			}	
		}
		
		return returnValue
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}
}

const isFactCheckRegisteredLocal = async(claimInput)=>{
	try{
		const FactName = claimInput['name']
		const siteName =claimInput['site']
		// a specifier par defaut 
		//cherche l'eleement pour trouver son id 
		//const FactChecker = await FactChecker.find({name:name})
		//const id = FactChecker[0]._id.toString()
		
		if(FactName!=null){
			const returnValue= await FactChecker.exists({name:FactName})
			if (returnValue==true){
				return returnValue
			}
			//console.log("score according to name:")
			//console.log(returnValue)
		}
	
			if(siteName!=null){
				const returnValue= await FactChecker.exists({source:siteName})
				return returnValue
				//console.log("score according to site:")
			  //console.log(returnValue)
			}	
		
		//console.log("claimInput:")
		//console.log(claimInput)
		//console.log("returnValue")
		
		
	}catch(error){
    return {success:false, data:[],error:error.message}
	}
}

//Get the URL Object and it's parameter ContainsmetaData and see if it is set as True
//MetaData Field is not empty 
//@param {string} url
//@return {boolean} value  
const containsMetaData = async(url)=>{
	try{
		console.log(url)
		const urlObj = await Url.find({sourceUrl:url})
		const value = await Url.exists({sourceUrl: url,containsMetadata:true})
		console.log(urlObj[0])
		console.log("containsMetaData: "+value.toString())
		return value
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}
}
 


/**
 * Maybe this fonction is just not important 
 */
// look if metadata was extracted
// look if their is any keywords in the data
// Objet: url string 
// response: Boolean  
const containRelevantKeywords= async (req, rel) =>{
	// Look at first if metaData were extracted then compute an and operatioin 
	value = containsMetaData(url)

}
	

// Look in  the object and see if there is a score: 
//Object: url string 
// return Boolean 
const containsScore = async (req,res) => {
	try{
		const url = req.body['name']
		const value = await Url.exists({sourceUrl: url,containsScore:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}
}
 
// Look if their are already generated NLP keywords values 
//@param {string} url
//@return value
const containsNlpKeywords = async(url) => {	
	try{
		const value = await Url.exists({sourceUrl: url,containsKeywords:true})
		return value
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}
}


//look if the factList of the url object is not empty
//Object :url 
//response: Boolean 
const containAssociatedFactCheck= async(req,res)=> {
	try{
		const url = req.body.url
		const value = await Url.exists({sourceUrl: url,containsAssociatedFactCheck:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}
}


/**
 * TO COMPLETE NEW
 * */


//Look at at the url Object and see if is value LinkReachable is defined as true
// @param {string} url
// @return {boolean} value
const isLinkReachable= async (url)=>{
	try{
		const value = await Url.exists({sourceUrl: url,reachable:true})
		return value
	}catch(error){
		console.log(({success:false, data:[],error:error.message}))
	}

}	


//compares 2 List of factChekers,1 from DB and one 
// newly generated and return the new ones that are differents 
// @param {Objet} req
// @return {facts} difference
const containDifferentFactCheck = async(req)=>{
	try{
		const url = req.url
		const factScoresField = req.factScoresField
		let factScoresFieldComp= []
		for(let fact of factScoresField){
			factScoresFieldComp.push(JSON.parse(fact))
		}
		const newfactList = req.newClaim
		//console.log(newfactList)
		//console.log(newfactList.length)
		let difference = []
		let i=0
		for(let claim of newfactList ){
			//console.log(i)
		 //i=i+1
			const claimInput =getFactCheckInfoFromClaim(claim)
			//console.log(claimInput) 
			const bool = await isFactCheckRegisteredLocal(claimInput)
			//console.log(`booleanvalue: ${bool}`)
			//console.log(claimInput)
			if(bool ==false){
				difference.push(claim)
				//console.log("difference")
			}else{
				
				const FactCheck =  await FactChecker.findOne({source:claimInput["site"]})
				//console.log(FactCheck)
				const Id = FactCheck._id.toString()
				//console.log(Id)
				let claimFormat = formatClaimForDifference(claim,Id)
				if(!claimInList(claimFormat,factScoresFieldComp)){
					difference.push(claim)	
				}
			}

		}

		

		
		return difference
	}catch(error){
    console.log({success:false, data:[],error:error.message})
	}
}



 module.exports ={
	isUrlInDB,
	isLinkReachable,
	isThereAscore,
	isTheScoreUpdated,
	isFactCheckRegistered,
	containAssociatedFactCheck,
	containsMetaData,
	containsScore,
	containsNlpKeywords,
	containRelevantKeywords,
	canReachLink,
	containDifferentFactCheck,

	
}
