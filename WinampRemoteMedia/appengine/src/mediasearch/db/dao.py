from mediasearch.db.objectmodel import Config
from mediasearch.db.objectmodel import Comments
from mediasearch.db.objectmodel import BadMedia
from google.appengine.ext import db


def getConfig():
    config = db.get(db.Key.from_path("Config", "MediaSearchConfiguration"))
    if not config:
        config = Config(key_name="MediaSearchConfiguration")
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
    
    def getAll():
        """Gets all the bad media"""
        return BadMedia.all()
    getAll = staticmethod(getAll)
    
    def add(directoryUrl, mediaUrl):
        """Adds bad media information."""
        badMedia = BadMedia(parent=getConfig(), directoryUrl=directoryUrl, mediaUrl=mediaUrl)
        badMedia.put()
    add = staticmethod(add)
    
    def delete(badMedia):
        """Deletes bad media."""
        badMedia.delete()
    delete = staticmethod(delete)