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
// Object : url 
// response: Boolean 

const isUrlInDB = async(req,res)=>{
	try{
		const url = req.body['url']
		console.log("in")
		
		//console.log("url: "+url)
		const value = await Url.exists({sourceUrl: url})
		//console.log(value)
		
		res.status(200).json({success:true,data:value})
	}catch(error){
		
    res.status(409).json({success:false, data:[],error:error.message})
	}
}

	
//Try directly to connect to the link and see if a value can be found 
const canReachLink= async (req,res)=>{
	try{
		const link = req.body["url"]
		const isReachable = require('is-reachable');
		console.log(link)
		const value = await isReachable(link)
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}

}	

//Look at url in dataBase and return True if the value score  was able to be found
// Object: Url 
// response: Boolean 
const isThereAscore= async(req,res)=>{
	try{
		const url = req.body['url']
		//console.log("url: "+url)
		const value = await Url.exists({sourceUrl: url,isThereAscore:true})
		//console.log(value)
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}
}



//Look at the last time the score in the Url Object was update and the Current date 
// return true if day inferior at date we specified
// Object : url 
// response : Boolean
// Look at theLastDateUpdate only because the built date function change even when 
// other value change 
const isTheScoreUpdated= async(req,res)=>{
	try{
		const url = req.body['url']
		const interval = INTERVAL
		//console.log("url: "+url)
		const UrlObj = await Url.find({sourceUrl: url})
		const theDate = UrlObj[0].latTimeScoreUpdated
		//console.log(theDate)
		value = isUpDate(theDate,interval);
		//console.log(value)

		//value = isUpDate(theDate)
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}
}


//Check if The factCheck element is already in the FactChecklist DB
//Object:FactCheckObjet // can consider it's name 
//response Boolean 
const isFactCheckRegistered= async(req,res)=>{
	try{
		console.log("okok")
		const FactName = req.body['name']
		const siteName =req.body['site']
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
		
		console.log(returnValue)
		res.status(200).json({success:true,data:returnValue})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
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
// Get the URL Object and it's parameter ContainsmetaData and see if it is set as True
// MetaData Field is not empty 
// Object = url string 
// response : Boolean 
const containsMetaData = async(req,res)=>{
	try{
		const url = req.body['url']
		const value = await Url.exists({sourceUrl: url,containsMetadata:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
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
// Object: url string 
// return: Boolean 
const containsNlpKeywords = async(req,res) => {
	
	try{
		const url = req.body['url']
		const value = await Url.exists({sourceUrl: url,containsKeywords:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
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
// Object : Url 
// response: Boolean 
const isLinkReachable= async (req,res)=>{
	try{
		const url = req.body['url']
		const value = await Url.exists({sourceUrl: url,reachable:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}

}	



const containDifferentFactCheck = async(req,res)=>{
	try{
		const url = req.body.url
		const factScoresField = req.body.factScoresField
		let factScoresFieldComp= []
		for(let fact of factScoresField){
			factScoresFieldComp.push(JSON.parse(fact))
		}
		const newfactList = req.body.newClaim
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

		

		console.log(difference)
		res.status(200).json({success:true,data:difference})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
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
	containDifferentFactCheck
}
