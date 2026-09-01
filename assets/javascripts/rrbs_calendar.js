  var long_time_format = 'HH:mm A';
  var long_date_format = 'YYYY-MM-DD';
  var long_date_format_datepicker = 'mm/dd/yy';
  var eventsJSON = [];
  var event_json_text =[];
  var rrbsPlanYear = new Date().getFullYear();
  var rrbsPlanMonth = new Date().getMonth();
  var rrbsViewMode = 'month';

  var rrbsMonthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
  ];

  function getResourceColor(resourceId) {

    var id = parseInt(resourceId, 10);

    if (isNaN(id))
        id = 0;

    var hue = (id * 137.508) % 360;

    return "hsl(" + hue + ",60%,50%)";
}
function getResourceTextColor(resourceId) {

    var id = parseInt(resourceId, 10);

    if (isNaN(id))
        id = 0;

    var hue = (id * 137.508) % 360;

    if (hue >= 35 && hue <= 195) {
        return "#000000";
    }

    return "#ffffff";
}
  //var baseUrl =  "http://localhost:3000"
  
jQuery(document).ready(function($) {
	
	var getEventsJSON = function(offset, moment) {
			var url = baseUrl + '/issues.json?key=' + api_key  + '&project_id=' + project_id + '&tracker_id=' + tracker_id +'&status_id=*'
				url = url  + '&due_date=' + encodeURIComponent('>=') + moment;
				url = url + '&limit=' + 100 + '&offset=' + offset;
				
			console.log("ajax読み込み %s", url);
			
			$.ajax({
				url : url,
				dataType : 'json',
				
				
				success: function(res){ 
					console.log("ajax読み込み成功 %s", url);
					console.dir(res);
					
					buildEventsJSON(res, offset == 0);  //offset==0のときはtrue
					
					// limit 以下のときはoffset設定して再取得
					if (res.total_count > (offset + 100)) { getEventsJSON(offset + 100, moment); } 
				    else {
    					filterEvents(GetCookie_array('r_selected'));

    					if ($('#rrbs_year_plan').is(':visible')) {
        					rrbsRenderYearPlan(rrbsPlanYear);
    					}

				    if ($('#rrbs_month_plan').is(':visible')) {
                    rrbsRenderMonthPlan(rrbsPlanYear, rrbsPlanMonth);}	 
						 }
					 },
				
					
					
				error: function(){ console.log("ajax失敗 %s", url);  }
				
			});
	};
	
	var buildEventsJSON = function(eventsRawJSON, clear) {
          console.log('Building JSON');
          var count = eventsRawJSON.issues.length;
          var event = eventsRawJSON.issues;
          
          //clearにtrue送られてきたときのときは，初期化
          if (clear) {
              eventsJSON = {events:[]};
          }
          
          for (var i = 0; i < count; i++) {
			try{  //avoid "Cannot read properties of undefined (reading 'name')"
              if (event[i].custom_fields == undefined) { continue; }

			  var resource_id;
              var start_time;
			  var end_time;
			  var text;

			  //read custom_fields value
              for (var j = 0; j < event[i].custom_fields.length; j++)
              {
                  if (event[i].custom_fields[j]["id"] == fieldIdResource){
					resource_id = event[i].custom_fields[j].value;
				  }
                  if (event[i].custom_fields[j]["id"] == fieldIdStart){
					start_time = event[i].custom_fields[j].value;
				  }
                  if (event[i].custom_fields[j]["id"] == fieldIdEnd){
					end_time = event[i].custom_fields[j].value;
				  }
				  if (event[i].custom_fields[j]["id"] == fieldIdText){
					text = event[i].custom_fields[j].value;
				  }
              }
              
			  //check value and format event object
			  var resource;
			  for (var k = 0; k < rrbs_resources.length; k++){
				if (rrbs_resources[k][1] == resource_id) {
					resource = rrbs_resources[k][0];
					continue;
				}
			  }

              var start;
			  if (start_time != "" && start_time != undefined) {
				start = event[i].start_date + "T" + start_time + ":00";
			  } else {
				start = event[i].start_date + "T00:00:00";
			  }

              var end;
			  if (end_time != "" && end_time != undefined) {
				end = event[i].due_date + "T" + end_time + ":00";
                
				if ((moment(end) - moment(start)) < 0){
				  end = start.slice(0,-3) + ":01";
				}
			  } else {
				end = event[i].due_date + "T23:59:00";
			  }
              
			  if (fieldIdText == ''){
				text = '';
			  }

              
			  var event_color = getResourceColor(resource_id);  
			  var event_text_color = getResourceTextColor(resource_id);
              //var event_color = '#1905b2';  //dark blue/
              
              //if (event[i].status.id == issue_status_id_book) { event_color = '#227c27' ; }  //green
              //if (event[i].status.id == issue_status_id_progress) { event_color = '#ffd43a' ; }  //yellow
              //if (event[i].status.id == issue_status_id_complete) { event_color = '#636363' ; }  //grey
			  
			  
			  if (event[i].status.id != issue_status_id_cancel) {   //not displayed
				eventsJSON["events"].push({
							title: event[i].subject,
							resource_id: resource_id,
							resource: resource,
							start: start,
							end: end,
					        assigned_to: resource,
                            assigned_to_id: null,
							id: event[i].id,
							booking_text: text,
							color: event_color,
					        textColor: event_text_color,
							status_id: event[i].status.id
				});
			  }
			} catch(error) {
			  console.log("buildEventsJSON error :" + error);
			  console.log(event[i]);
			}
          }
          return true;
      };
	
	

	//選択ボタンでリソースが変更された場合
	$('#rrbs_resource').change(function() {
		var r_selected = [];
		$('input[name="rrbs_resource_checkbox"]:checked').each(function(){
		r_selected.push($(this).val());
		});
		document.cookie = 'r_selected=[' + r_selected + ']';
		
			filterEvents(r_selected);

		   if ($('#rrbs_year_plan').is(':visible')) {
               rrbsRenderYearPlan(rrbsPlanYear);
           }

		   if ($('#rrbs_month_plan').is(':visible')) {
              rrbsRenderMonthPlan(
                  rrbsPlanYear,
                  rrbsPlanMonth
           );
       }
	});
	
	var load_checkbox = function(){
		var r_selected = GetCookie_array("r_selected");
		
		//try {
		//		r_selected_str = r_selected_str.replace("[","")
		//		r_selected_str = r_selected_str.replace("]","")
		//	var r_selected = r_selected_str.split(',');
			
			if (r_selected.length > 0){
				$('input:checkbox[name="rrbs_resource_checkbox"]').each(function(){
					//console.log(" rrbs_resource_checkbox  "  + $(this).val());
					if (r_selected.indexOf($(this).val()) >= 0){ $(this).attr("checked",true) }
				});
				filterEvents(r_selected);
			}
		//} catch (error) { console.log("r_selected cookie undefined"); }
	};
	
	
	var filterEvents = function(r_selected){
			event_json_text = []; //初期化
			if ( eventsJSON.length != 0 ) {
				
				// eventsJSONの編集
				if (eventsJSON["events"].length > 0){
					eventsJSON["events"].forEach(function(event){
						for (var j in r_selected){
							if (event.resource_id == r_selected[j]){
								event_json_text.push(event);
								}  //選択されたr_selectedとissueのresource_idが一致するときjson配列に追加
						}
					})
				}
			}
			// console.log(event_json_text);  //デバッグ用
			console.log('r_selected: ' + r_selected + ',   event_json_text : ' + event_json_text + ',   ---render fullcalendar');  //デバッグ用
		
		
			$('#calendar').fullCalendar('removeEvents');
			$('#calendar').fullCalendar('addEventSource', event_json_text);   //再描画
			
	};
	





	$('#delete_booking').click(function() {
		if ($('#event_id').val() <= 0)
			return false;
			
		var event_id = $('#event_id').val();
		var url = baseUrl + '/issues/' + event_id + '.json?key=' + api_key;
		var action = 'DELETE';
		
		console.log("ajax通信 %s %s", action, url);
		
		$.ajax({
			url : url,
			type : action,
			datatype : 'json',
			
			success: function(res){ 
				console.log("ajax通信成功 %s %s", action, url);
				console.dir(res);
				doReload();
				},
				
			error: function(jqXHR, textStatus, errorThrown){
				if (jqXHR.status == 200){  // なぜか成功200においてもエラー処理になることがある
					console.log("ajax通信成功 %s %s", action, url);
					console.dir(jqXHR);
					doReload();
				}else{
					console.log("ajax失敗 %s %s", action, url);
					console.log(textStatus + ": " + jqXHR.responseText);
					alert(jqXHR.status + " " + jqXHR.statusText + "\n ajax失敗" + "\n textStatus : " + textStatus + "\n errorThrown : " + errorThrown + "\n responseText : " + jqXHR.responseText);
				}
			}
		});
		
		$('.rrbs_saveModal').dialog('close');
	});
      
      
      

      $('#save_booking').click(function() {
          var event_id = $('#event_id').val();
          
          var booking_start_date = window.moment($('#booking_start_date').val(), long_date_format);
          var booking_end_date = window.moment($('#booking_end_date').val(), long_date_format);
          
          var start_time = window.moment($('#start_time').val(), 'HH:mm'); 
		  var end_time = window.moment($('#end_time').val(), 'HH:mm');
          
          var ajaxData_custom_field_values = {};
              ajaxData_custom_field_values[fieldIdStart] = start_time.format('HH:mm');
              ajaxData_custom_field_values[fieldIdEnd] = end_time.format('HH:mm');
			  ajaxData_custom_field_values[fieldIdResource] = $('#selected_resource').val();
			  if (fieldIdText != ''){
			    ajaxData_custom_field_values[fieldIdText] = $('#booking_text').val();
			  }
          


          $('.rrbs_saveModal').dialog('close');
          
          //setting the variable for update or create as required
          if ($('#event_id').val() == 0) {
              var action = 'POST';
              var url = baseUrl + '/issues.json?key=' + api_key;
              
	          var ajaxData = { issue : {
	          	project_id: project_id,
	          	tracker_id: tracker_id,
	          	subject: $('#subject').val(),
	          	start_date: booking_start_date.format('YYYY-MM-DD'),
	          	due_date: booking_end_date.format('YYYY-MM-DD'),
	          	custom_field_values: ajaxData_custom_field_values,
	          	//assigned_to_id: $('#selected_assigned_to').val(),
	          	//status_id: $('#selected_issue_status').val()
				status_id: issue_status_id_book
	          }};
              
              
          } else {
              var action = 'PUT';
              var url = baseUrl + '/issues/' + event_id + '.json?key=' + api_key;
              
	          var ajaxData = { issue : {
	          	project: {id: project_id },
	          	tracker: {id: tracker_id },
	          	subject: $('#subject').val(),
	          	start_date: booking_start_date.format('YYYY-MM-DD'),
	          	due_date: booking_end_date.format('YYYY-MM-DD'),
	          	custom_field_values: ajaxData_custom_field_values,
	          	//assigned_to_id: $('#selected_assigned_to').val(),
	          	//status_id: $('#selected_issue_status').val()
				status_id: issue_status_id_book
	          }};
          }
		  console.log("ajax通信 %s %s", action, url);
          console.log(ajaxData)
          
		$.ajax({
			url : url,
			type : action,
			datatype : 'json',
			data : ajaxData,
			
			success: function(res){ 
				console.log("ajax通信成功 %s %s", action, url);
				console.dir(res);
				doReload();
				},
			
			error: function(jqXHR, textStatus, errorThrown){
				if (jqXHR.status == 200){  // なぜか成功200においてもエラー処理になることがある
					console.log("ajax通信成功 %s %s", action, url);
					console.dir(jqXHR);
					doReload();
				}else{
					console.log("ajax失敗 %s %s", action, url);
					console.log(textStatus + ": " + jqXHR.responseText);
					alert(jqXHR.status + " " + jqXHR.statusText + "\n ajax失敗" + "\n textStatus : " + textStatus + "\n errorThrown : " + errorThrown + "\n responseText : " + jqXHR.responseText);
				}
			}
		});
		
		$('#event_id').val(0);
	});
	
	

      $('.rrbs_saveModal').keypress(function(e) {
          if (e.which == 13) {
              jQuery('#save_meeting').focus().click();
              e.preventDefault();
              return false;
          }
      });
      
   
   
	// reloadメソッドによりページをリロード
	function doReload() {
	
		// 全体reload
		window.location.reload(true);

	}
	
	function GetCookie( name ){
		var result = null;
		
		var cookieName = name + '=';
		var allcookies = document.cookie;
		
		var position = allcookies.indexOf( cookieName );
		if( position != -1 )
		{
			var startIndex = position + cookieName.length;
			
			var endIndex = allcookies.indexOf( ';', startIndex );
			if( endIndex == -1 )
			{
				endIndex = allcookies.length;
			}
			
			result = decodeURIComponent(
				allcookies.substring( startIndex, endIndex ) );
		}
		
		return result;
	}
	
	function GetCookie_array( name ){
		var result = [];
		
		var cookieName = name + '=';
		var allcookies = document.cookie;
		
		var position = allcookies.indexOf( cookieName );
		if( position != -1 )
		{
			var startIndex = position + cookieName.length;
			
			var endIndex = allcookies.indexOf( ';', startIndex );
			if( endIndex == -1 )
			{
				endIndex = allcookies.length;
			}
			
			result = decodeURIComponent(
				allcookies.substring( startIndex, endIndex ) );
				
			result = result.replace("[","")
			result = result.replace("]","")
			result = result.split(',');
		}
		
		return result;
	}
	
	function rrbsGetWeekNumber(date) {
    var currentDate = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        )
    );

    var dayNumber = currentDate.getUTCDay();

    if (dayNumber === 0) {
        dayNumber = 7;
    }

    currentDate.setUTCDate(
        currentDate.getUTCDate() + 4 - dayNumber
    );

    var yearStart = new Date(
        Date.UTC(currentDate.getUTCFullYear(), 0, 1)
    );

    return Math.ceil(
        (
            (
                currentDate - yearStart
            ) / 86400000 + 1
        ) / 7
    );
}
	function rrbsParseDate(dateValue) {
    if (!dateValue) {
        return null;
    }

    /*
     * Redmine обычно возвращает YYYY-MM-DD.
     * Разбираем вручную, чтобы браузер не сдвинул дату
     * из-за часового пояса.
     */
    var dateParts = String(dateValue)
        .substring(0, 10)
        .split('-');

    if (dateParts.length !== 3) {
        return null;
    }

    return new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10)
    );
}
   function rrbsEventIntersectsMonth(event, year, month) {

    var startDate = rrbsParseDate(event.start);
    var endDate = rrbsParseDate(event.end);

    if (!startDate || !endDate) {
        return false;
    }

    var monthStart = new Date(
        year,
        month,
        1
    );

    var monthEnd = new Date(
        year,
        month + 1,
        0
    );

    return (
        startDate <= monthEnd &&
        endDate >= monthStart
    );
}


function rrbsGetResourceEventsForMonth(
    resourceId,
    year,
    month
) {

    if (
        !eventsJSON ||
        !eventsJSON.events ||
        !Array.isArray(eventsJSON.events)
    ) {
        return [];
    }

    return eventsJSON.events.filter(function(event) {

        return (
            String(event.resource_id) ===
                String(resourceId) &&

            rrbsEventIntersectsMonth(
                event,
                year,
                month
            )
        );
    });
}


function rrbsBuildMonthHeader(
    year,
    month
) {

    var daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    var html = '';

    html +=
        '<div class="rrbs-month-header-row">';

    html +=
        '<div class="rrbs-month-name-header">' +
        'Сотрудник' +
        '</div>';

    html +=
        '<div class="rrbs-month-days-header" ' +
        'style="grid-template-columns: ' +
        'repeat(' +
         daysInMonth +
         ', minmax(32px, 1fr));">';
	
    for (
        var day = 1;
        day <= daysInMonth;
        day++
    ) {

        var date = new Date(
            year,
            month,
            day
        );

        var dayOfWeek = date.getDay();

        var dayName = [
            'Вс',
            'Пн',
            'Вт',
            'Ср',
            'Чт',
            'Пт',
            'Сб'
        ][dayOfWeek];

        var weekendClass = '';

        if (
            dayOfWeek === 0 ||
            dayOfWeek === 6
        ) {
            weekendClass =
                ' rrbs-month-weekend';
        }

        html +=
            '<div class="' +
            'rrbs-month-day-header' +
            weekendClass +
            '">';

        html += day;

        html +=
            '<span>' +
            dayName +
            '</span>';

        html +=
            '</div>';
    }

    html += '</div>';

    html += '</div>';

    return html;
}


function rrbsBuildMonthResourceRow(
    resource,
    year,
    month
) {

    var resourceName = resource[0];
    var resourceId = resource[1];

    var daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    var resourceEvents =
        rrbsGetResourceEventsForMonth(
            resourceId,
            year,
            month
        );

    var monthStart = new Date(
        year,
        month,
        1
    );

    var monthEnd = new Date(
        year,
        month + 1,
        0
    );

    var html = '';

    html +=
        '<div class="rrbs-month-resource-row">';


    /*
     * Имя сотрудника.
     */
    html +=
        '<div class="' +
        'rrbs-month-resource-name' +
        '">';

    html +=
        $('<div>')
            .text(resourceName)
            .html();

    html +=
        '</div>';


    /*
     * Временная шкала.
     */
    html +=
        '<div class="' +
        'rrbs-month-timeline' +
        '" style="' +
        'grid-template-columns: ' +
	    'repeat(' +
        daysInMonth +
        ', minmax(32px, 1fr));' +
        '">';


    /*
     * Ячейки дней.
     */
    for (
        var day = 1;
        day <= daysInMonth;
        day++
    ) {

        var currentDate = new Date(
            year,
            month,
            day
        );

        var dayOfWeek =
            currentDate.getDay();

        var weekendClass = '';

        if (
            dayOfWeek === 0 ||
            dayOfWeek === 6
        ) {
            weekendClass =
                ' rrbs-month-weekend';
        }

        html +=
            '<div class="' +
            'rrbs-month-day-cell' +
            weekendClass +
            '" style="grid-column: ' +
		    day +
            ';"></div>';
    }


    /*
     * Полосы отпусков.
     */
    resourceEvents.forEach(function(event) {

        var startDate =
            rrbsParseDate(event.start);

        var endDate =
            rrbsParseDate(event.end);

        if (
            !startDate ||
            !endDate
        ) {
            return;
        }


        /*
         * Обрезаем отпуск границами
         * текущего месяца.
         */
        if (
            startDate < monthStart
        ) {
            startDate =
                new Date(monthStart);
        }

        if (
            endDate > monthEnd
        ) {
            endDate =
                new Date(monthEnd);
        }


        /*
         * Номер первого дня отпуска
         * в выбранном месяце.
         */
        var startDay =
            startDate.getDate();


        /*
         * Номер последнего дня отпуска.
         */
        var endDay =
            endDate.getDate();


        var durationDays =
            endDay -
            startDay +
            1;


        var eventColor =
            event.color ||
            '#3a87ad';


        var eventTextColor =
            event.textColor ||
            '#ffffff';


        var eventTitle =
            (event.assigned_to ||
                resourceName) +

            ': ' +

            moment(startDate)
                .format('DD.MM.YYYY') +

            ' – ' +

            moment(endDate)
                .format('DD.MM.YYYY');


        html +=
            '<div class="' +
            'rrbs-month-event' +
            '"';


        html +=
            ' style="' +

            'grid-column: ' +
            startDay +

            ' / span ' +
            durationDays +

            ';' +

            'background-color: ' +
            eventColor +

            ';' +

            'color: ' +
            eventTextColor +

            ';"';


        html +=
            ' data-event-id="' +
            event.id +
            '"';


        html +=
            ' title="' +

            $('<div>')
                .text(eventTitle)
                .html() +

            '">';


        html +=
            $('<div>')
                .text(
                    event.assigned_to ||
                    resourceName
                )
                .html();


        html +=
            '</div>';
    });


    html +=
        '</div>';

    html +=
        '</div>';

    return html;
}


function rrbsRenderMonthPlan(
    year,
    month
) {

    rrbsPlanYear = year;

    rrbsPlanMonth = month;


    var html = '';


    html +=
        '<div class="' +
        'rrbs-month-plan-wrapper' +
        '">';


    /*
     * Заголовок с днями месяца.
     */
    html +=
        rrbsBuildMonthHeader(
            year,
            month
        );


    /*
     * Выбранные сотрудники.
     */
    var selectedResources =
        GetCookie_array(
            'r_selected'
        );


    for (
        var i = 0;
        i < rrbs_resources.length;
        i++
    ) {

        var resource =
            rrbs_resources[i];

        var resourceId =
            String(resource[1]);


        /*
         * Показываем только сотрудников,
         * отмеченных галочками.
         */
        if (
            selectedResources.indexOf(
                resourceId
            ) === -1
        ) {
            continue;
        }


        html +=
            rrbsBuildMonthResourceRow(
                resource,
                year,
                month
            );
    }


    html +=
        '</div>';


    $('#rrbs_month_plan')
        .html(html);


    /*
     * Клик по отпуску.
     *
     * Пока открываем задачу Redmine,
     * так же, как сейчас
     * работает годовой план.
     */
    $('#rrbs_month_plan')
        .off(
            'click',
            '.rrbs-month-event'
        )
        .on(
            'click',
            '.rrbs-month-event',
            function() {

                var eventId =
                    $(this)
                        .data(
                            'event-id'
                        );

                if (!eventId) {
                    return;
                }

                window.location.href =
                    baseUrl +
                    '/issues/' +
                    eventId;
            }
        );
}
	
	function rrbsEventIntersectsYear(event, year) {
    var startDate = rrbsParseDate(event.start);
    var endDate = rrbsParseDate(event.end);

    if (!startDate || !endDate) {
        return false;
    }

    var yearStart = new Date(year, 0, 1);
    var yearEnd = new Date(year, 11, 31);

    return startDate <= yearEnd && endDate >= yearStart;
}
	function rrbsGetResourceEvents(resourceId, year) {
    if (
        !eventsJSON ||
        !eventsJSON.events ||
        !Array.isArray(eventsJSON.events)
    ) {
        return [];
    }

    return eventsJSON.events.filter(function(event) {
        return (
            String(event.resource_id) === String(resourceId) &&
            rrbsEventIntersectsYear(event, year)
        );
    });
}
	function rrbsBuildMonthsHeader() {
    var monthWeeks = [
        5, 4, 4, 5,
        4, 4, 5, 4,
        4, 5, 4, 4
    ];

    var html = '';

    html += '<div class="rrbs-plan-months-row">';
    html += '<div class="rrbs-plan-name-header">Сотрудник</div>';
    html += '<div class="rrbs-plan-months">';

    for (var month = 0; month < 12; month++) {
        html += '<div class="rrbs-plan-month" ' +
            'style="grid-column: span ' + monthWeeks[month] + ';">';

        html += rrbsMonthNames[month];

        html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    return html;
}
	function rrbsBuildWeeksHeader() {
    var html = '';

    html += '<div class="rrbs-plan-weeks-row">';
    html += '<div class="rrbs-plan-name-header"></div>';
    html += '<div class="rrbs-plan-weeks">';

    for (var week = 1; week <= 52; week++) {
        html += '<div class="rrbs-plan-week-number">';
        html += week;
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    return html;
}
	function rrbsBuildResourcePlanRow(resource, year) {
    var resourceName = resource[0];
    var resourceId = resource[1];

    var resourceEvents = rrbsGetResourceEvents(
        resourceId,
        year
    );

    var html = '';

    html += '<div class="rrbs-plan-resource-row">';

    html += '<div class="rrbs-plan-resource-name">';
    html += $('<div>').text(resourceName).html();
    html += '</div>';

    html += '<div class="rrbs-plan-timeline">';

    /*
     * Сетка из 52 недель.
     */
    for (var week = 1; week <= 52; week++) {
        html +=
		'<div class="rrbs-plan-week-cell" ' +
        'style="grid-column: ' +
        week +
        ';"></div>';
    }

    /*
     * Полосы отпусков.
     */
    resourceEvents.forEach(function(event) {
        var startDate = rrbsParseDate(event.start);
        var endDate = rrbsParseDate(event.end);

        if (!startDate || !endDate) {
            return;
        }

        var yearStart = new Date(year, 0, 1);
        var yearEnd = new Date(year, 11, 31);

        /*
         * Обрезаем отпуск границами выбранного года.
         */
        if (startDate < yearStart) {
            startDate = yearStart;
        }

        if (endDate > yearEnd) {
            endDate = yearEnd;
        }

        var startWeek = rrbsGetWeekNumber(startDate);
        var endWeek = rrbsGetWeekNumber(endDate);

        /*
         * Даты конца декабря могут попасть в неделю №1
         * следующего года.
         */
        if (
            endDate.getMonth() === 11 &&
            endWeek === 1
        ) {
            endWeek = 52;
        }

        if (startWeek < 1) {
            startWeek = 1;
        }

        if (startWeek > 52) {
            startWeek = 52;
        }

        if (endWeek < startWeek) {
            endWeek = startWeek;
        }

        if (endWeek > 52) {
            endWeek = 52;
        }

        var durationWeeks = endWeek - startWeek + 1;

        var eventColor = event.color || '#3a87ad';
        var eventTextColor = event.textColor || '#ffffff';

        var eventTitle =
            (event.assigned_to || resourceName) +
            ': ' +
            moment(startDate).format('DD.MM.YYYY') +
            ' – ' +
            moment(endDate).format('DD.MM.YYYY');

        html += '<div class="rrbs-plan-event"';

        html += ' style="' +
            'grid-column: ' + startWeek +
            ' / span ' + durationWeeks + ';' +
            'background-color: ' + eventColor + ';' +
            'color: ' + eventTextColor + ';"';

        html += ' data-event-id="' + event.id + '"';

        html += ' title="' +
            $('<div>').text(eventTitle).html() +
            '">';

        /*
         * На коротких отпусках текст может не поместиться.
         * Поэтому можно вывести только имя или оставить пусто.
         */
        html += $('<div>')
            .text(event.assigned_to || resourceName)
            .html();

        html += '</div>';
    });

    html += '</div>';
    html += '</div>';

    return html;
}
	function rrbsRenderYearPlan(year) {
    rrbsPlanYear = year;

    $('#rrbs_plan_year').text(year);

    var html = '';

    html += '<div class="rrbs-plan-wrapper">';

    html += rrbsBuildMonthsHeader();
    html += rrbsBuildWeeksHeader();

	var selectedResources = GetCookie_array('r_selected');

	for (var i = 0; i < rrbs_resources.length; i++) {
    	var resource = rrbs_resources[i];
    	var resourceId = String(resource[1]);

    /*
     * Если слева выбраны сотрудники,
     * показываем только выбранных.
     *
     * Если не выбрана ни одна галочка,
     * строки сотрудников не показываем.
     */
    	if (selectedResources.indexOf(resourceId) === -1) {
        continue;
    	}

    	html += rrbsBuildResourcePlanRow(
        	resource,
        	year
    	);
	}

    html += '</div>';

    $('#rrbs_year_plan').html(html);

    $('#rrbs_year_plan')
        .off('click', '.rrbs-plan-event')
        .on('click', '.rrbs-plan-event', function() {
            var eventId = $(this).data('event-id');

            if (!eventId) {
                return;
            }

            window.location.href =
                baseUrl + '/issues/' + eventId;
        });
}
	
	$('#rrbs_prev_year').click(function() {
    rrbsPlanYear--;

    $('#rrbs_plan_year').text(rrbsPlanYear);

	$('#calendar .fc-center h2')
        .text(rrbsPlanYear + ' год');

    getEventsJSON(
        0,
        rrbsPlanYear + '-01-01'
    );
});

$('#rrbs_next_year').click(function() {
    rrbsPlanYear++;

    $('#rrbs_plan_year').text(rrbsPlanYear);
	
    $('#calendar .fc-center h2')
        .text(rrbsPlanYear + ' год');

    getEventsJSON(
        0,
        rrbsPlanYear + '-01-01'
    );
});
	
	
	// fullcalendarの基本設定
	var loadCalendar = function() {
		$('#calendar').fullCalendar({
			locale: current_lang.split('-')[0].split('_')[0],

			customButtons: {
            yearPlan: {
                text: 'Год',

                click: function() {
					
					rrbsViewMode = 'year';

                    // Оставляем toolbar FullCalendar,
                    // скрываем только месячную сетку.
                    $('#calendar .fc-view-container').hide();

                    // Скрываем месячный план.
                    $('#rrbs_month_plan').hide();

                    // Показываем годовой план.
                    $('#rrbs_year_plan').show();

                    // Показываем управление годом.
                    $('#rrbs_year_controls').hide();

                    // Меняем центральный заголовок.
                    $('#calendar .fc-center h2')
                        .text(rrbsPlanYear + ' год');

                    // Состояние кнопок.
                    $('.fc-month-button')
                        .removeClass('fc-state-active');

                    $('.fc-yearPlan-button')
                        .addClass('fc-state-active');

                    // Рисуем год.
                    rrbsRenderYearPlan(
                        rrbsPlanYear
                    );

                    // Загружаем события за год.
                    getEventsJSON(
                        0,
                        rrbsPlanYear + '-01-01'
                    );
                }
            }
        },
			
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,yearPlan'
				// オプション:  month,basicWeek,basicDay,agendaWeek,agendaDay,listWeek
			},
			defaultView: 'month',
			navLinks: true, // can click day/week names to navigate views
			editable: true,
			eventLimit: false, // allow "more" link when too many events
			businessHours: true, // display business hours
			businessHours: { 
				dow: [ 1, 2, 3, 4, 5 ], // days of week. an array of zero-based day of week integers (0=Sunday)
				start: '08:00:00',
				end: '19:00:00',
			},
			
			// 曜日表示の設定
			firstDay: 1, //週表示の始まり。0:日曜。TODO:redmine全体設定とってこれると良い
			
			
			allDaySlot: false,  // 終日スロットを表示
			axisFormat: 'H(:mm)',  // スロットの時間の書式
			//slotMinutes: 15,  // スロットの分
			//snapMinutes: 15,  // 選択する時間間隔
			timeFormat: 'H:mm',  // 時間の書式
			//scrollTime: '09:00:00',  // スクロール開始時間
			minTime: '06:00:00',  // 最小時間
			maxTime: '22:00:00',  // 最大時間
			
			
			//
			// eventにmouseoverしたときホップアップを表示(qtip利用)
			//
			eventMouseover: function (data, event, view) {
				tooltip = '<div class="tooltiptopicevent" style="width:auto;height:auto;background:#feb811;position:absolute;z-index:10001;padding:10px 10px 10px 10px ;  line-height: 200%;">'
							 + label_rrbs_subject      + ': ' + data.title + '</br>' 
							 + label_rrbs_resource     + ': ' + data.resource + '</br>'
							 + label_rrbs_assigned_to  + ': ' + data.assigned_to + '</br>' 
							 + label_rrbs_start_time   + ': ' + data.start.toISOString().substr(0,16) + '</br>' 
							 + label_rrbs_end_time     + ': ' + data.end.toISOString().substr(0,16) + '</br>'
							 + label_rrbs_issueid      + ': ' + data.id + '</br>'
						if (fieldIdText != ''){
							tooltip = tooltip + label_rrbs_booking_text + ': ' + data.booking_text + '</br>' 
						}
						tooltip = tooltip + '</div>';
				$("body").append(tooltip);
				$(this).mouseover(function (e) {
					$(this).css('z-index', 10000);
					$('.tooltiptopicevent').fadeIn('500');
					$('.tooltiptopicevent').fadeTo('10', 1.9);
				}).mousemove(function (e) {
					$('.tooltiptopicevent').css('top', e.pageY + 10);
					$('.tooltiptopicevent').css('left', e.pageX + 20);
				});
			},
			
			//qtipの終了処置
			eventMouseout: function (data, event, view) {
				$(this).css('z-index', 8);
				$('.tooltiptopicevent').remove();
			},
			dayClick: function () {
				//tooltip.hide()
			},
			eventResizeStart: function () {
				//tooltip.hide()
			},
			eventDragStart: function () {
				//tooltip.hide()
			},
			viewDisplay: function () {
				//tooltip.hide()
			},
			
			
			// eventをクリックして編集する
              eventClick : function(calEvent, jsEvent, view){
                  $('.rrbs_saveModal').dialog({
                      title : langUpdateEvent,
                      modal : true,
                      resizable : false,
                      draggable : true,
                      width : 450,
                      show : 'blind',
                      hide : 'explode'
                  });
                  $('.rrbs_saveModal').dialog();
                  $('#selected_resource').val(calEvent.resource_id);
                  $('#booking_start_date').val(calEvent.start.format(long_date_format));
                  $('#booking_end_date').val(calEvent.end.format(long_date_format));
                  $('#subject').val(calEvent.title);
                  $('#event_id').val(calEvent.id);
                  $('#start_time').val(calEvent.start.format('HH:mm'));
                  $('#end_time').val(calEvent.end.format('HH:mm'));
				  $('#booking_text').val(calEvent.booking_text);

					//$('#selected_issue_status').val(calEvent.status_id);
					
					
					//$('#delete_booking').hide();  // 台帳管理の安全性から当面隠す
					
                  $('#subject').focus();                
              },
              
			// 新規作成
			dayClick : function(date, calEvent, jsEvent, view) {
			
			
				if ("Anonymous" == $('#user_name').val() || "Anonym" == $('#user_name').val()) {
					console.log('User not logged in');
					alert("ログインしてください");
					return false;
				}
				
				
				if (!user_can_add) {
					console.log('User cannot add tickets to project');
					alert("ログインしてください");
					return false;
				}
				
				//if (!allowEdit) {
				//	console.log('Loading not finished');
				//	return false;
				//}
				
				//if (isPastDay(date)) {
				//	jAlert(langWarningCreatePast, langInfo);
				//	return false;
				//} 
					
                  
                  
                  $('#event_id').val(0);
                  $('#selected_resource').val($('input[name="rrbs_resource_checkbox"]:checked').val());
                  
                  $('#booking_start_date').val(date.format(long_date_format));
                  $('#booking_end_date').val(date.format(long_date_format));
                  $('#subject').val("");
                  $('#start_time').val(date.format('HH:mm'));
                  $('#end_time').val(date.format('HH:mm'));
                  
                  //$('#selected_issue_status').val(1);
                  
                  $('.rrbs_saveModal').dialog({
                      title : langCreateEvent,
                      modal : true,
                      resizable : false,
                      draggable : true,
                      width : 450,
                      show : 'blind',
                      hide : 'explode'
                  });
                  $('.rrbs_saveModal').dialog('open');
                  
                  //$('#delete_booking').hide();
                  $('#subject').focus();
			},
			
			//カレンダー表示にあわせevents再読み込み
			viewRender: function(currentView){
			
				//calendarの表示している日時を取得
				//.fullCalendar('getDate')の値は，ボタン作動後の値となっている
				var moment_calendar = $('#calendar').fullCalendar('getDate');
					moment_calendar = moment_calendar.format('YYYY-MM-01');

				var planDate =
    				$('#calendar')
        				.fullCalendar(
            				'getDate'
        				);

                if (rrbsViewMode === 'month') {

    				rrbsPlanYear =
        				planDate.year();

    				rrbsPlanMonth =
        				planDate.month();

	    			rrbsRenderMonthPlan(
        				rrbsPlanYear,
        				rrbsPlanMonth
    				);
				}
				
				//cookieから前回の日付を取得
				var moment_cookie = GetCookie("moment");
				
				
				//高速化のためcookie日付から更新有無を判断
				if ( moment_cookie != null ) {
					if ( moment_calendar < moment_cookie ) {
						console.log("cookieよりも古い日付を表示しているため，eventsJSON再読み込み");
						getEventsJSON(0, moment_calendar);	//eventsJSONの読み込み
						
						//cookie保存
						document.cookie = 'moment=' + moment_calendar + '; max-age=300';
					}
				}else{
					//cookieないときはeventsJSONの読み込み
					getEventsJSON(0, moment_calendar);
					
					//cookie保存
					document.cookie = 'moment=' + moment_calendar + '; max-age=300';
				}
			},
			
			
			
			events: eventsJSON,     // fullcalendarにeventsを設定。最初は空
		});
	};
	
	//calendar描画時は，eventsJSON再読み込み
	var d = new Date(); //今日
		moment_now = d.getFullYear() + '-' + ("0"+(d.getMonth() + 1)).slice(-2) + '-01'; //YYYY-MM-01
		getEventsJSON(0, moment_now);
		
		//cookie保存
		document.cookie = 'moment=' + moment_now + '; max-age=300';

	loadCalendar();		// 描画


/*
 * Перехват штатных кнопок FullCalendar.
 */
$('.fc-prev-button')
    .off('click')
    .on('click', function() {

        if (rrbsViewMode === 'year') {

            rrbsPlanYear--;

            $('#calendar .fc-center h2')
                .text(rrbsPlanYear + ' год');

            rrbsRenderYearPlan(
                rrbsPlanYear
            );

            getEventsJSON(
                0,
                rrbsPlanYear + '-01-01'
            );

            return;
        }

        $('#calendar')
            .fullCalendar('prev');
    });


$('.fc-next-button')
    .off('click')
    .on('click', function() {

        if (rrbsViewMode === 'year') {

            rrbsPlanYear++;

            $('#calendar .fc-center h2')
                .text(rrbsPlanYear + ' год');

            rrbsRenderYearPlan(
                rrbsPlanYear
            );

            getEventsJSON(
                0,
                rrbsPlanYear + '-01-01'
            );

            return;
        }

        $('#calendar')
            .fullCalendar('next');
    });


$('.fc-today-button')
    .off('click')
    .on('click', function() {

        if (rrbsViewMode === 'year') {

            rrbsPlanYear =
                new Date().getFullYear();

            $('#calendar .fc-center h2')
                .text(rrbsPlanYear + ' год');

            rrbsRenderYearPlan(
                rrbsPlanYear
            );

            getEventsJSON(
                0,
                rrbsPlanYear + '-01-01'
            );

            return;
        }

        $('#calendar')
            .fullCalendar('today');
    });
	
	load_checkbox();

    /*
 * Возврат из годового режима
 * штатной кнопкой FullCalendar "Месяц".
 */
	$('#calendar').on(
    	'click',
    	'.fc-month-button',
    	function() {

			rrbsViewMode = 'month';

        // Возвращаем месячную область FullCalendar.
        	$('#calendar .fc-view-container').hide();

        // Показываем месячный план.
        	$('#rrbs_month_plan').show();

        // Скрываем годовой.
        	$('#rrbs_year_plan').hide();
        	$('#rrbs_year_controls').hide();

        // Получаем текущую дату FullCalendar.
        	var currentDate =
            	$('#calendar').fullCalendar('getDate');

        	rrbsPlanYear =
            	currentDate.year();

        	rrbsPlanMonth =
            	currentDate.month();

        // Возвращаем штатный заголовок месяца.
        	$('#calendar .fc-center h2')
            	.text(
                	currentDate.format('MMMM YYYY')
            	);

        // Состояние кнопок.
        	$('.fc-yearPlan-button')
            	.removeClass('fc-state-active');

        	$('.fc-month-button')
            	.addClass('fc-state-active');

        // Перерисовываем месяц.
        	rrbsRenderMonthPlan(
            	rrbsPlanYear,
            	rrbsPlanMonth
        );
    }
);
	
	$('#rrbs_year_plan').hide();
    $('#rrbs_year_controls').hide();

    $('#calendar').show();
    $('#rrbs_month_plan').show();
	
	$('#rrbs_plan_year').text(rrbsPlanYear);
}); 
