/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoadExtended()
{
    // Load the base media search.
    onLoadMediaSearch();
    
    // Setup YouTube search.
    searchObject = new LastFMSearch('ResultsPane');
    
    // Bind enter key to search input.
    $("#SearchInput").keypress(
        function (e)
        {
            if (e.which == 13)
            {
                search($('#SearchInput')[0].value)
            }
        });
}


/**
 * The LastFM Search functionality.
 */
var LastFMSearch = Base.extend(
{
    /**
     * The search URL for LastFM tracks.
     */
    SEARCH_URL: 'http://ws.audioscrobbler.com/2.0',
    
    /**
     * Track search method.
     */
    TRACK_SEARCH: 'track.search',
    
    /**
     * Artist search method.
     */
    ARTIST_SEARCH: 'artist.search',
    
    /**
     * The API key.
     */
    API_KEY: 'da6ae1e99462ee22e81ac91ed39b43a4',
    
    /**
     * The API response format.
     */
    JSON_FORMAT: 'json',
        
    /**
     * The search criteria.
     */
    __searchCriteria: null,
    
    /**
     * The results UI.
     */
    __lastfmUI: null,
    
    /**
     * The search page from which to retrieve results.
     */
    __searchPage: null,
    
    /**
     * Constructor for LastFMSearch.
     * 
     * @param resultsId The ID of the results pane.
     */
    constructor: function(resultsId)
    {
        // Create the YouTube UI.
        this.__lastfmUI = new LastFMUI(resultsId,
            function(self)
            {
                return function()
                {
                    self.__getMoreResults();
                };
            }(this));
        
        // Setup the search page.
        this.__searchPage = 1;
    },
    
    /**
     * Main search function.
     *
     * @param searchString The search string.
     */
    search: function(searchString)
    {
        // Track search.
        pageTracker._trackEvent('LastFM', 'Search', searchString);
            
        // Clear results.
        this.clearResults();
        
        // Store the search string.
        this.__searchCriteria = searchString;
        
        // Indicate that the search has started.
        this.__lastfmUI.searchStarted();
        
        // Perform the (tracks) search.
        this.__perfomSearch(true);
    },
    
    /**
     * Performs the LastFM search.
     * 
     * @param searchTracks Whether or not a track is to be performed (otherwise it is an artist search).
     */
    __perfomSearch: function(searchTracks)
    {
        var data = this.__createSearchObject(searchTracks);
        getXDomainJSON(this.SEARCH_URL, data,
            function(self, searchTracks)
            {
                return function(data)
                {
                    self.__processLastFMResults(data, searchTracks);
                };
            }(this, searchTracks),
            function()
            {
                // Do nothing;
            });
    },
    
    /**
     * Clears results.
     */
    clearResults: function()
    {
        this.__searchPage = 1;
        this.__lastfmUI.clear();
    },
    
    /**
     * Processes the LastFM results.
     * 
     * @param data The data returned from the LastFM search.
     * @param searchTracks Whether or not a track search was performed (otherwise it was an artist search).
     */
    __processLastFMResults: function(data, searchTracks)
    {
        // Setup result set.
        var resultIndex = 0;
        var resultSet = new Array();
        /*for (index in data.feed.entry)
        {
            // Create result entry.
            resultSet[resultIndex] = new Object();
            resultSet[resultIndex].videoID = this.VIDEO_ID_RE.exec(data.feed.entry[index].media$group.media$player[0].url)[1];
            resultSet[resultIndex].title = "" + data.feed.entry[index].media$group.media$title.$t;
            resultSet[resultIndex].strDuration = this.__formatTime(data.feed.entry[index].media$group.yt$duration.seconds);
            resultSet[resultIndex].duration = parseInt(data.feed.entry[index].media$group.yt$duration.seconds);
            resultSet[resultIndex].thumbnailURL = data.feed.entry[index].media$group.media$thumbnail[0].url;
            resultIndex++;
        }
        
        if (this.__searchIndex == 1 && resultSet.length == 0)
        {
            // No results.
            this.__youtubeUI.noResults();
        }
        else
        {
            // Show the results.
            this.__youtubeUI.addResults(resultSet);
        }*/
    },
    
    /**
     * Creates a search object to submit to the XDomain JSON request.
     * 
     * @param searchTracks Whether or not a track is to be performed (otherwise it is an artist search).
     * @return A LastFM search object.
     */
    __createSearchObject: function(searchTracks)
    {
        var searchObject = new Object();
        if (searchTracks)
        {
        	// Track search.
            searchObject.method = this.TRACK_SEARCH;
            searchObject.track = this.__searchCriteria;
            searchObject.page = this.__searchPage;  // Only use paging for track searches.
        }
        else
        {
        	// Artist search. Only the first result of the first page is going to be used.
        	searchObject.method = this.ARTIST_SEARCH;
        	searchObject.artist = this.__searchCriteria;
        }
        searchObject.api_key = this.API_KEY;
        searchObject.format = this.JSON_FORMAT;
        return searchObject;
    },
    
    /**
     * Gets more results.
     */
    __getMoreResults: function()
    {
        // Move the search index.
        this.__searchPage += 1;
        
        // Perform the (track) search.
        this.__perfomSearch(true);
    }
});