from google.appengine.ext import db
from google.appengine.tools import bulkloader
from mediasearch.db import objectmodel
    
class ApplicationExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'Application',
                                 [('dllVer', str, None),
                                  ('name', str, None),
                                  ('appUrl', str, None),
                                  ('iconId', str, None)
                                 ])
    
class BadMediaExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'BadMedia',
                                 [('siteUrl', str, None),
                                  ('cause', str, None),
                                  ('occurrence', str, None),
                                  ('timestamp', str, None)
                                 ])
    
class CommentsExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'Comments',
                                 [('dummyIndex', str, None),
                                  ('comments', str, None)
                                 ])

class ConfigExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'Config',
                                 [('maxOccurrenceUntilIgnore', str, None)
                                 ])
    
class IgnoredSiteExporter(bulkloader.Exporter):
  def __init__(self):
    bulkloader.Exporter.__init__(self, 'IgnoredSite',
                                 [('siteUrl', str, None)
                                 ])

exporters = [ApplicationExporter, BadMediaExporter, CommentsExporter, ConfigExporter, IgnoredSiteExporter]