const express = require('express');
const { MongoServerClosedError } = require('mongodb');
const mongoose = require('mongoose');
const app = express();
const MetaData = require('./src/models/metadata') // import metaData
const create = require("./src/routes/create")
const get = require("./src/routes/getRouter")
const contains = require("./src/routes/contains");
const score = require("./src/routes/score")
const { isFactCheckRegistered } = require('./src/dataHandling/contain');


const main = require('./src/main')
// make  connection to url 
mongoose.connect(dbURI,{useNewUrlParser:true, useUnifiedTopology:true})
	.then((result)=> app.listen(3000))// because asynchronisrt 
	.catch((err)=>console.log(err));


//middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use("/create",create) // routing everything starting with create
app.use("/get",get) // routing everything starting with set
app.use("/contains",contains)// routing everything starting with contains 		
app.use("/score",score)// routing everything starting with score


app.get('/',function(req,res){
  res.send('Hello World');
});

const data = {
	title:"article#2 de la valeur",
	keywords:['k1','k2','k5']
}
app.get('/test',(req,res)=>{
	const meta = new MetaData(data);
	meta.save()
		.then((result)=>{
			res.send(result)
		})
		.catch((err)=>{
				console.log(err)
		})

});

app.get('/all-blogs',(req,res)=>{
	MetaData.find()
		.then((result)=>{
			res.send(result);
		})
		.catch((err)=>console.log(err));
});




// Entry point for Backend 
app.get('/main',async (req,res)=> {
	const returnValue = await main.main(req.body);
	res.send(returnValue)

});




