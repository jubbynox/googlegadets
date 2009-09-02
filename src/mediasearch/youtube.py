import re
import logging

from google.appengine.api import urlfetch

GET_VIDEO_INFO_URL = "http://www.youtube.com/get_video_info?&video_id=VIDEO_ID"
GET_VIDEO_URL = "http://www.youtube.com/get_video?video_id=VIDEO_ID&t=TOKEN_ID&fmt=FMT"

RE_TOKEN_ID_SEARCH = "&token=(.*?)&"

class YouTube:
    """YouTube search object."""
    
    def __init__(self, urlFetch):
        """Initialiser."""
        self.__urlFetch = urlFetch    # The URL fetch processor
        self.getVideoURL = ''
        
    def clearUrlFetch(self):
        self.__urlFetch = None
        
    def constructVideoURL(self, videoID, fmt):
        """Constructs the video URL."""
        # Get the token.
        tokenID = self.__getTokenID(videoID)
        if not tokenID:
            # Failure
            return
        
        # Find the actual download URL.
        self.getVideoURL = self.__getVideoDownloadURL(videoID, tokenID, fmt)
        
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
            logging.error('Could not get video information from site: ' + url + ' (' + result.status_code + ')')
            return
        # Ensure the content is in the right format.
        result.content = result.content.decode('utf-8', 'ignore')
        
        # Retrieve the token ID.
        match = re.search(RE_TOKEN_ID_SEARCH, result.content, re.I)
        match = re.search(RE_TOKEN_ID_SEARCH, result.content, re.I)
        if match:
            return match.group(1)
        else:
            return
        
    def __getVideoDownloadURL(self, videoID, tokenID, fmt):
        """Gets the actual download URL of the video."""
        url = GET_VIDEO_URL.replace('VIDEO_ID', videoID).replace('TOKEN_ID', tokenID).replace('FMT', fmt)
        result = self.__urlFetch.fetch(url, None, urlfetch.GET, {}, True, False)
        if result.status_code != 303:
            # Website did not respond as expected, try normal quality
            url = GET_VIDEO_URL.replace('VIDEO_ID', videoID).replace('TOKEN_ID', tokenID).replace('&fmt=FMT', '')
            result = self.__urlFetch.fetch(url, None, urlfetch.GET, {}, True, False)
            if result.status_code != 303:
                # Something is not working.
                logging.error('Could not get video source information from site: ' + url + ' (' + result.status_code + ')')
                return
            
        return result.headers["location"].decode('utf-8', 'ignore')