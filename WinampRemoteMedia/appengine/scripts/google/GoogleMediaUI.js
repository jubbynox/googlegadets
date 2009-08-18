/**
 * The Google Media Search UI.
 */
var GoogleMediaUI = Base.extend(
{
	/**
	 * The layout.
	 */
	__layout: null,
	
	/**
	 * The sites pane UI.
	 */
	__sitesPaneUI: null,
	
	/**
	 * The site browser pane UI.
	 */
	__siteBrowserPaneUI: null,
	
	/**
	 * The track pane UI.
	 */
	__tracksPaneUI: null,
	
	/**
	 * A flag to indicate whether or not to allow site browsing.
	 */
	__noResults: false,
	
	/**
	 * Constructor for GoogleMediaSearchUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnGetMoreResults The asynchronous function to get more results.
	 */
	constructor: function(containerId, fnGetMoreResults)
	{
		// Setup IDs for panes.
		var sitesId = containerId + "_sitesPane";
		var siteBrowserId = containerId + "_siteBrowserPane";
		var tracksId = containerId + "_tracksPane";
		
		// Setup sizes.
		var elContainer = $('#' + containerId);
		var height = $(window).height() - elContainer.offset().top + 20;// - 40; // Leave gap at bottom.
		var width = $(window).width();
		
		// Create the layout.
		this.__layout = new YAHOO.widget.Layout(containerId, {height: height, width: width,
			units: [
        		{ position: 'left', width: width/2, scroll: true, resize: true, body: '<div id="' + sitesId + '"></div>', gutter: '0 9px 0 0', minWidth: 50, maxWidth: width-50 },
        		{ position: 'center', scroll: true, body: '<div id="' + siteBrowserId + '"></div>' },
        		{ position: 'bottom', height: height/3, scroll: true, resize: true, body: '<div id="' + tracksId + '"></div>', gutter: '9px, 0 0 0', minHeight: 50, maxHeight: height-50 }]});
		this.__layout.render();
		
		// Create the sites pane.
		this.__sitesPaneUI = new GoogleMediaSitesPaneUI(sitesId,
				function(self)
				{
					return function(siteData)
					{
						self.siteSelected(siteData);
					};
				}(this));
				
		// Create the site browser pane.
		this.__siteBrowserPaneUI = new GoogleMediaSiteBrowserPaneUI(siteBrowserId, fnGetMoreResults,
				function(self)
				{
					return function(contextData)
					{
						self.contextSelected(contextData);
					};
				}(this));
				
		// Create the tracks pane.
		this.__tracksPaneUI = new GoogleMediaTracksPaneUI(tracksId,
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
		// Clear the sites pane UI.
		this.__sitesPaneUI.clear();
		// Clear the site browser pane UI.
		this.__siteBrowserPaneUI.clear();
		// Clear the tracks browser pane UI.
		this.__tracksPaneUI.clear();
		
		// Set no results.
		this.__noResults = true;
	},
	
	/**
	 * Adds details to the pane to indicate that searching has started.
	 */
	searchStarted: function()
	{
		var tmp = new Object();
		tmp.url = 'Scanning...';
		this.__sitesPaneUI.addSite(tmp);
	},
	
	/**
	 * Adds indication that there were no results.
	 */
	noResults: function()
	{
		this.__sitesPaneUI.clear();
		var tmp = new Object();
		tmp.url = 'No results.';
		this.__sitesPaneUI.addSite(tmp);
	},
	
	/**
	 * Adds a result.
	 * 
	 * @param result The result data.
	 */
	addResult: function(result)
	{
		if (this.__noResults == true)
		{
			// Clear the sites pane UI.
			this.__sitesPaneUI.clear();
			this.__noResults = false;
		}
		this.__sitesPaneUI.addSite(result);
	},
	
	/**
	 * Selects a site.
	 * 
	 * @param siteData The selected site data.
	 */
	siteSelected: function(siteData)
	{
		// Only continue if there are results.
		if (!this.__noResults)
		{
			this.__tracksPaneUI.clear();
			this.__siteBrowserPaneUI.showSite(siteData);
		}
	},
	
	/**
	 * Selects a context.
	 * 
	 * @param contextData The context data.
	 */
	contextSelected: function(contextData)
	{
		this.__tracksPaneUI.showTracks(contextData.tracks);
	},
	
	/**
	 * Tracks selected.
	 * 
	 * @param tracks The tracks.
	 */
	tracksSelected: function(tracks)
	{
		var tracks;
		for (track in tracks)
		{
			// Get the track length.
			var songLength = winampGetMetadata(tracks[track].url, "length");
			if (songLength == -1)	// Error.
			{
				// Bad ID3 tag, possible bad site. Report to App engine.
				reportBadMedia(tracks[track].url, 1);
				alert('The track "' + tracks[track].name + '" could not be found on the site.');
			}
			else if (songName == 0)
			{
				// WinAmp API not supported.
				return;
			}
			else
			{
				// Load remaining tag data.
				var songName = winampGetMetadata(tracks[track].url, "title");
				var songArtist = winampGetMetadata(tracks[track].url, "artist");
				
				// Construct title from meta data.
				var title = tracks[track].name;
				if (songName.length > 0 && songArtist.length > 0)
				{
					title = songArtist + " - " + songName;
				}
	
				// Enqueue the track.
				enqueueMedia(0, tracks[track].url, title, songLength)
				
				// Track enqueue.
                pageTracker._trackEvent('Audio', 'Enqueue', tracks[track].url);
			}
		}
	}
});