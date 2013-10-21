/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/                     

var popselector = function(selector, heading)
{
	this.selector = selector; 	// Assign the target selector so we can save results there later.
	this.heading = heading;		// The heading to assign to the h1 tag.
	this.options = new Array();	// An array to hold the selectable options.
	this.page = 0;				// The current page number of the selectable options.
	this.num_results = 0;		// The number of results / selectable options showing after search.
	this.callbackMethod = null;
	this.addNewMethod = null;
	this.showViewAll = false;
	this.largeScreenMode = true;
	this.readOnly = false;		// Set to true to prevent the pop selector value from being changed.
	this.deleteCallback = null;	// Set to a javascript method to enable the deletion of poplist items.
    this.scroller = false;
    this.doDeleteID = 0;
	
	var self = this;	// Store a reference to the object for use within window scope callbacks.
	
	// Show the first element
	$(this.selector).find("li:eq(0)").css("display", "block");
	
	// Bind the click event on the selector
	$(this.selector).bind(objApp.touchEvent, function(e)
	{
		e.preventDefault();

		if($("#popSelector").length > 0)
		{
			return;
		}
		
		// If this pop selector is in read only mode, prevent any changes.
		if(self.readOnly)
		{
			alert("Sorry, you may not change this value.");
			return;
		}
		
		// Determine the dimensions of the selector
		var height = self.getAvailableHeight();
		var width = self.getScreenWidth();
		
		var thisHeight = height;
		
		// If we're on a large screen, make the modal not quite as height as the screen.
		if(thisHeight > 500)
		{
			thisHeight = height - 60; 	
		}
		
		var optionsHeight = thisHeight - 140;
		
		// If the width is greater than 500px, make the width only 500 anyway.
		if(width > 500)
		{
			width = 500;
		}
		
		// Hide the main screen.
		if(!self.largeScreenMode)
		{
			$("#main").css("visibility", "hidden");
			$("#flags").css("visibility", "hidden");	
		}

		// Setup the control html
		var div = $('<div id="popSelector" style="height: ' + thisHeight + 'px; width: ' + width + 'px;" />');
		div.append('<h1 style="width: ' + width + 'px !important;">' + self.heading + '</h1>');
		div.append('<form id="frmPopSearch" name="frmPopSearch">');
		
		if(self.largeScreenMode)
		{
			div.append('<input type="text" id="popSelectorSearch" value="" style="width: 200px !important;" />');	
		}
		else
		{
			div.append('<input type="text" id="popSelectorSearch" value="" />');
		}
		
		div.append('<input type="button" id="btnPopSelectorSearch" value="Search" />');
		
		if(self.addNewMethod != null)
			div.append('<input type="button" id="btnPopSelectorAdd" value="Add New" />');
			
		div.append('</form>');
		div.append('<div id="popSelectorOptionsWrapper" style="height: ' + optionsHeight + 'px"><div id="popSelectorOptions" width: ' + width + 'px" ><p>Loading...</p></div></div>');
		div.append('<div id="popSelectorControls">' +
			'<a id="btnPopSelectorCancel" class="button" href="javascript:void(0);">Done</a>' +
			'<a id="btnPopSelectorUp" class="button" href="javascript:void(0);">UP</a>' + 
			'<a id="btnPopSelectorDown" class="button" href="javascript:void(0);">Down</a>' +
		'</div>');
        
        var az = "<ul id='popAZ'>";
        
        for(c = 97; c <= 122; c++)
        {
            var thisChar = String.fromCharCode(c);
            az += '<li><a code="' + thisChar + '" href="javascript:void(0);">' + thisChar + '</a></li>';    
        }
        
        az += '</ul>';
        
        div.append(az);
		
		// Append the control to the document body
		$("body").append(div);
		
		self.selectorShowing = true;
		
		// Load the options from the original control into the array
		self.loadOptions();
		
		// Call the search method to fill the results.
		self.search();
		
		// Bind events to cancel button
		$("#popSelector #popSelectorControls #btnPopSelectorCancel").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();

			self.close();		
		});	
		
		$("#popSelectorSearch").bind("keyup", function()
		{
			self.search();
		});	
		
		
		/***
		* Handle the event when the user clicks on the search button.
		*/
		$("#popSelector #btnPopSelectorSearch").bind(objApp.touchEvent, function()
		{
			self.search();
		});
		
		// If an add new item method has been defined, bind the click event to the add button.
		if(self.addNewMethod != null)
		{
			$("#popSelector #btnPopSelectorAdd").bind(objApp.touchEvent, function()
			{
				self.addNewMethod();
			});
		}
        
        $("#popAZ li a").bind(objApp.touchEvent, function(e)
        {
            e.preventDefault();
            
            var selectedChar = $(this).attr("code");
            var selectedAscii = selectedChar.charCodeAt(0);
            
            var maxLoop = self.options.length - 1;
            var counter = 0;
            var foundIndex = -1;
            
            while((counter < maxLoop) && (foundIndex < 0))
            {
                var option = self.options[counter][1].toLowerCase();
                if(option != "")
                {
                    var firstChar = option.substring(0, 1);
                    var firstCharCode = firstChar.charCodeAt(0);

                    if(firstCharCode >= selectedAscii)
                    {
                        foundIndex = counter;    
                    }
                }
                
                counter++; 
            }
            
            var scrollTop = 0;
            
            if(foundIndex > 0)
            {
                scrollTop = 52 * foundIndex;
            }
            
            if(objUtils.isMobileDevice())
            {
                self.scroller.scrollTo(0, (scrollTop * -1), 200);  
            }
            else
            {
                $("#popSelectorOptionsWrapper").scrollTop(scrollTop);
            }
        });
	});
	
	/***
	* loadOptions reads all the possible options from the source selector and stores the ids and values in
	* an array.
	*/
	this.loadOptions = function()
	{
		var counter = 0;
		self.options = new Array();
		
		$(this.selector).find("li").each(function() 
		{
			if(counter > 0)
			{
				var val = $(this).attr("title");
				var text = $(this).text();
				
				self.options.push(new Array(val, text));
			}
			
			counter++;
		});			
	}
	
	/***
	* Adds a new option to the options array
	*/
	this.addOption = function(val, text)
	{
		self.options.push(new Array(val, text));	
		
		// Add the category name into the pop selector ul
		$(self.selector).append('<li title="' + val + '">' + text + '</li>');		
	}
    
    /****
    * Sort the list options and then refresh the list with the sorted values.
    */
    this.sortAndRefresh = function()
    {
        this.options.sort(function(a, b)
        {
            // Determine if the values we're sorting are numbers are not
            var valAIsNotNum = isNaN(a[1]);
            var valBIsNotNum = isNaN(b[1]);
            
            if(valAIsNotNum && valBIsNotNum)
            {
                // Both values are NOT numbers.  
                // Sort as strings 
                var valA = a[1].toLowerCase();
                var valB = b[1].toLowerCase();
                
                if (valA < valB) //sort string ascending
                {
                    return -1;
                }
                else if (valA > valB)
                {
                    return 1;
                }
                else
                {
                    return 0 //default return value (no sorting)    
                }
            }
            else if(valAIsNotNum)
            {
                // Value B is a number, but value A is not.
                // Put strings at the top
                return -1;    
            }
            else if(valBIsNotNum)
            {
                // Value A is a number, but value B is not.
                // Put strings at the top                
                return 1;    
            }
            else
            {
                // Both values are numbers.
                return a[1] - b[1];    
            }            
        });
        
        this.removePopOptions(0, "", "");
        
        // Repopulate the options based
        if(this.options.length <= 1) return;
        
        for(var x in this.options)
        {
            $(self.selector).append('<li title="' + this.options[x][0] + '">' + this.options[x][1] + '</li>');
        }
    }
    
	
	/***
	* This method removes an option from the poplist, as specified by the id val.
	*/
	this.removeOption = function(val)
	{
		var index = 0;
		var found = false;
		var max_loop = self.options.length;
		
		while((index < max_loop) && (!found))
		{
			if(self.options[index][0] == val)
			{
				found = true;
			}
			else
			{
				index++;
			}
		}
		
		if(found)
		{
			// Remove the option from the internal array
			self.options.splice(index, 1);
			
			// Remove the option from the list.
			$(self.selector).find('li[title="' + val + '"]').remove();
			
			// Reload the poplist
			self.search();
		}
	}
	
	/***
	* The search function is invoked when the user taps the search button.
	* It shows all the options that match the search term.
	*/
	this.search = function()
	{
  		var html = "";
		var counter = 0;
		var num_showing = 0;
		
		// Clear the search results
		$("#popSelector #popSelectorOptions").html("");
		$("#popSelector #popSelectorOptions").scrollTop(0);
		var search_text = $("#popSelector #popSelectorSearch").val().toLowerCase(); 
		
		if(self.showViewAll)
		{
			html += '<p id="all"><span>View All</span></p>';
		}
			              
		for(counter = 0; counter < self.options.length; counter++)
		{
			var match = true;
			
			var val = self.options[counter][0];
			var text = self.options[counter][1];
			
			if((search_text != "") && (text.toLowerCase().indexOf(search_text) == -1))
				match = false;
			
			if(match)
			{
				html += '<p id="' + val + '" ';
                if(self.deleteCallback != null) html += 'class="deleteEnabled"';
                html += '><span>' + text + '</span>';
				
				if(self.deleteCallback != null)
				{
					html += '<a class="popDelete"></a>';
                    html += '<a class="button popDoDelete">Delete</a>';
				}
				
				html += '</p>';
				num_showing++;
			}
		}
		
		if(self.options.length == 0)
			html += '<p id="">There are currently no items in this list.</p>';
		else if(num_showing == 0)
			html += '<p id="">No items matched your search criteria</p>'; 
		
		$("#popSelector #popSelectorOptions").html(html);
		self.showButtons();
		
		if(objUtils.isMobileDevice())	    
	    {
	    	//$("#popSelector #popSelectorOptions").addClass("webkitBox");
	    	self.scroller = new iScroll('popSelectorOptionsWrapper', { hScrollbar: false, vScrollbar: true});
            //var scroller = new TouchScroll(document.querySelector("#popSelector #popSelectorOptions"));
		}		
		
		/***
		* Handle the event when the user clicks on an option.
		*/		
		$("#popSelector #popSelectorOptions p").bind("click", function(e) 
		{
			e.preventDefault();
			
			// Get the id of the selected value
			var id = $(this).attr("id");
			var text = $(this).find("span").text();
			
			if(id == "")
				return;
			
			// Add the active selected to it
			$(this).addClass("selected");
			
			// Set the value of the source selector
			var first_element = $(self.selector + " li:eq(0)");
			
			if(first_element != null)
			{
				$(first_element).attr("title", id);
				$(first_element).text(text);
                $(first_element).css("display", "block");
			}

			setTimeout(function()
			{
				self.close();
					
			}, 100);
			
			return false;
		});
		
		$("#popSelector #popSelectorOptions p a.popDelete").bind("click", function(e)
		{
			e.preventDefault();
			e.stopPropagation();
            
            // Unbind and hide events on all Do Delete buttons.
            $("#popSelector #popSelectorOptions p a.popDoDelete").unbind();
            $("#popSelector #popSelectorOptions p a.popDoDelete").hide();    
            
            var this_id = $(this).parent().attr("id"); 
            
            if(this_id == self.doDeleteID) {
                self.doDeleteID = 0;
                return;    
            }
            
            self.doDeleteID = this_id;
            
            // Show the relevant delete button
            var btnDoDelete = $(this).parent().find("a.popDoDelete");
            $(btnDoDelete).show();
            
            $(btnDoDelete).bind("click", function(e)
            {
                e.preventDefault();
                e.stopPropagation();
                
                // Get the ID of the related item
                var id = $(this).parent().attr("id");
                self.deleteCallback(id);                                 
            });
		})
		
	};
	
	this.selectElementAndClose = function(id, text)
	{
		// Set the value of the source selector
		var first_element = $(self.selector + " li:eq(0)");
		
		if(first_element != null)
		{
			$(first_element).attr("title", id);
			$(first_element).text(text);
			
			self.close();
		}		
	}
	
	/***
	* Show buttons shows the up/down buttons as required.
	*/
	this.showButtons = function()
	{
		// Always show the cancel button
		$("#popSelector #btnPopSelectorCancel").css("visibility", "visible");
		 		
 		// By default hide the up/down buttons
		$("#popSelector #btnPopSelectorUp").css("visibility", "hidden");
		$("#popSelector #btnPopSelectorDown").css("visibility", "hidden");

        // If we're not on the first page, show the up button
        if(self.page > 1)
        {
			$("#popSelector #btnPopSelectorUp").css("visibility", "visible");
        }
        
        // Figure out if we need to show the down button
        
        if((self.num_pages > 1) && (self.page < self.num_pages))
        {
			$("#popSelector #btnPopSelectorDown").css("visibility", "visible");	
        }
	};
	
	/***
	* preselect sets the value and text of the first option in the source selector
	* if a matching value can be found.
	*/
	this.preselect = function(value)
	{
		// See if we can find a value in the selector control that matches the passed value
		var node = $(this.selector + ' li[title="' + value + '"]:first');

		if($(node).is("li"))
		{
			// We've found a matching node.
			// Get the text value of it.
			var text = node.text();
			
			// Set the id and text of first option in the source selector so it's preselected.
			$(this.selector + ' li:eq(0)').attr("title", value);
			$(this.selector + ' li:eq(0)').text(text);
		}
	}
	
	/***
	* preselectByText sets the value and text of the first option in the source selector
	* if a matching text value can be found.
	*/
	this.preselectByText = function(text)
	{
		// See if we can find a value in the selector control that matches the passed value
		var foundNode = null;
		
		$(this.selector + ' li').each(function()
		{
			if($(this).text() == text)
			{
				foundNode = $(this);	
			}
		});
		
		if(foundNode == null)
			return;

		// Set the id and text of first option in the source selector so it's preselected.
		$(this.selector + ' li:eq(0)').attr("title", $(foundNode).attr("title"));
		$(this.selector + ' li:eq(0)').text(text);
	}	
	
	/***
	* The close method removes the popSelector from the screen entirely and
	* also frees the memory used to store the option values.
	*/
	this.close = function()
	{
		// Remove all bindings to options.
		$("#popSelector #popSelectorOptions p").unbind();
		$("#popSelector").unbind();

		// Remove the pop selector from the screen
		$("#popSelector").remove();

		// Hide the main screen.
		$("#main").css("visibility", "visible");
		$("#flags").css("visibility", "visible");			
        
		// Clear the array
		self.options = new Array();

		if(self.callbackMethod != null)
		{
			self.callbackMethod();
		}
	}
	
	/***
	* getValue returns the value/ID for the selected item in this poplist.
	*/
	this.getValue = function()
	{
		return $(this.selector + " li:eq(0)").attr("title"); 
	}
	
	/***
	* getText returns the visible text for the selected item in this poplist.
	*/
	this.getText = function()
	{
		return $(this.selector + " li:eq(0)").text(); 
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
	
	this.getScreenWidth = function()
	{
   		return window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
	}
	
	/***
	* removePopOptions loops through the options in the 
	* specified popSelector and removes all options equal to and above the offset.
	*/
	this.removePopOptions = function(offset, defaultValue, defaultCaption)
	{     
		// Find out how many li's there are
		var maxLoop = $(this.selector + " li").length;
		
		// Clone the first item
		var firstItem = $(this.selector + " li:eq(0)").clone();
		
		// Loop through from the end until the offset, removing all li's as we go
		/*
		for(i = maxLoop; i >= offset; i = i -1)
		{
			$(selector + " li:eq(" + i + ")").remove();
		}
		*/

		$(this.selector + " li").remove();
		
		// Append the first item back in
		$(this.selector).append(firstItem);
		
		// Preselect the first option'
		// Set the id and text of first option in the source selector so it's preselected.
		$(this.selector + ' li:eq(0)').attr("title", defaultValue);
		$(this.selector + ' li:eq(0)').text(defaultCaption);	
	}	
	
	this.clear = function(defaultValue, defaultCaption)
	{
		$(self.selector + ' li:eq(0)').attr("title", defaultValue);
		$(self.selector + ' li:eq(0)').text(defaultCaption);		
	}
};