/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

var imageMarker = function(objImage, heading, notes, saveMethod, deleteMethod, photoID, readOnly)
{
	this.objImage = objImage; 		// Assign the image object to the local class for future reference
	this.heading = heading;			// The heading to assign to the h1 tag.
	this.notes = notes;				// The current value of the notes for this image.
	this.saveMethod = saveMethod;	// The callback method to invoke when the image is saved.
    this.deleteMethod = deleteMethod;// The callback method to invoke when the image is deleted.
	this.canvas = null; 			// A reference to the canvas object
	this.context = null;			// The canvas context
	this.touchEvent = null;			// Either 'click' or 'touchstart' depending on device type
	this.closeMethod = null;		// Can be set to a callback method and will be invoked when window closes
	
	this.clickX = new Array();		// Array to hold x co-ord click events
	this.clickY = new Array();		// Array to hold y co-ord click events
	this.clickDrag = new Array();	// Array to hold draw events
	this.clickColour = new Array();	// Array to hold colour settings for each stroke.
	this.paint = false;				// Set to true when painting.
	this.penColour = "df4b26";
	this.readOnly = readOnly;
    this.photoID = photoID;
	
	var self = this;	// Store a reference to the object for use within window scope callbacks.

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
			thisHeight = height - 20; 	
		}
		
		var optionsHeight = thisHeight - 120;
		
		width = width - 30;
		
        /*
		if(width > 974)
		{
			width = 974;
		}
        */
		
		var canvasWidth = 600;
		var canvasHeight = 400;
		
		if(self.objImage.width < canvasWidth)
		{
			canvasWidth = self.objImage.width;
		}
		
		if(self.objImage.height < canvasHeight)
		{
			canvasHeight = self.objImage.height;
		}		

		// Setup the control html
		var div = $('<div id="imageMarker" style="height: ' + thisHeight + 'px; width: ' + width + 'px;" />');
			div.append('<h1 style="width: ' + width + 'px !important;">' + self.heading + '</h1>');
			
			// Left Panel
			var leftPanel = $('<div class="imColLeft" style="width: ' + (width - 300) + 'px; height: ' + (height - 120) + 'px;" />');
				leftPanel.append('<canvas id="im_Canvas" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>');
				leftPanel.append('<ul id="colorControls">' +
					'<li><a class="colorRed selected" href="javascript:void(0);">Red</a></li>' +
					'<li><a class="colorYellow" href="javascript:void(0);">Yellow</a></li>' +
					'<li><a class="colorGreen" href="javascript:void(0);">Green</a></li>' +
					'</ul>');

			// Right panel
			var rightPanel = $('<div class="imColRight" style="width: 250px; height: ' + (height - 120) + 'px;" />');
				rightPanel.append('<h2>Image Notes</h2>');
				rightPanel.append('<textarea id="imNotes" name="imNotes" style="width: 240px; height: ' + (height - 180) + 'px;">' + self.notes + '</textarea>');

			// Append left and right panels
			div.append(leftPanel);
			div.append(rightPanel);
			
			div.append('<div style="clear:both;"></div>');
			
			var form = $('<form id="frmIMControls" name="frmIMControls" action="#" method="post">');
			
			if(self.readOnly == false)
			{
				form.append('<a id="btnIMSave" class="button" name="btnIMSave">Save</a>');
				form.append('<a id="btnIMReset" class="button" name="btnIMReset">Reset</a>');
                form.append('<a id="btnIMDelete" class="button warning" name="btnIMDelete">Delete</a>');
			}
			
			form.append('<a id="btnIMCancel" class="button" name="btnIMCancel">Cancel</a>');
				
			div.append(form);
		
		// Append the control to the document body
		$("body").append(div);
		
		// Setup the canvas and context
		self.canvas = document.getElementById("im_Canvas");
		self.context = self.canvas.getContext("2d");
		
		// Draw the image into the canvas
		self.context.drawImage(self.objImage, 0, 0);			
		
		setTimeout(function()
		{
			self.bindEvents();	
		}, 250);
	}
	
	this.bindEvents = function()
	{
		// Bind events to cancel button	
		$("#imageMarker #frmIMControls #btnIMCancel").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.close();		
		});
		
		
		$("#imageMarker #frmIMControls #btnIMReset").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.canvas.width = self.canvas.width; // Clears the canvas
			
			// Draw the image into the canvas
			self.context.drawImage(self.objImage, 0, 0);
			
			// Initalise the arrays
			self.clickX = new Array();
			self.clickY = new Array();
			self.clickDrag = new Array();
			self.clickColour = new Array();						
		});
        
        $("#imageMarker #frmIMControls #btnIMDelete").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
            if(!confirm("Are you sure you want to delete this image?  Once the issue has been deleted you cannot recover it."))
			{
				return false;
			}
			self.deleteMethod(self.photoID);
            self.close();			
		});
		
		$("#imageMarker #frmIMControls #btnIMSave").bind(self.touchEvent, function(e)
		{
			e.preventDefault();
			
			// Get the image data in base64 encoding.
			var strDataURI = self.canvas.toDataURL("image/jpeg");
			
			// Chop off the base64 header.
			var b64pos = strDataURI.indexOf("base64,");
			strDataURI = strDataURI.substring(b64pos + 7);
			
			// Pass a result object with the image and notes back to the caller
			var objResult = new imageMarkerResult(strDataURI, $("#imNotes").val());
			self.saveMethod(objResult);
			self.close();
		});		
		
		// make sure we scroll back down after the user has finished typing.
		$("#imageMarker #imNotes").bind("blur", function()
		{
			self.scrollTop();
		});		
		
		// Setup drawing events, based on desktop/mobile device type
		if(self.isMobileDevice())
		{
			// This is phone or tablet.  Use touch events.
			$('#im_Canvas').bind("touchmove", function(e)
			{
				e.preventDefault();
				
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
	            var elm = $(this).offset();
				
				var mouseX = touch.pageX - elm.left;
				var mouseY = touch.pageY - elm.top;
		
				if(mouseX < $(this).width() && mouseX > 0)
				{	
					self.addClick(mouseX, mouseY, self.paint);
					self.paint = true;
					self.redraw();
				}
			});
			
			$('#im_Canvas').bind("touchend", function(e) 
			{
				e.preventDefault();
				self.paint = false;
			});			
		}
		else
		{
			// This is a desktop PC, use mouse events
			
			$('#im_Canvas').mousedown(function(e)
			{
				var mouseX = e.pageX - this.offsetLeft;
				var mouseY = e.pageY - this.offsetTop;
				self.paint = true;
				self.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
				self.redraw();
			});
			
			$('#im_Canvas').mousemove(function(e)
			{
				if(self.paint)
				{
					self.addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
					self.redraw();
				}
			});
			
			$('#im_Canvas').mouseup(function(e)
			{
				self.paint = false;
			});		
			
			$('#im_Canvas').mouseleave(function(e)
			{
				self.paint = false;
			});				
			
		}
		
		$("#colorControls a.colorRed").bind(this.touchEvent, function(e)
		{
			e.preventDefault();
			self.penColour = "df4b26";
			
			// Remove selected state from all colours
			$("#colorControls a").removeClass("selected");
			
			// Select selected state
			$(this).addClass("selected");
		});
		
		$("#colorControls a.colorYellow").bind(this.touchEvent, function(e)
		{
			e.preventDefault();
			self.penColour = "FFFF00";
			
			// Remove selected state from all colours
			$("#colorControls a").removeClass("selected");
			
			// Select selected state
			$(this).addClass("selected");
		});	
		
		$("#colorControls a.colorGreen").bind(this.touchEvent, function(e)
		{
			e.preventDefault();
			self.penColour = "00FF00";
			
			// Remove selected state from all colours
			$("#colorControls a").removeClass("selected");
			
			// Select selected state
			$(this).addClass("selected");
		});			
					
	}
	
	/***
	* The close method removes the popSelector from the screen entirely and
	* also frees the memory used to store the option values.
	*/
	this.close = function()
	{
		// Remove all bindings to options.
		$("#imageMarker #frmIMControls a").unbind();
		$('#im_Canvas').unbind();		
		$("#imageMarker").unbind();

		// Remove the pop selector from the screen
		$("#imageMarker").remove();
		
		if(self.closeMethod != null)
		{
			self.closeMethod();
		}
	}
	
	this.addClick = function(x, y, dragging)
	{
		self.clickColour.push(self.penColour);
		self.clickX.push(x);
		self.clickY.push(y);
		self.clickDrag.push(dragging);
	}	

	this.redraw = function()
	{
		self.canvas.width = self.canvas.width; // Clears the canvas
		self.context.drawImage(self.objImage, 0, 0);

		self.context.strokeStyle = "#df4b26";
		self.context.lineJoin = "round";
		self.context.lineWidth = 5;

		for(var i=0; i < self.clickX.length; i++)
		{		
			self.context.beginPath();
			self.context.strokeStyle = "#" + self.clickColour[i];
			
			if(self.clickDrag[i] && i)
			{
				self.context.moveTo(self.clickX[i-1], self.clickY[i-1]);
			}
			else
			{
				self.context.moveTo(self.clickX[i]-1, self.clickY[i]);
			}
			
			self.context.lineTo(self.clickX[i], self.clickY[i]);
			self.context.closePath();
			self.context.stroke();
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

var imageMarkerResult = function(imageData, notes)
{
	this.imageData = imageData;
	this.notes = notes;
};