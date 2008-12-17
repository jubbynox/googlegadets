import os
from google.appengine.api import apiproxy_stub_map
from google.appengine.api import user_service_stub
from google.appengine.api import datastore_file_stub
from google.appengine.api import mail_stub
from google.appengine.api import urlfetch_stub
from google.appengine.api.memcache import memcache_stub


apiproxy_stub_map.apiproxy.RegisterStub(
                                        'user',
                                        user_service_stub.UserServiceStub())
os.environ['AUTH_DOMAIN'] = 'gmail.com'  
os.environ['USER_EMAIL'] = 'test@gmail.com'
os.environ['APPLICATION_ID'] = 'test'

apiproxy_stub_map.apiproxy.RegisterStub(
                                        'datastore_v3',
                                        datastore_file_stub.DatastoreFileStub('telly_tests',
                                                                              '/dev/null',
                                                                              '/dev/null'))

apiproxy_stub_map.apiproxy.RegisterStub(
                                        'mail',
                                        mail_stub.MailServiceStub())

apiproxy_stub_map.apiproxy.RegisterStub( 
                                        'urlfetch',
                                        urlfetch_stub.URLFetchServiceStub())

apiproxy_stub_map.apiproxy.RegisterStub(
                                        'memcache',
                                        memcache_stub.MemcacheServiceStub()) 




# Run tests.
import testtelly
if __name__ == '__main__':
    testtelly.run_test_suite()