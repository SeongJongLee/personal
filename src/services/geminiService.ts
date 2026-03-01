import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzePersonalColor(imageBase64: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";

  const prompt = `
    당신은 세계적인 퍼스널 컬러 전문가입니다. 제공된 이미지를 바탕으로 사용자의 퍼스널 컬러를 정밀 분석하세요.
    
    분석 프로세스 (반드시 다음 단계를 거쳐 판단하세요):
    1. 조명 분석: 현재 환경의 조명 색온도(따뜻함/차가움)와 밝기를 파악하여 화이트 밸런스를 머릿속으로 보정하세요.
    2. 언더톤(Undertone) 판별: 피부의 노란기/황금빛(Warm)과 붉은기/푸른기/핑크빛(Cool)을 분석하세요. 눈동자 테두리와 헤어 컬러의 조화를 확인하세요.
    3. 명도(Value) 및 채도(Chroma) 분석: 이목구비의 대비감, 피부의 투명도, 색상의 탁도(Muted)와 선명도(Clear)를 분석하세요.
    
    계절별 특징 가이드 (주의 깊게 읽으세요):
    - 봄(Spring): **웜톤(Warm)**, 고명도, 고채도. 생기 있고 밝은 느낌. 피부에 노란기나 복숭아빛이 돌며, 눈동자가 반짝이고 투명함. (겨울과 혼동 주의: 겨울보다 훨씬 따뜻한 노란기가 베이스임)
    - 여름(Summer): **쿨톤(Cool)**, 고명도, 저채도. 부드럽고 우아한 느낌. 피부에 붉은기나 핑크빛이 돌며, 전체적으로 부드러운 인상.
    - 가을(Autumn): **웜톤(Warm)**, 저명도, 저채도. 깊이 있고 차분한 느낌. 피부에 노란기나 황금빛이 강하며, 성숙하고 그윽한 인상.
    - 겨울(Winter): **쿨톤(Cool)**, 저명도, 고채도. 선명하고 강렬한 대비감. 피부가 매우 창백하거나 푸른기가 돌며, 눈동자와 헤어의 대비가 강함. (봄과 혼동 주의: 봄보다 훨씬 차갑고 푸른기가 베이스임)

    **특별 주의사항 (Spring vs Winter):**
    - 사용자가 선명한 이목구비를 가졌다고 해서 무조건 '겨울'로 판단하지 마세요. 
    - 피부에 따뜻한 황금빛이나 피치빛이 돈다면 '봄(Bright Spring)'일 확률이 높습니다. 
    - '겨울'은 얼음처럼 차가운(Icy) 느낌이 있어야 하며, '봄'은 햇살처럼 따뜻한(Sunny) 느낌이 있어야 합니다.
    - 머리카락이 검다고 해서 무조건 겨울이 아닙니다. 피부의 온도감을 최우선으로 보세요.

    결과 요구사항 (JSON 형식):
    - reasoning: 위 분석 프로세스(특히 언더톤 판별 근거와 봄/겨울 혼동 방지 논리 포함)를 상세히 설명하세요. (한국어)
    - type: Spring, Summer, Autumn, Winter 중 하나.
    - confidence: 0~1 사이의 신뢰도 점수.
    - palette: 가장 잘 어울리는 5가지 색상의 Hex 코드.
    - bestColors: 구체적인 색상 명칭 3가지 (예: 카멜 베이지, 로얄 블루 등). (한국어)
    - worstColors: 피해야 할 색상 명칭 3가지. (한국어)
    - lightingCondition: 감지된 조명 상태 설명. (한국어)
    - imagePrompt: 이 결과에 기반한 고품질 패션 화보 생성을 위한 영문 프롬프트. (예: "Spring warm type model wearing peach silk dress, soft golden hour lighting, blooming garden background")

    전문가적인 시각에서 매우 논리적이고 구체적으로 답변하세요.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1],
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT" as any,
        properties: {
          type: { type: "STRING" as any, enum: ["Spring", "Summer", "Autumn", "Winter"] },
          confidence: { type: "NUMBER" as any },
          reasoning: { type: "STRING" as any },
          palette: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          bestColors: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          worstColors: { type: "ARRAY" as any, items: { type: "STRING" as any } },
          lightingCondition: { type: "STRING" as any },
          imagePrompt: { type: "STRING" as any },
        },
        required: ["type", "confidence", "reasoning", "palette", "bestColors", "worstColors", "lightingCondition", "imagePrompt"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function generateStylishImage(prompt: string): Promise<string> {
  // Use Pollinations.ai for image generation to avoid Gemini usage limits.
  // This service is free and doesn't require an API key.
  const encodedPrompt = encodeURIComponent(`high-fashion editorial portrait, ${prompt}, sophisticated, visually stunning, 8k resolution, professional photography`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
  
  return imageUrl;
}
