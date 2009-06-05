/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoadExtended()
{
	// Setup YouTube search.
	searchObject = new YouTubeSearch('ResultsPane');
	
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
 * The YouTube Search functionality.
 */
var YouTubeSearch = Base.extend(
{
	/**
	 * The search URL for YouTube videos.
	 */
	SEARCH_URL: 'http://gdata.youtube.com/feeds/api/videos',
	
	/**
	 * Regular expression to extract video ID from player URL.
	 */
	VIDEO_ID_RE: /watch\?v=(.+)$/,
	
	/**
	 * Maximum number of results per search.
	 */
	__maxResults: 10,
	
	/**
	 * The search criteria.
	 */
	__searchCriteria: null,
	
	/**
	 * The results UI.
	 */
	__youtubeUI: null,
	
	/**
	 * The search index from which to retrieve results.
	 */
	__searchIndex: null,
	
	/**
	 * Constructor for GoogleMediaSearch.
	 * 
	 * @param resultsId The ID of the results pane.
	 */
	constructor: function(resultsId)
	{
		// Create the YouTube UI.
		this.__youtubeUI = new YouTubeUI(resultsId,
			function(self)
			{
				return function()
				{
					self.__getMoreResults();
				};
			}(this));
		
		// Setup the search index.
		this.__searchIndex = 1;
	},
	
	/**
	 * Main search function.
	 *
	 * @param searchString The search string.
	 */
	search: function(searchString)
	{
		// Clear results.
		this.clearResults();
		
		// Store the search string.
		this.__searchCriteria = searchString;
		
		// Indicate that the search has started.
		this.__youtubeUI.searchStarted();
		
		// Perform the search.
		this.__perfomSearch();
	},
	
	/**
	 * Performs the YouTube search.
	 */
	__perfomSearch: function()
	{
		var data = this.__createSearchObject();
		getXDomainJSON(this.SEARCH_URL, data,
			function(self)
			{
				return function(data)
				{
					self.__processYouTubeResults(data);
				};
			}(this),
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
		this.__searchIndex = 1;
		this.__youtubeUI.clear();
	},
	
	/**
	 * Processes the YouTube results.
	 * 
	 * @param data The data returned from the YouTube search.
	 */
	__processYouTubeResults: function(data)
	{
		// Setup result set.
		var resultIndex = 0;
		var resultSet = new Array();
		for (index in data.feed.entry)
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
		}
	},
	
	/**
	 * Formats seconds into m:ss
	 * 
	 * @param seconds
	 * 
	 * @return The formatted time as a string.
	 */
	__formatTime: function(seconds)
	{
		var minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		seconds = seconds < 10 ? '0' + seconds : seconds;
		return minutes + ':' + seconds;
	},
	
	/**
	 * Creates a search object to submit to the XDomain JSON request.
	 * 
	 * @return A YouTube search object.
	 */
	__createSearchObject: function()
	{
		var searchObject = new Object();
		searchObject.alt = 'json-in-script';	// Requests a response that wraps JSON in a script tag.
		searchObject['start-index'] = this.__searchIndex;	// The start index of the results.
		searchObject['max-results'] = this.__maxResults;	// The maximum number of results to retrieve.
		searchObject.q = this.__searchCriteria;
		return searchObject;
	},
	
	/**
	 * Gets more results.
	 */
	__getMoreResults: function()
	{
		// Move the search index.
		this.__searchIndex += this.__maxResults;
		
		// Perform the search.
		this.__perfomSearch();
	}
});