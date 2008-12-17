import datetime
from telly.misc import uniqueid
from telly.db.objectmodel import Config
from telly.db.objectmodel import Viewer
from telly.db.objectmodel import PlaylistItem
from telly.db.objectmodel import Video
from google.appengine.ext import db


class DaoConfig():
    """Config data accessor."""
    
    def get():
        """Gets the configuration. Sets the config up if it is not currently there."""
        config = db.get(db.Key.from_path("Config", "TellyConfiguration"))
        if not config:
            config = Config(key_name="TellyConfiguration", heartbeatInterval=150, minimumViewTime=10,
                            minimumAddInterval=10, minimumPurgeInterval=600, maxAddCountPerHour=100)
            config.put()
        return config
    get = staticmethod(get)
    
    def update(config):
        """Updates the configuration. Not really necessary (because config.put() is only one line), but added for completeness."""
        config.put()
    update = staticmethod(update)


class DaoViewer():
    """Viewer data accessor."""
    
    def create(parent):
        """Creates a new viewer object."""
        viewer = Viewer(parent=parent, guid=uniqueid())
        viewer.put()
        return viewer
    create = staticmethod(create)
    
    def getByGuid(parent, guid):
        """Gets a viewer by their GUID."""
        if not guid:
            return None
        
        query = Viewer.gql("WHERE guid = :guid AND ANCESTOR IS :ancestor", guid=guid, ancestor=parent)
        return query.get()
    getByGuid = staticmethod(getByGuid)
    
    def updateAddTime(viewer):
        """Updates the add time of the viewer to the current time."""
        if viewer:
            viewer.lastAddTime = datetime.datetime.now()
            viewer.put()
    updateAddTime = staticmethod(updateAddTime)
    
    def incrementAddCount(viewer):
        """Increments the view count of the viewer."""
        if viewer:
            viewer.addCount = viewer.addCount + 1
            viewer.put()
    incrementAddCount = staticmethod(incrementAddCount)
    
    def update(viewer):
        """Updates the viewer. Not really necessary (because viewer.put() is only one line), but added for completeness."""
        viewer.put()
    update = staticmethod(update)
    
    def getMissingViewers(parent, minimumHeartbeat):
        """Returns the viewers that have not sent a heartbeat since at least minimumHeartbeat."""
        query = Viewer.gql("WHERE lastHeartbeat < :minimumHeartbeat AND ANCESTOR IS :ancestor",
                           minimumHeartbeat=minimumHeartbeat, ancestor=parent)
        return query
    getMissingViewers = staticmethod(getMissingViewers)
    
    def deleteViewer(viewer):
        """Deletes the viewer."""
        playlist = viewer.playlist
        for playlistItem in playlist:
            playlistItem.createdBy = None
            playlistItem.put()
            
        viewer.delete()
    deleteViewer = staticmethod(deleteViewer)
    
    
class DaoPlaylistItem():
    """Playlist item data accessor."""
    
    def create(parent, video, createdBy, message=''):
        """Creates a new playlist item."""
        playlistItem = PlaylistItem(parent=parent, video=video, message=message, createdBy=createdBy)
        return db.get(playlistItem.put()) # This makes sure the correct datetime is in the object (the retrieved object has +1 hour???)
    create = staticmethod(create)
    
    def getNext(parent, playlistItem):
        """Gets the next playlist item after the specified playlist item."""
        if playlistItem: # If a playlist item is specified then search for a newer one.
            query = PlaylistItem.gql("WHERE created > :lastDateTime AND ANCESTOR IS :ancestor ORDER BY created ASC", lastDateTime=playlistItem.created, ancestor=parent)
            return query.get()
        
        query = PlaylistItem.gql("WHERE ANCESTOR IS :ancestor ORDER BY created ASC", ancestor=parent)
        return query.get()
    getNext = staticmethod(getNext)
    
#    def purgeViewersPlaylist(parent, viewer):
#        """Removes a viewer's playlist items that no-one else is watching. Returns a list of orphaned videos."""
#        orphanedVideos = []
#        query = PlaylistItem.gql("WHERE createdBy = :createdBy AND ANCESTOR IS :ancestor", createdBy=viewer, ancestor=parent)
#        for playlistItem in query:
#            if playlistItem.viewers.count() > 0:
#                # Remove the link to the owning viewer.
#                playlistItem.createdBy = None
#                playlistItem.put()
#            else:
#                # Remember the video that is going to be orphaned.
#                orphanedVideos.append(playlistItem.video)
#                # Remove the playlist item.
#                playlistItem.delete()
#        return orphanedVideos
#    purgeViewersPlaylist = staticmethod(purgeViewersPlaylist)
    
    def getOldestViewingItem(parent):
        """Returns the oldest playlist item that is still being viewed."""
        retItem = None
        query = PlaylistItem.gql("WHERE ANCESTOR IS :ancestor ORDER BY created ASC", ancestor=parent)
        for playlistItem in query:
            if playlistItem.viewers.count() > 0:
                retItem = playlistItem
                break;
        return retItem
    getOldestViewingItem = staticmethod(getOldestViewingItem)
    
    def getItemsAddedBeforeDate(parent, date):
        """Returns the playlist items that were added before the given date."""
        query = PlaylistItem.gql("WHERE created < :date AND ANCESTOR IS :ancestor", date=date, ancestor=parent)
        return query
    getItemsAddedBeforeDate = staticmethod(getItemsAddedBeforeDate)
    
    def purge(parent):
        """Removes playlist items that no-one is watching and have no createdBy. Returns a list of orphaned videos."""
        orphanedVideos = []
        query = PlaylistItem.gql("WHERE createdBy=:createdBy AND ANCESTOR IS :ancestor", createdBy=None, ancestor=parent)
        for playlistItem in query:
            if playlistItem.viewers.count() == 0:
                # Remember the video that is going to be orphaned.
                orphanedVideos.append(playlistItem.video)
                # Remove the playlist item.
                playlistItem.delete()
        return orphanedVideos
    purge = staticmethod(purge)
        
    
    def delete(playlist):
        """Removes the playlist items in the given list. Returns a list of orphaned videos."""
        orphanedVideos = []
        for playlistItem in playlist:
            # Remember the video that is going to be orphaned.
            orphanedVideos.append(playlistItem.video)
            # Remove the playlist item.
            playlistItem.delete()
        return orphanedVideos
    delete = staticmethod(delete)


class DaoVideo():
    """Video data accessor."""
    
    def create(parent, title, url, duration, description):
        """Creates a video object, unless the URL is already in use; in which case it returns the existing video."""
        link = db.Link(url)
        query = Video.gql("WHERE url = :url AND ANCESTOR IS :ancestor", url=link, ancestor=parent)
        video = query.get()
        if video: # A video with that URL already exists.
            return video
        
        video = Video(parent=parent, title=title, url=link, duration=duration, description=description)
        video.put()
        # Update with ID.
        video.id = video.key().id()
        video.put()
        return video
    create = staticmethod(create)
    
    def getById(parent, id):
        """Searches for a video based on its ID."""
        query = Video.gql("WHERE id = :id AND ANCESTOR IS :ancestor", id=id, ancestor=parent)
        return query.get()
    getById = staticmethod(getById)
    
    def incrementViewCount(video):
        """Increments the view count of the video."""
        if video:
            video.viewCount += 1
            video.put()
    incrementViewCount = staticmethod(incrementViewCount)
            
    def flagWithError(video):
        """Sets the error flag on the video."""
        video.errorFlag = True
        video.put()
    flagWithError = staticmethod(flagWithError)
        
    def getList(parent):
        """Gets a list of all videos."""
        return Video.gql("WHERE ANCESTOR IS :ancestor", ancestor=parent)
    getList = staticmethod(getList)
    
    def refresh(video):
        """Refreshes a video."""
        return video.get(video.key())
    refresh = staticmethod(refresh)
    
    def delete(videos):
        """Deletes the videos."""
        if type(videos) is list and len(videos) > 0 or videos.count() > 0:
            db.delete(videos)
    delete = staticmethod(delete)
    
    def getAllOrdered(parent):
        """Returns all the videos, ordered by viewCount (descending)."""
        query = Video.gql("WHERE ANCESTOR IS :ancestor ORDER BY viewCount DESC", ancestor=parent)
        return query
    getAllOrdered = staticmethod(getAllOrdered)