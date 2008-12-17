/**
 * The media pane UI.
 */
var MediaResultsUI = Base.extend(
{
	/**
	 * Constructor.
	 *
	 * @param resultsId The element ID of the media results pane.
	 * @param boundaryElement The boundary element (in which results can be dragged).
	 * @param webToHostAppInteraction The media interaction object.
	 */
	constructor: function(resultsId, boundaryElement, webToHostAppInteraction)
	{
		// Get the results view.
		this.__elMediaResults = $("#" + resultsId);
		this.__boundaryElement = boundaryElement;
		this.__webToHostAppInteraction = webToHostAppInteraction;
	},
	
	/**
	 * The HTML of a track.
	 */
	__MEDIA_HTML: '<div id="ID">NAME<input type="hidden" id="name" value="NAME"/><input type="hidden" id="url" value="URL"/></div>',
	
	/**
	 * Regular expression to match all 'NAME' strings.
	 */
	__NAME_SEARCH: new RegExp('NAME', 'g'),
	
	/**
	 * The track pane element.
	 */
	__elMediaResults: null,
	
	/**
	 * The boundary element.
	 */
	__boundaryElement: null,
	
	/**
	 * The media interaction object.
	 */
	__webToHostAppInteraction: null,
	
	/**
	 * A counter used to help construct track elements IDs.
	 */
	__currentIDCounter: null,
	
	/**
	 * An array to hold the media result objects.
	 */
	__mediaResult: new Array(),
	
	/**
	 * Displays the given media.
	 *
	 * @param media The media data.
	 */
	displayMedia: function(media)
	{
		// Clear existing media.
		this.__clearMedia();
		
		// Make two lists. One with matched tracks, other with unmatched tracks.
		var matchedMedia = new Array();
		var unmatchedMedia = new Array();
		var mediaIndex;
		var currentMedia;
		for (mediaIndex in media)
		{
			currentMedia = media[mediaIndex];
			if (currentMedia.isMatched)
			{
				matchedMedia[matchedMedia.length] = currentMedia;
			}
			else
			{
				unmatchedMedia[unmatchedMedia.length] = currentMedia;
			}
		}
		
		// Build the media result objects - matched media first.
		for (mediaIndex in matchedMedia)
		{
			this.__mediaResult[this.__mediaResult.length] = this.__addMedia(matchedMedia[mediaIndex]);
		}
		for (mediaIndex in unmatchedMedia)
		{
			this.__mediaResult[this.__mediaResult.length] = this.__addMedia(unmatchedMedia[mediaIndex]);
		}
	},
	
	/**
	 * Builds the HTML elements for given media.
	 *
	 * @param media The media.
	 *
	 * @return The media result.
	 */
	__addMedia: function(media)
	{
		// Make the new ID.
		var id = this.__elMediaResults.attr('id') + '_media' + this.__currentIDCounter++;
		
		// Make the HTML.
		var mediaHTML = this.__MEDIA_HTML.replace('ID', id).replace(this.__NAME_SEARCH, media.name).replace('URL', media.url);
		
		// Add to media pane.
		var elMedia = this.__elMediaResults.append(mediaHTML);
		
		// Create a draggable element.
		return new MediaResult(id, this.__boundaryElement, this.__webToHostAppInteraction, media);
	},
	
	/**
	 * Clears media from the media pane UI.
	 */
	__clearMedia: function()
	{
		// Clear results pane.
		this.__elMediaResults.empty();
		
		// Reset ID counter.
		this.__currentIDCounter = 0;
		
		// Clear the draggable media result objects.
		for (mediaIndex in this.__mediaResult)
    	{
    		this.__mediaResult[mediaIndex].unreg();
    	}
		this.__mediaResult = new Array();
	},
	
	/**
     * Event when the width of the results pane has changed.
     *
     * @param oArgs Information about the event.
     */
    onWidthChange: function(oArgs, me)
    {
    	// Rebuild boundary conditions of all media results.
    	var mediaIndex;
    	for (mediaIndex in me.__mediaResult)
    	{
    		me.__mediaResult[mediaIndex].recalculateBoundaryCondition();
    	}
    }
});


/**
 * A drag-drop media result.
 * 
 * @param id The ID of this element.
 * @param boundaryElement the bounding element that this object cannot be dragged outside of.
 * @param mediaInteraciton The media interaction object.
 * @param config Configuration parameters.
 */
MediaResult = function(id, boundaryElement, mediaInteraction, media, config)
{
    MediaResult.superclass.constructor.apply(this, arguments);
    this.setup(id, boundaryElement, mediaInteraction, media);
};

YAHOO.extend(MediaResult, YAHOO.util.DDProxy,
{
	/**
     * The node type
     * @property __type
     * @private
     * @type string
     * @default "MediaResult"
     */
    __type: "MediaResult",
    
    /**
     * The start position.
     */
    __startPos: null,
    
    /**
     * Max units to left.
     */
    __maxToLeft: null,
    
    /**
     * Max units to right.
     */
    __maxToRight: null,
    
    /**
     * Max units to top.
     */
    __maxToTop: null,
    
    /**
     * Max units to bottom.
     */
    __maxToBottom: null,
    
    /**
     * This media element.
     */
    __elMe: null,
    
    /**
     * This media element's width.
     */
    __width: null,
    
    /**
     * This media element's height.
     */
    __height: null,
    
    /**
     * The media interaction object.
     */
    __webToHostAppInteraction: null,
    
    /**
     * The media.
     */
    __media: null,

	/**
	 * Setup the draggable result node.
	 *
	 * @param id The element id.
	 * @param boundaryElement The boundary element.
	 * @param webToHostAppInteraction The media interaction object.
	 * @param media The media object.
	 */
    setup: function(id, boundaryElement, webToHostAppInteraction, media)
    {
        if (!id)
        { 
            return; 
        }
        
        // Setup properties.
        this.addToGroup('media');
        this.isTarget = false;
        this.__media = media;
        this.__webToHostAppInteraction = webToHostAppInteraction;
        
        // Record the start position.
        this.__startPos = YAHOO.util.Dom.getXY( this.getEl() );
        this.__elMe = $("#" + id);
        this.__width = this.__elMe.width();
        this.__height = this.__elMe.height();
        
        // Set the boundary constraints based on the supplied boundary element.
        this.__maxToLeft = this.__elMe.offset().left - boundaryElement.offset().left;
        this.__maxToRight = (boundaryElement.offset().left + boundaryElement.width()) - (this.__elMe.offset().left + this.__width);
        this.__maxToTop = this.__elMe.offset().top - boundaryElement.offset().top;
        this.__maxToBottom = (boundaryElement.offset().top + boundaryElement.height()) - (this.__elMe.offset().top + this.__height);
		this.setXConstraint(this.__maxToLeft, this.__maxToRight); 
		this.setYConstraint(this.__maxToTop, this.__maxToBottom);
    },
    
    /**
     * Rebuilds the boundary conditions for the draggable object.
     * YUI recalculates the constraints, but doesn't take into account the change in an element's size.
     */
    recalculateBoundaryCondition: function()
    {
    	// Calculate new maxToRight and maxToBottom.
    	this.__maxToRight += this.__width - this.__elMe.width();
    	this.__maxToBottom += this.__height - this.__elMe.height();
    	
    	// Store new width and height.
    	this.__width = this.__elMe.width();
    	this.__height = this.__elMe.height();
    	
    	// Set boundary constraints.
    	this.setXConstraint(this.__maxToLeft, this.__maxToRight); 
		this.setYConstraint(this.__maxToTop, this.__maxToBottom);
    },
    
    /**
     * Fired when the result object is dropped.
     */
    endDrag: function(e)
    {
    	// Easiest way to move back to original position. Tried resetting position onInvalidDrop, but YUI moves the DD element after the event.
    },
    
    /**
     * Fired when the media is dropped onto a target.
     */
    onDragDrop: function(e, id)
    {
    	this.__webToHostAppInteraction.mediaDropEvent(id, this.__media);
    }
});