const express = require("express")
const{
  notifyAdmin,
  containsScoreSystem,
  updateScoreInUrl,
  claimScoreInFactCheck,
  containsScore,
  computeAggregationNote,
  getScoreField
} = require("../score/scoreHelpers")
router = express.Router()
router.post("/notifyAdmin",notifyAdmin)
router.post("/containsScoreSystem",containsScoreSystem)
router.post("/updateScoreInUrl",updateScoreInUrl)
router.post("/claimScoreInFactCheck",claimScoreInFactCheck)
router.get("/containsScore",containsScore)
router.get("/computeAggregationNote",computeAggregationNote)
router.get("/getScoreField",getScoreField)

module.exports = router;