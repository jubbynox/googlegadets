/**
 * The Google Media Search UI.
 */
var YouTubeUI = Base.extend(
{
	/**
	 * The App Engine request string to get mode info about the video.
	 */
	APP_ENGINE_REQUEST: 'http://' + location.host + '/youtube/getVideo?videoID=VIDEO_ID&fmt=FMT',
	
	/**
	 * The layout.
	 */
	__layout: null,
	
	/**
	 * The results pane UI.
	 */
	__resultsPaneUI: null,
	
	/**
	 * A flag to indicate whether or not to allow site browsing.
	 */
	__noResults: false,
	
	/**
	 * Constructor for YouTubeUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnGetMoreResults Callback function to get more results.
	 */
	constructor: function(containerId, fnGetMoreResults)
	{
		// Setup IDs for panes.
		var resultsId = containerId + "_resultsPane";
		
		// Setup sizes.
		var elContainer = $('#' + containerId);
		var height = $(window).height() - elContainer.offset().top + 20;// - 40; // Leave gap at bottom.
		var width = $(window).width();
		
		// Create the layout.
		this.__layout = new YAHOO.widget.Layout(containerId, {height: height, width: width,
			units: [
        		{ position: 'center', scroll: true, body: '<div id="' + resultsId + '"></div>' }]});
		this.__layout.render();
		
		// Create the results pane.
		this.__resultsPaneUI = new YouTubeResultsPaneUI(resultsId, fnGetMoreResults,
			function(self)
				{
					return function(tracks)
					{
						self.tracksSelected(tracks);
					};
				}(this));
	},
	
	/**
	 * Clears all results.
	 */
	clear: function()
	{
		// Clear the results pane UI.
		this.__resultsPaneUI.clear();
		
		// Set no results.
		this.__noResults = true;
	},
	
	/**
	 * Adds details to the pane to indicate that searching has started.
	 */
	searchStarted: function()
	{
		var tmp = new Object();
		tmp.thumbnail = 'Scanning...';
		this.__resultsPaneUI.addResult(tmp);
	},
	
	/**
	 * Adds indication that there were no results.
	 */
	noResults: function()
	{
		this.__resultsPaneUI.clear();
		var tmp = new Object();
		tmp.thumbnail = 'No results.';
		this.__resultsPaneUI.addResult(tmp);
	},
	
	/**
	 * Adds a result.
	 * 
	 * @param result The result.
	 */
	addResult: function(result)
	{
		if (this.__noResults == true)
		{
			// Clear the sites pane UI and searching indicator.
			this.__resultsPaneUI.clear();
			this.__noResults = false;
		}
		this.__resultsPaneUI.addResult(result);
	},
	
	/**
	 * Adds results.
	 * 
	 * @param results The results.
	 */
	addResults: function(results)
	{
		if (this.__noResults == true)
		{
			// Clear the sites pane UI and searching indicator.
			this.__resultsPaneUI.clear();
			this.__noResults = false;
		}
		this.__resultsPaneUI.addResults(results);
	},
	
	/**
	 * Tracks selected.
	 * 
	 * @param tracks The tracks.
	 */
	tracksSelected: function(tracks)
	{
		// Only continue if there are results.
		if (!this.__noResults)
		{
			var fmt = $('#Quality').val();
			var track;
			var index;
			for (index in tracks)
			{
				// Enqueue the track.
				track = tracks[index];
				var appEngineRequest = this.APP_ENGINE_REQUEST.replace(/VIDEO_ID/, track.videoID);
				appEngineRequest = appEngineRequest.replace(/FMT/, fmt);
				enqueueMedia(2, appEngineRequest, track.title, track.duration);
			}
		}
	}
});