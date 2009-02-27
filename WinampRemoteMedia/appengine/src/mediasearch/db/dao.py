import re

from mediasearch.db.objectmodel import Config
from mediasearch.db.objectmodel import Comments
from mediasearch.db.objectmodel import BadMedia
from mediasearch.db.objectmodel import IgnoredSite
from google.appengine.ext import db


def getConfig():
    config = db.get(db.Key.from_path("Config", "MediaSearchConfiguration"))
    if not config:
        config = Config(key_name="MediaSearchConfiguration", maxOccuranceUntilIgnore=10)
        config.put()
    return config


class DaoComments():
    """Comments accessor."""
    
    def getAll():
        """Gets all the comments."""
        return Comments.all()
    getAll = staticmethod(getAll)
    
    def add(comments):
        """Adds comments."""
        dbComments = Comments(parent=getConfig(), comments=comments)
        dbComments.put()
    add = staticmethod(add)
    
    def delete(comments):
        """Deletes comments."""
        comments.delete()
    delete = staticmethod(delete)


class DaoBadMedia():
    """Bad media accessor."""
    RE_SITE_URL_SEARCH = "https?://([^/]+)"; # Regular Expression. Retrieves only the site.
    
    def getAll():
        """Gets all the bad media."""
        return BadMedia.all()
    getAll = staticmethod(getAll)
    
    def getBadMedia(siteUrl, cause):
        """Finds a bad media site."""
        query = BadMedia.gql("WHERE siteUrl = :siteUrl AND cause = :cause",
                  siteUrl=siteUrl.lower(), cause=cause, parent=getConfig())   # Use lower case for matching.
        return query.get()
    getBadMedia = staticmethod(getBadMedia)
    
    def add(mediaUrl, cause):
        """Adds bad media information."""
        # Get the site from the mediaUrl string.
        siteUrl = re.search(DaoBadMedia.RE_SITE_URL_SEARCH, mediaUrl, re.I).group(1)
        # Find any existing site object else create a new one.
        badMedia = DaoBadMedia.getBadMedia(siteUrl, cause)
        if badMedia:
            # Media found, increment occurance.
            badMedia.occurance += 1
        else:
            # Create new bad media object.
            badMedia = BadMedia(parent=getConfig(), siteUrl=siteUrl.lower(), cause=cause, occurance=1)
        # Store the bad media or move to ignored site list.
        if badMedia.occurance > getConfig().maxOccuranceUntilIgnore:
            # Add to ignored site list and delete from bad media.
            DaoIgnoredSites.add(siteUrl)
            badMedia.delete()
        else:
            badMedia.put()
    add = staticmethod(add)
    
    def delete(badMedia):
        """Deletes bad media."""
        badMedia.delete()
    delete = staticmethod(delete)
    
    
class DaoIgnoredSites():
    """Ignored sites accessor."""
    
    def getAll():
        """Gets all the ignored sites."""
        return IgnoredSite.all()
    getAll = staticmethod(getAll)
    
    def add(siteUrl):
        """Adds a site URL to the ignored list."""
        # Check for existing site; add if does not already exist.
        ignoredSite = DaoIgnoredSites.getIgnoredSite(siteUrl)
        if not ignoredSite:
            ignoredSite = IgnoredSite(parent=getConfig(), siteUrl=siteUrl.lower())   # Store as lower case.
            ignoredSite.put()
    add = staticmethod(add)
    
    def delete(siteUrl):
        """Deletes an ignored site URL."""
        siteUrl.delete()
    delete = staticmethod(delete)
    
    def getIgnoredSite(siteUrl):
        """Finds the ignored site."""
        query = IgnoredSite.gql("WHERE siteUrl = :siteUrl",
                  siteUrl=siteUrl.lower(), parent=getConfig())   # Use lower case for matching.
        return query.get()
    getIgnoredSite = staticmethod(getIgnoredSite)