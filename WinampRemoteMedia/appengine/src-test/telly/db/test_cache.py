import unittest
from google.appengine.ext import db
from google.appengine.api import memcache
from telly.db import objectmodel
from telly.db import cache
from telly.db import dao

class TestCacheConfig(unittest.TestCase):
    """Config test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        configurations = objectmodel.Config.all()
        if configurations.count() > 0:
            db.delete(configurations)
        memcache.flush_all()
    
    def testGet(self):
        config = cache.CacheConfig.get()
        self.assert_(config, 'Config not retrieved.')
        
        config.heartbeatInterval = 1
        config.minimumViewTime = 1
        config.minimumAddInterval = 1
        config.minimumPurgeInterval = 1
        config.maxAddCountPerHour = 1
        dao.DaoConfig.update(config)
        
        config = cache.CacheConfig.get()
        self.assertNotEqual(config.heartbeatInterval, 1, 'heartbeatInterval updated.')
        self.assertNotEqual(config.minimumViewTime, 1, 'minimumViewTime updated.')
        self.assertNotEqual(config.minimumAddInterval, 1, 'minimumAddInterval updated.')
        self.assertNotEqual(config.minimumPurgeInterval, 1, 'minimumPurgeInterval updated.')
        self.assertNotEqual(config.maxAddCountPerHour, 1, 'maxAddCountPerHour updated.')
        
    def testUpdate(self):
        config = cache.CacheConfig.get()
        config.heartbeatInterval = 1
        config.minimumViewTime = 1
        config.minimumAddInterval = 1
        config.minimumPurgeInterval = 1
        config.maxAddCountPerHour = 1
        cache.CacheConfig.update(config)
        
        config = cache.CacheConfig.get()
        self.assertEqual(config.heartbeatInterval, 1, 'heartbeatInterval not updated.')
        self.assertEqual(config.minimumViewTime, 1, 'minimumViewTime not updated.')
        self.assertEqual(config.minimumAddInterval, 1, 'minimumAddInterval not updated.')
        self.assertEqual(config.minimumPurgeInterval, 1, 'minimumPurgeInterval not updated.')
        self.assertEqual(config.maxAddCountPerHour, 1, 'maxAddCountPerHour not updated.')
        
        
        
def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCacheConfig)
    return suite