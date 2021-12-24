const express = require("express")
const{
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
} = require("../dataHandling/contain")
router = express.Router()


router.get("/isurlInDb",isUrlInDB)
router.get("/isLinkReachable",isLinkReachable)
router.get("/isThereAscore",isThereAscore),
router.get("/isTheScoreUpdated",isTheScoreUpdated)
router.get("/isFactCheckRegistered",isFactCheckRegistered)
router.get("/containAssociatedFactCheck",containAssociatedFactCheck)
router.get("/containsMetaData",containsMetaData)
router.get("/containsScore",containsScore)
router.get("/containsNlpKeywords",containsNlpKeywords)
router.get("/containRelevantKeywords",containRelevantKeywords)
router.get("/canReachLink",canReachLink)
router.get("/containDifferentFactCheck",containDifferentFactCheck)


module.exports = router;