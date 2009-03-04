/**
 * A selectable list that can invoke functions on double or right click.
 * If there is to be a context menu then double click and multi-select is allowed; otherwise single click acts like a double click.
 */
var SelectableTableUI = Base.extend(
{
	/**
	 * The data table.
	 */
	__dataTable: null,
	
	/**
	 * The element ID of the HTML element to contain the list.
	 */
	__containerId: null,
	
	/**
	 * The column definitions (see DataTable YUI).
	 */
	__columns: null,
	
	/**
	 * The data schema.
	 */
	__schema: null,
	
	/**
	 * The method to call on selection.
	 */
	__fnSelect: null,
	
	/**
	 * The right-click context menu text to activate the select function.
	 */
	__contextMenuTxt: null,
	
	/**
	 * Constructor.
	 *
	 * @param containerId The element ID of the HTML element to contain the list.
	 * @param columns The column definitions (see DataTable YUI).
	 * @param schema The schema.
	 * @param fnSelect The method to call on selection.
	 * @param contextMenuTxt The right-click context menu text to activate the select function.
	 */
	constructor: function(containerId, columns, schema, fnSelect, contextMenuTxt)
	{
		// Assign properties.
		this.__containerId = containerId;
		this.__columns = columns;
		this.__schema = schema;
		this.__fnSelect = fnSelect;
		this.__contextMenuTxt = contextMenuTxt;
	},
	
	/**
	 * Creates a new table, erasing the existing data.
	 * 
	 * @param data The data.
	 */
	reattachData: function(data)
	{
		// Destroy existing table.
		if (this.__dataTable)
		{
			this.__dataTable.destroy();
			this.__dataTable = null;
		}
		
		// Setup data source.
		var dataSource = new YAHOO.util.LocalDataSource(data);
    	dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSARRAY;
		dataSource.responseSchema = this.__schema;
		
		// Create new table.
		this.__dataTable = new SelectableDataTable(this.__containerId, this.__columns,
					dataSource, this.__fnSelect, this.__contextMenuTxt);
	},
	
	/**
	 * Clears the table.
	 */
	clear: function()
	{
		// Destroy existing table.
		if (this.__dataTable)
		{
			this.__dataTable.destroy();
			this.__dataTable = null;
		}
	}
});


/**
 * A selectable table that can invoke functions on double or right click.
 * If there is to be a context menu then double click and multi-select is allowed; otherwise single click acts like a double click.
 *
 * @param containerId The element ID of the HTML element to contain the list.
 * @param columns The column definitions (see DataTable YUI).
 * @param dataSource The data source.
 * @param fnSelect The method to call on selection.
 * @param contextMenuTxt The right-click context menu text to activate the select function.
 */
SelectableDataTable = function(containerId, columns, dataSource, fnSelect, contextMenuTxt)
{
	SelectableDataTable.superclass.constructor.call(this, containerId, columns, dataSource, {renderLoopSize: 100});
	this.setup(containerId, fnSelect, contextMenuTxt);
};

YAHOO.extend(SelectableDataTable, YAHOO.widget.DataTable,
{
	/**
	 * The container ID.
	 */
	__containerId: null,
	
	/**
	 * The method to call on selection.
	 */
	__fnSelect: null,
	
	/**
	 * The right-click context menu text to activate the select function.
	 */
	__contextMenuTxt: null,
	
	/**
	 * The context menu object.
	 */
	__contextMenu: null,
	
	/**
     * Setup the selectable table.
     *
     * @param containerId The element ID of the HTML element to contain the list.
	 * @param fnSelect The method to call on selection.
	 * @param contextMenuTxt The right-click context menu text to activate the select function.
     */
    setup: function(containerId, fnSelect, contextMenuTxt)
    {
    	// Assign properties.
    	this.__containerId = containerId;
    	this.__fnSelect = fnSelect;
    	this.__contextMenuTxt = contextMenuTxt;
    	
    	// Setup events based on context menu functionality.
    	if (contextMenuTxt)
    	{
    		// Single click just highlights row.
    		this.subscribe("rowClickEvent", this.__singleClick);
    		this.subscribe("rowDblclickEvent", this.__dblClick);
    	}
    	else
    	{
    		// Single click acts selects row if there is no context menu.
    		this.subscribe("rowClickEvent", this.__singleClickAndSelect);
    		// Disable multi-select if there is no context menu.
    		this.set("selectionMode","singlecell");
    	}
    },
    
    /**
     * Destroys the selectable data table.
     */
    destroy: function()
    {
    	// Destroy context menu.
    	if (this.__contextMenu)
    	{
    		this.__contextMenu.destroy();
    		this.__contextMenu = null;
    	}

    	// Invoke super method.
    	YAHOO.widget.DataTable.prototype.destroy.apply(this);
    },
    
    /**
     * Row selected.
     * 
     * @param event The event.
     * @param target The target.
     */
    __singleClick: function(event, target)
    {
    	// Invoke event select row method on parent object.
    	this.onEventSelectRow(event, target);
    	
    	// Create a context menu object (now that a row has been selected), if required.
    	if (this.__contextMenuTxt && !this.__contextMenu)
    	{
    		var dataTable = this;
    		this.__contextMenu = new YAHOO.widget.ContextMenu(this.__containerId + "_context",
                {trigger:dataTable.getTbodyEl()});
        	this.__contextMenu.addItem(this.__contextMenuTxt);
        	this.__contextMenu.render(this.__containerId);
        	this.__contextMenu.clickEvent.subscribe(this.__contextClick, this);
    	}
    },
    
    /**
     * Row selected.
     * 
     * @param event The event.
     * @param target The target.
     */
    __singleClickAndSelect: function(event, target)
    {
    	// Invoke event select row method on parent object.
    	this.onEventSelectRow(event, target);
    	
    	this.__rowsSelected(this.getSelectedRows());
    },
    
    /**
     * Double click event.
     * 
     * @param event The event object.
     * @param target The TD element.
     */
    __dblClick: function(event, target)
    {
    	this.__rowsSelected(this.getSelectedRows());
    },
    
    /**
     * Right-click context selection.
     */
    __contextClick: function(type, args, dataTable)
    {
    	dataTable.__rowsSelected(dataTable.getSelectedRows());
    },
    
    /**
     * Rows have been selected.
     * 
     * @selectedRowIds The selected row IDs.
     */
    __rowsSelected: function(selectedRowIds)
    {
    	var record;
    	var data = new Array();
    	for (var rowId in selectedRowIds)
    	{
    		record = this.getRecord(selectedRowIds[rowId]);
    		data[data.length] = record.getData();
    	}
    	this.__fnSelect(data);
    }
});