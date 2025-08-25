import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main(question) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: question }],
      },
    ],
  });

  console.log("Response is :", response.candidates);

  const answer = response.candidates[0]?.content?.parts[0]?.text || "No answer found";
  return answer;
}

export async function POST(request) {
  const body = await request.json();
  const answer = await main(body.message);

  return new Response(JSON.stringify({ answer }), {
    headers: { "Content-Type": "application/json" },
  });
}
