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
        # Get application list
        jsonOut = None
        try:
            dllVer = float(self.request.get("dllVer"))
            boApplications = DaoApplication.getByVer(dllVer)
            # Convert to JSON
            if len(boApplications) > 0:
                data = []
                for application in boApplications:
                    app = SupportedApp()
                    app.name = application.name
                    app.appurl = application.appUrl
                    app.iconid = application.iconId
                    data.append(app)
                jsonOut = jsonpickle.encode(data, unpicklable=False)
        except ValueError:
            pass
        
        if not jsonOut:
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
            path = os.path.join(os.path.dirname(__file__), '../templates/Callback.html')
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
        self.iconid = ''
        
        
class GetWinAmpCSS(webapp.RequestHandler):
    """Entry point for retrieving the WinAmp CSS."""
    def get(self):
        # Get application list
        jsonOut = None
        font = self.request.get("font")
        fontsize = self.request.get("fontsize")
        itemBackground = self.request.get("itemBackground")
        itemForeground = self.request.get("itemForeground")
        windowBackground = self.request.get("windowBackground")
        buttonForeground = self.request.get("buttonForeground")
        hilite = self.request.get("hilite")
        listHeaderBackground = self.request.get("listHeaderBackground")
        listHeaderText = self.request.get("listHeaderText")
        selectionBarForeground = self.request.get("selectionBarForeground")
        selectionBarBackground = self.request.get("selectionBarBackground")
        inactiveSelectionBarBackground = self.request.get("inactiveSelectionBarBackground")
        
        # Create template values.
        templateValues = {
                          'FONT': font,
                          'FONT_SIZE': fontsize,
                          'ITEM_BACKGROUND': itemBackground,
                          'ITEM_FOREGROUND': itemForeground,
                          'WINDOW_BACKGROUND': windowBackground,
                          'BUTTON_FOREGROUND': buttonForeground,
                          'HILITE': hilite,
                          'LIST_HEADER_BACKGROUND': listHeaderBackground,
                          'LIST_HEADER_TEXT': listHeaderText,
                          'SELECTION_BAR_FOREGROUND': selectionBarForeground,
                          'SELECTION_BAR_BACKGROUND': selectionBarBackground,
                          'INACTIVE_SELECTION_BAR_BACKGROUND': inactiveSelectionBarBackground
                          }
        
        # Write response.
        path = os.path.join(os.path.dirname(__file__), '../templates/winamp.css')
        self.response.out.write(template.render(path, templateValues))