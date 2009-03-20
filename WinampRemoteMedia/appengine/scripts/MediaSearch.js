/**
 * Load common libraries.
 * Requires hosting page to include Google's AJAX APIs.
 */
google.load("jquery", "1");
google.load("jqueryui", "1");

/** Global variables **/
var test = 0; // 0, 1, 2
var searchObject;


/** Application loader. **/
google.setOnLoadCallback(onLoad);


/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoad()
{
	// Setup default JQuery AJAX settings.
	$.ajaxSetup({timeout: 10000});
	
	// Call application onLoad method.
	onLoadExtended();
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