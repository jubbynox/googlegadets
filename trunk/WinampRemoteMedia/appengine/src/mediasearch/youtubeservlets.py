from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from mediasearch import jsonpickle
from mediasearch import youtube


class GetVideoURL(webapp.RequestHandler):
    """Entry point for processing get video query."""
    def get(self):
        urlFetch = urlfetch
        yt = youtube.YouTube(urlFetch)
        if yt.constructVideoURL(self.request.get("videoID"), self.request.get("fmt")):
            yt.clearUrlFetch()
            jsonOut = jsonpickle.encode(yt, unpicklable=False)
            self.response.out.write(jsonOut)
        else:
            self.response.out.write('{ }')