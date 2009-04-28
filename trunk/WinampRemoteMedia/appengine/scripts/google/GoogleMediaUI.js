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
		var height = $(window).height() - elContainer.offset().top - 40; // Leave gap at bottom.
		var width = elContainer.width();
		
		// Create the layout.
		this.__layout = new YAHOO.widget.Layout(containerId, {height: height, width: width,
			units: [
        		{ position: 'left', width: width/2, scroll: true, resize: true, body: '<div id="' + sitesId + '"></div>' },
        		{ position: 'center', scroll: true, body: '<div id="' + siteBrowserId + '"></div>' },
        		{ position: 'bottom', height: height/3, scroll: true, resize: true, body: '<div id="' + tracksId + '"></div>' }]});
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
	},
	
	/**
	 * Adds a result.
	 * 
	 * @param result The result data.
	 */
	addResult: function(result)
	{
		this.__sitesPaneUI.addSite(result);
	},
	
	/**
	 * Selects a site.
	 * 
	 * @param siteData The selected site data.
	 */
	siteSelected: function(siteData)
	{
		this.__tracksPaneUI.clear();
		this.__siteBrowserPaneUI.showSite(siteData);
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
			// Get the song name.
			var songName = winampGetMetadata(tracks[track].url, "title");
			if (songName == -1)	// Error.
			{
				// Bad ID3 tag, possible bad site. Report to App engine.
				reportBadMedia(tracks[track].url, 1);
				alert('The track "' + tracks[track].name + '" could not be found on the site.');
				return;
			}
			else if (songName == 1)
			{
				// WinAmp API not supported.
				return;
			}
			
			// Load remaining tag data.
			var songLength = winampGetMetadata(tracks[track].url, "length");
			var songArtist = winampGetMetadata(tracks[track].url, "artist");
			
			// Construct title from meta data.
			var title = tracks[track].name;
			if (songName.length > 0 && songArtist.length > 0)
			{
				title = songArtist + " - " + songName;
			}

			// Enqueue the track.
			winampEnqueue(tracks[track].url, title, songLength);
		}
	}
});