import "./modal.js";

// Select container
const items = document.querySelector(".items");

window.onload = () => {
  loadFacts();
};


// Store all facts globally
let facts = [];
let selectedCategory = "all";
let currentSort = null;

//GET ALL DATA
async function loadFacts() {
  try {
    const response = await fetch('/api/facts');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    facts = data;
    console.log("FACTS:", data);
    displayFacts(data);
  } catch (error) {
    console.error("Error fetching facts:", error);
  }
}


// CREATE FACT ITEMS
function displayFacts(dataArray){
  //Remove previous facts
  items.innerHTML=""
  dataArray.forEach((fact)=>{
    //Component
    const child = `  
    <div class="facts-item" data-id="${fact.id}">
        <div class="fact-item-bar">
          <div class="facts-item-bar-category ${fact.category}">
            ${fact.category.charAt(0).toUpperCase() + fact.category.slice(1)}
          </div>
            <div class="facts-item-bar-source">
              <a class="source" href="${fact.source}">Source</a>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link source-icon">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
            </div>
        </div>
          <p class="facts-item-paragraph">${fact.text}</p>
            <div class="facts-item-reactions">
              <div class="facts-item-reactions-votes positive">
                <button class="facts-item-reactions-positive">👍</button>
                ${fact.votes_positive}
              </div>
              <div class="facts-item-reactions-votes negative">
                <button class="facts-item-negative">👎</button>
                ${fact.votes_negative}
              </div>
            </div>
    </div>
  `;
    //INSERT COMPONENT
    items.insertAdjacentHTML("afterbegin", child);

    //-------------------------------------
    const positiveBtn = document.querySelector(
      ".facts-item-reactions-positive"
    );
    const negativeBtn = document.querySelector(".facts-item-negative");
    const factId = fact.id;
    //-------------------------------



    //REACTIONS 
    positiveBtn.onclick= ()=>{
      const hasVotedPositive = localStorage.getItem (`positive_votes_${factId}`);
      if(hasVotedPositive){
        alert("You have already voted.");
        return
      }
      reactionFn(
        fact.id,
        "positive",
        fact.votes_positive
      );
      localStorage.setItem(`positive_votes_${factId}`, "true");
    }

    negativeBtn.onclick = ()=>{
      const hasVotedNegative= localStorage.getItem(`negative_votes_${factId}`);
      if(hasVotedNegative){
        alert("You have already voted")
        return
      }
      reactionFn(
        fact.id,
        "negative",
        fact.votes_negative
      )
      localStorage.setItem(`negative_votes_${factId}`, "true");
    }
  })
}
//insert data in the database func
async function createFact(factData) {
  try {
    const response = await fetch('/api/create-fact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Fact inserted correctly", result);
    return result;
  } catch (error) {
    console.error("Error inserting fact:", error);
    throw error;
  }
}
//Use the function when user inputs data
document.getElementById("factForm").addEventListener("submit", async function (event){
  event.preventDefault()
  const formData = new FormData(this);
  const fact = formData.get("fact");
  const source = formData.get("source");
  const category = formData.get("category");
  const newFact = {
    text:fact,
    source:source,
    category:category.toLowerCase()
  }
  await createFact(newFact)

  document.getElementById("modal").close();
  this.reset();
  loadFacts();
})

//FILTERING CATEGORIES
const categoryButtons = document.querySelectorAll(".categories-button");

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.classList[1];

    //Scroll to facts section
    const factsSection = document.querySelector(".facts");
    if (factsSection) {
      factsSection.scrollIntoView({ behaviour: "smooth" });
    }

    // Apply current sorting or just filter by category
    if (currentSort) {
      sortFacts(currentSort);
    } else {
      filterAndDisplayFacts();
    }
  });
});


//NEWEST & POPULAR FILTERING FEATURE:
const newestButton = document.querySelectorAll(".button-facts-button")[0];
const popularButton = document.querySelectorAll(".button-facts-button")[1];

newestButton.addEventListener("click", () => {
  sortFacts("newest");
});

popularButton.addEventListener("click", () => {
  sortFacts("popularity");
});

function sortFacts(type) {
  currentSort = type;
  
  // Get facts filtered by current category
  let filteredFacts = facts;
  if (selectedCategory !== "all") {
    filteredFacts = facts.filter(fact => fact.category.toLowerCase() === selectedCategory);
  }
  
  // Sort the filtered facts
  let sortedFacts = [...filteredFacts];
  if (type === "popularity") {
    sortedFacts.sort((a, b) => a.votes_positive - b.votes_positive);
  } else if (type === "newest") {
    sortedFacts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    console.error("Invalid sort type. Use 'popularity' or 'newest'.");
    return;
  }
  displayFacts(sortedFacts);
}

function filterAndDisplayFacts() {
  let filteredFacts = facts;
  if (selectedCategory !== "all") {
    filteredFacts = facts.filter(fact => fact.category.toLowerCase() === selectedCategory);
  }
  displayFacts(filteredFacts);
}



//VOTING FEATURE
async function reactionFn(id, type, currentVotes) {
  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        type: type,
        currentVotes: currentVotes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Vote updated:", result);

    // Reload facts and re-apply current filter/sort
    await loadFacts();
    if (currentSort) {
      sortFacts(currentSort);
    } else {
      filterAndDisplayFacts();
    }
  } catch (error) {
    console.error("Error updating vote:", error);
  }
}



