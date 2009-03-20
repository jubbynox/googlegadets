from google.appengine.ext import webapp
from django.utils import simplejson
from mediasearch import jsonpickle
from mediasearch.db.dao import DaoComments


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


class AddComments(webapp.RequestHandler):
    """Entry point for adding comments."""
    def post(self):
        dataIn = convertJsonInputToObject(self.request.body)
        if dataIn.comments:
            DaoComments.add(dataIn.comments);