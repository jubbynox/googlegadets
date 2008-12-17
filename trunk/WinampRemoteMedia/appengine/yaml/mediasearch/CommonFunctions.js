/**
 * Calculates the minimum width, initial width and maximum width for a resizable pane.
 *
 * @param desiredMinWidth The desired minimum width.
 * @param desiredInitialWidth The desired initial width.
 * @param boundaryWidth The width of the bounding element.
 * @param marginAtMax The space to leave between the bounding element when extended to maximum width.
 *
 * @return Width object containing: minWidth, width, maxWidth.
 */
function calculateResizePaneWidthSettings(desiredMinWidth, desiredInitialWidth, boundaryWidth, marginAtMax)
{
	// Calculate maximum width.
	var maxWidth = boundaryWidth - marginAtMax;
	if (maxWidth < 10)	// There has to be a limit on how small this can be.
	{
		maxWidth = 10;
	}
	
	// Ensure that minimum width does not exceed maximum width.
	if (desiredMinWidth > maxWidth)
	{
		desiredMinWidth = maxWidth;
	}
	
	// Ensure that initial width is within bounds of minimum and maximum width.
	if (desiredInitialWidth < desiredMinWidth)
	{
		desiredInitialWidth = desiredMinWidth;
	}
	else if (desiredInitialWidth > maxWidth)
	{
		desiredInitialWidth = maxWidth;
	}
	
	// Construct object;
	var widthDetails = new Object();
	widthDetails.minWidth = desiredMinWidth;
	widthDetails.width = desiredInitialWidth;
	widthDetails.maxWidth = maxWidth;
	
	return widthDetails;
}