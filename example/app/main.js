

$(document).ready(function () {    
    $.getJSON("assets/jsons/result.json", function (result) {
        $.each(result, function (i, field) {
            $("div").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
});
 