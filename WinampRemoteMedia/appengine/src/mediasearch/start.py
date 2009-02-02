import os
import wsgiref.handlers
import logging

from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from mediasearch import jsonpickle
from django.utils import simplejson
from mediasearch import mediabranch
from mediasearch import testobjects
from mediasearch.db.dao import DaoComments
from mediasearch.db.dao import DaoBadMedia

class SearchUrl(webapp.RequestHandler):
    """Entry point for processing query."""
    def get(self):
        test = self.request.get("test")
        if test:
            urlFetch = testobjects.TestUrlFetch()
            if test == '2':
                urlFetch.setContent(urlFetch.content2)
            elif test == '3':
                urlFetch.setContent(urlFetch.content3)
        else:
            urlFetch = urlfetch
        url = self.request.get("url").replace(' ', '%20')
        branch = mediabranch.Branch(urlFetch)
        if branch.build(url, self.request.get("searchCriteria")):
            branch.clearUrlFetch()
            jsonOut = jsonpickle.encode(branch)
            self.response.out.write(jsonOut)
        else:
            self.response.out.write('{ }')
            
        
class AddComments(webapp.RequestHandler):
    """Entry point for adding comments."""
    def post(self):
        dataIn = convertJsonInputToObject(self.request.body)
        if dataIn.comments:
            DaoComments.add(dataIn.comments);
        
        
class AddBadMedia(webapp.RequestHandler):
    """Entry point for adding bad media."""
    def post(self):
        directoryUrl = self.request.get("directoryUrl")
        mediaUrl = self.request.get("mediaUrl")
        if directoryUrl and mediaUrl:
            DaoBadMedia.add(directoryUrl, mediaUrl)
        
        
def convertJsonInputToObject(jsonIn):
    """Ensures that posted JSON data is safely converted into an object."""
    firstPass = simplejson.loads(jsonIn)
    firstPass['classname__'] = 'AnyObject'
    firstPass['classmodule__'] = 'mediasearch.start'
    classJson = simplejson.dumps(firstPass)
    return jsonpickle.decode(classJson)
        
class AnyObject:
    """Used to hold any data from a JSON input."""
    pass

def main():
    application = webapp.WSGIApplication(
                                         [('/mediasearch/method/searchUrl', SearchUrl),
                                          ('/mediasearch/method/addComments', AddComments),
                                          ('/mediasearch/method/addBadMedia', AddBadMedia)],
                                          debug=True)
    wsgiref.handlers.CGIHandler().run(application)
  
  
if __name__ == "__main__":
    main()