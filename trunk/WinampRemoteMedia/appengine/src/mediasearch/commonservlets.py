import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from django.utils import simplejson
from mediasearch import jsonpickle
from mediasearch.db.dao import DaoComments
from mediasearch.db.dao import DaoApplication


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
            

class GetSupportedApps(webapp.RequestHandler):
    """Entry point for retrieving the supported applications."""
    def get(self):
        # Get application list.
        boApplications = DaoApplication.getAll()
        
        # Convert to JSON
        if boApplications.count() > 0:
            data = []
            for application in boApplications:
                app = SupportedApp()
                app.name = application.name
                app.appurl = application.appUrl
                app.iconurl = application.iconUrl
                data.append(app)
            jsonOut = jsonpickle.encode(data, unpicklable=False)
        else:
            jsonOut = '{ }'
        
        fnCallback = self.request.get("callback")
        if fnCallback:
            # Send data to callback function specified in GET parameters.
            # Create template values.
            templateValues = {
                              'fnCallback': fnCallback,
                              'data': jsonOut,
                              }
        
            # Write response.
            path = os.path.join(os.path.dirname(__file__), '../templates/SupportedApps.html')
            self.response.out.write(template.render(path, templateValues))
        else:
            # Return data.
            self.response.out.write(jsonOut)
        
        
class SupportedApp:
    """Used to hold application information."""
    def __init__(self):
        """Initialiser."""
        self.name = ''
        self.appurl = ''
        self.iconurl = ''