/**
 * The Google Media Sites Pane UI.
 */
var GoogleMediaSitesPaneUI = Base.extend(
{
	/**
	 * Definition of result columns.
	 */
	__columnDefs: [{key:"url", label:"Result URL"}],
				    
	/**
	 * The data schema.
	 */			    
	__schema: ["url"],
	
	/**
	 * The list UI.
	 */
	__listUI: null,
	
	/**
	 * The sites data.
	 */
	__sites: null,
	
	/**
	 * The method to invoke when a site is selected.
	 */
	__fnSiteSelected: null,
	
	/**
	 * Constructor for GoogleMediaSitesPaneUI.
	 * 
	 * @param containerId The ID of the container.
	 * @param fnSiteSelected The method to invoke when a site is selected.
	 */
	constructor: function(containerId, fnSiteSelected)
	{
		this.__fnSiteSelected = fnSiteSelected;
		
		// Setup the sites pane UI.
		this.__listUI = new SelectableTableUI(containerId, this.__columnDefs, this.__schema,
				function(self)
				{
					return function(rowData)
							{
								self.selected(rowData);
							};
				}(this));
		
		// Initialise sites array.
		this.__sites = new Array();
	},
	
	/**
	 * Clears the list.
	 */
	clear: function()
	{
		this.__listUI.clear();
		this.__sites = new Array();
	},
	
	/**
	 * Invoked when a row is selected.
	 * 
	 * @param rowData The selected row data.
	 */
	selected: function(rowData)
	{
		this.__fnSiteSelected(rowData[0]);
	},
	
	/**
	 * Adds site data.
	 * 
	 * @param siteData The site data.
	 */
	addSite: function(siteData)
	{
		// Remove any trailing /.
		siteData.url = siteData.url.replace(/\/$/, '');
		
		// Replace %20 with space.
		siteData.url = siteData.url.replace(/%20/g, ' ');
		
		// Add to array.
		this.__sites[this.__sites.length] = siteData;
		
		// Update list UI.
		this.__listUI.reattachData(this.__sites);
	}
});