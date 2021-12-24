# this is the version one, 
# in  this first version we are only concerned with the title 
# in other version more advance model can be considered to combined 
# other elements such as keywords 
# to pass the value whe are using childProcess
# 
# @version 1 on prend uniquement le titre comme parametre apres on pourra s'intereser 
# a tout l'objet metaData au complet
import json
import sys 
'''
metaData = {
	"id":"id",
	"title": "title of the article",
	"author": "author name",
	"keywords": ["kw1","kw2","kw3"],
	"description":"description of the article",
	"publishedTime":"date of publish",
	"modifiedTime": "date of modification",
	"sourceUrl": "url of the article",
}
'''

# takes a metaData object and return a list of keyword from it 
def CalculateKeywords(metaDataImported ):
  try:
    #metaData = json.loads(metaDataImported)
    #print(metaData)
    #sentence = "Uganda's Kampala bombings: Muslim cleric accused of jihadist links shot dead".split(' ')
    sentence = metaDataImported.split(' ')
    return json.dumps(generateSubSentences(sentence)) # return egalement en format json pout pouvoir decoder simplement
  except Exception as err:
    print(err)
    
  

'''Version1 of generateSubsentence
  Generate subsentences from list and return them.
  What is the time complexity of this ?
'''
# takes a list of words from a sentence 
def generateSubSentences(sentence):
  potentialQuerriesList= []
  n = len(sentence)
  for i in range(0,n):
      for j in range(i+1,n+1):
          potentialQuerriesList.append(sentence[i:j])
  potentialQuerriesList.sort(key=len) # optional but good for analysis 
  return multiplesWordsListToSentence(potentialQuerriesList)

def multiplesWordsListToSentence(multiplesWordsList):
  mp =[]
  for wordList in multiplesWordsList:
    wordList = wordsListToSentence(wordList)
    mp.append(wordList)
  
  return mp

def wordsListToSentence(wordList):
  return " ".join(wordList)


# Execution
print(CalculateKeywords(sys.argv[1]))
