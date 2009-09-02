import unittest
from mediasearch import mediabranch


class AnyObject:
    """Used to hold any data."""
    pass


class DummyUrlFetch:
    """A dummy URL fetch class."""
    
    def __init__(self):
        """Initialiser."""
        self.__statusCode = 404
        self.__content = ''
        pass
        
    def setStatusCode(self, statusCode):
        self.__statusCode = statusCode
        
    def setContent(self, content):
        self.__content = content
    
    def fetch(self, url, a, b, c, d, e):
        result = AnyObject()
        result.status_code = self.__statusCode
        result.content = self.__content
        return result
        

class TestBranch(unittest.TestCase):
    """TestBranch test class."""
    
    def setUp(self):
        pass
    
    def tearDown(self):
        pass
    
    def testQueryInUrl(self):
        branch = mediabranch.Branch(None)
        result = branch.build('http://somecontext?withquery', None)
        self.assertFalse(result, 'Failed to detect unwanted URL.')
        
    def testBadWebsite(self):
        urlFetch = DummyUrlFetch()
        urlFetch.setStatusCode(404)
        branch = mediabranch.Branch(urlFetch)
        result = branch.build('http://allowed', None)
        self.assertFalse(result, 'Failed to detect bad status code.')
        
    def testName(self):
        urlFetch = DummyUrlFetch()
        urlFetch.setStatusCode(200)
        urlFetch.setContent('<html><title>iNdEx  oF \n TestName</title></html>')
        branch = mediabranch.Branch(urlFetch)
        result = branch.build('http://allowed', '')
        self.assertEqual(branch.title, 'TestName', 'branch.title is not "TestName": ' + branch.title)
        
    def testNothingFind(self):
        urlFetch = DummyUrlFetch()
        urlFetch.setStatusCode(200)
        urlFetch.setContent("<html><title>iNdEx  oF \n TestName</title><td>[SND]</td>\n\
                <a href='\ndont match 1.mp3'>dont match 1</a>\n\n\n\n\
                <a href=''dont match 2.mp3'>dont match 2</a>\n\
                <a href='?dont match 3.mp3'>dont match 3</a>\n\
                <a href='dont match 4.mp3'>dont \n match 4</a>\n\
                <a href='dont match 5.mp3'>dont < match 5</a>\n\
                <a href='no directory match a.sdsa'>no directory match</a>\n")
        branch = mediabranch.Branch(urlFetch)
        result = branch.build('http://allowed', ' mAtCh  this ')
        self.assertEqual(len(branch.tracks), 0, 'branch.tracks is not 0: ' + str(len(branch.tracks)))
        self.assertEqual(len(branch.directories), 0, 'branch.directories is not 0: ' + str(len(branch.directories)))
        #self.assertFalse(result, 'Returned true.')
        
    def testMP3Find(self):
        urlFetch = DummyUrlFetch()
        urlFetch.setStatusCode(200)
        urlFetch.setContent("<html><title>iNdEx  oF \n TestName</title><td>[SND]</td>\n\
                <td><a href=\"Song to match.mp3\">Match song.mp3</a></td>\n\
                <a href='/Other song to match.mp3'>Other song.mp3</a>\n\
                <a href='http://bananas/stuff/Last song to match.mp3'>Last song.mp3</a>\n\
                <a href='\ndont match 1.mp3'>dont match 1</a>\n\n\n\n\
                <a href=''dont match 2.mp3'>dont match 2</a>\n\
                <a href='?dont match 3.mp3'>dont match 3</a>\n\
                <a href='dont match 4.mp3'>dont \n match 4</a>\n\
                <a href='dont match 5.mp3'>dont < match 5</a>\n")
        branch = mediabranch.Branch(urlFetch)
        result = branch.build('http://allowed/', ' mAtCh  this ')
        self.assertTrue(result, 'Failed before tracks were searched.')
        self.assertEqual(len(branch.tracks), 3, 'branch.tracks is not 3: ' + str(len(branch.tracks)))
        self.assertEqual(branch.tracks[0].url, 'http://allowed/Song to match.mp3', 'branch.tracks[0].url is not "http://allowed/Song to match.mp3": ' + branch.tracks[0].url)
        self.assertEqual(branch.tracks[0].name, 'Match song.mp3', 'branch.tracks[0].name is not "Match song.mp3": ' + branch.tracks[0].name)
        self.assertTrue(branch.tracks[0].isMatched, 'branch.tracks[0].isMatched is not True')
        self.assertEqual(branch.tracks[1].url, 'http://allowed/Other song to match.mp3', 'branch.tracks[1].url is not "http://allowed/Other song to match.mp3": ' + branch.tracks[1].url)
        self.assertEqual(branch.tracks[1].name, 'Other song.mp3', 'branch.tracks[1].name is not "Other song.mp3": ' + branch.tracks[1].name)
        self.assertFalse(branch.tracks[1].isMatched, 'branch.tracks[1].isMatched is not False')
        self.assertEqual(branch.tracks[2].url, 'http://bananas/stuff/Last song to match.mp3', 'branch.tracks[2].url is not "http://bananas/stuff/Last song to match.mp3: ' + branch.tracks[2].url)
        self.assertEqual(branch.tracks[2].name, 'Last song.mp3', 'branch.tracks[2].name is not "Last song.mp3": ' + branch.tracks[2].name)
        self.assertFalse(branch.tracks[2].isMatched, 'branch.tracks[2].isMatched is not False')
    
    def testChildDirectoryFind(self):
        urlFetch = DummyUrlFetch()
        urlFetch.setStatusCode(200)
        urlFetch.setContent("<html><title>iNdEx  oF \n TestName</title><td>[SND]</td>\n\
                <UL><LI><A HREF=\"/music/Not%20Us/\"> Parent Directory</A>\n\
                <LI><A HREF=\"Binaural\"> Binaural</A>\n\
                <LI><A HREF=\"/Lost%20Dogs%20(B-Sides)\"> Lost Dogs (B-Sides)</A>\n\
                <LI><A HREF=\"http://allowed/No%20Code/\"> No Code</A>\n\
                <LI><A HREF=\"?Not matched\">Not matched</A>\n\
                <td><a href=\"Song to match.mp3\">Match song.mp3</a></td>\n\
                <a href='Other song to match.mp3'>Other song.mp3</a>\n\
                <a href='\ndont match 1.mp3'>dont match 1</a>\n\n\n\n\
                <a href=''dont match 2.mp3'>dont match 2</a>\n\
                <a href='?dont match 3.mp3'>dont match 3</a>\n\
                <a href='dont match 4.mp3'>dont \n match 4</a>\n\
                <a href='dont match 5.mp3'>dont < match 5</a>\n\
                <a href='no directory match a.sdsa'>no directory match</a>\n")
        branch = mediabranch.Branch(urlFetch)
        result = branch.build('http://allowed', ' mAtCh  this ')
        self.assertTrue(result, 'Failed before child directories were searched.')
        self.assertEqual(len(branch.tracks), 2, 'branch.tracks is not 2: ' + str(len(branch.tracks)))
        self.assertEqual(len(branch.directories), 3, 'branch.directories is not 3: ' + str(len(branch.directories)))
        self.assertEqual(branch.directories[0].context, 'Binaural', 'branch.directories[0].context is not "Binaural": ' + branch.directories[0].context)
        self.assertEqual(branch.directories[0].name, ' Binaural', 'branch.directories[0].name is not " Binaural": ' + branch.directories[0].name)
        self.assertEqual(branch.directories[1].context, 'Lost%20Dogs%20(B-Sides)', 'branch.directories[1].context is not "Lost%20Dogs%20(B-Sides)": ' + branch.directories[1].context)
        self.assertEqual(branch.directories[1].name, ' Lost Dogs (B-Sides)', 'branch.directories[1].name is not " Lost Dogs (B-Sides)": ' + branch.directories[1].name)
        self.assertEqual(branch.directories[2].context, 'No%20Code', 'branch.directories[2].context is not "No%20Code": ' + branch.directories[2].context)
        self.assertEqual(branch.directories[2].name, ' No Code', 'branch.directories[2].name is not " No Code": ' + branch.directories[2].name)
        
        
def suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestBranch)
    #suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestDaoViewer))
    return suite