/**
 * Handle creation of different object
 */
const express= require('express');

//const childPython = spawn('python',['--version'])


/***
 * Objects models  imports
 */
const FactChecker = require('../models/factChecker');
const Url = require('../models/URL');
const MetaData = require('../models/metadata') // import metaData


/**
 * Helpers 
 */

 const getDataFromMetaData= async (id)=>{
	 try {
		 //console.log('inside')
		 //console.log(id)
		 const data = await MetaData.findById(id)
		 //console.log(data)
		 return data
	 } catch (error) {
		 console.log(error.message)
		 return error.message
	 }
 }

 const getDataFromKeywords = async (url)=>{
	try{
		const UrlObj = await Url.find({sourceLink:url});
		const keywords = UrlObj[0].keyWordsList;
		return keywords;
	}catch(error){
		console.log(error.message)
    return error.message
	}
 }

/**
 * 
 * @param {*} keywords 
 * @param {*} title 
 * @return factObject {f1Name: f1, f2Name: f2,...}
 */ 
 const getFactsFromApi = async(keywords,title)=>{
	console.log(req.body)
	var {spawn}= require('child_process');

	var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/t.py',"firstName"]);

	x = 0
	process.stdout.on('data',(data)=>{
		console.log(`${data}`);
		x = JSON.parse(data.toString());
		res.status(200).json({success:true,data:x})
	});
	
	process.stderr.on('data',(data)=>{
		console.error(`${data}`);
	});
 }
 

/**
 * Child process: in order to communicate info 
 * from js to python 
 */

 const testChild = async(req,res)=>{
	console.log(req.body)
	var {spawn}= require('child_process');

	var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/t.py',"firstName"]);

	x = 0
	process.stdout.on('data',(data)=>{
		console.log(`${data}`);
		x = JSON.parse(data.toString());
		res.status(200).json({success:true,data:x})
	});
	
	process.stderr.on('data',(data)=>{
		console.error(`${data}`);
	});
 }

/**
*Functions 
*/

// takes already existing metadata and generate a list of Keywords
// add the keywords to the url object 
//object:url 
//return a metaData object from it and update the metaDataObject
const generateNlpKeywords= async (req,res) =>{
	try{
		// loading metaData 
	// getMetaDataId from url Object 
		//console.log('init')
		const  url = req.body["url"]
		console.log(url)
		const UrlObj = await Url.find({sourceUrl:url});
 	  const metaDataId = UrlObj[0].metaData.toString()
		console.log(metaDataId)
		let theData = await getDataFromMetaData(metaDataId)
		theDataTitle= JSON.parse(JSON.stringify(theData))["title"]
		//console.log("after")
		//console.log(theDataObj)
		//console.log(typeof theDataObj)
		// function a construire 
		// need to stringify the data before returning it => for it 
		// to be easaly accessible by the function 
		var {spawn}= require('child_process');
		var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/keywordsToPotentialQuerries.py',theDataTitle]);
		
		process.stdout.on('data',(data)=>{
	  	console.log("in2")
			console.log(`${data}`);
			const NlpsKeywords  = JSON.parse(data);
			console.log("done")
			console.log(NlpsKeywords)
			Url.findOneAndUpdate({
				sourceUrl:url
			},{
				keyWordsList:NlpsKeywords
			},(err)=>{
				console.log(err)
			})
			// need to add the keywords to the url object then 
			res.status(200).json({success:true,data:NlpsKeywords })

		});
		
		process.stderr.on('data',(data)=>{
			console.error(`${data}`);
			const x = "error in the generateNlpsKeuwords"
			res.status(200).json({success:false,data:x })
		});

	}catch(error){
		//console.log('not in here')
		//console.log('here')
    res.status(409).json({success:false, data:[],error:error.message})
	}
}

// getMetaData id from Url Object 
const getMetaDataIdFromUrl= async (req,res)=>{
	try{
		// getMetaDataId from url Object 
		//console.log('init')
		const url = req
		const UrlObj = await Url.find({sourceLink:url})
		const metaData = UrlObj[0].metaData.toString()
		//console.log(metaData)
		res.status(200).json({success:true, data: metaData})
	}catch(error){

		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}

}


// return le score d'une donnee  deja en db
// si l'url ne contient pas de score il retourne une autre valeur
// object:url String 
//retour:responseObject
const getScore = async (req,res)=>{
	try{
		// getMetaDataId from url Object 
		const url = req.body['url']
		const code = req.body['code']
		let data ={"score":null,"code":100,"url":url,"message":"unknown Process"};
		if(code==10){
			data = {"score":null,"code":code,"url":url,"message":"Link cannot be reached"};
		}else if(code==11){
			data = {"score":null,"code":code,"url":url,"message":"No metaData was extracted from the website "};
		}else if(code==12){
			data = {"score":null,"code":code,"url":url,"message":"No claims extracted from the API Extracted it is empty"};
		}else if(code==13){
			data = {"score":null,"code":code,"url":url,"message":"The URL has no associated fact-checkers score"};
		}else if(code==14){
			const UrlObj= await Url.findOne({sourceUrl:url})
			const score = UrlObj.score.aggregated
			data = {"score":score,"code":code,"url":url,"message":"The score has been computed"};
		}else if(code==15){
			const UrlObj= await Url.findOne({sourceUrl:url})
			const score = UrlObj["score"]["aggregated"]
			data = {"score":score,"code":code,"url":url,"message":"The score has been updated "};
		}else if(code==16){

			const UrlObj=  await Url.findOne({sourceUrl:url})
			const score = UrlObj.score.aggregated
			data = {"score":null,"code":code,"url":url,"message":"No different between current and precedent score"};
		}else {

		}

		res.status(200).json({success:true,data})
	}catch(error){
		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}

}


//urL already contains metaData and Keywords retrieve associated to those keywords
//object:url string
//retour: listOfKeywords(strings)
const getNlpKeywords= async(req,res) =>{
	try{
		// getMetaDataId from url Object 
		const url = req.body['url']
		const UrlObj = await Url.find({sourceUrl:url})
		const keywords = UrlObj[0].keyWordsList
		//console.log(keywords)
		res.status(200).json({success:true,data:keywords})
	}catch(error){
		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}


}

//return the list of the already existing fact check in the url object
//objet:url string
//return: list[FactChek()]
const getFacts = async (req,res)=>{
	try{
		// getMetaDataId from url Object 
		//console.log('init')
		const url = req.body.url
		const UrlObj = await Url.find({sourceLink:url})
		const factCheckers = UrlObj[0].associatedFactCheckers
		//console.log(metaData)
		res.status(200).json({success:true, data:factCheckers})
	}catch(error){

		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}
}

//from the url find the related NLP keywords and try to find facts from the api
//matching the sentences 
//objet: url string 
//return a list of factCheck
const getFactsFromMetaData= async(req,res)=>{
	try{
		// 1.get the relevant keyword from the url object

		const url = req.body['url']
		const UrlObj = await Url.findOne({sourceUrl:url})
		//console.log(UrlObj)
		const metaDataId = UrlObj.metaData.toString()
		let keywords = UrlObj.keyWordsList
		//console.log(metaDataId)
		const metaData = await getDataFromMetaData(metaDataId)
		const title = metaData["title"]
		// 2.generate and return a list of valid google APIS 
		
		const theData = JSON.stringify({"keywords":keywords,"title":title})
		var {spawn}= require('child_process');
		var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/googleFactCheckAPI.py',theData]);
		
		process.stdout.on('data',(data)=>{
			console.log(`${data}`);
			const ClaimsFromAPI  = JSON.stringify(JSON.parse(data.toString()));
			// need to add the keywords to the url object then 
		
			res.status(200).json({success:true,data:ClaimsFromAPI })
		});

		process.stderr.on('data',(data)=>{
			console.error(`${data}`);
			const x = "error in getCompatibleFactCheck"
			res.status(200).json({success:false,data:x })
		});

	
	}catch(error){
		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}
}

//objet:url
//return list of stringKeywords
const getKeywords = (req,rel) => {
	pass
}


/***
 * NEW FUNCTIONS TO ADD 
 */

// takes a given list of keywords and
// returns a list of facts associated from them with the API
// object: keywords and url -> need to get the title of the metaData
const getNewFactsFromKey = async(req,res)=>{
	try{
		// getMetaDataId from url Object 
		//console.log('init')
		const url = req.body["url"]
		const keywords = req.body["keywords"]
		const metaObj = await MetaData.find({sourceLink:url})
		const title =  metaObj[0].title
		console.log(title)
		const urlTitleObj= JSON.stringify({"keywords":keywords,"title":title})


   var {spawn}= require('child_process');

	 var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/googleFactCheckAPI.py',urlTitleObj]);
		process.stdout.on('data',(data)=>{
			console.log(`${data}`);
			console.log(data)
			x = JSON.parse(data);
			res.status(200).json({success:true,data:x})
		});
		
		process.stderr.on('data',(data)=>{
			console.error(`${data}`);
		});

	}catch(error){

		//console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
	}
}



module.exports = {
	getScore,
	generateNlpKeywords,
	getMetaDataIdFromUrl,
	testChild,
	getNlpKeywords,
	getFacts,
	getFactsFromMetaData,
	getKeywords,
	getNewFactsFromKey
}
