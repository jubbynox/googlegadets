/**
 * The LastFM Search UI.
 */
var LastFMUI = Base.extend(
{
	/**
     * The App Engine request string to get mode info about the video.
     */
    APP_ENGINE_REQUEST: 'http://' + location.host + '/lastfm/getRadioTrack?artist=ARTIST',
    
    /**
     * The layout.
     */
    __layout: null,
    
    /**
     * The results pane UI.
     */
    __resultsPaneUI: null,
    
    /**
     * A flag to indicate whether or results were found.
     */
    __noResults: false,
    
    /**
     * Constructor for LastFMUI.
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
        this.__resultsPaneUI = new LastFMResultsPaneUI(resultsId, fnGetMoreResults,
            function(self)
                {
                    return function(artists)
                    {
                        self.artistsSelected(artists);
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
     * Artists selected.
     * 
     * @param artists The artists.
     */
    artistsSelected: function(artists)
    {
        // Only continue if there are results.
        if (!this.__noResults)
        {
            var fmt = $('#Quality').val();
            var artist;
            var index;
            for (index in artists)
            {
                // Enqueue the artist.
                artist = artists[index];
                var artistName = artist.artist.replace(/ \(.*\)$/, ''); // Remove and track match information.
                var trackName = artistName + ' Radio';
                var appEngineRequest = this.APP_ENGINE_REQUEST.replace(/ARTIST/, artistName);
                enqueueMedia(2, appEngineRequest, trackName, -1);
                
                // Radio track enqueue event.
                pageTracker._trackEvent('Radio', 'Enqueue', artistName);
            }
        }
    }
});