

$(document).ready(function () {    
    $.getJSON("assets/jsons/result.json", function (result) {
        $.each(result, function (i, field) {
            $("#byFiles").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
    $.getJSON("assets/locales/en.json", function (result) {
        $.each(result, function (i, field) {
            $("#en").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
     $.getJSON("assets/locales/fr.json", function (result) {
        $.each(result, function (i, field) {
            $("#fr").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
      $.getJSON("assets/jsons/countries.json", function (result) {           
           $.each(result, function (i, field) {
            $("#country").append(JSON.stringify(field));
        });
    });
});
 