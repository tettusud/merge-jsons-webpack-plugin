

$(document).ready(function () {    
    $.getJSON("assets/jsons/result.json", function (result) {
        $.each(result, function (i, field) {
            $("#byFiles").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
    $.getJSON("assets/jsons/languages.json", function (result) {
        $.each(result, function (i, field) {
            $("#lang").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
      $.getJSON("assets/jsons/countries.json", function (result) {           
           $.each(result, function (i, field) {
            $("#country").append(JSON.stringify(field));
        });
    });
});
 