import unittest

from google.appengine.ext import db
from mediasearch.db import objectmodel
from mediasearch.db import dao


class TestDaoApplication(unittest.TestCase):
    """DaoApplication test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        applications = objectmodel.Application.all()
        if applications.count() > 0:
            db.delete(applications)
    
    def testAdd(self):
        dao.DaoApplication.add(0.1, 'app1', 'url1', 1)
        dao.DaoApplication.add(0.2, 'app2', 'url2', 2)
        applications = dao.DaoApplication.getAll()
        
        self.assertEqual(applications.count(), 2, 'not 2 applications: ' + str(applications.count()))
        self.assertEqual(applications[0].dllVer, 0.1, 'applications[0].dllVer not 0.1: ' + str(applications[0].dllVer))
        self.assertEqual(applications[0].name, 'app1', 'applications[0].name not "app1": ' + applications[0].name)
        self.assertEqual(applications[0].appUrl, 'url1', 'applications[0].appUrl not "url1": ' + applications[0].appUrl)
        self.assertEqual(applications[0].iconId, 1, 'applications[0].iconId not 1: ' + str(applications[0].iconId))
        self.assertEqual(applications[1].dllVer, 0.2, 'applications[1].dllVer not 0.2: ' + str(applications[1].dllVer))
        self.assertEqual(applications[1].name, 'app2', 'applications[1].name not "app2": ' + applications[1].name)
        self.assertEqual(applications[1].appUrl, 'url2', 'applications[1].appUrl not "url2": ' + applications[1].appUrl)
        self.assertEqual(applications[1].iconId, 2, 'applications[1].iconId not 2: ' + str(applications[1].iconId))
        
    def testGetByVer(self):
        dao.DaoApplication.add(0.1, 'app1', 'url1', 1)
        dao.DaoApplication.add(0.1, 'app2', 'url2', 2)
        dao.DaoApplication.add(0.2, 'app3', 'url3', 3)
        dao.DaoApplication.add(0.2, 'app4', 'url4', 4)
        applications = dao.DaoApplication.getByVer(0.2)
        
        self.assertEqual(applications[0].dllVer, 0.2, 'applications[0].dllVer not 0.2: ' + str(applications[0].dllVer))
        self.assertEqual(applications[0].name, 'app3', 'applications[0].name not "app3": ' + applications[0].name)
        self.assertEqual(applications[0].appUrl, 'url3', 'applications[0].appUrl not "url3": ' + applications[0].appUrl)
        self.assertEqual(applications[0].iconId, 3, 'applications[0].iconId not 3: ' + str(applications[0].iconId))
        self.assertEqual(applications[1].dllVer, 0.2, 'applications[1].dllVer not 0.2: ' + str(applications[1].dllVer))
        self.assertEqual(applications[1].name, 'app4', 'applications[1].name not "app4": ' + applications[1].name)
        self.assertEqual(applications[1].appUrl, 'url4', 'applications[1].appUrl not "url4": ' + applications[1].appUrl)
        self.assertEqual(applications[1].iconId, 4, 'applications[1].iconId not 4: ' + str(applications[1].iconId))
        
    def testDelete(self):
        dao.DaoApplication.add(0.1, 'app1', 'url1', 1)
        dao.DaoApplication.add(0.2, 'app2', 'url2', 2)
        applications = dao.DaoApplication.getAll()
        dao.DaoApplication.delete(applications[0])
        
        self.assertEqual(applications.count(), 1, 'not 1 application: ' + str(applications.count()))
        self.assertEqual(applications[0].dllVer, 0.2, 'applications[0].dllVer not 0.2: ' + str(applications[0].dllVer))
        self.assertEqual(applications[0].name, 'app2', 'applications[0].name not "app2": ' + applications[0].name)
        self.assertEqual(applications[0].appUrl, 'url2', 'applications[0].appUrl not "url2": ' + applications[0].appUrl)
        self.assertEqual(applications[0].iconId, 2, 'applications[0].iconId not 2: ' + str(applications[0].iconId))


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
        badMedia = objectmodel.BadMedia.all()
        if badMedia.count() > 0:
            db.delete(badMedia)
        ignoredSites = objectmodel.IgnoredSite.all()
        if ignoredSites.count() > 0:
            db.delete(ignoredSites)
    
    def tearDown(self):
        badMedia = objectmodel.BadMedia.all()
        if badMedia.count() > 0:
            db.delete(badMedia)
        ignoredSites = objectmodel.IgnoredSite.all()
        if ignoredSites.count() > 0:
            db.delete(ignoredSites)
            
    def testAdd(self):
        # Change the max occurence until ignore to 3
        config = dao.getConfig()
        config.maxOccurrenceUntilIgnore = 3
        config.put()
        dao.DaoBadMedia.add('http://siteUrl1', 1)
        dao.DaoBadMedia.add('hTtp://siteurl1/', 1)
        dao.DaoBadMedia.add('httP://sITeUrl1/other/context', 1)
        dao.DaoBadMedia.add('http://siteUrl1', 2)  # Should be stored separately as it has a different cause.
        dao.DaoBadMedia.add('http://siteUrl2', 2)
        dao.DaoBadMedia.add('http://siteUrl3', 1)   # This site should end up being reported as ignored.
        dao.DaoBadMedia.add('http://siteUrl3', 1)
        dao.DaoBadMedia.add('http://siteUrl3', 1)
        dao.DaoBadMedia.add('http://siteUrl3', 1)
        
        badMedia = dao.DaoBadMedia.getAll()
        ignoredSites = dao.DaoIgnoredSites.getAll()
        
        self.assertEqual(badMedia.count(), 3, 'not 3 badMedia: ' + str(badMedia.count()))
        self.assertEqual(badMedia[0].siteUrl, 'siteurl1', 'badMedia[0].siteUrl not "siteurl1": ' + badMedia[0].siteUrl)
        self.assertEqual(badMedia[0].cause, 1, 'badMedia[0].cause not 1: ' + str(badMedia[0].cause))
        self.assertEqual(badMedia[0].occurrence, 3, 'badMedia[0].occurrence not 3: ' + str(badMedia[0].occurrence))
        self.assertEqual(badMedia[1].siteUrl, 'siteurl1', 'badMedia[1].siteUrl not "siteurl1": ' + badMedia[1].siteUrl)
        self.assertEqual(badMedia[1].cause, 2, 'badMedia[1].cause not 2: ' + str(badMedia[1].cause))
        self.assertEqual(badMedia[1].occurrence, 1, 'badMedia[1].occurrence not 1: ' + str(badMedia[1].occurrence))
        self.assertEqual(badMedia[2].siteUrl, 'siteurl2', 'badMedia[2].siteUrl not "siteurl2": ' + badMedia[2].siteUrl)
        self.assertEqual(badMedia[2].cause, 2, 'badMedia[2].cause not 2: ' + str(badMedia[2].cause))
        self.assertEqual(badMedia[2].occurrence, 1, 'badMedia[2].occurrence not 1: ' + str(badMedia[2].occurrence))
        
        self.assertEqual(ignoredSites.count(), 1, 'not 1 ignoredSites: ' + str(ignoredSites.count()))
        self.assertEqual(ignoredSites[0].siteUrl, 'siteurl3', 'ignoredSites[0].siteUrl not "siteurl3": ' + ignoredSites[0].siteUrl)
        
    def testDelete(self):
        dao.DaoBadMedia.add('http://siteUrl1', 1)
        dao.DaoBadMedia.add('http://siteUrl2', 2)
        badMedia = dao.DaoBadMedia.getAll()
        dao.DaoBadMedia.delete(badMedia[0])
        
        self.assertEqual(badMedia.count(), 1, 'not 1 badMedia: ' + str(badMedia.count()))
        self.assertEqual(badMedia[0].siteUrl, 'siteurl2', 'badMedia[0].siteUrl not "siteUrl2": ' + badMedia[0].siteUrl)
        self.assertEqual(badMedia[0].cause, 2, 'badMedia[0].cause not 2: ' + str(badMedia[0].cause))
        
        
class TestDaoIgnoredSites(unittest.TestCase):
    """DaoIgnoredSites test class."""
    
    def setUp(self):
        ignoredSites = objectmodel.IgnoredSite.all()
        if ignoredSites.count() > 0:
            db.delete(ignoredSites)
    
    def tearDown(self):
        ignoredSites = objectmodel.IgnoredSite.all()
        if ignoredSites.count() > 0:
            db.delete(ignoredSites)
    
    def testAdd(self):
        dao.DaoIgnoredSites.add('siteUrl1')
        dao.DaoIgnoredSites.add('siteUrl2')
        dao.DaoIgnoredSites.add('siteuRL2') # Should not be stored.
        ignoredSites = dao.DaoIgnoredSites.getAll()

        self.assertEqual(ignoredSites.count(), 2, 'not 2 ignoredSites: ' + str(ignoredSites.count()))
        self.assertEqual(ignoredSites[0].siteUrl, 'siteurl1', 'ignoredSites[0].siteUrl not "siteurl1": ' + ignoredSites[0].siteUrl)
        self.assertEqual(ignoredSites[1].siteUrl, 'siteurl2', 'ignoredSites[1].siteUrl not "siteurl2": ' + ignoredSites[1].siteUrl)
        
    def testDelete(self):
        dao.DaoIgnoredSites.add('siteUrl1')
        dao.DaoIgnoredSites.add('siteUrl2')
        ignoredSites = dao.DaoIgnoredSites.getAll()
        dao.DaoIgnoredSites.delete(ignoredSites[0])
        
        self.assertEqual(ignoredSites.count(), 1, 'not 1 ignoredSites: ' + str(ignoredSites.count()))
        self.assertEqual(ignoredSites[0].siteUrl, 'siteurl2', 'ignoredSites[0].siteUrl not "siteurl2": ' + ignoredSites[0].siteUrl)
        
    def testGetIgnoredSite(self):
        dao.DaoIgnoredSites.add('siteUrl1')
        dao.DaoIgnoredSites.add('siteUrl2')
        
        # Search for site.
        ignoredSite = dao.DaoIgnoredSites.getIgnoredSite('siteUrl2')
        if ignoredSite:
            self.assertEqual(ignoredSite.siteUrl, 'siteurl2', 'ignoredSite.siteUrl not "siteurl2": ' + ignoredSite.siteUrl)
        else:
            self.fail('Ignored site not found: "siteurl2"')
            
        # Search for no site.
        ignoredSite = dao.DaoIgnoredSites.getIgnoredSite('notStored')
        if ignoredSite:
            self.fail('Ignored site found: ' + ignoredSite.siteUrl)


def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDaoApplication)
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoComments))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoBadMedia))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoIgnoredSites))
    return suite