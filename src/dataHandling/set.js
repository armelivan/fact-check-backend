/*Handle creation of different object*/
const express= require('express');
const nodemailer =require('nodemailer');


/*Objects models  imports*/
const FactChecker = require('../models/factChecker');
const FactChekersList = require('../models/factCheckerList');
const MetaData = require('../models/metadata');
const Url = require('../models/URL');
const LISTNAME = process.env.LISTNAME;
const INTERVAL = process.env.INTERVAL;
const EMAIL= process.env.EMAIL;
const PASS = process.env.PASS;
const TO = process.env.TO; 



/**
 * Helpers Functions 
 */

// callBack Function to increase associatedUrl of 
//a given FactChecker
//@param {string} name
//@return {factCheck} factcheck
const increaseMyNumberOfAssociatedUrl = async(name)=>{
  try{
    const factCheck = await FactChecker.findOne({source:name})
    factCheck.numberOfAssociatedUrl+=1
    await factCheck.save()
    return {success:true,data:factCheck}
  }catch(error){
    return {success:false, data:[],error:error.message}
  }
}

// fait un appel sur la fonction 
// d'API
const getMetaDataFromApi = async(url)=>{
	var {spawn}= require('child_process');
	var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/metaDataExtractor.py',url]);
  let data =""
	process.stdout.on('data',async (data)=>{
    console.log("in stdout")
		console.log(`${data}`);
		data = await JSON.parse(data.toString());
	
  });
  

	process.stderr.on('data',(data)=>{
		console.error(`${data}`);
	});
 }


//Mail format for new FactChecker in DB 
//@param {claim} fact
//@param {string} url
//@return {string} value
const emailify= (fact,url)=>{
  const value = `
  A New FactChecker has been added to the FactChecker. 
  It is linked to the current URL:${url}.

  Here is the claim linked to it:
  ${JSON.stringify(fact,null,4)}
`
return value
}



/**
 * Called Functions
 */

//create a FactChecker Object 
//and add it to the dataBase and then in the FactCheckList of the given url.
//updateTheFactCheckerCount and adding the value into the url 
// @param {string} url
//@param {claim} fact 
const createFactChecker = async (fact,url)=>{
  try{
    const urlObj = await Url.find({sourceUrl:url})
    const id = urlObj[0]._id.toString()
    //console.log(id)
    let factChecker={
      numberOfAssociatedUrl:1,
      associatedFactsUrl:[id]
    }
    if("name" in fact["claimReview"][0]["publisher"]){
      factChecker.name = fact["claimReview"][0]["publisher"]["name"]
    }
    if("site" in fact["claimReview"][0]["publisher"]){
      factChecker.source= fact["claimReview"][0]["publisher"]["site"]
    }
    

    const newFactChecker = new FactChecker(factChecker)
    await newFactChecker.save()
    const theFactObj = await FactChecker.find({site:fact["claimReview"][0]["publisher"]["site"]})
    const factId = theFactObj[0]._id
   
    //2. add the FactChecker to the list of the factList of the URL 
    await Url.findOneAndUpdate({
      sourceUrl:url
    },{
      $push:{
        associatedFactCheckers:factId
      },
      containsAssociatedFactCheck:true
    })
    
    //3. update FactCheckerList 
    
    await FactChekersList.findOneAndUpdate({
      name:LISTNAME
    },{
      $push:{
        factCheckers:factId
      },
      $inc:{numberOfFactChek:1
      }
    })

  }catch(error){
    console.log({success:false, data:[],error:error.message})
  }
}


//Create Url object with blueprint and add it  in dataBase
// @param {string} url
const addUrl= async (req)=>{
  try{
    const url = req
    //console.log(url)
    const date = Date.now()
    //console.log(date)
    const newUrl = {
      reachable:false,
      latTimeScoreUpdated:date,
      containsKeywords:false, 
      containMetadata:false,
      numberOfTimeReached:0,
      metaData: null,
      score:{},
      sourceUrl:url
      }
    const setUrl = new Url(newUrl)
    const savedUrl = await setUrl.save()
    console.log({success:true, data:savedUrl})
  }catch(error){
    console.log({success:false, data:[],error:error.message})
  }
}


// Is it really Needed ??? 
// update consultation date of a given url Object 
//@param {string} url 
const updateDate = async (url)=>{
  try{
    const date = getCurrentDate()
    //find factCheck from given url
    const factCheck = await FactChecker.find({})
    res.status(200).json({success:true,data:factCheck})
    // set factChecker date to the given date 

  }catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
  }
}
  

// ajoute l'id de l'URL  a la liste des facts appartenants au factChecker
// et incremente le nombre d'url associated au fact
//@param {string} url
//@param {obj} factInfo
const updateFactChecker= async (factInfo,url)=>{

  try{
    //console.log('in here')
    const factName = factInfo['site'] // nom de l'url object

    // getting the id from the object url 
    const urlO = await Url.find({sourceUrl:url})
    const id = urlO[0]._id.toString()

    const factCheck = await FactChecker.find({source:factName})
    
    //console.log(factCheck)
    //console.log(id)
    factCheck[0].associatedFactsUrl.push(id)
    await factCheck.save()

    const incObject = increaseMyNumberOfAssociatedUrl(factName);
    console.log(incObject);
    //res.status(200).json(incObject)
    // set factChecker date to the given date 
  }catch(error){
    //console.log('not in here')
    console.log({success:false, data:[],error:error.message})
  }
}


//consider a factChecker object and increment
//it's number of associate Url if it contain 
// manual operation 
//objet: FactCheckerName 
// return success Number 
const increasenumberOfAssociatedUrl = async (req,res)=>{
  try{
    //console.log('in here')
    const name = req.body['name']
    //console.log(url)
    const factCheck = await FactChecker.findOne({name:name})
    factCheck.numberOfAssociatedUrl+=1
    await factCheck.save()
    res.status(200).json({success:true,data:factCheck})
    // set factChecker date to the given date 
  }catch(error){
    //console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
  }
}


// create a FactCheckerList without any value as parameter
const createFactCheckerList = async(req,res)=>{
  try{
    const name = req.body.name;
    //console.log(url)
    const date = Date.now()
    //console.log(date)
    const fList = {
      name: name,
      numberOfFactChek:0
      }
    const setFCL = new FactChekersList(fList)
    const savedFCL = await setFCL.save()
    res.status(201).json({success:true, data:savedFCL})
  }catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
  }
}

//add a new FactCheck to the collection of factCheck of a given List
//Objet: FactCheckName
//change also the value of contains associatedFactCheckers to true 
const addFactCheckToFactList = async(req,res)=>{
  try{
    //console.log('in here')
    const name = req.body['factName']
    const FactListName = req.body['listName']
    const factCheck = await FactChecker.find({name:name})

    const id = factCheck[0]._id.toString()
    console.log(id)
    console.log(typeof id)
    //console.log(id)
    //console.log(FactListName)
    await FactChekersList.findOneAndUpdate({
      name:associatedFactCheckers
    },{
      $push:{
        factChekers:{name:name,value:id}
      }
    })
    res.status(200).json({success:true,data:factCheck})
    // set factChecker date to the given date 
   }catch(error){
    //console.log('not in here')
    res.status(409).json({success:false, data:[],error:error.message})
  }

}

/**
 * TO COMPLETE NEW
 * */

//Need a create Fact-checker from a given url 
//(url)





// Try to extract MetaData from the url and add them to the website
  // 0. compute a metaData x 
  // 1. Load the urlObj
  // 2. Load the metadataObject and update it
//@param {string} url 
const extractMetaData= async (url)=>{
  try{

    //const newMetaData = await getMetaDataFromApi(url)

    var {spawn}= require('child_process');
	  var process = spawn('python3',['/Users/one/fact-checker-api/src/dataHandling/metaDataExtractor.py',url]);
    let newMetaData =null
    await process.stdout.on('data', async (data)=>{
    //console.log("in stdout")
    //console.log(`${data}`);
    newMetaData = await JSON.parse(data.toString());
    

    //console.log(typeof newMetaData)
    const title = newMetaData["title"]
    //console.log(title)
    const setMetaData = new MetaData(newMetaData)
    await setMetaData.save()
    
    const metaDataE = await MetaData.find({"title":title})
    const metaId = metaDataE[0]._id.toString()
    //console.log(url)
    //console.log(metaId)
    await Url.findOneAndUpdate({sourceUrl:url},{metaData:metaId,containsMetadata:true})},(err)=>{
      console.log(err)
    });
    const urlObj = Url.findOne({sourceUrl:url})
    console.log(urlObj.toString())
    console.log({success:true, data:"completed"})
    
	process.stderr.on('data',(data)=>{
		console.error(`${data}`);
	});
    
  }catch(error){
    //console.log('not in here')
    console.log({success:false, data:[],error:error.message})
  }

}


// Function a completer pour setter les variable 
const setContainMetaData = async (req,res)=>{
  try{
    const url = req.body["url"]
    const urlObj= await Url.find({"sourceUrl":url})
    urlObj[0]["containsMetadata"] = true;
    await urlObj.save()

    res.status(200).json({success:true,data:urlObj})

  }catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
  }
   
}







//Send a message specifying that there is a new FactChecker in the DataBase 
//without a scoring system
//@param {string} url
//@param {claim} fact
const notifyAdminNewFactCheck = async(fact,url)=>{
try{
  //const fact = req.body["fact"]
  //const url = req.body["url"]
  const message = emailify(fact,url)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL,
      pass: PASS
    }
  });

  let mailOptions = {
    from: EMAIL,
    to: TO,
    subject: 'NEW FactChecker added to FacheckerProject!',
    text: message
  };

  await transporter.sendMail(mailOptions, (error, info)=>{
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
 console.log({success:true,data: "sent" })
}catch(error){
  console.log({success:false, data:[],error:error.message})
}

}





  


module.exports ={
  createFactChecker,
  increasenumberOfAssociatedUrl,
  updateDate,
  addUrl,
  updateFactChecker,
  createFactCheckerList,
  addFactCheckToFactList,
  notifyAdminNewFactCheck,
  extractMetaData,
  setContainMetaData
}


/**
 * Tester insertion de chacune des donnees 
 */