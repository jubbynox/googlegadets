/**
 * The Google Media Tracks Pane UI.
 */
var GoogleMediaTracksPaneUI = Base.extend(
{
	/**
	 * Definition of result columns.
	 */
	__columnDefs: [{key:"name", label:"Name"}, {key:"url", label:"URL"}],
				    
	/**
	 * The data schema.
	 */			    
	__schema: ["name","url"],
	
	/**
	 * The list UI.
	 */
	__listUI: null,
	
	/**
	 * Constructor for GoogleMediaTracksPaneUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnTracksSelected The function to invoke when tracks are selected.
	 */
	constructor: function(containerId, fnTracksSelected)
	{
		// Setup the sites pane UI.
		this.__listUI = new SelectableTableUI(containerId, this.__columnDefs, this.__schema, fnTracksSelected, "Enqueue selection");
	},
	
	/**
	 * Clears the list.
	 */
	clear: function()
	{
		this.__listUI.clear();
	},
	
	/**
	 * Shows the tracks.
	 */
	showTracks: function(tracks)
	{
		// Update list UI.
		if (null != tracks.length && 'number' == typeof(tracks.length) && tracks.length > 0)
		{
			this.clear();
			this.__listUI.addRows(this.__orderTracks(tracks));
		}
		else
		{
			this.clear();
		}
	},
	
	/**
     * Order the track objects.
     */
    __orderTracks: function(tracks)
    {
    	// Make two lists. One with matched tracks, the other with unmatched tracks.
		var matchedTrack = new Array();
		var unmatchedTrack = new Array();
		var trackIndex;
		var currentTrack;
		for (trackIndex in tracks)
		{
			currentTrack = tracks[trackIndex];
			if (currentTrack.isMatched)
			{
				// A matched track.
				matchedTrack[matchedTrack.length] = currentTrack;
			}
			else
			{
				// An unmatched track.
				unmatchedTrack[unmatchedTrack.length] = currentTrack;
			}
		}
		
		// Recombine into one list.
		var orderedTracks = new Array();
		for (trackIndex in matchedTrack)
		{
			orderedTracks[orderedTracks.length] = matchedTrack[trackIndex];
		}
		for (trackIndex in unmatchedTrack)
		{
			orderedTracks[orderedTracks.length] = unmatchedTrack[trackIndex];
		}
		
		return orderedTracks;
    }
});