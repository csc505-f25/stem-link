import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// set up gemini api client
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runtime = "nodejs";

export async function POST(req: Request) {
  // ensure api key is set
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  // try to parse request body
  try {
    const body = await req.json();
    const { topic, difficulty } = body as {
      topic?: string;
      difficulty?: string;
    };

    // validate inputs
    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: "Missing topic or difficulty" },
        { status: 400 }
      );
    }

    // set up gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // construct prompt
    const prompt = `
Generate exactly ONE random ${difficulty.toLowerCase()} difficulty multiple-choice question
about the subject "${topic.toLowerCase()}".

Requirements:
- The question should be appropriate for a STEM learning app.
- Provide exactly 4 distinct answer options.
- Clearly decide which one option is correct.
- Respond ONLY with a single valid JSON object, no markdown, no extra text, no backticks.
- All content must be in English and in plain text format.

Use this exact JSON shape:

{
  "Subject": "${topic}",
  "Difficulty": "${difficulty}",
  "Question": "question text here as a string",
  "Answers": [
    "answer option 1",
    "answer option 2",
    "answer option 3",
    "answer option 4"
  ],
  "Correct_Index": 0
}

"Correct_Index" is the zero-based index (0 through 3) of the correct answer in the "Answers" array.
    `.trim();

    // generate content and store response
    const result = await model.generateContent(prompt);
    const text = result.response.text(); 

    // try to parse response as JSON and return if successful and error if not
    let parsed;
    try {
      parsed = JSON.parse(text);
    } 
    catch (e) {
      console.error("Failed to parse Gemini response as JSON:", text);
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } 
  catch (err) {
    console.error("Error in /api/generate-question:", err);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
