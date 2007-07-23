// Constants and global variables.
var baseSearchString = 'intitle:"index.of" (mp3) SEARCH_STRING -html -htm -php -asp -cf -jsp -aspx -pdf -doc';
var resultTitleSearchString = "<title>index\\s*of\\s*(.*)</title>";
var baseResultMP3SearchString = "<a href=['|\"](.*\\.mp3)['|\"]>(SEARCH_STRING)</a>";
var hostingURL = "http://gadgets.banacek.org/mediasearch/";
// The current search criteria.
var searchCriteria;
var results = new Array();
var resultCounter = 0;
var searchingDIV = "<div id='Searching'>Searching...</div>";
var trackBatchDIV = "<div id='TrackBatch'><a href='HEAD_URL' target='_blank'><div id='TBHead'><div id='TBIndexName'>INDEX_NAME</div><div id='TBURL'>BASE_URL</div></div></a><div id='TBBody'><div id='TBMatched'><div id='TBMatchedHead'>Matched tracks</div><div id='TBMatchedBody'>MATCHED_TRACK_INFO</div></div><div id='TBOther'><div id='TBOtherHead'>Other tracks from source <p class='centeredImage'><img name='ExpandImage#' src='" + hostingURL + "down.jpg' onclick='javascript:toggleOtherResults(\"#\");'/></p></div><div id='TBOtherBody'><div id='ExpandRegion#' style='display: none;'>OTHER_TRACK_INFO</div></div></div></div></div>";
var trackInfoDIV = "<a href='TRACK_URL' target='_blank'><div id='Track'>TRACK_NAME</div></a>";
var trackInfoAltDIV = "<a href='TRACK_URL' target='_blank'><div id='TrackAlt'>TRACK_NAME</div></a>";
var trackInfoNoneDIV = "<div id='TrackNone'>No tracks found</div>";

function toggleOtherResults(id)
{
	var regionId = "ExpandRegion" + id;
	var imageName = "ExpandImage" + id;
	var region = document.getElementById(regionId);
	if (region.style.display != 'none' )
	{
		region.style.display = 'none';
		document[imageName].src = hostingURL + "down.jpg";
	}
	else
	{
		region.style.display = '';
		document[imageName].src = hostingURL + "up.jpg";
	}
}

// Setup the Google search control.	
var searchControl = new GSearchControl();


// Function invoked on page load. Sets up the Google Web search control.
function OnLoad()
{
	var ws = new GwebSearch();
  searchControl.addSearcher(ws);

	var options = new GdrawOptions();
	searchControl.draw(document.getElementById("searchResults"), options);
	searchControl.setSearchCompleteCallback(this, onGoogleSearchComplete);
	searchControl.setResultSetSize(GSearch.LARGE_RESULTSET);
}


// The callback search function.
onGoogleSearchComplete = function(searchControl, searcher)
{
	if ( searcher.results && searcher.results.length > 0)
	{
		resultCounter = searcher.results.length;
		for (var i = 0; i < searcher.results.length; i++)
		{
    	var result = searcher.results[i];
    	_IG_FetchContent(result.unescapedUrl, _IG_Callback(loadTracks, result.unescapedUrl, searchCriteria));
    	//break;
    }
  }
  else
  {
  	refreshResults();
  }
}

		
// Start the Google search.
GSearch.setOnLoadCallback(OnLoad);


// Writes into a DIV layer.
function writeDiv(ID,parentID,URL)
{
	if (document.layers)
	{
		var oLayer;
		if(parentID)
		{
			oLayer = eval('document.' + parentID + '.document.' + ID + '.document');
		}
		else
		{
			oLayer = document.layers[ID].document;
		}
		oLayer.open();
		oLayer.write(URL);
		oLayer.close();
	}
	else if (parseInt(navigator.appVersion)>=5&&navigator.appName=="Netscape")
	{
		document.getElementById(ID).innerHTML = URL;
	}
	else if (document.all)
	{
		document.all[ID].innerHTML = URL;
	}
}


// Main search function.
function search(searchString)
{
	// Log search.
	_IG_Analytics("UA-2268697-1", "/mediaSearch/search");
	
	// Store the original search string.
	searchCriteria = searchString;
	
	// Stop any existing search.
	searchControl.cancelSearch();
	
	// Clear the results.
	results = new Array();
	resultCounter = 0;
	writeDiv('results', null, searchingDIV);
	_IG_AdjustIFrameHeight();
	
	// Setup the search string for the MP3 search.
	searchString = searchString.replace(/\s/g, ".");
	
	// Create the full matching string for Google Web searc.
	fullSearchString = baseSearchString.replace(/SEARCH_STRING/, searchString);
	
	// Perform the Google Web search.
	searchControl.execute(fullSearchString);
	return false;
}


// Clears the search results.
function clearResults()
{
	// Stop any existing search.
	searchControl.cancelSearch();
	
	// Clear the results.
	results = new Array();
	resultCounter = 0;
	writeDiv('results', null, "");
	_IG_AdjustIFrameHeight();
}


// Loads the tracks from the page.
function loadTracks(responseText, url, currSearchCriteria)
{
	// Decrement the result counter.
	resultCounter--;
	
	/*
	tracks object:
	tracks.baseUrl
	tracks.indexName
	tracks.matchedTrack[].link
	tracks.matchedTrack[].name
	tracks.otherTrack[].link
	tracks.otherTrack[].name
	*/
	
	// Check that the URL isn't a request string.
	if (url.match(/\?/))
	{
		refreshResults();
		return;
	}
	
	// Setup the tracks object.
	var tracks = new Object();
	tracks.baseUrl = url;
	
	// Get the page title.
	var titleRegEx = new RegExp(resultTitleSearchString, "i");
	var titleMatch = titleRegEx.exec(responseText);
	//alert("Here " + titleMatch + " " + responseText);
	if (titleMatch != null && titleMatch.length > 0)
	{
		// Page title has been found.
		tracks.indexName = titleMatch[1];
		//alert("Index " + tracks.indexName);
		
		// Search for matching tracks.
		// Setup the MP3 search string.
		var searchString = "(.*" + currSearchCriteria.replace(/\s/g, ".*)|(.*") + ".*)";
		var resultMP3SearchString = baseResultMP3SearchString.replace(/SEARCH_STRING/, searchString);
		tracks.matchedTrack = loadIndividualTracks(responseText, resultMP3SearchString);
		
		// Search for other tracks.
		resultMP3SearchString = baseResultMP3SearchString.replace(/SEARCH_STRING/, ".*");
		tracks.otherTrack = loadIndividualTracks(responseText, resultMP3SearchString);
		
		if (tracks.matchedTrack != null && tracks.matchedTrack.length > 0 || tracks.otherTrack != null && tracks.otherTrack.length > 0)
		{
			// Add the result object to the array of results.
			addToResults(tracks);
		}
	}
	
	refreshResults();
}

// Loads the individual tracks into the tracks object.
function loadIndividualTracks(responseText, resultMP3SearchString, indexJump)
{
	var matchedTrack = new Array();
	var trackIndex = 0;
	
	// Perform the MP3 track search.
	var trackRegEx = new RegExp(resultMP3SearchString, "i");
	var trackMatch = trackRegEx.exec(responseText);
	while (trackMatch != null && trackMatch.length > 0 )
	{
		//alert("Match " + trackMatch[0]);
		// Matching tracks have been found.
		matchedTrack[trackIndex] = new Object();
		matchedTrack[trackIndex].link = trackMatch[1];
		matchedTrack[trackIndex].link = matchedTrack[trackIndex].link.replace(/'/g, "%27");
		matchedTrack[trackIndex].name = trackMatch[2];
		trackIndex++;
		
		// Remove this match and search again.
		responseText = responseText.replace(trackRegEx, "");
		trackMatch = trackRegEx.exec(responseText);
	}

	if (matchedTrack.length == 0)
	{
		matchedTrack = null;
	}
	return matchedTrack;
}


// Adds the tracks to the main results object.
function addToResults(tracks)
{
	results[results.length] = tracks;
}


// Refreshes the results pane.
function refreshResults()
{
	var resultHTML = "";
	for (resultIndex = 0; resultIndex < results.length; resultIndex++)
	{
		var tracks = results[resultIndex];
		var trackBatchHTML = trackBatchDIV.replace(/#/g, resultIndex);
		trackBatchHTML = trackBatchHTML.replace(/HEAD_URL/, tracks.baseUrl);
		trackBatchHTML = trackBatchHTML.replace(/INDEX_NAME/, tracks.indexName);
		trackBatchHTML = trackBatchHTML.replace(/BASE_URL/, tracks.baseUrl);
		trackBatchHTML = trackBatchHTML.replace(/MATCHED_TRACK_INFO/, buildTrackList(tracks.baseUrl, tracks.matchedTrack));
		trackBatchHTML = trackBatchHTML.replace(/OTHER_TRACK_INFO/, buildTrackList(tracks.baseUrl, tracks.otherTrack));
		
		resultHTML += trackBatchHTML;
	}
	
	if (resultHTML == "" && resultCounter == 0)
	{
		resultHTML = "No Results";
	}
	
	if (resultHTML != "")
	{
		writeDiv('results', null, resultHTML);
	}
	
	/*if (resultCounter == 0)
	{*/
		_IG_AdjustIFrameHeight();
	//}
}


function buildTrackList(baseUrl, trackList)
{
	var tracksHTML = "";
	if (trackList != null)
	{
		for (trackIndex = 0; trackIndex < trackList.length; trackIndex++)
		{
			track = trackList[trackIndex];
			var trackHTML;
			if (trackIndex % 2 == 0)
			{
				trackHTML = trackInfoDIV;
			}
			else
			{
				trackHTML = trackInfoAltDIV;
			}
			trackHTML =trackHTML.replace(/TRACK_URL/, baseUrl + track.link);
			trackHTML = trackHTML.replace(/TRACK_NAME/, track.name);
			tracksHTML += trackHTML;
		}
	}
	else
	{
		tracksHTML = trackInfoNoneDIV;
	}
	
	return tracksHTML;
}