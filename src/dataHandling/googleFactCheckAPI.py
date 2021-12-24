'''
Connections and  functions to request values 
from the Google FactCheck API 
Dans cette version on fait des requettes simples,
de facon sequentielle en pastant mot par mot.
Dans des versions a venir on pourra combiner pour faire des recherches avancer
'''


'''
response object request: 
{
  "claims": [
    {
      "text": "Video of massive rally in support of Muslims in Tripura who have faced violence recently.",
      "claimant": "Facebook users",
      "claimDate": "2021-11-01T00:00:00Z",
      "claimReview": [
        {
          "publisher": {
            "name": "India Today",
            "site": "indiatoday.in"
          },
          "url": "https://www.indiatoday.in/fact-check/story/old-video-anti-macron-rally-dhaka-shared-protests-tripura-violence-1874094-2021-11-08",
          "title": "Fact Check: Old video of anti-Macron rally in Dhaka shared as ...",
          "reviewDate": "2021-11-08T00:00:00Z",
          "textualRating": "Mostly false",
          "languageCode": "en"
        }
      ]
    },
    {
      claim2...
    },
    {
      claim3...
    },
    {
      claimN...
    },
    
  ],
  "nextPageToken": "CAo"
}
'''
# Ne pas commit le code a cause des identifiants 
#imports 
import requests 
import sys
import pprint
import json
from sentence_transformers import SentenceTransformer, util
import numpy as np
from semanticHandler import compareSentences

# Trouver le moyen de hide les valeurs 
KEY= # set your key
QUERY = '0009989jkln'
TRESHOLD =0.75

# contains the set of claims that satisfied the passing conditions


# return appropriate response in case of fact_check
def getFactCheksContent(fact):
  if fact.status_code ==200:
    return fact.text
  else: 
    return 'error :'+str(fact.status_code)

#return Object containing Fact 
#or an empty 
# reference to test querries :https://developers.google.com/fact-check/tools/api/reference/rest/v1alpha1/claims/search?apix_params=%7B%22languageCode%22%3A%22en%22%2C%22query%22%3A%22montreal%22%7D
def getFactCheks(key,query):
  try: 

    requestUrl = f'https://factchecktools.googleapis.com/v1alpha1/claims:search?languageCode=en&query={query}&key={key}'
    r=requests.get(requestUrl)
    return getFactCheksContent(r)
  except Exception as e:
    print('Unexpected Error')
    return e.text

def claimInCache(claim,cache):
  title = getTitle(claim)
  return title in cache

def addClaimToCache(claim,cache):
  title = getTitle(claim)
  cache[title]=1

def getTitle(claim):
  if "title" in  claim["claimReview"][0]:
    return claim["claimReview"][0]["title"]
  else:
    return claim["text"]+claim["claimReview"][0]["publisher"]["site"]

def getCompatibleFactCheckIndividual(querry,validationSentence,theList,cache):

  response = json.loads(getFactCheks(KEY,querry))

  #dictionnary not empty we have claims   
  if response:
    claimsList = response["claims"]
    k=len(claimsList)
    #print(f"taille des reponses obtenus:{k}")
    j=1
    for claim in claimsList:
      #print(f"  {j}/{k}")
      j=j+1
      #print(claim["claimReview"][0])
      if (claimInCache(claim,cache)==False):
        value = validateSimilarityScore(claim["text"],validationSentence)
          #print("value: "+str(value))
        if value==True:
          if claim not in theList:
            theList.append(claim)
        else:
            pass
        addClaimToCache(claim,cache)
      else:
        #print("in cache")
        pass
    #print("this is it ")


#return Boolean
def validateSimilarityScore(claimSentence,validationSentence):
   score = compareSentences(claimSentence,validationSentence)
   #print("s1: "+str(claimSentence)+" s2:"+str(validationSentence))
   #print("      score:"+str(score))
   return score >=TRESHOLD


# takes a list of claim sets and format them in the
# good form for them to be returned
#x = getCompatibleFactCheck('{"keywords":["The sudden deaths","The sudden deaths of 10 teenagers may be linked to Covid-19 vaccines"],"title":"The sudden deaths of 10 teenagers may be linked to Covid-19 vaccines"}')


# MAIN FUNCTION 
# request object: '{"keywords":["q1","q2",...,"qn"],"title":"the title"}'
def getCompatibleFactCheck(requestObject):
  try:
    claimsSet=[]
    cacheSet={}
    kObj = json.loads(requestObject)
    n = len(kObj["keywords"])
    #print("nombre de keywords "+str(n))
    i=0
    for querry in kObj["keywords"]:
      getCompatibleFactCheckIndividual(querry,kObj["title"],claimsSet,cacheSet)
      i=i+1
      #print(f"{i}/{n}%")
      #print("claimSet:"+str(claimsSet))
    return json.dumps(claimsSet) # return it as a json text file 
    #print(claimsList)
  except Exception as e:
    print(str(e))


# Execution of the code 
print(getCompatibleFactCheck(sys.argv[1]))
