import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

function buildPrompt(effects) {
  const hasDrawing = effects?.drawing;
  const hasMinimi = effects?.minimi;

  if (hasDrawing && hasMinimi) {
    return `
이 이미지를 기반으로 새로운 이미지를 생성한다.

[작업 순서]
1. 먼저 원본 인물을 기반으로 한 귀여운 미니미 캐릭터 3~5개를 자연스럽게 추가한다.
2. 그 다음 미니미가 포함된 이미지 위에 가벼운 손그림 드로잉 장식을 추가한다.

[미니미]
- 원본 인물의 얼굴, 헤어, 의상, 포즈는 변경하지 않는다.
- 인물을 기반으로 한 작은 SD 캐릭터를 주변에 배치한다.
- 미니미는 손바닥 크기 느낌이며, 점프/손흔들기/기대기 등 서로 다른 동작을 한다.
- 캐릭터는 사진 속 인물 또는 주변 사물과 자연스럽게 상호작용한다.
- 공중에 어색하게 뜨지 않게 한다.

[드로잉]
- 색연필 또는 손그림 느낌의 얇은 선 드로잉.
- 하트, 별, 반짝임, 화살표, 물결선 등을 최대 5~6개만 추가한다.
- 얼굴, 눈, 입, 손, 주요 피사체, 미니미 캐릭터는 가리지 않는다.
- 텍스트는 생성하지 않는다.

[유지]
- 원본 사진의 구도, 색감, 조명, 분위기를 최대한 유지한다.
`;
  }

  if (hasMinimi) {
    return `
이 이미지를 기반으로 새로운 이미지를 생성한다.

[절대 규칙]
- 원본 인물의 얼굴, 헤어, 의상, 포즈는 변경하지 않는다.
- 원본 인물은 그대로 유지한다.
- 이미지 전체는 자연스러운 사진 기반 합성 느낌으로 유지한다.

[미니미 캐릭터]
- 원본 인물을 기반으로 한 귀여운 SD 미니미 캐릭터를 3~5개 생성한다.
- 크기는 작게, 손바닥 크기 느낌.
- 각 캐릭터는 점프, 손흔들기, 기대기, 장난치기 등 서로 다른 행동을 한다.
- 캐릭터들은 사진 속 인물 또는 주변 사물과 자연스럽게 상호작용한다.
- 공중에 어색하게 뜨지 않게 한다.

[금지]
- 인물 얼굴 변경 금지.
- 캐릭터가 너무 크거나 메인 인물보다 강조되는 것 금지.
- 텍스트 생성 금지.
`;
  }

  return `
이 이미지를 기반으로 새로운 이미지를 생성한다.

[절대 규칙]
- 기존 이미지의 인물과 주요 피사체는 변경하지 않는다.
- 이미지의 구도, 색감, 조명은 유지한다.

[드로잉 스타일]
- 색연필 또는 손그림 느낌의 얇은 선 드로잉.
- 자연스럽고 러프한 인스타 감성 낙서 느낌.

[드로잉 요소]
- 하트, 별, 반짝임, 화살표, 물결선 등을 추가한다.
- 최대 5개 이하만 생성한다.
- 요소는 서로 겹치지 않게 배치한다.

[배치 규칙]
- 드로잉은 여백 또는 덜 중요한 영역에만 배치한다.
- 인물 얼굴, 눈, 입, 손 등 주요 부위는 절대 가리지 않는다.
- 텍스트는 생성하지 않는다.
`;
}

app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    const effects = JSON.parse(req.body.effects || "{}");

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "이미지 파일이 없습니다.",
      });
    }

    const prompt = buildPrompt(effects);

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: fs.createReadStream(req.file.path),
      prompt,
      size: "1024x1024",
    });

    const imageBase64 = result.data[0].b64_json;

    fs.unlinkSync(req.file.path);

    res.json({
      ok: true,
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: error.message || "서버 오류",
    });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});