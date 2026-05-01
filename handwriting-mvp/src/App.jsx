import { useMemo, useRef, useState } from "react";
import "./App.css";

const DEFAULT_TEXTS = [
  { content: "오늘의 순간", x: 22, y: 16, rotate: -5 },
  { content: "이 분위기 저장", x: 72, y: 24, rotate: 4 },
  { content: "괜히 기분 좋은 날", x: 24, y: 76, rotate: 3 },
];

function createTextLayers() {
  const timestamp = Date.now();

  return DEFAULT_TEXTS.map((item, index) => ({
    id: `text_${timestamp}_${index}`,
    content: item.content,
    x: item.x,
    y: item.y,
    rotate: item.rotate,
    fontSize: 22,
    visible: true,
  }));
}

export default function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageRatio, setImageRatio] = useState("1 / 1");
  const [textLayers, setTextLayers] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [draggingTextId, setDraggingTextId] = useState(null);
  const [effects, setEffects] = useState({ drawing: true, minimi: false });

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const selectedText = useMemo(() => {
    return textLayers.find((t) => t.id === selectedTextId);
  }, [textLayers, selectedTextId]);

  function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setImageRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    };

    img.src = url;
    setImageUrl(url);
    setTextLayers(createTextLayers());
  }

  function updateText(id, patch) {
    setTextLayers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  function handlePointerDown(e, text) {
    e.stopPropagation();
    setSelectedTextId(text.id);
    setDraggingTextId(text.id);
  }

  function handlePointerMove(e) {
    if (!draggingTextId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    updateText(draggingTextId, {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
    });
  }

  function handlePointerUp() {
    setDraggingTextId(null);
  }

  function addText() {
    const newText = {
      id: `text_${Date.now()}`,
      content: "새 문구",
      x: 50,
      y: 50,
      rotate: 0,
      fontSize: 22,
      visible: true,
    };

    setTextLayers((prev) => [...prev, newText]);
    setSelectedTextId(newText.id);
  }

  function deleteText() {
    setTextLayers((prev) => prev.filter((t) => t.id !== selectedTextId));
    setSelectedTextId(null);
  }

  function toggleEffect(key) {
    setEffects((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function download() {
    if (!imgRef.current) return;

    const canvas = document.createElement("canvas");
    const img = imgRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    textLayers.forEach((t) => {
      const x = (t.x / 100) * canvas.width;
      const y = (t.y / 100) * canvas.height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((t.rotate * Math.PI) / 180);

      ctx.font = `${t.fontSize * 2}px sans-serif`;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";

      ctx.strokeText(t.content, 0, 0);
      ctx.fillText(t.content, 0, 0);

      ctx.restore();
    });

    const link = document.createElement("a");
    link.download = "result.png";
    link.href = canvas.toDataURL();
    link.click();
  }

  return (
    <div className="app">
      <div className="layout">
        <div className="workspace-card">
          <div className="top-bar">
            <div>
              <h1>손글씨 드로잉, 미니미 효과 꾸미기 웹</h1>
              <p>사진 업로드 → 효과 선택 → 만들기 → 저장</p>
            </div>

            <div className="actions">
              <label className="upload-button">
                사진 업로드
                <input type="file" onChange={handleUpload} />
              </label>
              <button onClick={download}>저장</button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="photo-canvas"
            style={{ aspectRatio: imageRatio }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {imageUrl ? (
              <img ref={imgRef} src={imageUrl} className="base-image" />
            ) : (
              <div className="empty-state">이미지 업로드</div>
            )}

            {textLayers.map((t) => (
              <div
                key={t.id}
                className={`layer-item ${
                  selectedTextId === t.id ? "selected" : ""
                }`}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  fontSize: t.fontSize,
                  transform: `translate(-50%,-50%) rotate(${t.rotate}deg)`,
                }}
                onPointerDown={(e) => handlePointerDown(e, t)}
              >
                {t.content}
              </div>
            ))}
          </div>
        </div>

        <div className="side-panel">
          <div className="panel-card">
            <h3>효과 선택</h3>

            <div className="mood-grid">
              <button
                className={`mood-button ${effects.drawing ? "active" : ""}`}
                onClick={() => toggleEffect("drawing")}
              >
                드로잉
              </button>

              <button
                className={`mood-button ${effects.minimi ? "active" : ""}`}
                onClick={() => toggleEffect("minimi")}
              >
                미니미
              </button>
            </div>

            <button style={{ marginTop: 10 }}>만들기</button>
          </div>

          <div className="panel-card">
            <h3>텍스트 편집</h3>

            {selectedText ? (
              <div className="edit-box">
                <textarea
                  value={selectedText.content}
                  onChange={(e) =>
                    updateText(selectedText.id, {
                      content: e.target.value,
                    })
                  }
                />

                <button onClick={deleteText} className="danger-button">
                  삭제
                </button>
              </div>
            ) : (
              <p>텍스트 선택하세요</p>
            )}

            <button onClick={addText}>텍스트 추가</button>
          </div>
        </div>
      </div>
    </div>
  );
}