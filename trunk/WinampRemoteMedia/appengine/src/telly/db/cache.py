from telly.db import dao
from google.appengine.api import memcache

class CacheConfig():
    """Configuration cache."""
    
    def get():
        """Gets the configuration."""
        config = memcache.get("configuration")
        if config is None:
            config = dao.DaoConfig.get()
            memcache.Client().set("configuration", config)
            
        return config
    get = staticmethod(get)
    
    def update(config):
        """Updates the configuration."""
        memcache.Client().set("configuration", config)
        dao.DaoConfig.update(config)
    update = staticmethod(update) 