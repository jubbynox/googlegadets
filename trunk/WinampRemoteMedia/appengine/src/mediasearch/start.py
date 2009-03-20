import os
import wsgiref.handlers

from google.appengine.ext import webapp
from mediasearch import commonservlets
from mediasearch import mediaservlets
from mediasearch import youtubeservlets


def main():
    application = webapp.WSGIApplication(
                                         [('/remotemedia/google/searchUrl', mediaservlets.SearchUrl),
                                          ('/remotemedia/google/getIgnoredSites', mediaservlets.GetIgnoredSites),
                                          ('/remotemedia/google/addBadMedia', mediaservlets.AddBadMedia),
                                          ('/remotemedia/youtube/getVideoURL', youtubeservlets.GetVideoURL),
                                          ('/remotemedia/addComments', commonservlets.AddComments)],
                                          debug=True)
    wsgiref.handlers.CGIHandler().run(application)
  
  
if __name__ == "__main__":
    main()