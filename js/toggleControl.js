/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

var toggleControl = function(id, valueSelector, type, caption, touchMethod)
{
	this.id = id;							// The control id - must be unique
	this.valueSelector = valueSelector; 	// The jquery selector to use when reading/writing the form value.  Usually a hidden form field.
	this.type = type;						// The selector type: binary (1/0) or text - controls how the selectors knows what state it is in.
	this.caption = caption;					// The selector button caption
	this.touchmethod = touchMethod;			// The callback method to invoke when the selector state is changed.
	this.preventToggle = false;				// Set to true to prevent the toggle from working
	
	var self = this;	// Store a reference to the object for use within window scope callbacks.

	/***
	* render
	* Renders the toggle in the
	*/
	this.render = function(selector)
	{
		// Create the control HTML
    	var html = '<div id="' + self.id + '" class="toggleControl';
    	
    	if(self.isActive())
    	{
    		// This toggle control is in active state
			html += ' toggleActive';
    	}
    	
    	html += '">';
    	
    	html += self.caption + '</div>';
    	
    	// Append the control into the defined selector
    	$(selector).append(html);
    	
    	// Bind the click / touch event
    	self.bindEvents();
	}
	
	this.getValue = function()
	{
		var value = $(self.valueSelector).val();
		return value;
	}
	
	this.bindEvents = function()
	{
    	var touchEvent = self.determineEventType();
    	
    	$("#" + self.id).bind(touchEvent, function(e)
    	{
			e.preventDefault();
			
			if(self.preventToggle)
			{
				alert("Sorry, you are not allowed to perform this action");
				return;
			}
			
			// Get the current selector value
			if(self.isActive())
			{				
				// Handle binary control logic
				if(self.type == "binary")
				{
					$(self.valueSelector).val(0);
					
					// The toggle control is currently active.  Switch it to inactive
					$("#" + self.id).removeClass("toggleActive");					
				}
			}
			else
			{	
				// The control is not currently active.
				
				// Handle binary control logic
				if(self.type == "binary")
				{
					$(self.valueSelector).val(1);
					
					// The toggle control is NOT currently active.  Switch it to active
					if(!$("#" + self.id).hasClass("toggleActive"))
					{
						$("#" + self.id).addClass("toggleActive");
					}										
				}
			}

			if(self.touchmethod != null)
			{
				self.touchmethod();
			}
    	});
	}
	
	/***
	* isActive
	* Returns true if the toggle control should be in an active state due to the underlying form value.
	*/
	this.isActive = function()
	{
		var value = $(self.valueSelector).val();
		
    	if(((self.type == "binary") && (value == 1)) || ((self.type == "text") && (value != "")))
    	{
    		// This toggle control is in active state
			return true;
    	}
    	
    	return false;		
	}
	
	this.setValue = function(text)
	{
		// This method is only valid on text toggles
		if(self.type != "text")
		{
			return;
		}
		
		// Update the form with the new value
		$(self.valueSelector).val(text);	
		
		if(text == "")
		{
			// There text control is empty and therefore the toggle shoule be INACTIVE.
			$("#" + self.id).removeClass("toggleActive"); 	
		}
		else
		{
			// The text control is not empty and the toggle should therefore be active.
			if(!$("#" + self.id).hasClass("toggleActive"))
			{
				$("#" + self.id).addClass("toggleActive");
			}		
		
		}
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
};