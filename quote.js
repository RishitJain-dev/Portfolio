const quoteHeading = document.querySelector(".quote");
const quoteAttribution = document.querySelector(".quote-attribution");

if (!quoteHeading || !quoteAttribution) {
    throw new Error("Quote page content not found.");
}

function getDailyQuoteIndex(length) {
    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");
    let hash = 2166136261;

    for (let index = 0; index < date.length; index += 1) {
        hash ^= date.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) % length;
}

async function loadDailyQuote() {
    const response = await fetch("quotes.json");
    if (!response.ok) {
        throw new Error(`Failed to load quotes: ${response.status}`);
    }

    const quotes = await response.json();
    if (!Array.isArray(quotes)) {
        throw new Error("Quotes data must be an array.");
    }

    if (quotes.length === 0) {
        throw new Error("No quotes are available.");
    }

    if (quotes.some((entry) =>
        !entry ||
        typeof entry.quote !== "string" ||
        !entry.quote.trim() ||
        typeof entry.name !== "string" ||
        !entry.name.trim()
    )) {
        throw new Error("Quotes data contains an invalid entry.");
    }

    const quote = quotes[getDailyQuoteIndex(quotes.length)];
    quoteHeading.textContent = `“${quote.quote}”`;
    quoteAttribution.textContent = `— ${quote.name}`;
}

loadDailyQuote().catch((error) => {
    console.error("Unable to display the quote of the day.", error);
    quoteHeading.textContent = "A quote could not be loaded today.";
});
