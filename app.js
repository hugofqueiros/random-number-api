import fetch from "node-fetch";
import express from "express";
import rateLimit from "express-rate-limit";

const app = express();
app.set("port", process.env.PORT || 3000);

const MAX_NUMBER = 100;
const MAX_NUMBER_ALLOWED = Number.MAX_SAFE_INTEGER - MAX_NUMBER;

const randomNumbers = [];
let numbersSum = 0;
let retryAttempts = 0;
let retryInProgress = false;

export async function fetchRandomNumber() {
    if (numbersSum > MAX_NUMBER_ALLOWED) {
        randomNumbers = [];
        numbersSum = 0;
    }

    if (retryInProgress) return;

    try {
        const response = await fetch(
            `https://csrng.net/csrng/csrng.php?min=0&max=${MAX_NUMBER}`
        );
        if (!response.ok) {
            throw new Error("Error thrown");
        }

        const data = await response.json();

        if (data[0].status === "error") {
            throw new Error("API Error");
        }

        const rand = data[0]?.random;

        if (rand) {
            const randomNumber = parseInt(rand, 10);
            randomNumbers.push(randomNumber);
            numbersSum += randomNumber;
        }

        retryAttempts = 0;
    } catch (err) {
        console.error("Error fetching number", err.message);

        if (retryAttempts < 5) {
            retryInProgress = true;
            // Exponential backoff: increase delay exponentially with each retry
            const delay = Math.pow(2, retryAttempts + 1) * 1000;
            console.log(`Retrying in ${delay / 1000} seconds...`);
            setTimeout(() => {
                retryInProgress = false;
                fetchRandomNumber();
            }, delay);
            retryAttempts++;
        } else {
            console.error(
                "Max retries reached. Unable to fetch random number."
            );
            retryAttempts = 0;
        }
    }
}

// fetch a random number every second
setInterval(fetchRandomNumber, 1000);

// Applies rate limiting middleware - rate limiting API to 1 per second
const limiter = rateLimit({
    windowMs: 1000,
    max: 1, // limit each IP to 1 requests
    message: "Rate limit exceeded. Please try again later.",
});

app.use(limiter);

function calculateAverage() {
    return randomNumbers.length > 0 && numbersSum / randomNumbers.length;
}

app.get("/", function (_, res) {
    res.send("hello world");
});

app.get("/average", (_, res) => {
    const average = calculateAverage();
    console.log('Average: ', average);
    res.json({ average });
});

app.listen(app.get("port"));

export default app;
