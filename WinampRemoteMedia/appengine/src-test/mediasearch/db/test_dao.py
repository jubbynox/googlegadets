import unittest

from google.appengine.ext import db
from mediasearch.db import objectmodel
from mediasearch.db import dao


class TestDaoComments(unittest.TestCase):
    """DaoComments test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        comments = objectmodel.Comments.all()
        if comments.count() > 0:
            db.delete(comments)
    
    def testAdd(self):
        dao.DaoComments.add('comment 1')
        dao.DaoComments.add('comment 2')
        comments = dao.DaoComments.getAll()
        
        self.assertEqual(comments.count(), 2, 'not 2 comments: ' + str(comments.count()))
        self.assertEqual(comments[0].comments, 'comment 1', 'comments[0].comments not "comment 1": ' + comments[0].comments)
        self.assertEqual(comments[1].comments, 'comment 2', 'comments[1].comments not "comment 2": ' + comments[1].comments)
        
    def testDelete(self):
        dao.DaoComments.add('comment 1')
        dao.DaoComments.add('comment 2')
        comments = dao.DaoComments.getAll()
        dao.DaoComments.delete(comments[0])
        
        self.assertEqual(comments.count(), 1, 'not 1 comment: ' + str(comments.count()))
        self.assertEqual(comments[0].comments, 'comment 2', 'comments[0].comments not "comment 2": ' + comments[0].comments)
        
        
class TestDaoBadMedia(unittest.TestCase):
    """DaoBadMedia test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        badMedia = objectmodel.BadMedia.all()
        if badMedia.count() > 0:
            db.delete(badMedia)
    
    def testAdd(self):
        dao.DaoBadMedia.add('directory1', 'url1')
        dao.DaoBadMedia.add('directory2', 'url2')
        badMedia = dao.DaoBadMedia.getAll()
        
        self.assertEqual(badMedia.count(), 2, 'not 2 badMedia: ' + str(badMedia.count()))
        self.assertEqual(badMedia[0].directoryUrl, 'directory1', 'badMedia[0].directoryUrl not "directory1": ' + badMedia[0].directoryUrl)
        self.assertEqual(badMedia[0].mediaUrl, 'url1', 'badMedia[0].mediaUrl not "url1": ' + badMedia[0].mediaUrl)
        self.assertEqual(badMedia[1].directoryUrl, 'directory2', 'badMedia[1].directoryUrl not "directory2": ' + badMedia[1].directoryUrl)
        self.assertEqual(badMedia[1].mediaUrl, 'url2', 'badMedia[1].mediaUrl not "url2": ' + badMedia[1].mediaUrl)
        
    def testDelete(self):
        dao.DaoBadMedia.add('directory1', 'url1')
        dao.DaoBadMedia.add('directory2', 'url2')
        badMedia = dao.DaoBadMedia.getAll()
        dao.DaoBadMedia.delete(badMedia[0])
        
        self.assertEqual(badMedia.count(), 1, 'not 1 badMedia: ' + str(badMedia.count()))
        self.assertEqual(badMedia[0].directoryUrl, 'directory2', 'badMedia[0].directoryUrl not "directory2": ' + badMedia[0].directoryUrl)
        self.assertEqual(badMedia[0].mediaUrl, 'url2', 'badMedia[0].mediaUrl not "url2": ' + badMedia[0].mediaUrl)


def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDaoComments)
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoBadMedia))
    return suite