const express = require("express")
const {
  addFactCheckToFactList,
  createFactCheckerList,
  createFactChecker,updateDate,
  addUrl,
  increasenumberOfAssociatedUrl,
  updateFactChecker,
  extractMetaData,
  setContainMetaData,
  notifyAdminNewFactCheck,

  } = require("../dataHandling/set")
router = express.Router()

router.post("/createFactChecker",createFactChecker)
router.get("/updateDate",updateDate)
router.post('/addUrl',addUrl)
router.post('/increasenumberOfAssociatedUrl',increasenumberOfAssociatedUrl )
router.post('/updateFactChecker',updateFactChecker)
router.post('/createFactCheckerList',createFactCheckerList)
router.post('/addFactCheckToFactList',addFactCheckToFactList)
router.get('/extractMetaData',extractMetaData)
router.get("/setContainMetaData",setContainMetaData)
router.post("/notifyAdminNewFactCheck",notifyAdminNewFactCheck)

module.exports = router;