/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

var imageResizer = function(objImage)
{
	this.objImage = objImage; 		// Assign the image object to the local class for future reference
	var self = this;	// Store a reference to the object for use within window scope callbacks.

	/***
	* resize
	* Resizes (scales) the image to the desired width
	*/
	this.resize = function(width)
	{
		// Calculate the ratio needed to achieve the new image size
		var ratio = width / this.objImage.width;
		
		// Setup a canvas with the same dimensions as the image and draw the original image into it
 		var canvas1 = document.createElement("canvas");
    	var context1 = canvas1.getContext("2d");
		
		canvas1.width = this.objImage.width;
		canvas1.height = this.objImage.height;
		context1.drawImage(this.objImage, 0, 0);
		
		// Setup a second canvas of resized size
 		var canvas2 = document.createElement("canvas");
    	var context2 = canvas2.getContext("2d");
		
		canvas2.width = this.objImage.width * ratio;
		canvas2.height = this.objImage.height  * ratio;
		
		// Draw the image into the smaller canvas scaled to the correct size.
		context2.drawImage(canvas1, 0, 0, canvas2.width, canvas2.height);			
			
		// Get the image data in base64 encoding.
		var strDataURI = canvas2.toDataURL("image/jpeg");
		
		// Chop off the base64 header.
		var b64pos = strDataURI.indexOf("base64,");
		strDataURI = strDataURI.substring(b64pos + 7);
		
		// Cleanup
		context1 = null;		
		context2 = null;
		canvas1 = null;
		canvas2 = null;
		
		// Return the scaled image
		return strDataURI;		
	}
};