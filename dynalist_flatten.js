function onBodyLoad() {
    document.getElementById("docUrlInput").value=localStorage.getItem("dynalistDocUrl");

    var filterInput = localStorage.getItem("filterRegexp");
    if (filterInput) {
        document.getElementById("filterInput").value = filterInput;
    }

    var sortResults = localStorage.getItem("sortResults");
    if (sortResults) {
        document.getElementById("sortResultsSelect").value = sortResults;
    }
}

function onGoButtonClick() {

    var resultsPanel = document.getElementById("resultsPanel");
    var apiKey = document.getElementById("apiKeyInput").value;
    var docUrl = document.getElementById("docUrlInput").value;
    var filterRegexp = document.getElementById("filterInput").value;
    var sortResultsSelect = document.getElementById("sortResultsSelect");
    var sortResults = sortResultsSelect[sortResultsSelect.selectedIndex].value;

    // Error checking
    if (apiKey === "") {
        resultsPanel.innerHTML = "Please enter your <a href='https://apidocs.dynalist.io/'>API key</a>.";
        return;
    }
    if (docUrl === "") {
        resultsPanel.innerHTML = "Please enter the document URL.";
        return;
    }
    if (filterRegexp === "") {
        resultsPanel.innerHTML = "Please enter a filter. Hint: .* means 'show everything'";
        return;
    }

    localStorage.setItem("dynalistDocUrl", docUrl);
    localStorage.setItem("filterRegexp", filterRegexp);
    localStorage.setItem("sortResults", sortResults);

    // Get doc ID from URL
    var docIDRegexp = new RegExp("^https:\/\/dynalist.io\/d\/([^#]+)");
    var result = docIDRegexp.exec(docUrl);
    if (!result || result.length < 2) {
        resultsPanel.innerHTML="Error parsing doc URL.";
        return;
    }
    var docId = result[1];

    // Load document from Dynalist
    resultsPanel.innerHTML="Loading...";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            resultsPanel.innerHTML = "Processing...";
            var data = JSON.parse(xmlHttp.responseText);
            processData(data, resultsPanel, docId, filterRegexp, sortResults);
        }
    }
    xmlHttp.open("POST", "https://dynalist.io/api/v1/doc/read", true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify({
        token: apiKey,
        file_id: docId
    }));

}

function processData(data, resultsPanel, docId, filterRegexp, sortResults) {

    // Filter nodes
    var regexp = new RegExp(filterRegexp);
    var filteredNodes = [];
    if (filterRegexp !== "") {
        data["nodes"].forEach(function(node) {
            var result = regexp.exec(node.content + "\n" + node.note);
            if (result) {
                filteredNodes.push(node);
            }
        });
    }

    // Sort nodes
    var sortedNodes = filteredNodes.slice();
    if (sortResults == "title") {
        sortedNodes.sort(compareNodesByTitle);
    } else if (sortResults == "note") {
        sortedNodes.sort(compareNodesByNote);
    } else if (sortResults == "filter") {
        sortedNodes.sort(function(a, b) {
            var resulta = regexp.exec(a.content + "\n" + node.note);
            var resultb = regexp.exec(b.content = "\n" + node.note);
            if (resulta < resultb) {
                return -1;
            } else if (resulta > resultb) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    // Render nodes
    resultsPanel.innerHTML = "";
    sortedNodes.forEach(function(node) {

        var paragraph = document.createElement("p");
        resultsPanel.appendChild(paragraph);

        var link = document.createElement("a");
        link.classList.add("dynalistTitle");
        link.href = "https://dynalist.io/d/" + docId + "#z=" + node.id;
        link.target = "_blank";
        paragraph.appendChild(link);
        paragraph.appendChild(document.createElement("br"));

        if (node.note !== "") {
            var note = document.createElement("span");
            note.classList.add("dynalistNote");
            text = node.note;
            texts = text.split("\n");
            texts.forEach(function(line) {
                note.appendChild(document.createElement("br"));
                note.appendChild(document.createTextNode(line));
            });
            paragraph.append(note);
        }

        var text = document.createTextNode(node.content);
        link.appendChild(text);

    });
}

function compareNodesByTitle(a, b) {
    if (a.content < b.content) {
        return -1;
    } else if (a.content > b.content) {
        return 1;
    } else {
        return 0;
    }
}

function compareNodesByNote(a, b) {
    if (a.note < b.note) {
        return -1;
    } else if (a.note > b.note) {
        return 1;
    } else {
        return 0;
    }
}
