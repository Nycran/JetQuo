/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

var noteModal = function(heading, notes, saveMethod)
{
	this.heading = heading;			// The heading to assign to the h1 tag.
	this.notes = notes;				// The current value of the notes for this image.
	this.saveMethod = saveMethod;	// The callback method to invoke when the image is saved.
    this.showRecipients = false;
    this.includeOnReport = 0;
    this.includeOnReportSelector = "";
	
	var self = this;	// Store a reference to the object for use within window scope callbacks.
    
    this.setShowRecipients = function(showRecipients)
    {
        this.showRecipients = showRecipients;        
    }
    
    this.setIncludeOnReportSelector = function(includeOnReportSelector)
    {
        this.includeOnReportSelector = includeOnReportSelector;        
    }           

	/***
	* show
	* Shows the modal window with the image in the canvas and setups up events for drawing.
	*/
	this.show = function()
	{
		this.touchEvent = self.determineEventType();
		
		// Determine the dimensions of the control
		var height = self.getAvailableHeight();
		var width = self.getScreenWidth();
		
		var thisHeight = height;
		
		// If we're on a large screen, make the modal not quite as height as the screen.
		if(thisHeight > 500)
		{
			thisHeight = height - 30; 	
		}
		
		var textareaHeight = thisHeight - 100;
        
        if(this.includeOnReportSelector != "") {
            textareaHeight = textareaHeight - 60;  
        }
		
		width = width - 50;
		
        /*
		if(width > 974)
		{
			width = 974;
		}
        */		

		// Setup the control html
		var div = $('<div id="noteModal" style="height: ' + thisHeight + 'px; width: ' + width + 'px;" />');
			div.append('<h1 style="width: ' + width + 'px !important;">' + self.heading + '</h1>');
			
			var input = '<textarea id="txtNoteModal" style="width: ' + (width - 50) + 'px; height: ' + textareaHeight + 'px;" rows="5" cols="20">' + self.notes + '</textarea>';

			// Append left and right panels
			div.append(input);
            
            if(this.includeOnReportSelector != "") {
                var v = $(this.includeOnReportSelector).val();
                var incOnReport = '<div id="divIncludeOnReport" style="height: 60px;"></div><input type="hidden" name="includeonreport" id="includeonreport" value="' + v + '" />';
                div.append(incOnReport);
                
                setTimeout(function() {
                    var objToggleIOR = new toggleControl("toggleIncludeOnReport", "#noteModal #includeonreport", "binary", "On Report", function()
                    {
                        $(self.includeOnReportSelector).val(objToggleIOR.getValue());
                    });

                    objToggleIOR.render("#divIncludeOnReport");   
                }, 300);                               
            }
			
			div.append('<div style="clear:both;"></div>');
			
			var form = $('<form id="frmNMControls" name="frmNMControls" action="#" method="post">');
				form.append('<a id="btnNMSave" name="btnNMSave">Save</a>');
				form.append('<a id="btnNMClear" name="btnNMClear">Clear</a>');
				form.append('<a id="btnNMCancel" name="btnNMCancel">Cancel</a>');
				
			div.append(form);
		
		// Append the control to the document body
		$("body").append(div);		
		
		setTimeout(function()
		{
			self.bindEvents();	
		}, 250);
	}   
	
	this.setReadOnly = function()
	{
		$("#noteModal #frmNMControls #btnNMClear").hide();
		$("#noteModal #frmNMControls #btnNMSave").hide();
	}
	
	this.bindEvents = function()
	{
		// Bind events to cancel button	
		$("#noteModal #frmNMControls #btnNMCancel").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.close();		
		});
		
		
		$("#noteModal #frmNMControls #btnNMClear").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
			
			$("#noteModal #txtNoteModal").val("");				
		});
		
		$("#noteModal #frmNMControls #btnNMSave").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
  			
			self.saveMethod(self.getValue());
			self.close();
		});		
		
		// make sure we scroll back down after the user has finished typing.
		$("#noteModal #txtNoteModal").bind("blur", function()
		{
			self.scrollTop();
		});		

		
					
	}
	
	this.getValue = function()
	{
		var value = $("#noteModal #txtNoteModal").val();
		return value;
	}
	
	/***
	* The close method removes the popSelector from the screen entirely and
	* also frees the memory used to store the option values.
	*/
	this.close = function()
	{
		// Remove all bindings to options.
		$("#noteModal #frmNMControls a").unbind();
		$('#txtNoteModal').unbind();		

		// Remove the pop selector from the screen
		$("#noteModal").remove();
		
		if(self.closeMethod != null)
		{
			self.closeMethod();
		}
	}
	
	/***
	* getAvailableHeight
	* Gets the available screen height, taking into account toolbars.
	*/
	this.getAvailableHeight = function() 
	{
		var window_height = 0;

		if (typeof (window.innerHeight) == "number")
			window_height = window.innerHeight;
		else 
		{
			if (document.documentElement && document.documentElement.clientHeight)
				window_height = document.documentElement.clientHeight;
			else 
			{
				if (document.body && document.body.clientHeight) 
					window_height = document.body.clientHeight;
			}
		}
		
		return window_height;
	}
	
	/***
	* getScreenWidth
	* Returns the available screen width
	*/
	this.getScreenWidth = function()
	{
   		return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
	}
	
	/***
	* determineEventType - Determines if touch events are supported by the browser
	* and based on that, returns the relevant event name to bind to for click/touch events.
	*/	
	this.determineEventType = function()
	{
		if ('ontouchstart' in document.documentElement)
			return "touchstart";
		else
			return "click";
	}
	
	/****
	* isMobileDevice
	* Determine whether the current browser support mobile touch events or not.
	*/
	this.isMobileDevice	= function()
	{
		if ('ontouchstart' in document.documentElement)
			return true;
		else
			return false;
	}		
	
	this.scrollTop = function()
	{
		if(self.isMobileDevice())
		{      
			window.scrollTo(0, 1);
		}		
	}			
};