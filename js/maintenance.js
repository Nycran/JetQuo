/**********************************************************
OBJECT: Maintenance
***********************************************************/

/***
* @project: PlanetEarth
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

function Maintenance()
{
	var self = this;
	
	/***
	* Setup the sync/account screen
	*/   
	this.setupMaintenance = function()
	{
		// Hide all panels
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Maintenance");
		
		objApp.setNavActive("#navMaintenance");
		
		// Show the sync screen.
		$("#maintenance").removeClass("hidden"); 
  		
  		// Bind sync events
  		this.bindEvents();

        $('#select_period').trigger('change');
	}
	
	/***
	* Binds click/touch events to controls
	*/
	this.bindEvents = function()
	{
		
		// User starts sync
		$("#delete_photo").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			objApp.objMaintenance.startDelete();
		});	
        
        $('#select_period').bind('change', function(e){
			if($(this).val() == -1)
            {
                
                $('#select_date').show();
                $("#select_date").glDatePicker({
                    cssName: 'flatwhite',
                    calendarOffset: { x: 0, y: 0 },
                    onClick: (function(el, cell, date, data) {
                        var dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear()
                        el.val(dateStr);
                    })
                });
            }
            else
            {
                $('#select_date').hide();
            }
        });
	}
	
	this.startDelete = function()
    {
        var periods = $('#select_period').val();
        var curDate = new Date();
        
        if(periods != -1)
            var maintaince_date = new Date(curDate.getTime() - periods*24*60*60*1000);
        else
            var maintaince_date = objApp.userDateStrToDate($("#select_date").val());
    
		var sql = "UPDATE inspectionitemphotos " +
			"SET deleted = 1, dirty = 1 " +
            // "WHERE modified < '"+maintaince_date.toISOString().replace('T', ' ').substr(0, 19)+"'";
            "WHERE modified < '"+maintaince_date.toISOString()+"'";
            
		objDBUtils.execute(sql, [], null);	
        
        alert('Delete successfully');
    }
}
