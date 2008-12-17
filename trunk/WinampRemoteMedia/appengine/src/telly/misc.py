# Nicked from http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/163604
import math, sys
import time

def _unique_sequencer():
    _XUnit_sequence = sys.maxint
    while 1:
        yield _XUnit_sequence
        _XUnit_sequence -= 1
        if _XUnit_sequence <= 0:
            _XUnit_sequence = sys.maxint
_uniqueid = _unique_sequencer()

def uniqueid(prefix=''):
    frac, secs = math.modf(time.time())
    days, remain = divmod(secs, 86400)
    id = _uniqueid.next()
    return u"%s%s%s_%s" % (prefix, hex(int(days))[2:],
                           hex(int(remain))[2:], hex(id)[2:])