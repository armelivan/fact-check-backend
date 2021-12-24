const express = require("express")
const{
  getMetaDataIdFromUrl,
  getScore,
  getFacts,
  generateNlpKeywords,
  testChild,
  getNlpKeywords,
  getNewFactsFromKey,
  getFactsFromMetaData
} = require("../dataHandling/get")
router = express.Router()

router.get("/getScore",getScore)
router.get("/generateNlpsKeywords",generateNlpKeywords)
router.get("/getMetaDataIdFromUrl",getMetaDataIdFromUrl)   
router.get("/testChild",testChild)   
router.get("/getNlpKeywords",getNlpKeywords)
router.get("/getNewFactsFromKey",getNewFactsFromKey)
router.get("/getFacts",getFacts)
router.get("/getFactsFromMetaData",getFactsFromMetaData)
module.exports = router;