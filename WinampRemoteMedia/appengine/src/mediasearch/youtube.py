import re

from google.appengine.api import urlfetch

GET_VIDEO_INFO_URL = "http://www.youtube.com/get_video_info?&video_id=VIDEO_ID"
GET_VIDEO_URL = "http://www.youtube.com/get_video?video_id=VIDEO_ID&t=TOKEN_ID"

RE_TOKEN_ID_SEARCH = "&token=(.*?)&"

class YouTube:
    """YouTube search object."""
    
    def __init__(self, urlFetch):
        """Initialiser."""
        self.__urlFetch = urlFetch    # The URL fetch processor
        self.getVideoURL = ''
        
    def clearUrlFetch(self):
        self.__urlFetch = None
        
    def constructVideoURL(self, videoID):
        """Constructs the video URL."""
        tokenID = self.__getTokenID(videoID)
        if not tokenID:
            # Failure
            return
        
        # Construct URL to pass back.
        self.getVideoURL = GET_VIDEO_URL.replace('VIDEO_ID', videoID).replace('TOKEN_ID', tokenID)
        
        # Success
        return True
    
    def __getTokenID(self, videoID):
        """Gets the video token from a supplied video ID."""
        # Construct URL.
        url = GET_VIDEO_INFO_URL.replace('VIDEO_ID', videoID)
        
        # Get the page content.
        result = self.__urlFetch.fetch(url, None, urlfetch.GET, {}, True, True)
        if result.status_code != 200:
            # Website did not respond correctly. Report error.
            return
        # Ensure the content is in the right format.
        result.content = result.content.decode('utf-8', 'ignore')
        
        # Retrieve the token ID.
        match = re.search(RE_TOKEN_ID_SEARCH, result.content, re.I)
        if match:
            return match.group(1)
        else:
            return