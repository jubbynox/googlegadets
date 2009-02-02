/**
 * Media searching routines.
 */
// Requires hosting page to include Google's AJAX APIs.
google.load("search", "1")
google.load("jquery", "1");
google.load("jqueryui", "1");

/** Global variables **/
var test = 2; // 0, 1, 2
var resultsUi;
var googleMediaSearch;


/** Global objects **/
// Setup the global objects.
google.setOnLoadCallback(onLoad);


/**
 * Function to be invoked on page load. Sets up the required objects.
 */
function onLoad()
{
	// Setup default JQuery AJAX settings.
	$.ajaxSetup({timeout: 10000});
	
	// Setup results pane.
	resultsUi = new ResultsUI('ResultsPane');
	
	// Setup Google media search.
	googleMediaSearch = new GoogleMediaSearch('HiddenElement', resultsUi, test);
}

/**
 * Main search function.
 *
 * @param searchString The search string.
 */
function search(searchString)
{
	// Do the Google media search.
	googleMediaSearch.search(searchString);
	
	// Ensure that the invoking form doesn't cause a page load.
	return false;
}

/**
 * Clears the results.
 */
function clearResults()
{
	// Clear search objects.
	googleMediaSearch.clearResults();
	
	// Clear the input box.
	$('#SearchInput')[0].value = '';
}

/**
 * Adds comments.
 *
 * @param comments The comments.
 */
function addComments(comments)
{
	// Make comments safe.
	comments = comments.replace(/("|\\)/g, '\\$1')
	
	// Post data.
	$.ajax({type: "POST", url: "/mediasearch/method/addComments", data: "{\"comments\": \"" + comments + "\"}", processData: false});
	
	// Ensure that the invoking form doesn't cause a page load.
	return false;
}