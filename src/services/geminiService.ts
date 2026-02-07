
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Course, CourseStatus, TargetLevel, Module, Lesson } from "../types";

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const generateCourseSyllabus = async (
  topic: string, 
  level: TargetLevel
): Promise<Partial<Course>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Role: World-Class Knowledge Architect & Curriculum Expert.
    Task: Create a 5-module Syllabus skeleton for any topic or skill teachable on the internet.
    Topic: "${topic}"
    Target Level: "${level}"
    
    Instructions:
    - Design a logical learning progression from fundamentals to advanced concepts.
    - If the topic is academic, align with relevant international standards.
    - If the topic is a skill/hobby, align with industry best practices.
    - Provide module titles and 2-sentence descriptions.
    
    JSON Schema:
    {
      "title": "...",
      "description": "...",
      "confidenceScore": 99,
      "modules": [{ "title": "...", "description": "..." }]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["title", "description", "modules"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    ...parsed,
    id: crypto.randomUUID(),
    status: CourseStatus.SKELETON,
    points: 100,
    targetLevel: level,
    verifications: 0,
    createdAt: new Date().toISOString(),
    flashcards: [],
    modules: (parsed.modules || []).map((m: any) => ({
      ...m,
      id: crypto.randomUUID(),
      isGenerated: false,
      lessons: []
    }))
  };
};

export const generateModuleDeepDive = async (
  courseTitle: string,
  moduleTitle: string,
  moduleDesc: string,
  level: string,
  lang: string
): Promise<{ lessons: Lesson[], flashcards: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Persona: Master Educator and Content Researcher.
    Task: Generate exhaustive, high-depth instructional content for Module: "${moduleTitle}" within the course "${courseTitle}".
    Target Level: ${level}
    Language: ${lang === 'np' ? 'Nepali' : 'English'}
    
    Requirements:
    1. EXHAUSTIVE DEPTH: Generate 3 comprehensive lessons.
    2. LENGTH: Each lesson must be approximately 1,200 words of rich, high-quality text. No fluff.
    3. STRUCTURE: Use clear Markdown headings, bullet points, and LaTeX for any technical or mathematical notation.
    4. GLOBAL CONTEXT: Use relevant global case studies, real-world applications, and industry examples.
    5. CITATIONS: Provide one clickable URL citation for each lesson from authoritative sources (e.g., .gov, .edu, official docs, or peer-reviewed sites).
    6. ASSESSMENT: Create 5 challenging multiple-choice questions for each lesson that test true understanding, not just recall.
    7. FLASHCARDS: Extract 5 key terms or concepts as flashcards.
    
    JSON Schema:
    {
      "lessons": [{
        "title": "...",
        "content": "Comprehensive markdown text (1200+ words)...",
        "citation": "...",
        "quiz": { "question": "...", "options": ["...", "...", "..."], "answer": "..." }
      }],
      "flashcards": [{ "front": "...", "back": "..." }]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 20000,
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lessons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                citation: { type: Type.STRING },
                quiz: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "options", "answer"]
                }
              },
              required: ["title", "content", "quiz", "citation"]
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
              required: ["front", "back"]
            }
          }
        },
        required: ["lessons", "flashcards"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    lessons: (parsed.lessons || []).map((l: any) => ({ ...l, id: crypto.randomUUID() })),
    flashcards: (parsed.flashcards || []).map((f: any) => ({
      ...f,
      id: crypto.randomUUID(),
      nextReviewDate: new Date().toISOString(),
      interval: 0,
      easeFactor: 2.5
    }))
  };
};

export const generateLessonAudio = async (text: string): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Summarize and narrate this educational content clearly for an audio-learner: ${text.substring(0, 1000)}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  }
};

export const guruBotAnswer = async (context: string, question: string, lang: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Persona: GuruBot (Global AI Tutor).
    Instructions: Helpful, scholarly, and supportive. Use simple analogies.
    Context: ${context}
    Question: ${question}
    Language: ${lang === 'np' ? 'Nepali' : 'English'}
  `;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text;
};

export const generateBridgeExplanation = async (content: string, q: string, wrong: string, correct: string, lang: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Knowledge Bridge Explanation.
    Topic: ${content.substring(0, 200)}...
    The learner chose "${wrong}" instead of "${correct}" for the question "${q}".
    Task: Explain the difference conceptually using a relatable analogy.
    Language: ${lang === 'np' ? 'Nepali' : 'English'}
  `;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text;
};
