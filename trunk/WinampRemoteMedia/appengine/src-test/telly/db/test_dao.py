import unittest
import datetime
from google.appengine.ext import db
from telly.db import objectmodel
from telly.db import dao
from telly.db.cache import CacheConfig


class TestDaoConfig(unittest.TestCase):
    """DaoConfig test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        configurations = objectmodel.Config.all()
        if configurations.count() > 0:
            db.delete(configurations)
    
    def testGet(self):
        config = dao.DaoConfig.get()
        self.assertEqual(config.heartbeatInterval, 150, 'Default heartbeatInterval not setup.')
        self.assertEqual(config.minimumViewTime, 10, 'Default minimumViewTime not setup.')
        self.assertEqual(config.minimumAddInterval, 10, 'Default minimumAddInterval not setup.')
        self.assertEqual(config.minimumPurgeInterval, 600, 'Default minimumPurgeInterval not setup.')
        self.assertEqual(config.maxAddCountPerHour, 100, 'Default maxAddCountPerHour not setup.')
        
    def testUpdate(self):
        config = dao.DaoConfig.get()
        config.heartbeatInterval = 1
        config.minimumViewTime = 1
        config.minimumAddInterval = 1
        config.minimumPurgeInterval = 1
        config.maxAddCountPerHour = 1
        dao.DaoConfig.update(config)
        
        config = dao.DaoConfig.get()
        self.assertEqual(config.heartbeatInterval, 1, 'heartbeatInterval not updated.')
        self.assertEqual(config.minimumViewTime, 1, 'minimumViewTime not updated.')
        self.assertEqual(config.minimumAddInterval, 1, 'minimumAddInterval not updated.')
        self.assertEqual(config.minimumPurgeInterval, 1, 'minimumPurgeInterval not updated.')
        self.assertEqual(config.maxAddCountPerHour, 1, 'maxAddCountPerHour not updated.')


class TestDaoViewer(unittest.TestCase):
    """DaoViewer test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        viewers = objectmodel.Viewer.all()
        if viewers.count() > 0:
            db.delete(viewers)
        listItems = objectmodel.PlaylistItem.all()
        if listItems.count() > 0:
            db.delete(listItems)
        videos = objectmodel.Video.all()
        if videos.count() > 0:
            db.delete(videos)
    
    def testCreate(self):
        viewer = dao.DaoViewer.create(CacheConfig.get())
        self.assert_(viewer.guid, 'guid not set.')
        self.assert_(not viewer.currentlyViewing, 'currentlyViewing has a value.')
        self.assert_(not viewer.lastHeartbeat, 'lastHeartbeat has a value.')
        self.assert_(not viewer.lastPlayTime, 'lastPlayTime has a value.')
        self.assert_(not viewer.lastAddTime, 'lastAddTime has a value.')
        self.assert_(not viewer.addCount, 'addCount has a value.')
    
    def testGetByGuidSuccess(self):
        newViewer = dao.DaoViewer.create(CacheConfig.get())
        lastHeartbeat = datetime.datetime(2008, 1, 1)
        lastPlayTime = datetime.datetime(2008, 1, 2)
        lastAddTime = datetime.datetime(2008,1 , 3)
        addCount = 100
        currentHour = 12
        newViewer.lastHeartbeat = lastHeartbeat
        newViewer.lastPlayTime = lastPlayTime
        newViewer.lastAddTime = lastAddTime
        newViewer.addCount = addCount
        newViewer.currentHour = currentHour
        newViewer.put()
        
        retrievedViewer = dao.DaoViewer.getByGuid(CacheConfig.get(), newViewer.guid)
        self.assertEqual(retrievedViewer.guid, newViewer.guid, "guid doesn't match.")
        self.assertEqual(retrievedViewer.lastHeartbeat, newViewer.lastHeartbeat, "lastHeartbeat doesn't match.")
        self.assertEqual(retrievedViewer.lastPlayTime, newViewer.lastPlayTime, "lastPlayTime doesn't match.")
        self.assertEqual(retrievedViewer.lastAddTime, newViewer.lastAddTime, "lastAddTime doesn't match.")
        self.assertEqual(retrievedViewer.addCount, newViewer.addCount, "addCount doesn't match.")
        self.assertEqual(retrievedViewer.currentHour, newViewer.currentHour, "currentHour doesn't match.")
    
    def testGetByGuidFailure(self):
        viewer = dao.DaoViewer.getByGuid(CacheConfig.get(), 'madeupguid')
        self.assert_(viewer is None, 'viewer retrieved for "madeupguid"')
    
    def testUpdateAddTime(self):
        viewer = dao.DaoViewer.create(CacheConfig.get())
        dao.DaoViewer.updateAddTime(viewer)
        self.assert_(viewer.lastAddTime, 'lastAddTime does not have a value.')
        
    def testIncrementAddCount(self):
        viewer = dao.DaoViewer.create(CacheConfig.get())
        oldAddCount = viewer.addCount
        dao.DaoViewer.incrementAddCount(viewer)
        newAddCount = viewer.addCount
        self.assertEqual(newAddCount, oldAddCount + 1, 'newAddCount is not 1 more than oldAddCount: ' + str(newAddCount-oldAddCount))
    
    def testUpdate(self):
        newViewer = dao.DaoViewer.create(CacheConfig.get())
        lastHeartbeat = datetime.datetime(2008, 1, 1)
        lastPlayTime = datetime.datetime(2008, 1, 2)
        lastAddTime = datetime.datetime(2008,1 , 3)
        addCount = 100
        currentHour = 12
        newViewer.lastHeartbeat = lastHeartbeat
        newViewer.lastPlayTime = lastPlayTime
        newViewer.lastAddTime = lastAddTime
        newViewer.addCount = addCount
        newViewer.currentHour = currentHour
        dao.DaoViewer.update(newViewer)
        
        retrievedViewer = dao.DaoViewer.getByGuid(CacheConfig.get(), newViewer.guid)
        self.assertEqual(retrievedViewer.guid, newViewer.guid, "guid doesn't match.")
        self.assertEqual(retrievedViewer.lastHeartbeat, newViewer.lastHeartbeat, "lastHeartbeat doesn't match.")
        self.assertEqual(retrievedViewer.lastPlayTime, newViewer.lastPlayTime, "lastPlayTime doesn't match.")
        self.assertEqual(retrievedViewer.lastAddTime, newViewer.lastAddTime, "lastAddTime doesn't match.")
        self.assertEqual(retrievedViewer.addCount, newViewer.addCount, "addCount doesn't match.")
        self.assertEqual(retrievedViewer.currentHour, newViewer.currentHour, "currentHour doesn't match.")
        
    def testGetMissingViewers(self):
        expiredTime = datetime.datetime.now() - datetime.timedelta(2);
        expiredViewer = dao.DaoViewer.create(CacheConfig.get())
        expiredViewer.lastHeartbeat = expiredTime
        dao.DaoViewer.update(expiredViewer)
        activeViewer = dao.DaoViewer.create(CacheConfig.get())
        activeViewer.lastHeartbeat = datetime.datetime.now()
        dao.DaoViewer.update(activeViewer)
        
        validTime = datetime.datetime.now() - datetime.timedelta(1);
        viewers = dao.DaoViewer.getMissingViewers(CacheConfig.get(), validTime)
        self.assertEqual(viewers.count(), 1, "viewers has " + str(viewers.count()) + " entries.")
        self.assertEqual(viewers.get().guid, expiredViewer.guid, "expiredViewer not returned.")
        
    def testDeleteViewer(self):
        viewer = dao.DaoViewer.create(CacheConfig.get())
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        playlistItem = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer, "message")
        dao.DaoViewer.deleteViewer(viewer)
        
        retrievedViewer = dao.DaoViewer.getByGuid(CacheConfig.get(), viewer.guid)
        self.assert_(retrievedViewer is None, 'viewer retrieved for "' + viewer.guid + '"')
        retrievedPlaylistItem = dao.DaoPlaylistItem.getNext(CacheConfig.get(), None)
        self.assert_(retrievedPlaylistItem.createdBy is None, 'retrievedPlaylistItem.createdBy is not None')
        
        
class TestDaoVideo(unittest.TestCase):
    """DaoVideo test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        videos = objectmodel.Video.all()
        if videos.count() > 0:
            db.delete(videos)
            
    def testCreateNew(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        self.assertEqual(video.title, "Title", "video title is incorrect: " + video.title)
        self.assertEqual(video.url, "http://url", "video URL is incorrect: " + video.url)
        self.assertEqual(video.duration, 1, "video duration is incorrect: " + str(video.duration))
        self.assertEqual(video.description, "description", "video description is incorrect: " + video.description)
        self.assert_(video.id, 'id not set.')
        
    def testCreateExisting(self):
        dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        count = objectmodel.Video.all().count()
        self.assertEqual(count, 1, "count of videos is not 1: " + str(count))
        
    def testGetById(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        video = dao.DaoVideo.getById(CacheConfig.get(), video.id)
        self.assert_(video, 'video not retrieved')
        
    def testincrementViewCount(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        dao.DaoVideo.incrementViewCount(video)
        dao.DaoVideo.incrementViewCount(video)
        self.assertEqual(video.viewCount, 2, 'video.viewCount is not 1: ' + str(video.viewCount))
        
    def testFlagWithError(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        self.assert_(not video.errorFlag, 'video.errorFlag is: ' + str(video.errorFlag))
        
        dao.DaoVideo.flagWithError(video)
        video = dao.DaoVideo.getById(CacheConfig.get(), video.id)
        self.assert_(video.errorFlag, 'video.errorFlag is: ' + str(video.errorFlag))
        
    def testGetList(self):
        video1 = dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1")
        video2 = dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2")
        video3 = dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3")
        videos = dao.DaoVideo.getList(CacheConfig.get())
        self.assertEqual(videos.count(), 3, 'videos.count() is not 3: ' + str(videos.count()))
        
    def testRefresh(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        video.viewCount = 100
        video = dao.DaoVideo.refresh(video)
        self.assertEqual(video.viewCount, 0, 'video.viewCount is not 0: ' + str(video.viewCount))
        
    def testDeleteByListType(self):
        videos = []
        videos.append(dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1"))
        videos.append(dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2"))
        videos.append(dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3"))
        
        dao.DaoVideo.delete(videos)
        videos = dao.DaoVideo.getList(CacheConfig.get())
        self.assertEqual(videos.count(), 0, 'videos.count() is not 0: ' + str(videos.count()))
        
    def testDeleteByGqlQueryType(self):
        dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1")
        dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2")
        dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3")
        
        videos = dao.DaoVideo.getList(CacheConfig.get())
        dao.DaoVideo.delete(videos)
        videos = dao.DaoVideo.getList(CacheConfig.get())
        self.assertEqual(videos.count(), 0, 'videos.count() is not 0: ' + str(videos.count()))
        
    def testGetAllOrdered(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1")
        video.viewCount = 100
        video.put()
        video = dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2")
        video.viewCount = 50
        video.put()
        video = dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3")
        video.viewCount = 150
        video.put()
        
        videos = dao.DaoVideo.getAllOrdered(CacheConfig.get())
        self.assertEqual(videos[0].title, "Title3", 'videos[0].title is not "Title3": ' + videos[0].title)
        self.assertEqual(videos[1].title, "Title1", 'videos[1].title is not "Title3": ' + videos[1].title)
        self.assertEqual(videos[2].title, "Title2", 'videos[2].title is not "Title3": ' + videos[2].title)
        
        
class TestDaoPlaylistItem(unittest.TestCase):
    """DaoPlaylistItem test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        listItems = objectmodel.PlaylistItem.all()
        if listItems.count() > 0:
            db.delete(listItems)
        videos = objectmodel.Video.all()
        if videos.count() > 0:
            db.delete(videos)
        viewers = objectmodel.Viewer.all()
        if viewers.count() > 0:
            db.delete(viewers)
            
    def testCreate(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "desciption")
        viewer = dao.DaoViewer.create(CacheConfig.get())
        message = 'message'
        playlistItem = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer, message)
        
        self.assertEqual(playlistItem.video.title, video.title, 'playlistItem.video.title is not "Title": ' + playlistItem.video.title)
        self.assertEqual(playlistItem.createdBy.guid, viewer.guid, 'playlistItem.createdBy.guid is not "' + viewer.guid + '": ' + playlistItem.createdBy.guid)
        self.assertEqual(playlistItem.message, message, 'playlistItem.message is not "message": ' + playlistItem.message)
        self.assert_(playlistItem.created, 'playlistItem.created not set.')
        
    def testGetNextNoItems(self):
        playlistItem = dao.DaoPlaylistItem.getNext(CacheConfig.get(), None)
        self.assert_(playlistItem is None, 'playlistItem returned.')
        
    def setupPlaylist(self, message1, message2, message3, returnItem):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        viewer = dao.DaoViewer.create(CacheConfig.get())
        playlistItem1 = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer, message1)
        playlistItem2 = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer, message2)
        playlistItem3 = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer, message3)
        playlistItem1.created = datetime.datetime.now() - datetime.timedelta(150);
        playlistItem1.put()
        playlistItem2.created = datetime.datetime.now() - datetime.timedelta(100);
        playlistItem2.put()
        if returnItem is not None:
            if returnItem == 1:
                return playlistItem1
            elif returnItem == 2:
                return playlistItem2
            elif returnItem == 3:
                return playlistItem3
            else:
                return None
        
    def testGetNextNoneSpecifed(self):
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        self.setupPlaylist(message1, message2, message3, None)
        playlistItem = dao.DaoPlaylistItem.getNext(CacheConfig.get(), None)
        self.assertEqual(playlistItem.message, message1, 'playlistItem.message is not "' + message1 + '": ' + playlistItem.message)
        
    def testGetNextMiddleListItemSpecifed(self):
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        playlistItem = self.setupPlaylist(message1, message2, message3, 2)
        retrievedPlaylistItem = dao.DaoPlaylistItem.getNext(CacheConfig.get(), playlistItem)
        self.assertEqual(retrievedPlaylistItem.message, message3, 'retrievedPlaylistItem.message is not "' + message3 + '": ' + retrievedPlaylistItem.message)
        
    def testGetNextLastListItemSpecifed(self):
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        playlistItem = self.setupPlaylist(message1, message2, message3, 3)
        retrievedPlaylistItem = dao.DaoPlaylistItem.getNext(CacheConfig.get(), playlistItem)
        self.assert_(retrievedPlaylistItem is None, 'retrievedPlaylistItem returned.') 
        
    """def testPurgeViewersPlaylist(self):
        # Create 3 test videos.
        video1 = dao.DaoVideo.create(CacheConfig.get(), "title1", "http://url1", 1, "description1")
        video2 = dao.DaoVideo.create(CacheConfig.get(), "title2", "http://url2", 2, "description2")
        video3 = dao.DaoVideo.create(CacheConfig.get(), "title3", "http://url3", 3, "description3")
        # Create 2 viewers.
        viewer1 = dao.DaoViewer.create(CacheConfig.get());
        viewer2 = dao.DaoViewer.create(CacheConfig.get());
        # Setup 4 playlist items.
        playlistItem1 = dao.DaoPlaylistItem.create(CacheConfig.get(), video1, viewer1, "message1")
        playlistItem2 = dao.DaoPlaylistItem.create(CacheConfig.get(), video2, viewer1, "message2")
        playlistItem3 = dao.DaoPlaylistItem.create(CacheConfig.get(), video3, viewer2, "message3")
        playlistItem4 = dao.DaoPlaylistItem.create(CacheConfig.get(), video1, viewer2, "message4")
        # Add viewers.
        viewer1.currentlyViewing = playlistItem3
        viewer2.currentlyViewing = playlistItem2
        viewer1.put()
        viewer2.put()
        
        # Purge items of viewer 1.
        orphanedVideos = dao.DaoPlaylistItem.purgeViewersPlaylist(CacheConfig.get(), viewer1)
        self.assertEqual(len(orphanedVideos), 1, 'len(orphanedVideos) is not 1: ' + str(len(orphanedVideos)))
        self.assertEqual(orphanedVideos[0].title, "title1", 'orphanedVideo does not have "title1": ' + orphanedVideos[0].title)
        listItems = objectmodel.PlaylistItem.all()
        self.assertEqual(listItems.count(), 3, 'listItems is not 3.')
        self.assertNotEqual(listItems[0].message, "message1", 'listItem[0] has "message1"')
        self.assertNotEqual(listItems[1].message, "message1", 'listItem[1] has "message1"')
        self.assertNotEqual(listItems[2].message, "message1", 'listItem[2] has "message1"')
        if listItems[0].message == "message2":
            disownedItem = listItems[0]
            self.assert_(listItems[1].createdBy, 'listItems[1] has no creator.')
            self.assert_(listItems[2].createdBy, 'listItems[2] has no creator.')
        elif listItems[1].message == "message2":
            disownedItem = listItems[1]
            self.assert_(listItems[0].createdBy, 'listItems[0] has no creator.')
            self.assert_(listItems[2].createdBy, 'listItems[2] has no creator.')
        elif listItems[2].message == "message2":
            disownedItem = listItems[2]
            self.assert_(listItems[0].createdBy, 'listItems[0] has no creator.')
            self.assert_(listItems[1].createdBy, 'listItems[1] has no creator.')
        self.assert_(disownedItem, 'Playlist item of "message2" not found.')
        self.assert_(disownedItem.createdBy is None, 'disownedItem still has a creator."')"""
        
    def testGetOldestViewingItem(self):
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        message4 = 'message4'
        message5 = 'message5'
        message6 = 'message6'
        playlistItem = self.setupPlaylist(message1, message2, message3, 3)
        viewer = dao.DaoViewer.create(CacheConfig.get())
        viewer.currentlyViewing = playlistItem
        viewer.put()
        playlistItem = self.setupPlaylist(message4, message5, message6, 2)
        viewer = dao.DaoViewer.create(CacheConfig.get())
        viewer.currentlyViewing = playlistItem
        viewer.put()
        
        oldestViewingItem = dao.DaoPlaylistItem.getOldestViewingItem(CacheConfig.get())
        self.assert_(oldestViewingItem, 'oldestViewingItem not returned.')
        self.assertEqual(oldestViewingItem.message, message5, 'oldestViewingItem.message is not "' + message5 + '": ' + oldestViewingItem.message)
        
    def testGetItemsAddedBeforeDate(self):
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        playlistItem = self.setupPlaylist(message1, message2, message3, 3)
        
        listItems = dao.DaoPlaylistItem.getItemsAddedBeforeDate(CacheConfig.get(), playlistItem.created)
        self.assertEqual(listItems.count(), 2, 'listItems != 2: ' + str(listItems.count()))
        self.assertNotEqual(listItems[0].message, message3, 'listItems[0].message is ' + message3)
        self.assertNotEqual(listItems[1].message, message3, 'listItems[1].message is ' + message3)
        
    def testPurge(self):
        video1 = dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1")
        video2 = dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2")
        video3 = dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3")
        viewer = dao.DaoViewer.create(CacheConfig.get())
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        playlistItem1 = dao.DaoPlaylistItem.create(CacheConfig.get(), video1, viewer, message1)
        playlistItem2 = dao.DaoPlaylistItem.create(CacheConfig.get(), video2, None, message2)
        playlistItem3 = dao.DaoPlaylistItem.create(CacheConfig.get(), video3, None, message3)
        viewer.currentlyViewing=playlistItem2
        viewer.put()
        
        orphanedVideos = dao.DaoPlaylistItem.purge(CacheConfig.get())
        listItems = objectmodel.PlaylistItem.all()
        self.assertEqual(listItems.count(), 2, 'listItems.count() != 2: ' + str(listItems.count()))
        self.assertNotEqual(listItems[0].message, message3, 'listItems[0].message is "' + message3 + '"')
        self.assertNotEqual(listItems[1].message, message3, 'listItems[1].message is "' + message3 + '"')
        self.assertEqual(len(orphanedVideos), 1, 'len(orphanedVideos) is not 1: ' + str(len(orphanedVideos)))
        self.assertEqual(orphanedVideos[0].title, "Title3", 'orphanedVideos[0].title is not "Title3": ' + orphanedVideos[0].title)
        
    def testDelete(self):
        video1 = dao.DaoVideo.create(CacheConfig.get(), "Title1", "http://url1", 1, "description1")
        video2 = dao.DaoVideo.create(CacheConfig.get(), "Title2", "http://url2", 2, "description2")
        video3 = dao.DaoVideo.create(CacheConfig.get(), "Title3", "http://url3", 3, "description3")
        message1 = 'message1'
        message2 = 'message2'
        message3 = 'message3'
        playlistItem1 = dao.DaoPlaylistItem.create(CacheConfig.get(), video1, None, message1)
        playlistItem2 = dao.DaoPlaylistItem.create(CacheConfig.get(), video2, None, message2)
        playlistItem3 = dao.DaoPlaylistItem.create(CacheConfig.get(), video3, None, message3)
        playList = []
        playList.append(playlistItem1)
        playList.append(playlistItem2)
        
        orphanedVideos = dao.DaoPlaylistItem.delete(playList)
        listItems = objectmodel.PlaylistItem.all()
        self.assertEqual(listItems.count(), 1, 'listItems.count() is not 1: ' + str(listItems.count()))
        self.assertEqual(listItems[0].message, message3, 'listItems[0].message is not "' + message3 + '": ' + listItems[0].message)
        self.assertEqual(len(orphanedVideos), 2, 'len(orphanedVideos) is not 2: ' + str(len(orphanedVideos)))
        self.assertNotEqual(orphanedVideos[0].title, "Title3", 'orphanedVideos[0].title is "Title3"')
        self.assertNotEqual(orphanedVideos[1].title, "Title3", 'orphanedVideos[1].title is "Title3"')
        

class TestObjectReferences(unittest.TestCase):
    """Object references test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        listItems = objectmodel.PlaylistItem.all()
        if listItems.count() > 0:
            db.delete(listItems)
        videos = objectmodel.Video.all()
        if videos.count() > 0:
            db.delete(videos)
        viewers = objectmodel.Viewer.all()
        if viewers.count() > 0:
            db.delete(viewers)
            
    def testReferences(self):
        video = dao.DaoVideo.create(CacheConfig.get(), "Title", "http://url", 1, "description")
        viewer1 = dao.DaoViewer.create(CacheConfig.get())
        viewer2 = dao.DaoViewer.create(CacheConfig.get())
        playlistItem1 = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer1, "message1")
        playlistItem2 = dao.DaoPlaylistItem.create(CacheConfig.get(), video, viewer2, "message2")
        viewer1.currentlyViewing = playlistItem1
        viewer2.currentlyViewing = playlistItem1
        dao.DaoViewer.update(viewer1)
        dao.DaoViewer.update(viewer2)
        
        # Test initial references.
        video = dao.DaoVideo.getById(CacheConfig.get(), video.id)
        playlist = video.playlist
        self.assertEqual(playlist.count(), 2, 'playlist.count() is not 2: ' + str(playlist.count()))
        if playlist[0].message == "message1":
            self.assertEqual(playlist[0].viewers.count(), 2, 'playlist[0].viewers.count() is not 2: ' + str(playlist[0].viewers.count()))
            self.assertEqual(playlist[1].viewers.count(), 0, 'playlist[1].viewers.count() is not 0: ' + str(playlist[1].viewers.count()))
        elif playlist[0].message == "message2":
            self.assertEqual(playlist[0].viewers.count(), 0, 'playlist[0].viewers.count() is not 0: ' + str(playlist[0].viewers.count()))
            self.assertEqual(playlist[1].viewers.count(), 2, 'playlist[1].viewers.count() is not 2: ' + str(playlist[1].viewers.count()))
        else:
            self.fail('playlist[0].message == "' + playlist[0].message + '"')
        viewer1 = dao.DaoViewer.getByGuid(CacheConfig.get(), viewer1.guid)
        playlist = viewer1.playlist
        self.assertEqual(playlist.count(), 1, 'playlist.count() is not 1: ' + str(playlist.count()))
        self.assertEqual(playlist[0].message, "message1", 'playlist[0].message is not "message1": ' + playlist[0].message)
        viewer2 = dao.DaoViewer.getByGuid(CacheConfig.get(), viewer2.guid)
        playlist = viewer2.playlist
        self.assertEqual(playlist.count(), 1, 'playlist.count() is not 1: ' + str(playlist.count()))
        self.assertEqual(playlist[0].message, "message2", 'playlist[0].message is not "message2": ' + playlist[0].message)
        
        # Remove playlist item 2 (belonging to viewer 2)
        playlist[0].delete()
        video = dao.DaoVideo.getById(CacheConfig.get(), video.id)
        playlist = video.playlist
        self.assertEqual(playlist.count(), 1, 'playlist.count() is not 1: ' + str(playlist.count()))
        viewer2 = dao.DaoViewer.getByGuid(CacheConfig.get(), viewer2.guid)
        self.assertEqual(viewer2.playlist.count(), 0, 'viewer2.playlist.count() is not 0: ' + str(viewer2.playlist.count()))
        
        # Remove viewer 1.
        viewer1.delete()
        playlistItem = dao.DaoPlaylistItem.getOldestViewingItem(CacheConfig.get())
        self.assertEqual(playlistItem.viewers.count(), 1, 'playlistItem.viewers.count() is not 1: ' + str(playlistItem.viewers.count()))
        


def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDaoConfig)
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoViewer))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoVideo))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoPlaylistItem))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestObjectReferences))
    return suite