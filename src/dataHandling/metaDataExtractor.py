from bs4 import BeautifulSoup
import requests 
import json
import sys 



'''
The code will not support dynamic webSite,
for that we will need to use other parser that are JS native 
@ parameter: LinkUrl 
@returnValue: JSON ->metaData Object
@Technology : Scrappy 
We want to extract data from a webpage and return them in the form 
'''
#stores the values 
UrlDic = {}
propertyList = {
                "og:type":"type",
                "og:title":"title",
                "og:description":"description",
                "og:url":"sourceUrl",
                "og:site_name":"site_name",
                "article:tag":"tag",
                "article:published_time":"publishedTime",
                "article:modified_time":"modifiedTime",
                }
nameList = {
            "description":"description",
            "author":"author",
            "news_keywords":"keywords",
            "lastModified":"modifiedTime",
            "keywords":"keywords"
          }
#TestURL = ['https://www.journaldemontreal.com/2021/11/16/le-mystere-sepaissit-autour-du-meurtre-dun-ado-de-16-ans-a-montreal','https://www.lapresse.ca/actualites/justice-et-faits-divers/2021-11-16/proces-avorte-de-l-ex-maire-de-terrebonne/le-dpcp-interjette-appel.php','https://www.bbc.com/news/world-africa-59337953']


def postTraitement(dic):
  if dic["keywords"]: 
     dic["keywords"]=dic["keywords"].split(',')

  # remove not essential blank line 
  for key in dic: 
       if dic[key] == '':
         dic[key] =None

def Jsonify(dic):
  return json.dumps(dic,indent=4)


# Main code 
def extractData(url):

  
  # case when not reachable 
  html_text= requests.get(url).text
  soup = BeautifulSoup(html_text,'lxml')
  
  # property list 
  for tag in propertyList:
    # Extracting each 
    valueExtracted = soup.find('meta',property=tag)

    if valueExtracted:
      UrlDic[propertyList[tag]]=valueExtracted["content"]  
    else:
      UrlDic[propertyList[tag]] = None
    
  # nameList 
  for tag in nameList: 
    valueExtracted= soup.find('meta', attrs={'name':tag}) #because name is used by default
    if valueExtracted:
      if ((nameList[tag] in UrlDic) and (UrlDic[nameList[tag]] is None)) or (nameList[tag] not in UrlDic):
        UrlDic[nameList[tag]]= valueExtracted["content"]
    else:
      if nameList[tag] not  in UrlDic:
        UrlDic[nameList[tag]] = None

  postTraitement(UrlDic)
  return Jsonify(UrlDic)



# Extract 
print(extractData(sys.argv[1]))