import unittest
from db import test_dao
from db import test_cache

def run_test_suite():
    runner = unittest.TextTestRunner()
    print 'Running DAO tests...'
    runner.run(test_dao.suite())
    print 'Running Cache tests...'
    runner.run(test_cache.suite())