

// List of loading messages
const loadingMessages = [
  "Knowledge is on its way... Just a moment while we fetch the best insights for you!",
  "We're mining the data gems you need... Hold tight, answers are loading!",
  "Preparing the ultimate knowledge boost... Almost there!",
  "Hang in there! We're crafting the perfect set of answers for your query.",
  "Gathering insights... Just a few more seconds for the freshest data!"
];



function showLoader() {
  document.body.classList.add('loading');
  document.getElementById('loaderOverlay').style.display = 'flex';
  setLoadingText(); 
}

function hideLoader() {
  document.body.classList.remove('loading');
  document.getElementById('loaderOverlay').style.display = 'none';
}


function setLoadingText() {
  const loadingTextElement = document.getElementById('loadingText');
  const randomIndex = Math.floor(Math.random() * loadingMessages.length);
  loadingTextElement.textContent = loadingMessages[randomIndex];
}


const modeToggle = document.getElementById('modeToggle');


const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
  document.body.classList.add(currentTheme);
  if (currentTheme === 'dark-mode') {
    modeToggle.checked = true; 
  }
}


modeToggle.addEventListener('change', () => {
  if (modeToggle.checked) {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark-mode'); 
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    localStorage.setItem('theme', 'light-mode'); 
  }
});


document.getElementById('selectAll').addEventListener('change', function() {
  const checkboxes = document.querySelectorAll('.result-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = this.checked; 
  });
});


function showWelcomeMessage() {
  const welcomeMessage = document.createElement('div');
  welcomeMessage.id = 'welcomeMessage';
  welcomeMessage.innerHTML = '<h2>Welcome to Code Quest: Knowledge Base!</h2><p>Your one-stop solution for searching insights on various topics.</p>';
  welcomeMessage.style.position = 'fixed';
  welcomeMessage.style.top = '50%';
  welcomeMessage.style.left = '50%';
  welcomeMessage.style.transform = 'translate(-50%, -50%)';
  welcomeMessage.style.backgroundColor = '#0073e6';
  welcomeMessage.style.color = '#ffffff';
  welcomeMessage.style.padding = '20px';
  welcomeMessage.style.borderRadius = '10px';
  welcomeMessage.style.zIndex = '10000';
  welcomeMessage.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  welcomeMessage.style.transition = 'opacity 1s ease';

  
  document.body.classList.add('loading');

  document.body.appendChild(welcomeMessage);

  
  setTimeout(() => {
    welcomeMessage.style.opacity = '0';
    setTimeout(() => {
      welcomeMessage.remove();
      
      document.body.classList.remove('loading');
    }, 1000);
  }, 1200); 
}

window.onload = function() {
  showWelcomeMessage();
};

// Search function
async function search() {
  const queryInput = document.getElementById('query');
  const query = queryInput.value;
  const sortBy = document.getElementById('sortBy').value;
  const filterBy = document.getElementById('filterBy').value;

  showLoader();

  try {
    const response = await fetch(`/search?q=${query}&sort=${sortBy}&source=${filterBy}`);
    const data = await response.json();

    hideLoader();

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (data.stackOverflow.length > 0) {
      data.stackOverflow.forEach(result => {
        const resultBox = document.createElement('div');
        resultBox.classList.add('result-box');
        resultBox.innerHTML = `
          <h4>${result.title}</h4>
          <p>${result.summary}</p>
          <a href="${result.link}" target="_blank">View on Stack Overflow</a>
          <input type="checkbox" class="result-checkbox" />
        `;
        resultsContainer.appendChild(resultBox);
      });
    }

    if (data.reddit.length > 0) {
      data.reddit.forEach(result => {
        const resultBox = document.createElement('div');
        resultBox.classList.add('result-box');
        resultBox.innerHTML = `
          <h4>${result.title}</h4>
          <p>${result.summary}</p>
          <a href="${result.link}" target="_blank">View on Reddit</a>
          <input type="checkbox" class="result-checkbox" />
        `;
        resultsContainer.appendChild(resultBox);
      });
    }
    
    
    queryInput.value = '';

  } catch (error) {
    console.error('Error fetching search results:', error);
    hideLoader();
    alert('An error occurred while fetching the data.');
  }
}

// Function to send email with selected results
async function sendEmail() {
  const emailInput = document.getElementById('email');
  const email = emailInput.value;
  const query = document.getElementById('query').value;
  const onlyLiked = document.getElementById('onlyLiked').checked;
  const selectedResults = [];

  document.querySelectorAll('.result-box').forEach((box) => {
    const checkbox = box.querySelector('.result-checkbox');
    const link = box.querySelector('a').href;
    const source = link.includes('stackoverflow') ? 'Stack Overflow' : 'Reddit';

    
    if (!onlyLiked || (onlyLiked && checkbox.checked)) {
      selectedResults.push({ source, link });
    }
  });

  try {
    const response = await fetch('/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, query, selectedResults })
    });

    const result = await response.json();
    alert(result.message);
    
    
    emailInput.value = '';
  } catch (error) {
    console.error('Error sending email:', error);
    alert('An error occurred while sending the email.');
  }
}
async function translateResults() {
  const targetLanguage = document.getElementById('targetLanguage').value;
  const resultsContainer = document.getElementById('results');
  const resultBoxes = resultsContainer.querySelectorAll('.result-box');

  if (resultBoxes.length === 0) {
    alert('Please perform a search first before attempting translation.');
    return;
  }

  resultBoxes.forEach(async (resultBox) => {
    const summary = resultBox.querySelector('p').innerText;

    try {
      const response = await fetch('https://api-b2b.backenster.com/b1/api/v3/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer a_ARA3xX15bjWeNWFi60JimglKn26SMdKxT2gUfmNcA47jfW3a1f1mSkLxdrXqG9AqtEX56wb9Pe0iOH4o'
        },
        body: JSON.stringify({
          text: summary,
          from: 'en',  
          to: targetLanguage
        }),
      });

      const data = await response.json();
      resultBox.querySelector('p').innerText = data.result;  // Update the summary with the translated text
    } catch (error) {
      console.error('Error translating result:', error);
      alert('An error occurred while translating the result.');
    }
  });
}
