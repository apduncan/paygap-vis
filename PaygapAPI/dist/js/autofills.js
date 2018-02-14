$(document).ready(function() {
    var companyNames = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('co_name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        //prefetch: './companies/name/%QUERY',
        remote: {
            url: './companies/name/%QUERY',
            wildcard: '%QUERY'
        }
    });
    
    $('#typebox').typeahead({
            highlight: true
        }, {
        name: 'company-names',
        display: 'co_name',
        source: companyNames,
        limit: 20,
        templates: {
            suggestion: function(data) {
                console.log(data)
                return '<p><a href="./companies/' + data.co_hash + '">' + data.co_name + '</a></p>'
            },
            empty: '<p>No results</p>'
        }
    });
});