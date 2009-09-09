/** Global variables **/
var test = 0; // 0, 1, 2
var searchObject;

/**
 * Function to be invoked on page load. Sets up the media search.
 */
function onLoadMediaSearch()
{
	// Check WinAmp API available.
    checkForWinAmpAPI();
    
	// Setup stylesheet.
	setupStylesheet();
	
	// Set focus on input box.
	$('#SearchInput')[0].focus();
}

/**
 * Main search function.
 *
 * @param searchString The search string.
 */
function search(searchString)
{
	// Do the search.
	searchObject.search(searchString);
	
	// Ensure that the invoking form doesn't cause a page load.
	return false;
}

/**
 * Clears the results.
 */
function clearResults()
{
	// Clear search objects.
	searchObject.clearResults();
	
	// Clear the input box.
	$('#SearchInput')[0].value = '';
}