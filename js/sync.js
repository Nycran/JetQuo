/**********************************************************
OBJECT: SYNC
***********************************************************/

/***
* @project: PlanetEarth
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

function Sync()
{
	var self = this;
	this.data = "";
	this.tableIndex = 0;
	this.recordIndex = 0;
	this.refreshSync = false;
	this.noRefreshWarning = false;
	this.silentMode = false;
	this.callbackMethod = null;
	
	/***
	* Setup the sync/account screen
	*/   
	this.setupSync = function(doRefresh)
	{
		// Default to standard sync
		self.refreshSync = doRefresh; 
		self.silentMode = false; 
		self.callbackMethod = null;
		
		if(doRefresh)
		{
			self.forceRefresh();
		}
		else
		{
			$("#frmSync #refresh_sync").attr("checked", false);   	
		}

		// Hide all panels
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Data Sync");
		
		objApp.setNavActive("#navSync");
		
		// Show the sync screen.
		$("#sync").removeClass("hidden"); 
  		
  		// Bind sync events
  		this.bindEvents();			
	}
	
	/***
	* Binds click/touch events to controls
	*/
	this.bindEvents = function()
	{
		// Unbind submit button
		$("#frmSync input[type='submit']").unbind();
		
		// User starts sync
		$("#frmSync input[type='submit']").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			objApp.objSync.startSync();
		});	
	}
	
	this.forceRefresh = function()
	{
		$("#frmSync #refresh_sync").attr("checked", "checked");
		objApp.objSync.noRefreshWarning = true;
		objApp.objSync.refreshSync = true;
	}
	
	this.archiveData = function()
	{
		// Get a recordset of inspectionitemphotos
		var sql = "SELECT iip.* " +
			"FROM inspectionitemphotos iip " +
			"INNER JOIN inspectionitems ii ON iip.inspectionitem_id = ii.id " +
			"INNER JOIN inspections i ON ii.inspection_id = i.id " +
			"WHERE i.finalised = 1 " +
			"AND i.inspection_start < ? " +
			"AND length(iip.photodata_tmb) > 0";
			
		// Figure out the unix time 14 days ago in milliseconds
		var threshold = new Date().getTime();
		threshold = threshold - ((86400 * 1000) * 14); 
			
		objDBUtils.loadRecordsSQL(sql, [threshold], function(param, items)
		{
			if(!items)
			{
				alert("There were no items to archive");
				$("#frmSync #archive_data").removeAttr("checked");
				self.startSync();
				return;	
			}
			
			var maxLoop = items.rows.length;
			var r = 0;
			var total_cleared = 0;
			
			var doNext = function()
			{
				var row = items.rows.item(r);
				var tmb_data = row.photodata_tmb;
				
				if(row.photodata_tmb != "")
				{
					if(row.photodata_tmb != null)
						total_cleared += row.photodata_tmb.length; 	
				}
				
				if(row.photodata != "")
				{
					if(row.photodata != null)
						total_cleared += row.photodata.length; 						
				}
				
				sql = "UPDATE inspectionitemphotos " +
					"SET photodata_tmb = '', photodata = '' " +
					"WHERE id = ?";
					
				objDBUtils.execute(sql, [row.id], function()
				{
					r++;
					
					if(r < maxLoop)
					{
						doNext();
					}
					else
					{
						alert("Task completed.  Cleared: " + Math.floor(total_cleared / 1024) + " Kb");	
						$("#frmSync #archive_data").removeAttr("checked");
						self.startSync();						
					}					
				});					
			}
			
			if(r < maxLoop)
			{
				alert("Please wait.. Clearing " + maxLoop + " records.  This may take some time.");
				doNext();
			}								
			
			
		}, "");
			 
	}	
	
	this.startSyncSilent = function(callbackMethod)
	{
		self.silentMode = true;
		self.callbackMethod = callbackMethod;
		
		// Start the sync
		self.startSync();
	}
	
	this.startSync = function()
	{
		if(!self.silentMode)
		{
			// Make sure the username and pass have been entered.
			if(!$("#frmSync").validate().form())
			{
				alert("Please enter a valid email address and your password.  Your password should be at least 5 characters long.");
				return;
			}
			
            /*
			if($("#frmSync #archive_data").is(":checked"))
			{
				if(!confirm("Warning, you are about to archive your old photos.  This will remove inspection photos from your iPad that are more than 2 weeks old.  Are you sure you want to do this?'"))
					return;
					
				self.archiveData();
				return;
			}	
            */		
			
			if(($("#frmSync #refresh_sync").is(":checked")) && (!objApp.objSync.noRefreshWarning))
			{
				if(!confirm("Warning, you have selected the 'reset my data' option.  This will delete all your local data and then download everything from the Planet Earth server.  Any data that you've entered since your last sync will be lost.  Are you sure?'"))
					return;
					
				objApp.objSync.refreshSync = true;  
			}
			
			this.tableIndex = 0;
			this.recordIndex = 0;		
			
			$("#accountMessage").text("Checking login..."); 
		}
        
		var parameters = {};
		parameters['email'] = localStorage.getItem("email");
		parameters['password'] = localStorage.getItem("password");

		if((parameters['email'] == null) || (parameters['password'] == null) || (parameters['email'] == "") || (parameters['password'] == ""))
		{
			objApp.objLogin.logout();
			return;
		}

		if(!self.silentMode) blockElement("#frmSync");

		$.post(objApp.apiURL + 'account/do_login', parameters , function(data)
		{  	
			if(data.status == "OK")
			{                    
 				// The login is OK.
 				if(objApp.objSync.refreshSync)
 				{
 					// The user is doing a refresh sync
 					// Clear any data in the database object
 					objDBUtils.data = "";
 					
 					// Delete all local data (except the first two tables app_tables and preferences - that's why we start at index 2 instead if 0)
 					if(!self.silentMode) $("#accountMessage").text("Login OK.  Deleting local data...");
 					
 					// Tell the database to delete all data.
 					setTimeout('objDBUtils.emptyAllTables(1, objApp.objSync.sendData);', 200);
 				}
 				else
 				{
 					var isPhonegap = objApp.phonegapBuild;
                    
                    setTimeout('objApp.objSync.uploadPhotos();', 200);
                
                    /*
 					
 					if(isPhonegap)
 					{
 						// When running under phonegap, before we send anything to the server, we must upload photos first.
 						if(!self.silentMode) $("#accountMessage").text("Login OK.  Looking for photos to upload...");
 						
						
 					}
 					else
 					{ 
 						if(!self.silentMode) $("#accountMessage").text("Login OK.  Preparing data...");
 						
 						// Now proceed with sync.
 						// Ask the database object to get all dirty data and to call the sendData method
 						// in this object when done.

 						objDBUtils.callbackMethod = objApp.objSync.sendData; 						
 						
 						// Do not send photos when not running under phonegap.
 						setTimeout('objDBUtils.getDirtyData(1, 0);', 200);
					}
                    */
				}
			}
			else if(data.message == "INVALID")
			{
				if(!self.silentMode)
				{
					unblockElement("#frmSync");
					$("#accountMessage").text("Sorry, either your email or password is incorrect.");
				}
				else if(self.callbackMethod != null)
				{
					self.callbackMethod(false);
				}
			}
			else
			{
				if(!self.silentMode)
				{				
					unblockElement("#frmSync");
					$("#accountMessage").text("Sorry, something went wrong.  Please report this error to the Planet Earth support team.");				
				}
				else if(self.callbackMethod != null)
				{
					self.callbackMethod(false);
				}				
			}
		}, "json"); 			
	}
	

	/***
	* sendData Sends data to the PlanetEarth server,
	* awaits processing, and then receives any new
	* data and stores it locally.
	*/
	this.sendData = function()
	{	
		// Setup the request data.
		var parameters = {};
		parameters['email'] = localStorage.getItem("email");
		parameters['password'] = localStorage.getItem("password");		
		parameters['version'] = objApp.version;
		parameters['data'] = objDBUtils.data;
        parameters['anticache'] = Math.floor(Math.random() * 999999);
		
		var refreshSync = "false";
		
		if(objApp.objSync.refreshSync)
		{
			// Set the refresh sync flag
			refreshSync = "true";

			if(!self.silentMode) $("#accountMessage").text("Asking server for your data...");
		}
		else
		{
			if(!self.silentMode) $("#accountMessage").text("Sending data to server...");
		}

		$.post(objApp.apiURL + 'account/process_data/' + refreshSync, parameters , function(data)
		{         		         
			// Remove / clear the data store temporarily in the DB object
			objDBUtils.data = "";  
            
            try {
                data = jQuery.parseJSON(data);
                
                // Make sure the server processed the data OK.    
                if(data.status == "OK")
                {
                    if(!self.silentMode) $("#accountMessage").text("Data sent OK, checking for data to process...");
                    
                    // Store the data locally.
                    self.data = data;
                    
                    // Data was processed OK.
                    // Did the server send us any data to store locally?
                    if(data.tables.length > 0)
                    {
                        // There is data. 
                         self.processTable();
                    }
                    else
                    {
                        self.tableIdx = 0;
                        self.removeDirtyFlags();
                    }
                }
                else
                {
                    if(!self.silentMode)
                    {                
                        unblockElement("#frmSync");
                        alert("Warning: An error occured during the data sync operation.  Please report this error to the Planet Earth team.");
                        $("#accountMessage").text("Sorry, something went wrong during the processing phase.  Please report this error to the Planet Earth team.");                                    
                    }
                    else if(self.callbackMethod != null)
                    {
                        self.callbackMethod(false);
                    }                
                }

                           
            } catch (e) {
                // error
                if(!self.silentMode)
                {                
                    unblockElement("#frmSync");
                    alert("Warning: An error occured during the data sync operation.  Please report this error to the Planet Earth team.");
                    $("#accountMessage").text("Sorry, something went wrong during the processing phase.  Please report this error to the Planet Earth team.");                                    
                }
                else if(self.callbackMethod != null)
                {
                    self.callbackMethod(false);
                }                
            }             
		}, ""); 			
	}
	
	/***
	* processTable handles inserting/updating the records for the current table
	* in the current sync operation.  It is called for each table in the resultset 
	* from the server.
	*/
	this.processTable = function()
	{
		var tableName = this.data.tables[self.tableIndex];
		
		// How many records for this table do we need to prcess.
		var num_recs = self.data[tableName].length;
	
		// Get the current row
		var row = self.data[tableName][self.recordIndex];
		
		// Start a transaction
		objDBUtils.db.transaction(function(transaction) 
		{			
			// handleRecord processes a record and handles deciding whether to
			// process more records in the current table or whether to move on to the next table.
			var handleRecord = function(transaction, tableName, row)
			{
				if(!self.silentMode) $("#accountMessage").text("Processing table: " + tableName + ", record " + (self.recordIndex + 1));

				// Build the sql insert/update statement
				var sql = self.buildSaveData(tableName, row);   
			
				transaction.executeSql(sql, self.saveData, function (transaction, result) 
				{            
					// Increment the recordIndex
					self.recordIndex++;
					
					if(self.recordIndex >= num_recs)
					{
						// This table has finished
						self.recordIndex = 0;
						self.tableIndex++;
						
						// If there's more processing to be done
						// invoke the process table method again.
						// Otherwise invoke sync finished
						if(self.tableIndex < self.data.tables.length)
						{
							self.processTable();
						}
						else
						{
							self.tableIdx = 0;
							self.removeDirtyFlags();	
						}							
					}
					else
					{
						// There is more data to handle for this table
						// Get the next row.
						row = self.data[tableName][self.recordIndex];
						handleRecord(transaction, tableName, row);
					}
						                              
				}, self.DB_error_handler); 				
			}
			
			// Handle the first record for this table.
			handleRecord(transaction, tableName, row);					
		});
	}
	
	/***
	* buildSaveData creates the SQL update/insert string for the current table
	* and also stores the necessary insert/update data in an internal array.
	*/
	this.buildSaveData = function(tableName, row)
	{
		var sql = "";  
		self.saveData = new Array();
		var fieldIdx = 0;
				

		// FOR ALL OTHER TABLES, USE INSERT OR REPLACE syntax to keep things simple
		sql = "INSERT OR REPLACE INTO " + tableName + " ";
		var header = "(";
		var footer = "VALUES (";
			
		// Loop through the field names
		for (var field in row) 
		{
			if(fieldIdx > 0)
			{
				header += ", ";	
				footer += ", ";	
			}
			
			header += field;
			footer += "?";
			
			// Save the value into the saveData array.	
			self.saveData.push(row[field]);
			
			fieldIdx++;
		}
		
		sql += header + ") " + footer + ");";

		
		return sql;		
	};	
	
	
	this.removeDirtyFlags = function()
	{
		self.tableIdx++; 
	
		if(self.tableIdx < objDBUtils.tables.length)
		{
			var tableName = objDBUtils.tables[self.tableIdx][0];   
			if(!self.silentMode) $("#accountMessage").text("Cleaning up table '" + tableName + "', one moment...");

			// Set all dirty records as not dirty
			var sql = "UPDATE " + tableName + " SET dirty = 0 WHERE dirty = 1";
			
			if(tableName == "inspections")
			{
				// For the inspections table, only set dirty to 0 when the inspection has been finalised.
				//sql += " AND finalised = 1";
			}
			
			objDBUtils.execute(sql, null, objApp.objSync.removeDirtyFlags);

			// Remove deleted records from local storage.  However, dont delete deleted contactfavourite records
            // as the deleted flag in this table simply means that the contact is not infact a favourite of this user.
            if(tableName != "contactsfavourites") {
			    var sql = "DELETE FROM " + tableName + " WHERE deleted = 1;";
			    objDBUtils.execute(sql, null, null);			
            }
		}   
		else
		{
			if(objApp.phonegapBuild)
			{
				self.storePhotosOnFS()
			}
			else
			{
                self.syncFinished();
			}
		}
	}
	
	/***
	* Stores any thumbnails returned from the server (will be in base64 encoding in the inspectionitemphotos table)
	* onto the local file system, and then clears the space in the database, thus freeing up considerable room.
	*/
	this.storePhotosOnFS = function()
	{
		var fail = function(error)
		{
			alert("storePhotosOnFS::Caught error: " + error.code);
		}
		
		// Request access to the file system
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem)
		{
			// Get a recordset of any photos that have not yet been moved to the filesystem
			var sql = "SELECT iip.* " +
				"FROM inspectionitemphotos iip " +
				"WHERE length(iip.photodata_tmb) > 500";
				
			objDBUtils.loadRecordsSQL(sql, [], function(param, items)
			{
				if(!items)
				{
					// Nothing to do.
					self.syncFinished();
					return;	
				}
				
				var maxLoop = items.rows.length;
				var r = 0;
				var total_cleared = 0;
				
				var doNext = function()
				{
					var row = items.rows.item(r);
					var tmb_data = row.photodata_tmb;       
					
					var file_name = row.id + "_thumb.jpg";
					
					// Get permission to write the file
					fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
					{
						// Create the file write object
						fileEntry.createWriter(function(writer)
						{
					        writer.onwriteend = function(evt) 
					        {
								// Get the file URI
								var uri = fileEntry.toURI();
								
								// Update the database with the URI
								sql = "UPDATE inspectionitemphotos " +
									"SET photodata_tmb = ? " +
									"WHERE id = ?";
									
								objDBUtils.execute(sql, [uri, row.id], function()
								{
									r++;
									
									if(r < maxLoop)
									{
										doNext();
									}
									else
									{
										self.syncFinished();						
									}					
								});									
					        };
							
							// Write the thumbnail data to the file.
							writer.write(tmb_data);
							
						}, fail);
							
					}, fail);
				}
				
				if(r < maxLoop)
				{
					if(!self.silentMode)
					{     
						$("#accountMessage").text("Moving thumbnails to local file system");	
					}
										
					doNext();
				}								

			}, "");				

		}, fail);  
	}
	
	this.syncFinished = function()
	{	              
		if(!self.silentMode)
		{
			unblockElement("#frmSync");        
			$("#accountMessage").text("All done - Sync completed successfully!");	
		}
		
		// Not sure why this is required, but the
		// sync object gets messed up after a sync finishes.
		objApp.objSync = new Sync();
		
		if(self.silentMode)		
		{
			if(self.callbackMethod != null)	
			{
				// Invoke the callback method and let it know the sync completed successfully.
				self.callbackMethod(true);
			}
		}
	}
	
	this.getLoginParams = function()
	{
		var parameters = {};
		
		parameters['email'] = localStorage.getItem("email");
		parameters['password'] = localStorage.getItem("password");
		
		if((parameters['email'] == null) || (parameters['email'] == ""))
		{
			return false;
		}
		
		if((parameters['password'] == null) || (parameters['password'] == ""))
		{
			return false;
		}		
		
		return parameters;		
	}
	
	this.uploadPhotos = function()
	{                 
		// Define a method to start the sync - will be called when photo uploading is finished.
		var startSync = function()
		{
 			if(!self.silentMode) $("#accountMessage").text("Preparing data...");
 			
 			// Now proceed with sync.
 			// Ask the database object to get all dirty data and to call the sendData method
 			// in this object when done.
 			objDBUtils.callbackMethod = objApp.objSync.sendData; 						
 			
 			// Do not send photos when not running under phonegap.
 			setTimeout('objDBUtils.getDirtyData(1, 0);', 200);			
		}

		// Get a recordset of photos with their dirty flags set
		var sql = "SELECT * " +
			"FROM inspectionitemphotos " +
			"WHERE dirty = ?";

		objDBUtils.loadRecordsSQL(sql, [1], function(param, items)
		{
			if(!items)
			{
				startSync();
				return;
			}
			
			var maxLoop = items.rows.length;
			var r = 0;
			
			var doNext = function()
			{
				var row = items.rows.item(r);
				var photodata = "";
				var photodata_tmb = "";
				
				// Define a method to actually upload the photo data once it has been retrieved
				// either from the FS or from the database.
				var uploadPhoto = function(photodata_tmb, photodata)
				{
					var params = {};
					
					// Add login details
					params['email'] = localStorage.getItem("email");
					params['password'] = localStorage.getItem("password");		
					params['version'] = objApp.version;	
					
					// Add item details
					params["id"] = row.id;
					params["inspectionitem_id"] = row.inspectionitem_id;
					params["seq_no"] = row.seq_no;
					params["deleted"] = row.deleted;
					params["photodata"] = photodata;
					params["photodata_tmb"] = photodata_tmb;
					params["notes"] = row.notes;
					
					if(!self.silentMode) $("#accountMessage").text("Uploading photo " + (r + 1));
					
					// Invoke the upload
					$.post(objApp.apiURL + "inspections/upload_photo", params, function(data)
					{
						if(data.status != "OK")
						{
							alert("An error occured whilst trying to upload the photo: " + data.message);
							return;
						}
						
						// The photo uploaded OK
						
						// Set the dirty flag back to 0
						var sql = "UPDATE inspectionitemphotos " + 
							"SET dirty = 0 " + 
							"WHERE id = ?";
							
						objDBUtils.execute(sql, [row.id], function()
						{
							// Increment the row counter
							r++;
							
							// If there are more photos to upload upload them, otherwise start the normal sync.
							if(r < maxLoop)				
							{
								doNext();
							}
							else
							{
								startSync();
							}							
						});
						
					}, "json");
				}				
				
				if(objApp.phonegapBuild)
				{
					// If phonegap is being used, the image data is on the file system. 
					// Get the thumbnail
					var file_name = row.id + "_thumb.jpg";
					 
					objUtils.readFile(file_name, function(success, data)
					{
						if(!success)	
						{
							alert("Couldn't read file: " + file_name);
							return;
						}
						
						photodata_tmb = data;
						
						// Now get the big image
						file_name = row.id + ".jpg";
						
						objUtils.readFile(file_name, function(success, data)
						{
							if(!success)	
							{
								alert("Couldn't read file: " + file_name);
								return;
							}

							photodata = data;
							
							uploadPhoto(photodata_tmb, photodata);
						});						
					});			
				}
				else
				{
					// If phonegap is not being used, the image data
					// is stored in the database itself.
					photodata = row.photodata;	
					photodata_tmb = row.photodata_tmb;
                    
					uploadPhoto(photodata_tmb, photodata);
				}
				
			}	
			
			if(r < maxLoop)				
			{
				doNext();
			}
			else
			{
				startSync();
			}			
			
		}, "");
	}			
}
