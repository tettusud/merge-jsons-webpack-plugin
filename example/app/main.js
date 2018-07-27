

$(document).ready(function () {    
    $.getJSON("files/file.json", function (result) {
        $.each(result, function (i, field) {
            $("#byFiles").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
    $.getJSON("groupBy/locales/en.json", function (result) {
        $.each(result, function (i, field) {
            $("#en").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
     $.getJSON("groupBy/locales/fr.json", function (result) {
        $.each(result, function (i, field) {
            $("#fr").append("<strong>"+i+"</strong>:"+field + " <p>");
        });
    });
      $.getJSON("groupBy/countries/countries.json", function (result) {   
        
       document.getElementById("country").innerHTML=JSON.stringify(result,undefined,10)
    });
});

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}