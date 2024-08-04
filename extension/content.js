console.log("LLM Review Running")

// const API = 'http://127.0.0.1:8080'
const API = 'https://llm-image-uusnu6kzea-uc.a.run.app'
const score_threshold = 0.000
const MAX_QUESTIONS = 7

// ------------- TEXT EXTRACTION --------------

// Function to extract text from elements within spans
function extractTextFromElement(element) {
    // Use Array.from to create an array from the NodeList
    return Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)
        .map(node => node.nodeType === Node.TEXT_NODE ? node.textContent : extractTextFromElement(node))
        .join('');
}

// Select the div with class "studies-list"
const studiesListDiv = document.querySelector('div.studies-list');

// Select the table with class "studies screen"
const table = studiesListDiv.querySelector('table.studies.screen');

// Select all tbody elements
const tbodies = table.querySelectorAll('tbody');

// Initialize an array to store the extracted text
const extractedTexts = []; // Contains string for LLM processing
const paragraphs = []; // Contains paragraph object
let paragraphHash = {}

// Iterate through each tbody element to extrac texts
tbodies.forEach(tbody => {
    // Find the tr element with id starting with "study-"
    const tr = tbody.querySelector('tr[id^="study-"]');
    
    if (tr) {
        // Extract the study_id from the tr id
        const studyIdMatch = tr.id.match(/^study-(\d+)$/);
        let study_id = studyIdMatch ? parseInt(studyIdMatch[1], 10) : 0;
        study_id = study_id.toString();

        // Find the td element with class "info study"
        const td = tr.querySelector('td.info.study');
        
        if (td) {
            // Find the div with class "references references-1"
            const referencesDiv = td.querySelector('div.references.references-1');
            
            if (referencesDiv) {
                // Find the div with class "abstract"
                const abstractDiv = referencesDiv.querySelector('div.abstract');
                
                if (abstractDiv) {
                    // Extract text from the paragraph element
                    const paragraph = abstractDiv.querySelector('p');
                    
                    if (paragraph) {
                        // Extract text including text within spans
                        let text = extractTextFromElement(paragraph);
                        // Remove all newline characters
                        text = text.replace(/\n+/g, ' ').trim();
                        extractedTexts.push([study_id, text]);
                        // Save paragraph object
                        paragraphs.push(paragraph);
                        // Save to paragraph hash
                        paragraphHash[study_id] = paragraph;
                    }
                }
            }
        }
    }
});

// Print the extracted texts
console.log(extractedTexts);


// ------------- Styling --------------

// Function to inject a <link> element for CSS
const injectCss = (href) => {
const link = document.createElement('link');
link.href = href;
link.rel = 'stylesheet';
link.type = 'text/css';
document.head.appendChild(link);
};

// Function to inject a <script> element for JavaScript
const injectScript = (src) => {
const script = document.createElement('script');
script.src = src;
script.async = true; // Optional: to load script asynchronously
document.head.appendChild(script);
};

// Inject DaisyUI CSS
// injectCss('https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css');

// Inject Tailwind CSS
// injectScript('https://cdn.tailwindcss.com');


// ------------- Create Floating Div --------------

(function() {
    // Create the floating div
    var floatingDiv = document.createElement('div');

    // Set initial styles for the floating div
    floatingDiv.style.position = 'fixed';
    floatingDiv.style.left = '0';
    floatingDiv.style.top = '25%'; // Center vertically on the left third
    floatingDiv.style.width = '18%'; // 20% of the screen width
    floatingDiv.style.height = '50%'; // 50% of the website height
    floatingDiv.style.backgroundColor = 'white'; // White background
    floatingDiv.style.border = '1px solid lightgrey'; // Thin light grey border
    floatingDiv.style.zIndex = '9999'; // Ensure it's on top of other elements
    floatingDiv.style.pointerEvents = 'auto'; // Make it interactive
    floatingDiv.style.display = 'block'; // Start visible
    floatingDiv.style.padding = '10px'; // Add some padding
    floatingDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6)'; // Box shadow with slight offset and blur
    floatingDiv.style.overflow = 'hidden'; //Hide overflowing content
    floatingDiv.id = 'floatingDiv';
    floatingDiv.style.transition = 'opacity 0.5s ease';


    // Attach the Shadow DOM
    const shadowRoot = floatingDiv.attachShadow({ mode: 'open' });

    // Create a style element for DaisyUI CDN
    const style = document.createElement('style');
    style.textContent = `
    @import "https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css";
    `;

    // Append the style to the shadow root
    shadowRoot.appendChild(style);


    // Move existing content into the shadow root
    let floatingContent = document.createElement('div');
    floatingContent.id = 'floatingContent';
    shadowRoot.appendChild(floatingContent);


    // Create container for question inputs
    var questionContainer = document.createElement('div');
    floatingContent.appendChild(questionContainer);

    // Function to create a new question input
    function createQuestionInput(value = '') {
        var input = document.createElement('input');
        input.type = 'text';
        input.style.width = '95%'; // Take up 95% of the width
        input.style.margin = '5px 0'; // Add some margin for spacing
        input.style.border = '1px solid #000000'; // Slightly darker border
        input.style.display = 'block'; // Ensure it's a block element
        input.style.marginLeft = 'auto'; // Center horizontally
        input.style.marginRight = 'auto'; // Center horizontally
        input.style.fontSize = '1em'
        // input.className = 'input input-bordered w-full max-w-xs';
        input.value = value;

        // Save the state when the input is changed
        // input.addEventListener('input', saveState);

        questionContainer.appendChild(input);
    }

    // Function to save the state of the question inputs
    function saveState() {
        var questionInputs = questionContainer.getElementsByTagName('input');
        var questionValues = [];
        for (var i = 0; i < questionInputs.length; i++) {
            questionValues.push(questionInputs[i].value);
        }
        chrome.storage.local.set({ questionValues: questionValues }, function() {
            console.log('State saved.');
        });
    }
    

    // Function to load the state of the question inputs
    function loadState() {
        chrome.storage.local.get(['questionValues'], function(result) {
            var savedQuestionValues = result.questionValues;
            if (savedQuestionValues) {
                for (var i = 0; i < savedQuestionValues.length; i++) {
                    createQuestionInput(savedQuestionValues[i]);
                }
                inputCount = savedQuestionValues.length; // Set input count based on loaded state
            } else {
                createQuestionInput(); // Create at least one input if no saved state
            }
        });
    }

    // Create the button to add new question inputs
    // var addButton = document.createElement('button');
    // addButton.innerText = 'Add question';
    // addButton.style.display = 'block'; // Make sure it's a block element
    // addButton.style.position = 'absolute';
    // addButton.style.marginTop = '10px'; // Add some margin for spacing
    // addButton.className = 'outline';
    // addButton.style.left = '34%'; // Center horizontally
    // addButton.style.transform = 'translateX(-50%)'; // Adjust for centering
    // addButton.style.fontSize = "1em";
    // floatingContent.appendChild(addButton);

    // // Create the button to delete the last question input
    // var deleteButton = document.createElement('button');
    // deleteButton.innerText = 'Delete';
    // deleteButton.style.display = 'block'; // Make sure it's a block element
    // deleteButton.style.position = 'absolute';
    // deleteButton.style.marginTop = '10px'; // Add some margin for spacing
    // deleteButton.className = 'outline';
    // deleteButton.style.left = '70%'; // Center horizontally
    // deleteButton.style.transform = 'translateX(-50%)'; // Adjust for centering
    // deleteButton.style.fontSize = "1em";
    // floatingContent.appendChild(deleteButton);

    // Create a container for the buttons
    var buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.flexDirection = 'row';
    buttonsContainer.className = 'buttons-container';
    floatingContent.appendChild(buttonsContainer);

    // Media query function
    function applyResponsiveStyles() {
        if (window.innerWidth <= 1000) {
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.alignItems = 'center';
        } else {
            buttonsContainer.style.flexDirection = 'row';
            buttonsContainer.style.alignItems = 'flex-start';
            
        }

        if (window.innerWidth <= 1300) { 
            addButton.innerText = 'Add';
        } else {
            addButton.innerText = 'Add question';
        }
    }

    // Create the add button
    var addButton = document.createElement('button');
    addButton.innerText = 'Add question';
    addButton.style.display = 'inline-block';
    addButton.style.margin = '10px 5px';
    addButton.style.fontSize = '1em';
    addButton.className = 'outline';
    buttonsContainer.appendChild(addButton);

    // Create the delete button
    var deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.style.display = 'inline-block';
    deleteButton.style.margin = '10px 5px';
    deleteButton.style.fontSize = '1em';
    deleteButton.className = 'outline';
    buttonsContainer.appendChild(deleteButton);

    // Apply styles initially and on window resize
    applyResponsiveStyles();
    window.addEventListener('resize', applyResponsiveStyles);




    // Create the submit button
    var submitButton = document.createElement('button');
    submitButton.id = 'submit-button'; // Assign an ID for easier reference
    submitButton.innerText = 'Submit new questions';
    submitButton.style.display = 'block'; // Make sure it's a block element
    submitButton.style.marginTop = '10px'; // Add some margin for spacing
    submitButton.style.width = '80%';
    submitButton.style.position = 'absolute'; // Position the button absolutely

    submitButton.style.left = '50%'; // Center horizontally
    submitButton.style.transform = 'translateX(-50%)'; // Adjust for centering
    submitButton.style.bottom = '5%'; // Position 10% from the bottom

    submitButton.style.fontSize = '1em';
    floatingContent.appendChild(submitButton);

    // Add event listener to the add button
    var inputCount = 0;
    addButton.addEventListener('click', function() {
        if (inputCount < MAX_QUESTIONS) {
            createQuestionInput();
            inputCount++;
        }
    });

    // Add event listener to the delete button
    deleteButton.addEventListener('click', function() {
        if (inputCount > 1) {
            questionContainer.removeChild(questionContainer.lastChild);
            inputCount--;
        }
    });

    // Add event listener to the submit button
    submitButton.addEventListener('click', function() {
        if (submitButton.innerHTML == "Success") {
            return
        }

        var questionInputs = questionContainer.getElementsByTagName('input');
        var questions = [];
        for (var i = 0; i < questionInputs.length; i++) {
            questions.push(questionInputs[i].value);
        }

        //Slice for first column in 2d array
        id_values = extractedTexts.map(row => row[0]);

        //Slice for second column in 2d array
        text_values = extractedTexts.map(row => row[1]);

        // Prepare initial message object
        const init_message = {
            questions: questions,
            ids: [id_values[0]],
            extractedTexts: [text_values[0]]
        };

        // Prepare message object
        const message = {
            questions: questions,
            ids: id_values,
            extractedTexts: text_values
        };

        qaPost(init_message, submitButton, saveState);
        qaPost(message, submitButton, saveState, true);
        
    });

    // Append the floating div to the body
    document.body.appendChild(floatingDiv);

    // Load the state when the script is loaded
    loadState();
})();

// Send POST request
function qaPost(message, submitButton, saveState, final=false) {
    // Show loading text
    submitButton.textContent = 'Loading...';
    submitButton.disabled = true;

    fetch(API + '/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    })
    .then(response => response.json())
    .then(data => {
        if (data['para_answers'].length > 0) {

            console.log('Success:', data);

            //highlight based on message
            chrome.storage.local.set({ processedTexts: data });
            refreshHighlights()

            saveState(); // Save state after pressing submit button
            
            if(final == true) {
                // Update popup to show success message
                submitButton.textContent = 'Success';
                submitButton.disabled = false;
            }
            

        } else {
            console.log('No question or no extracted text');
            // Update popup to indicate issue
            submitButton.textContent = 'No data';
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        // Update popup to show failure message
        submitButton.textContent = 'Failed';
        submitButton.disabled = false;
    });
}


// ------------- Extraneous functions --------------

let question_index = 0

// Function to handle keydown events
function handleKeyDown(event) {
    // Select the div with the ID 'content'
    let floatingDiv = document.getElementById('floatingDiv');

    // Select all input elements inside the content
    let inputs = floatingDiv.shadowRoot.querySelectorAll('input');

    // Check if the keydown event occurred inside an input element
    if (event.target == floatingDiv) {
        // Check if questions have been modified
        changeButton = false
        chrome.storage.local.get(['questionValues'], function(result) {
            let questionValues = []
            for (let i = 0; i < inputs.length; i++) {
                questionValues.push(inputs[i].value);
            }

            let savedQuestionValues = result.questionValues;
            if (savedQuestionValues.length == questionValues.length) {
                for (let i = 0; i < savedQuestionValues.length; i++) {
                    if(savedQuestionValues[i] != questionValues[i]) {
                        changeButton = true
                    }
                }
                
            } else {
                changeButton = true
            }
            if (changeButton) {
                let submitButton = floatingDiv.shadowRoot.getElementById('submit-button');
                submitButton.innerHTML = "Submit new questions"
            } else {
                let submitButton = floatingDiv.shadowRoot.getElementById('submit-button');
                submitButton.innerHTML = "Success"
            }
        });

        return; // Exit the function if typing in an input
    }

    const numInputs = inputs.length; // Get the number of input elements

    if (event.key === 'k' && floatingDiv.style.display !== 'none') {
        // Decrease index if not at the minimum
        if (question_index > 0) {
            question_index--;
        }
        refreshHighlights();
    } else if (event.key === 'l' && floatingDiv.style.display !== 'none') {
        // Increase index if not at the maximum
        if (question_index < numInputs - 1) {
            question_index++;
        }
        refreshHighlights();
    } else if (event.key === 'j') {
        // Toggle div visibility
        floatingDiv.style.display = (floatingDiv.style.display === 'none') ? 'block' : 'none';
        

        if (floatingDiv.style.display === 'none') {
            for (let i = 0; i< paragraphs.length; i++) {
                reformatted = formatText(extractTextFromElement(paragraphs[i]), 'UWOIERDS')
                paragraphs[i].innerHTML = reformatted
            }
        } else {
            refreshHighlights();
        }
    }

    
}

function refreshHighlights(){
    // Select the div with the ID 'floatingDiv'
    let floatingDiv = document.getElementById('floatingDiv');

    // Select all input elements inside the floatingDiv
    let inputs = floatingDiv.shadowRoot.querySelectorAll('input');

    // Reset the background color of all inputs
    inputs.forEach(input => {
        input.style.backgroundColor = ''; // Remove any previously set background color
    });

    // Set the background color for the input at the current index
    if (inputs[question_index]) {
        inputs[question_index].style.backgroundColor = '#cae9ff'; // Very light blue

        // Call highlightFunc with the updated index
        highlightFunc(question_index);
    }
    console.log(question_index)
}

function highlightFunc(qind=0) {

    chrome.storage.local.get('processedTexts', (result) => {
        const message = result.processedTexts || [];
        console.log(message)
        para_answers = message['para_answers']
        if (para_answers.length > 0) {
            console.log('Retrieved QAs from local storage:', para_answers);

            

            // Loop through each paragraph and create highlights
            for (let i = 0; i < para_answers.length; i++) {

                // Check to see if qind fits
                if (qind >= para_answers[i].length) {
                    return 
                }

                let p = paragraphHash[para_answers[i][qind].id]
                let a = para_answers[i][qind].answer
                if(p) {
                    reformatted = formatText(extractTextFromElement(p), a)
                    p.innerHTML = reformatted
                }
                
            }
            console.log('Succesful reformatting')
            
        }
    });
}

function formatText(originalStr, searchStr) {
    // Function to normalize a string by removing punctuation and whitespace
    function normalizeString(str) {
        return str.toLowerCase().replace(/[\s\p{P}]/gu, '');
    }

    // Normalize both the original string and the search string
    const normalizedOriginal = normalizeString(originalStr);
    const normalizedSearch = normalizeString(searchStr);

    // Find the start index of the search string in the normalized original string
    const startIndex = normalizedOriginal.indexOf(normalizedSearch);

    // If the search string is not found, return the original string
    if (startIndex === -1) { 
        console.log('No match found')
        console.log(normalizedSearch)
        return originalStr;}

    // Function to get the substring from the original string based on the normalized indices
    function getSubstring(original, start, length) {
        let count = 0;
        for (let i = 0; i < original.length; i++) {
            if (!/\s|\p{P}/u.test(original[i])) {
                if (count === start) {
                    // TODO: just adding length is an imperfect fix because there may be differing whitespace
                    //       in the searchstring, but unimportant to functionality
                    return original.slice(i, i + length);
                }
                count++;
            }
        }
        return '';
    }

    // Get the length of the substring in the original string
    const length = searchStr.length;

    // Find the matching substring in the original string
    const matchSubstring = getSubstring(originalStr, startIndex, length);

    // Replace the matching substring with <mark> tags
    const highlightedStr = originalStr.replace(matchSubstring, `<mark>${matchSubstring}</mark>`);

    return highlightedStr;
}   


// Add event listener for keydown
document.addEventListener('keydown', handleKeyDown);






