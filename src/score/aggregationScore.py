'''
@ list of input 
Takes a list of input and compute from those a aggragateScore given 
the k-mean 

Example of input format : 
//the list is in Json format and the dict inside are also in Json format
[{fact-object},{fact-object},{fact-object}]

V1.0 We only takes the scores of the  fact-Objects and does not considerates the dates of 
the values.

V2.0 We considerated the dates of the object also and also compute a score for the values that has a
nierier date 

V3.0 For a a givenFactCheck present many times, we want to reduce the weight of the model
'''
# imports 
import requests 
import json
import sys
#from sklearn.cluster import KMeans
import numpy as np
import pandas as pd
import math
#import matplotlib.pyplot as plt
#plt.style.use('seaborn')
#from mpl_toolkits.mplot3d import Axes3D

ROUNDING_PRECISION =2
"""
# aggragation  without giving weight to the dates
def aggregatesScore ():
  pass


#give a certain weight to the value giving the date 
#more recent element have a higher date -> (2D space K-mean)
def aggragateScoreGivingDate():
  pass
"""




#aggregatorV1.0"

#Find and return the centroid value
#Mean and centroid are the same in 1D 
def getCentroid(listV):
    return sum(listV)/len(listV)

# calculate abs dist of point from centroide
def findDist(point,centroid):
    return math.sqrt((point-centroid)**2)

# calculate credibility values for each points
# On normalise de l'échelle de 1-5
def setCred0(point,centroid):
    return abs(1 - (findDist(point,centroid)/4))

# Set Cred for all the element in the given list
def setCredAll0(listV):
    credList=[]
    centroid = getCentroid(listV)
    for elem in listV:
        credList.append(setCred0(elem,centroid))
    return credList

def reputation(credList,listV):
    #have to ensure that they have the good dimensions
    #What happen if all the cred are =0
    sumU =0
    for i in range(len(credList)):
        sumU += credList[i]*listV[i]
    sumD = sum(credList)
    if sumD!=0:
        return sumU/sumD
    return None


# ici je peux peux être arrondir les valeurs
def aggregatorV1(factList):
  scoreList = getOnlyScoresFromFacts(factList)
  credL = setCredAll0(scoreList)
  return round(reputation(credL,scoreList),ROUNDING_PRECISION)





#Main Code#

#Takes the input string and return a 
# List of dictionnaries 
def parseFactListInput(factListString):
  factList = json.loads(factListString)
  theListDic = []
  for elem in factList:
    theListDic.append(json.loads(elem))
  return theListDic

# takes factList [{...},...{name:xx,score:scorex,date:xx},...{...}]=> returns only [score1,...,scoreN]
def getOnlyScoresFromFacts(factList):
  returnList = []
  for fact in factList:
    returnList.append(fact["score"])
  return returnList

def computeAggregationScore(factListString):
  factList= parseFactListInput(factListString)
  aggregationScore = aggregatorV1(factList)
  return json.dumps({"score":aggregationScore})



## Test ##

#computeAggregationScore(testList)
#l0 =[1,1,1,1,1,5,5]
#print(computeRep(l0))
#avr = sum(l0)/len(l0)
#print(avr)

#testList = "[\"{\\\"factId\\\":\\\"61b3bcecddd43198a37d3d3c\\\",\\\"score\\\":1,\\\"date\\\":\\\"2021-05-05T11:32:00Z\\\"}\",\"{\\\"factId\\\":\\\"61b3bcecddd43198a37d3d3c\\\",\\\"score\\\":5,\\\"date\\\":\\\"2021-05-05T11:32:00Z\\\"}\",\"{\\\"factId\\\":\\\"61b3bcecddd43198a37d3d3c\\\",\\\"score\\\":5,\\\"date\\\":\\\"2021-05-05T11:32:00Z\\\"}\",\"{\\\"factId\\\":\\\"61b3bcecddd43198a37d3d3c\\\",\\\"score\\\":2,\\\"date\\\":\\\"2021-05-05T11:32:00Z\\\"}\"]"
#print(computeAggregationScore(testList))

#EXtract# 

print(computeAggregationScore(sys.argv[1]))