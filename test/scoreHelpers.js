/*Handle creation of different object*/
const { format } = require('morgan');
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

/*
 if(! fact claim contains a score value):
	pass 
 else: 
	get FactChecker <= from (fact url, name)
	if(!FactChecker contains a scoreSystem):
	 notifyAdmin
	 pass 
	else :
		claimScore <= extract it and CamelCaseIt(sameFormat)
		if(!ClaimScore not in FactChecker scoreSystem )
			notifyAdmin
			pass 
		else: 
			score <=SystemScore["claimScore"]

			UrlOb <= get from url
			UrlOb.score.update <= {
				{
					factCheck: Id,
					date:, 
					score:
				}
			}

	const factContainScore(fact)=> {Boolean(True,False)}
*/

//Helpers// 
const getMessage1 = (fact,url)=>{
	const message = `
		The FactCheck associated to this claim:
		${JSON.stringify(fact,null,4)}

		does not have a scoring sytem, please add it promptly.
		this is for the operation related to this URL_request:
		${url}
	`
	return message
}

const getMessage2 = (fact,url) =>{
	const message = `
		We could not find a score associated to the score value of 
		this claim in the associated Fact-Chek:
		${JSON.stringify(fact,null,4)}

		this is for the operation related to this URL_request:
		${url}

		Please update the scoring system
	`
	return message
}

// put them in string format to be inputed in the 
// dataBase
const formatScoreInput = (factId,score,date)=>{
	const fact = {
								"factId":factId,
								"score":score,
								"date":date
							}
	return JSON.stringify(fact)

}

// takes scoreSystem from FactCheck object (string)
// and transform it into  a object
const formatScoreSystem = (scoreSystem)=>{
	return JSON.parse(scoreSystem)
}

/*
 *Functions 
 */

/*
On veut ajouter un nouveau score dans l'url object
score <=SystemScore["claimScore"]
UrlOb <= get from url
UrlOb.score.update <= {
	{
		factCheck: Id,
		date:, 
		score:
	}
}
*/
//FactScore(int),fact,url
const updateScoreInUrl= async (req,res)=>{
	try{
		
		const url = req.body["url"]
		const factSite = req.body["fact"]["claimReview"][0]["publisher"]["site"]
		let score = req.body['factScore']// string 
		const date = req.body["fact"]["claimReview"][0]["reviewDate"]
		const factCheck= await FactChecker.findOne({source:factSite})
		const factId = factCheck._id.toString()
		
		// retriving score from factCheck object and doing the conversion
		let scoreSystem = factCheck.scoreSystem
		console.log(scoreSystem)
		scoreSystem = formatScoreSystem(scoreSystem)
		score = scoreSystem[score]
		console.log("score")
		console.log(score)


		const inputValue = formatScoreInput(factId,score,date)

		await Url.findOneAndUpdate({
      sourceUrl:url
    },{
      $push:{
        "score.scoreField":inputValue
			},containsScore:true
    })
	
		res.status(200).json({success:true,data:inputValue})
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }
}

//Look at the fact element and try to find 
// if there is a score system 
const containsScoreSystem = async(req,res)=>{
	try{
		const fact= req.body['fact']
		const source = fact["claimReview"][0]["publisher"]["site"]
		const value = await FactChecker.exists({source:source,containsScore:true})
		res.status(200).json({success:true,data:value})
	}catch(error){
    res.status(409).json({success:false, data:[],error:error.message})
	}
}

//! important de garder FactScore parceque la note du factCheck 
//a  ete ajustee au bon format 
//Find the FactCheck Object according to the name 
//or the url of the fact and then look at if 
//the FactScore is is one of the field of the fact
// score:{
//	score1:val1
//  score2:val2
//  ...
//  scoreN:valN
//}
const claimScoreInFactCheck= async(req,res)=>{
	try{
		const factScore = req.body.FactScore
		const factSite = req.body["fact"]["claimReview"][0]["publisher"]["site"]
		const factCheck= await FactChecker.findOne({source:factSite})
		//console.log(factCheck)
		let value = false
		if ("scoreSystem" in factCheck){
			let scoreSystem = factCheck.scoreSystem
			scoreSystem  = formatScoreSystem(scoreSystem)
			console.log(scoreSystem)
			console.log(factScore)
			if (factScore in scoreSystem){
				value= true
			}
		}



		res.status(200).json({success:true,data:value})
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }

}



// send an email to the admin saying that the scoreSystem 
// in the Fact is empty
// Objects : @fact,@Url,@code 
const notifyAdmin= async(req,res)=>{
	try{
		const fact = req.body.fact
		const code = req.body.code
		const url = req.body.url 
		let message = "";

		// fact-Check does not have a scoring system 
		if(code==1){
			message = getMessage1(fact,url)
		// no score associated to that particular claim in the Fact-checkScore
		}else if(code==2){
			message = getMessage2(fact,url)
		}
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
			subject: 'Update Fact-Check Scoring system',
			text: message
		};
	
		await transporter.sendMail(mailOptions, (error, info)=>{
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});
	
		res.status(200).json({success:true,data: message })
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }

}


// is it really neadde
const computeScoreFact= (fact,url) => {
	// does it co
} 


// addScoring system  Manual function to add scoring values from scratch
// tothe code 
const addScoringSystem = (factCheck,scoring)=> {statusCode(success,fail)
	pass 
}


//Look at the old and recent factValues
// consider only the Fact with a present scoring system 
// gives accordingly weight in regard to the date at wich the elements has been placed 
// updateUrl score 
const computeAggregationNote = async(req,res) => {
	try{
		const url = req.body.url
		const UrlObj = await Url.findOne({sourceUrl:url})
		const score = UrlObj.score.scoreField
		const ScoreParameter = JSON.stringify(score)
		
		
    var {spawn}= require('child_process');
	  var process = spawn('python3',['/Users/one/fact-checker-api/src/score/aggregationScore.py',ScoreParameter]);
		let scoreData=null
		
    process.stdout.on('data',async (data)=>{
    //console.log("in stdout")
    //console.log(`${data}`);
    scoreData = await JSON.parse(data.toString());
		console.log(scoreData)
		res.status(200).json({success:true,data:scoreData})
			
    await Url.findOneAndUpdate(
			{sourceUrl:url},
			{"score.aggregated":scoreData["score"]},
			{latTimeScoreUpdated:Date.now()})},(err)=>{
      console.log(err)
    });
  

	process.stderr.on('data',(data)=>{
		console.error(`${data}`);
	});




		//res.status(200).json({success:true,data:scoreData})
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }



}

// Look if their are score associated from 
// Factcheck in the url(not the aggregateScore)
const containsScore = async (req,res)=>{
	try{
		const url = req.body.url
		const value = await Url.exists({sourceUrl:url,containsScore:true })
		console.log(value)
		res.status(200).json({success:true,data:value})
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }
}


//getting ScoreList of claim 
const getScoreField = async(req,res)=>{
		try{
		const url = req.body.url
		const UrlObj = await Url.findOne({sourceUrl:url})
		const scoreField = UrlObj.score.scoreField
		//console.log(UrlObj)
		res.status(200).json({success:true,data:scoreField})
  }catch(error){
		res.status(409).json({success:false, data:[],error:error.message})
  }
}


module.exports ={
	notifyAdmin,
	containsScoreSystem,
	updateScoreInUrl,
	claimScoreInFactCheck,
	containsScore,
	computeAggregationNote,
	getScoreField
}
