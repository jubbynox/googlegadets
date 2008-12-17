from google.appengine.ext import db


class Config(db.Model):
    """Root of all mediasearch data."""
    pass

class Comments(db.Model):
    """Comments and suggestions."""
    comments = db.TextProperty(required=True)


class BadMedia(db.Model):
    """Bad Media."""
    directoryUrl = db.StringProperty(required=True, multiline=False) # The media directory.
    mediaUrl = db.StringProperty(required=True, multiline=False) # The media URL.