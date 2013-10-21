/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/
function Datepicker() 
{
	var self = this;	// Create a reference to the object itself
	
	// Define months of the year
	this.months = new Array("January", "February", "March", "April", "May", "June", 
		"July", "August", "September", "October", "November", "December");	
	
	// Define variables to hold currently showing year and month pointers.
	this.year = 2011;
	this.month = 0;
	
	// Define field to hold return field
	this.returnField = null;
	this.callbackMethod = null;
	
	this.selectedDate = new Date();
	
	/***
	* Shows the initial welcome screen that allows the user to
	* choose between going to the setup wizard or doing a sync.
	*/
	this.show = function(returnField)
	{	
		this.returnField = returnField;
		
		// Show the date picker
		$("#datepicker").removeClass("hidden");
		
		// Remove event bindings
		//$("#datepicker input").unbind();
		
		var objDate = new Date();
		
		if((this.year == 0) || (isNaN(this.year)))
		{
			this.year = objDate.getFullYear();
			this.month = objDate.getMonth();
		}

		this.setMonthYear(); 
		
		// Handle the event when the user clicks on the year/month back button
		$("#datepickerBack").bind("click", function()
		{                     
			var obj = objDatePicker;  
			obj.month = obj.month - 1;
			
			if(obj.month < 0)
			{
				obj.year = obj.year - 1;
				obj.month = 11;
			}
			
			obj.setMonthYear();  
		});
		
		// Handle the event when the user clicks on the year/month next button
		$("#datepickerNext").bind("click", function()
		{                     
			var obj = objDatePicker;  
			obj.month = obj.month + 1;
			
			if(obj.month > 11)
			{
				obj.year = obj.year + 1;
				obj.month = 0;
			}
			
			obj.setMonthYear();  
		});
		
		// Handle the event when the user clicks on the cancel button
		$("#datepickerCancel").bind("click", function()
		{
			$("#datepicker a").unbind();
			$("#datepicker input").unbind();
			$("#datepicker").unbind();			
			
			// Show the main screen.
			$("#main").css("visibility", "visible");												
			
			$("#datepicker").addClass("hidden");
			
		});
		
		// Handle the event when the user clicks on the done button
		$("#datepickerSelect").bind("click", function()
		{
			$(objDatePicker.returnField).val(objApp.formatUserDate(objDatePicker.selectedDate));
			
			if(objDatePicker.callbackMethod != null)
			{
				objDatePicker.callbackMethod();
				objDatePicker.callbackMethod = null;	
			}
			
			$("#datepickerCancel").click();
		});	
		
		$("#datepicker").bind("click", function(e)
		{
			e.preventDefault();
		});			
						
	};
	
	this.setMonthYear = function()
	{
		// Set the calendar year/month heading
		var s = this.months[this.month] + ", " + this.year;
		$("#datepickerMonthYear span").text(s);
		
		// Remove any previous event bindings
		$("#datepicker table tr td a").unbind();
		
		// Setup calendar day grid
		this.setDays();
		
		// Bind events
		$("#datepicker table tr td a").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			// Ignore disabled cells
			var classes = $(this).attr("class");
			if(classes == "disabled")
				return;
				
			var me = objDatePicker;
			
			// Remove any selected cell states
			$("#datepicker table tr td a").removeClass("selected");			
			
			// Get the selected day number
			var dayNo = $(this).text() * 1;
			
			// Set the selected date object to the correct year, month and day
			me.selectedDate.setFullYear(me.year);
			me.selectedDate.setMonth(me.month);
			me.selectedDate.setDate(dayNo);
			
			// Set the relevant cell to be selected
			$("#datepicker  #A" + dayNo).addClass("selected");
		});
	}
	
	this.setDays = function()
	{	
		// Remove selected states
		$("#datepicker table tr td a").removeClass("selected");
		
		// Determine the starting day for this month
		var startingDay = 0;
		
		var objDate = new Date();
	
		objDate.setFullYear(this.year);
		objDate.setMonth(this.month);
		objDate.setDate(1);
		
		startingDay = objDate.getDay();
		
		// Convert sundays to mondays
		if(startingDay == 0)
			startingDay = 6;
		else
		{
			// And adjust all other days back one.
			// Monday should equal day 0
			startingDay = startingDay - 1;
		}

		// Get the number of days in this month.		
		var daysInMonth = this.daysInMonth(this.year, this.month);

		// Get the number of days in the previous month
		objDate.setMonth(this.month - 1);
		var daysInPreviousMonth = this.daysInMonth(objDate.getFullYear(), objDate.getMonth());
		
		// Figure out how many days need to be shown in a 
		// disabled state from the previous month in the first row.
		var numDisabledDays = startingDay - 1;
		
		// Get a preference to the first day row in the table
		var row1 = $("#datepicker table tbody tr:eq(0)");
		
		// Loop through the first row, starting from the LAST
		// date to show from the previous month and loop backwards
		var dayNo = daysInPreviousMonth;
		var startDay = daysInPreviousMonth - numDisabledDays;
		
		for(day = 0; day <= numDisabledDays; day++)
		{
			var cell = $(row1).find("td:eq(" + day + ") a");
        	$(cell).text(startDay);
        	$(cell).addClass("disabled");
        	$(cell).attr("id", "D" + startDay);
        	startDay = startDay + 1;
		}
		
		// Now loop forwards through the rest of the first row, starting at day 1
		var dayNo = 1;
		
		// Reinitialise the date object
		objDate.setFullYear(this.year);
		objDate.setMonth(this.month);		
		
		for(day = startingDay; day <= 6; day++)
		{
			var cell = $(row1).find("td:eq(" + day + ") a");
        	$(cell).text(dayNo);
        	$(cell).removeClass("disabled");
        	$(cell).attr("id", "A" + dayNo);
        	
        	// See if the date we're rendering IS the selected date
        	objDate.setDate(dayNo);
        	
        	if(objDate.getFullYear() == this.selectedDate.getFullYear())
        	{
				if(objDate.getMonth() == this.selectedDate.getMonth())
				{
					if(objDate.getDate() == this.selectedDate.getDate())
						$(cell).addClass("selected");
				}
        	}
        				
        	dayNo++;
		}
		
		
		// Loop through all remaining rows
		var rowNo = 1;
		var nextMonthDay = 1;
		
		for(rowNo = 1; rowNo <= 5; rowNo++)
		{
			// Get a reference to this row
			var row = $("#datepicker table tbody tr:eq(" + rowNo + ")");
			
			// Loop through all cells
			for(c = 0; c <= 6; c++)
			{
				// Get a reference to this cell
				var cell = $(row).find("td:eq(" + c + ") a"); 
				
				if(dayNo <= daysInMonth)
				{
        			$(cell).text(dayNo);
        			$(cell).removeClass("disabled");
        			$(cell).attr("id", "A" + dayNo);
        			
        			// See if the date we're rendering IS the selected date
        			objDate.setDate(dayNo);
        			
        			if(objDate.getFullYear() == this.selectedDate.getFullYear())
        			{
						if(objDate.getMonth() == this.selectedDate.getMonth())
						{
							if(objDate.getDate() == this.selectedDate.getDate())
							{
								$(cell).addClass("selected");
							}
						}
        			}        			
        								
				}
				else
				{
					// We're now into the next month.
					// Add the days starting from 1 again and disable them.
        			$(cell).text(nextMonthDay);
        			$(cell).addClass("disabled");
        			$(cell).attr("id", "D" + nextMonthDay);						
					nextMonthDay++;
				}
				
				dayNo++;				
			}
		}
	}
	
	this.daysInMonth = function(year, month) 
	{
	     return 32 - new Date(year, month, 32).getDate();
	}	
}
