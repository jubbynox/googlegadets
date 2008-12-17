from google.appengine.ext import db

class Config(db.Model):
    """The configuration for the Telly. All values are in seconds."""
    heartbeatInterval = db.IntegerProperty(required=True) # Interval between heartbeats. These are used to perform housekeeping of data.
    minimumViewTime = db.IntegerProperty(required=True) # The minimum amount of time that must elapse before a new video can be requested.
    minimumAddInterval = db.IntegerProperty(required=True) # The minimum amount of time that must elapse before a viewer can add more content.
    minimumPurgeInterval = db.IntegerProperty(required=True) # The minimum amount of time that must elapse before a purge can be performed.
    maxAddCountPerHour = db.IntegerProperty(required=True) # The maximum amount of video additions a user can perform in one hour.


class Video(db.Model):
    """A video object."""
    id = db.IntegerProperty() # The ID of the video.
    title = db.StringProperty(required=True, multiline=False) # Title of video.
    url = db.LinkProperty(required=True) # The (YouTube) link to the video.
    viewCount = db.IntegerProperty(default=0, required=True) # The number of times the video has been viewed.
    errorFlag = db.BooleanProperty(default=False, required=True) # Indicates if this video has been reported with an error.
    duration = db.IntegerProperty(required=True) # The length of the video.
    description = db.TextProperty(required=True) # The description of the video.

  
class PlaylistItem(db.Model):
    """An item within a playlist."""
    video = db.ReferenceProperty(required=True, reference_class=Video, collection_name="playlist") # The video of this playlist item.
    message = db.StringProperty(multiline=False) # Any message to display with the video.
    created = db.DateTimeProperty(required=True, auto_now_add=True) # When the playlist item was added to the playlist.
    createdBy = db.ReferenceProperty(required=False, collection_name="playlist") # The viewer that added this playlist item.


class Viewer(db.Model):
    """A viewer."""
    guid = db.StringProperty(required=True, multiline=False) # A GUID for this viewer.
    currentlyViewing = db.ReferenceProperty(reference_class=PlaylistItem, collection_name="viewers") # The playlist item the view is currently watching.
    lastHeartbeat = db.DateTimeProperty() # When the viewer last sent a valid heartbeat.
    lastPlayTime = db.DateTimeProperty() # When the viewer last started playing a video.
    lastAddTime = db.DateTimeProperty() # When the viewer last added a video to the playlist.
    addCount = db.IntegerProperty(default=0, required=True) # The number of times, this hour, that the viewer has added a video.
    currentHour = db.IntegerProperty(required=False) # The current hour for which the add count applies.