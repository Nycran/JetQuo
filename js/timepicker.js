/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/
function Timepicker() 
{
	var self = this;	// Create a reference to the object itself
	
	this.hour = 9;
	this.minute = 30;
	this.meridian = "PM";
	
	// Define field to hold return field
	this.returnField = null;
	this.callbackMethod = null;
	
	/***
	* Shows the initial welcome screen that allows the user to
	* choose between going to the setup wizard or doing a sync.
	*/
	this.show = function(returnField)
	{
		// Set the return field
		this.returnField = returnField;
		
		objApp.scrollTop();
		
		// Hide the main screen to prevent events firing.
		//$("#main").css("visibility", "hidden");		
		
		// Show the timepicker modal
		$("#timepicker").removeClass("hidden");
		
		// Remove any currently selected states selected state
		$("#timepicker a").removeClass("selected");
		
		var objDate = new Date();
		
		if(this.hour == 0)
		{
			this.hour = objDate.getHours();
			
			if(this.hour == 0)
			{
				this.meridian = "AM";
				this.hour = 12;
			}
			else if(this.hour < 12)
			{
				this.meridian = "AM";
			}
			else if(this.hour == 12)
			{
				this.meridian = "PM";
			}						
			else
			{
				this.meridian = "PM";
				this.hour = this.hour - 12;
			}
			
			this.minute = objDate.getMinutes();
		}
	
		// Make sure the minute value is a modulo of 5.
		// If not, round up or down accordingly.
		var diff = this.minute % 5; 
		
		if(diff != 0)
		{
			if(diff > 2)
			{
				this.minute = this.minute + (5 - diff);
				
				if(this.minute == 60)
				{
					this.minute = 0;
					this.hour = this.hour + 1;
					
					if(this.hour > 12)
						this.hour = this.hour - 12;
					else if(this.hour == 12)
					{
						// Flip the meridian
						if(this.meridian == "AM")
							this.meridian = "PM";
						else
							this.meridian = "AM";
					}
				}
			}
			else
				this.minute = this.minute - diff;
		}
		
		// Preselect the appropriate values
		$("#timepickerHours li:eq(" + (this.hour - 1) + ") a").addClass("selected");	
		
		var idx = 0;
		if(this.minute >= 5)
			idx = this.minute / 5;
			
		$("#timepickerMinutes li:eq(" + (idx) + ") a").addClass("selected");
		
		if(this.meridian == "AM")
			$("#timepickerMeridian li:eq(0) a").addClass("selected");
		else
			$("#timepickerMeridian li:eq(1) a").addClass("selected");
		
		// Handle the event when a user clicks on an hours button
		$("#timepickerHours a").bind(determineEventType(), function(e)
		{
			e.preventDefault(); 
			
			// Remove the selected state on any previously selected hour buttons
			$("#timepickerHours a").removeClass("selected");
			
			// Add the selected state to this button.
			$(this).addClass("selected");
		});
		
		// Handle the event when a user clicks on an minutes button
		$("#timepickerMinutes a").bind(determineEventType(), function(e)
		{
			e.preventDefault(); 
			
			// Remove the selected state on any previously selected hour buttons
			$("#timepickerMinutes a").removeClass("selected");
			
			// Add the selected state to this button.
			$(this).addClass("selected");
		});
		
		// Handle the event when a user clicks on a meridian button
		$("#timepickerMeridian a").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			// Remove the selected state on any previously selected hour buttons
			$("#timepickerMeridian a").removeClass("selected");
			
			// Add the selected state to this button.
			$(this).addClass("selected");
		});
		
		// Handle the event when the user clicks on the cancel button
		$("#timepickerCancel").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.cancel();
		});
		
		// Handle the event when the user clicks on the done button
		$("#timepickerSelect").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();

			// Get the time
			var hour = $("#timepickerHours a.selected").text();
			var minute = $("#timepickerMinutes a.selected").text();
			
			var time = hour + ":" + minute + " " + $("#timepickerMeridian a.selected").text(); 
			
			// Set the return field with the time
			$(self.returnField).val(time);
			
			if(self.callbackMethod != null)
			{
				self.callbackMethod();
				self.callbackMethod = null;	
			}	
			
			// Close the window and cleanup.
  			self.cancel(); 
		});	
		
		$("#timepicker").bind("click", function(e)
		{
			e.preventDefault();
		});	
	};
	
	this.cancel = function()
	{
		$("#timepicker a").unbind();
		$("#timepicker input").unbind();
		$("#timepicker").unbind();
		
		// Show the main screen to prevent events firing.
		$("#main").css("visibility", "visible");									
		
		$("#timepicker").addClass("hidden");
		
		objApp.scrollTop();		
	}
	
	/***
	* timeToSeconds
	* Converts a time in HH:MM AM format to the number of seconds that time represents since midnight.
	*/
	this.timeToSeconds = function(timeString)
	{
		// Extract the hours, minutes and meridian values from the time string
		var colonPos = timeString.indexOf(":");
		
		var hours = timeString.substring(0, colonPos) * 1;
		var minutes = timeString.substring(colonPos + 1, colonPos + 3) * 1;
		var meridian = timeString.substring(colonPos + 4).toUpperCase();

		if(hours == 12)
		{
			if(meridian == "AM")	
				hours = 0;
		}
		else if(meridian == "PM")
		{
			hours = hours + 12;
		}
		
		var secsSinceMidnight = (hours * 3600) + (minutes * 60);
		
		return secsSinceMidnight;
	};	
	
	/***
	* secondsToTime
	* Converts a time represented as seconds since midnight to HH:MM AM/PM format
	*/
	this.secondsToTime = function(seconds)
	{
		var hours = 0;
		var minutes = 0;
		var meridian = "AM";
		
		hours = Math.floor(seconds / 3600);
		seconds = seconds - (hours * 3600);
		
		minutes = Math.floor(seconds / 60);
		
		if(hours == 0)
		{
			hours = 12;
			meridian = "AM";	
		}
		else if(hours == 12)
		{
			meridian = "PM";
		}		 
		else if(hours > 12)
		{
			meridian = "PM";
			hours = hours - 12;
		}
		
		var result = hours + ":";
		if(minutes < 10) result = result + "0";
		result = result + minutes + " " + meridian;
		
  		return result;
	};
	
	/***
	* getTimeStr
	* Creates a time string in HH:MM AM/PM format
	* based on the passed date object.
	*/
	this.getTimeStr = function(objDate)
	{
		var hours = objDate.getHours();
		var minutes =objDate.getMinutes();
		var meridian = "AM";
		
		if(hours == 0)
		{
			hours = 12;
			meridian = "AM";	
		}
		else if(hours == 12)
		{
			meridian = "PM";
		}		 
		else if(hours > 12)
		{
			meridian = "PM";
			hours = hours - 12;
		}
		
		var result = hours + ":";
		if(minutes < 10) result = result + "0";
		result = result + minutes + " " + meridian;
		
  		return result;	
	}
	
	this.setDefaultTime = function(timeString)
	{
		// Extract the hours, minutes and meridian values from the time string
		var colonPos = timeString.indexOf(":");
		
		var hours = timeString.substring(0, colonPos) * 1;
		var minutes = timeString.substring(colonPos + 1, colonPos + 3) * 1;
		var meridian = timeString.substring(colonPos + 4).toUpperCase();
		
		this.hour = hours;
		this.minute = minutes;
		this.meridian = meridian;		
	}		
}