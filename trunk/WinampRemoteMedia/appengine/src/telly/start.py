import os
import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template


class MainPage(webapp.RequestHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, None))
    

def main():
    application = webapp.WSGIApplication(
                                         [('/telly/*.*', MainPage)],
                                          debug=True)
    wsgiref.handlers.CGIHandler().run(application)
  
  
if __name__ == "__main__":
    main()