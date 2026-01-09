
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const verifyAndExtractID = async (
  base64Image: string,
  idType: string
): Promise<ExtractedData> => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Extract data from this ${idType}. Perform image quality checks for clarity, completeness, and readability.
            Return a JSON object with:
            - fullName (string)
            - dob (string, YYYY-MM-DD)
            - idNumber (string)
            - documentType (string, classify it)
            - confidenceScores (object with fullName, dob, idNumber as floats 0-1)
            - qualityCheck (object with isClear, isComplete, isReadable as booleans, and optional reason if false)
            
            IMPORTANT: If the image is blurry or unreadable, set isReadable to false and provide a reason.`
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          dob: { type: Type.STRING },
          idNumber: { type: Type.STRING },
          documentType: { type: Type.STRING },
          confidenceScores: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.NUMBER },
              dob: { type: Type.NUMBER },
              idNumber: { type: Type.NUMBER },
            },
            required: ["fullName", "dob", "idNumber"]
          },
          qualityCheck: {
            type: Type.OBJECT,
            properties: {
              isClear: { type: Type.BOOLEAN },
              isComplete: { type: Type.BOOLEAN },
              isReadable: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ["isClear", "isComplete", "isReadable"]
          }
        },
        required: ["fullName", "dob", "idNumber", "documentType", "confidenceScores", "qualityCheck"]
      }
    },
  });

  const response = await model;
  const result = JSON.parse(response.text || '{}');
  return result as ExtractedData;
};
