from google.appengine.ext import db


class Config(db.Model):
    """Root of all mediasearch data."""
    maxOccuranceUntilIgnore = db.IntegerProperty(required=True) # Number of bad media occurances until passed to ignored.

class Comments(db.Model):
    """Comments and suggestions."""
    comments = db.TextProperty(required=True)


class BadMedia(db.Model):
    """Bad Media."""
    siteUrl = db.StringProperty(required=True, multiline=False) # The site URL.
    cause = db.IntegerProperty(required=True) # The cause of the error. 1 = Bad response fetching URL content; 2 = App Engine timed out;
    occurance = db.IntegerProperty(required=True) # The number of times this site has been reported.
    timestamp = db.DateTimeProperty(required=True, auto_now=True, auto_now_add=True) # Last modified time.
    
class IgnoredSite(db.Model):
    """
    Ignored sites. Start with:
    audiozen.us
    bestmp3free.com
    netcashdaily.net
    www.musicmp3direct.com
    www.mobileminimovies.co.uk
    www.metacritic.com
    www.bigmusicdirectory.info
    www.rapidshare1.com
    www.randombase.com
    holytree.free.fr
    www.sodaroorchards.com
    suburbanrevolt.com
    mediastarsoft.net
    pure-mp3.com
    www.mp3bots.net
    """
    siteUrl = db.StringProperty(required=True, multiline=False) # The site URL.