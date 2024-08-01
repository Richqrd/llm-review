document.addEventListener("DOMContentLoaded", function() {
    fetch('http://127.0.0.1:5000/api/model')
        .then(response => response.json())
        .then(data => {
            const model = data.model;
            const responseContainer = document.getElementById('response-container');
            responseContainer.innerHTML = `
                Powered by ${model}.
            `;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];
        var urlPattern = /^https:\/\/.*\.covidence\.org\/reviews\/.*\/review_studies\/screen.*$/;
        var specificText = document.getElementById('mainDesc');

        if (urlPattern.test(tab.url)) {
            specificText.innerHTML = "Press 'j' to toggle highlight visibility. 'k' to move up questions, and 'l' to move down."
        } else {
            specificText.innerHTML = "Please navigate to Covidence TiAb screening to use this extension."
        }
    });
    


});