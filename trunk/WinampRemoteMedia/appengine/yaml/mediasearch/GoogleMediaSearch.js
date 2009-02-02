/**
 * Runs a Google media search.
 */
var GoogleMediaSearch = Base.extend(
{
	/**
	 * The main search Google string to search for MP3 tracks. "SEARCH_STRING" is replaces with the MP3 album or track name.
	 */
	BASE_SEARCH_STRING: 'intitle:"index.of" (mp3) SEARCH_STRING -html -htm -php -asp -cf -jsp -aspx -pdf -doc',
	
	/**
	 * The location of the Google search processor App Engine.
	 */
	SEARCH_URL: 'method/searchUrl',
	
	/**
	 * Constructor.
	 *
	 * @param hiddenElementId An element ID that can be used for hiding stuff.
	 * @param resultsUi The results UI object.
	 * @param test A test number or nothing for live.
	 */
	constructor: function(hiddenElementId, resultsUi, test)
	{
		this.__resultsUi = resultsUi;
		this.__test = test;
	
		// Google Web search setup.
		this.__searchControl = new google.search.SearchControl();
		this.__webSearch = new google.search.WebSearch();
		this.__searchControl.addSearcher(this.__webSearch);
		var options = new google.search.DrawOptions();
		this.__searchControl.draw($('#' + hiddenElementId)[0], options);
		this.__searchControl.setSearchCompleteCallback(this, this.__onSearchComplete);
		this.__searchControl.setResultSetSize(google.search.Search.LARGE_RESULTSET);
	},
	
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
	 * The results UI.
	 */
	__resultsUi: null,
	
	/**
	 * The test number.
	 */
	__test: null,
	
	/**
	 * The current result index.
	 */
	__resultsCounter: null,
	
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
									this.getForCallback(this, this.__buildResultTree),
									function()
									{
										reportBadMedia(url, 'App Engine timed out.');	// Report the error.
										self.__processWebSearch();	// Continue to next result.
									});
				// Move to next result.
				this.__resultsCounter++;
			}
		}
	},
	
	/**
	 * Called on connection error. Reports problematic URL to App Engine and then invokes fnCallback.
	 * 
	 * @param url The problematic URL.
	 * @param fnCallback Function to call after reporting problematic URL.
	 */
	__connectionError: function(url, fnCallback)
	{
		
	},
	
	/**
	 * Gets more results from the URL.
	 *
	 * @param resultNode The existing result node that needs completing.
	 * @param fnResultsCallback The function to call with the search results.
	 */
	__getMoreResults: function(resultNode, fnResultsCallback)
	{
		var self = this;
		this.__searchURL(resultNode.url,
			function(data)
			{
				self.__buildResultNode(resultNode, data, fnResultsCallback);
			},
			function()
			{
					fnResultsCallback(null, null)
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
	 * Handles the results from the JSON URL branch query and builds the complete result tree.
	 *
	 * @param data The data returned.
	 */
	__buildResultTree: function(data)
	{
		// If there is data then continue.
		if (data.url && (data.tracks.length > 0 || data.directories.length > 0))
		{
			// Remove any trailing /.
			data.url = data.url.replace(/\/$/, '');
			
			// Replace %20 with space.
			data.url = data.url.replace(/%20/g, ' ');
		
			// Get the result nodes up to and including the received results.
			var resultNodes = this.__getResultNodes(data.url);
			
			// Add response data to the final result node.
			var lastResultNode = resultNodes[resultNodes.length-1];
			lastResultNode.title = data.title;
			lastResultNode.tracks = data.tracks;
			lastResultNode.areLoaded = true;
			
			// Build the tree.
			this.__resultsUi.addGoogleSearchResultsTree(this.__searchCriteria, resultNodes[0].name, resultNodes, data.directories, this.getForCallback(this, this.__getMoreResults));
		}
		
		// Continue processing the web search.
		this.__processWebSearch();
	},
	
	/**
	 * Handles the results from the JSON URL branch query, but only builds a result node.
	 * The results are passed to fnResultsCallback (which is expected to complete the node building).
	 *
	 * @param resultNode The original resultNode.
	 * @param data The data returned.
	 * @param fnResultsCallback The function to call with the search results.
	 */
	__buildResultNode: function(resultNode, data, fnResultsCallback)
	{
		if (data.url)
		{
			//var resultNode = new Object();
			//resultNode.name;	// Name should already exist from query of parent.
			resultNode.title = data.title;
			//resultNode.url = data.url;	// URL should already exist from query of parent.
			resultNode.tracks = data.tracks;
			resultNode.areLoaded = true;
			
			// Build the results branch.
			fnResultsCallback(resultNode, data.directories);
		}
		else
		{
			// No results.
			fnResultsCallback(null, null);
			// Inform Google App. Maybe not; someone could have navigated here using the links. It is the initial search that is important.
			//$.ajax({type: 'POST', url: this.BAD_MEDIA_URL, data: '{"directoryUrl": "' + url + '","mediaUrl": "Whole directory"}', processData: false});
		}
	},
	
	/**
	 * Builds the contexts to the end of the supplied URL.
	 *
	 * @param url The URL.
	 *
	 * @return An array of.
	 */
	__getResultNodes: function(url)
	{
		// Get the contexts.
		var contexts = this.__getContexts(url);
		
		// Loop through all contexts, building result nodes.
		var resultNodes = [];
		var previousFullContext = '';
		var context;
		for (context in contexts)
		{
			resultNodes[context] = new Object();
			resultNodes[context].name = contexts[context];
			resultNodes[context].url = previousFullContext + contexts[context];
			previousFullContext = resultNodes[context].url + '/';	// The next context to use.
		}
		
		return resultNodes;
	},
	
	/**
	 * Splits the URL into the contexts.
	 *
	 * @param url The URL.
	 *
	 * @return An array of contexts.
	 */
	__getContexts: function getContexts(url)
	{
		// Get protocol.
		var parts = url.split('//');
		
		// Split on delimiter.
		var contexts = parts[1].split('/');
		
		// Recombine protocol with initial context.
		contexts[0] = parts[0] + '//' + contexts[0];
		
		return contexts; 
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
			
			this.__onSearchComplete();//null, search);
		}
		else
		{
			// Setup the search string for the MP3 search (replaces spaces with ".").
			searchString = searchString.replace(/\s/g, ".");
			
			// Create the full matching string for Google Web search.
			var fullSearchString = this.BASE_SEARCH_STRING.replace(/SEARCH_STRING/, searchString);
			
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
	}
});
	
	