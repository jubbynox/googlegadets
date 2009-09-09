import datetime

from google.appengine.ext import db
from google.appengine.tools import bulkloader
from mediasearch.db import objectmodel
    
class ApplicationLoader(bulkloader.Loader):
  def __init__(self):
    bulkloader.Loader.__init__(self, 'Application',
                                 [('dllVer', float),
                                  ('name', str),
                                  ('appUrl', str),
                                  ('iconId', int)
                                 ])
    
class BadMediaLoader(bulkloader.Loader):
  def __init__(self):
    bulkloader.Loader.__init__(self, 'BadMedia',
                                 [('siteUrl', str),
                                  ('cause', int),
                                  ('occurrence', int),
                                  ('timestamp', lambda x: datetime.datetime.strptime(x, '%d/%m/%Y %H:%M'))
                                 ])
    
class CommentsLoader(bulkloader.Loader):
  def __init__(self):
    bulkloader.Loader.__init__(self, 'Comments',
                                 [('dummyIndex', int),
                                  ('comments', db.Text)
                                 ])

class ConfigLoader(bulkloader.Loader):
  def __init__(self):
    bulkloader.Loader.__init__(self, 'Config',
                                 [('maxOccurrenceUntilIgnore', int)
                                 ])
    
class IgnoredSiteLoader(bulkloader.Loader):
  def __init__(self):
    bulkloader.Loader.__init__(self, 'IgnoredSite',
                                 [('siteUrl', str)
                                 ])

loaders = [ApplicationLoader, BadMediaLoader, CommentsLoader, ConfigLoader, IgnoredSiteLoader]