// Load required libraries
google.load("search", "1")


/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoadExtended()
{
	// Setup Google media search.
	searchObject = new GoogleMediaSearch('HiddenElement', 'ResultsPane', test);
}


/**
 * The Google Media Search functionality.
 */
var GoogleMediaSearch = Base.extend(
{
	/**
	 * The main search Google string to search for MP3 tracks. "SEARCH_STRING" is replaces with the MP3 album or track name.
	 */
	BASE_SEARCH_STRING: 'intitle:"index.of" (mp3) SEARCH_STRING -html -htm -php -asp -cf -jsp -aspx -pdf -doc',
	
	/**
	 * Removes a site from a Google search.
	 */
	SITE_REMOVE_STRING: '-site:',
	
	/**
	 * The location of the Google media search processor App Engine.
	 */
	SEARCH_URL: 'google/searchUrl',
	
	/**
	 * The location of the Google media ignored sites processor App Engine.
	 */
	IGNORED_SITES_URL: 'google/getIgnoredSites',
	
	/**
	 * A list of ignored sites.
	 */
	IGNORED_SITES: null,
	
	/**
	 * The test number.
	 */
	__test: null,
	
	/**
	 * The Google search control.
	 */
	__searchControl: null,
	
	/**
	 * The web search object.
	 */
	__webSearch: null,
	
	/**
	 * The search criteria.
	 */
	__searchCriteria: null,
	
	/**
	 * The current result index.
	 */
	__resultsCounter: null,
	
	/**
	 * The Google media UI.
	 */
	__mediaUI: null,
	
	/**
	 * Constructor for GoogleMediaSearch.
	 * 
	 * @param hiddenId The ID of a hidden pane.
	 * @param resultsId The ID of the results pane.
	 * @param test A test number or nothing for live.
	 */
	constructor: function(hiddenId, resultsId, test)
	{
		this.__test = test;
		
		// Load the ignored sites.
		var self = this;
		getDomainJSON(this.IGNORED_SITES_URL, null,
			function(data)
				{
					self.IGNORED_SITES = data;
				},
			function()
			{
					self.IGNORED_SITES = new Array();
			});
		
		// Create the media UI.
		this.__mediaUI = new GoogleMediaUI(resultsId, function(self)
													{
														return function(url, fnResultsCallback)
														{
															self.__getMoreResults(url, fnResultsCallback);
														};
													}(this));
		
		// Google Web search setup.
		this.__searchControl = new google.search.SearchControl();
		this.__webSearch = new google.search.WebSearch();
		this.__searchControl.addSearcher(this.__webSearch);
		var options = new google.search.DrawOptions();
		this.__searchControl.draw($('#' + hiddenId)[0], options);
		this.__searchControl.setSearchCompleteCallback(this, this.__onSearchComplete);
		this.__searchControl.setResultSetSize(google.search.Search.LARGE_RESULTSET);
	},
	
	/**
	 * Main search function.
	 *
	 * @param searchString The search string.
	 */
	search: function(searchString)
	{
		// Stop any existing search and clear results.
		this.__searchControl.cancelSearch();
		this.__searchControl.clearAllResults();
		this.clearResults();
		
		// Store the search string.
		this.__searchCriteria = searchString;
		
		if (this.__test)
		{
			var search = new Object();
			search.results = [];
			search.results[0] = new Object;
			search.results[0].unescapedUrl = 'http://a/test/search/';
			search.results[1] = new Object;
			search.results[1].unescapedUrl = 'http://another/test/search/';
			
			this.__webSearch = search;
			
			this.__onSearchComplete();
		}
		else
		{
			// Setup the search string for the MP3 search (replaces spaces with ".").
			searchString = searchString.replace(/\s/g, ".");
			
			// Create the full matching string for Google Web search.
			var fullSearchString = this.BASE_SEARCH_STRING.replace(/SEARCH_STRING/, searchString);
			
			// Append ignored sites.
			for (ignoredSite in this.IGNORED_SITES)
			{
				fullSearchString += " " + this.SITE_REMOVE_STRING + this.IGNORED_SITES[ignoredSite];
			}
			
			// Perform the Google Web search.
			this.__searchControl.execute(fullSearchString);
		}
	},
	
	/**
	 * Clears results.
	 */
	clearResults: function()
	{
		// Stop any existing search.
		this.__searchControl.cancelSearch();
		this.__searchControl.clearAllResults();
		
		// Clear results UI.
		this.__mediaUI.clear();
	},
	
	/**
	 * The callback search function.
	 */
	__onSearchComplete: function()
	{	
		// Setup result counter.
		this.__resultsCounter = 0;
		
		// Start processing.
		this.__processWebSearch();
	},
	
	/**
	 * Processes the next results of the web search.
	 */
	__processWebSearch: function()
	{
		// Check that there are search results.
		if (this.__webSearch.results && this.__webSearch.results.length > 0)
		{
			// Test index.
			if (this.__resultsCounter >= this.__webSearch.results.length)	// Get next page as all results have been processed.
			{
				if (this.__webSearch.cursor)	// Test if there are more pages to load.
				{
					if (this.__webSearch.cursor.currentPageIndex < this.__webSearch.cursor.pages.length-1)
					{
						// Load next page of results.
						this.__webSearch.gotoPage(this.__webSearch.cursor.currentPageIndex+1);
					}
				}
			}
			else	// Process web search.
			{
				var url = this.__webSearch.results[this.__resultsCounter].unescapedUrl;
				var self = this;
				this.__searchURL(url,
									function(data)
									{
										self.__processResult(data);
									},
									function()
									{
										reportBadMedia(url, 2);	// Report the error.
										self.__processWebSearch();	// Continue to next result.
									});
				// Move to next result.
				this.__resultsCounter++;
			}
		}
	},
	
	/**
	 * Gets more results from the URL.
	 *
	 * @param url The URL from which to get more results.
	 * @param fnResultsCallback The function to call with the search results.
	 */
	__getMoreResults: function(url, fnResultsCallback)
	{
		var self = this;
		this.__searchURL(url,
			function(data)
			{
				self.__buildResultNode(data, fnResultsCallback);
			},
			function()
			{
					fnResultsCallback(null);
			});
	},
	
	/**
	 * Searches the URL for media.
	 *
	 * @param url The URL.
	 * @param fnCallbackSuccess Function to call when the search successfully completes.
	 * @param fnCallbackError Function to call when the search completes in error.
	 */
	__searchURL: function(url, fnCallbackSuccess, fnCallbackError)
	{
		var query = new Object();
		query.url = url;
		query.searchCriteria = this.__searchCriteria;
		if (test)
		{
			query.test = test;
		}

		getDomainJSON(this.SEARCH_URL, query, fnCallbackSuccess, fnCallbackError);
	},
	
	/**
	 * Handles the results from the JSON URL branch query.
	 *
	 * @param data The data returned.
	 */
	__processResult: function(data)
	{
		// If there is data then continue.
		if (data.url && (data.tracks.length > 0 || data.directories.length > 0))
		{
			this.__mediaUI.addResult(data);
		}
		
		// Continue processing the web search.
		this.__processWebSearch();
	},
	
	/**
	 * Handles the results from the JSON URL branch query, but only builds a result node.
	 * The results are passed to fnResultsCallback (which is expected to complete the node building).
	 *
	 * @param data The data returned.
	 * @param fnResultsCallback The function to call with the search results.
	 */
	__buildResultNode: function(data, fnResultsCallback)
	{
		if (data.url)
		{
			// Build the results branch.
			fnResultsCallback(data);
		}
		else
		{
			// No results.
			fnResultsCallback(null);
		}
	}
});