import unittest
import test_mediabranch

from db import test_dao

def run_test_suite():
    runner = unittest.TextTestRunner()
    
    print 'Running mediabranch tests...'
    runner.run(test_mediabranch.suite())
    
    print 'Running DAO tests...'
    runner.run(test_dao.suite())