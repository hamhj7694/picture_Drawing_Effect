import React, { useMemo, useRef, useState } from "react";
import "./App.css";

const MOODS = [
  {
    id: "daily",
    label: "일상 스냅",
    samples: ["오늘 기분 좋다", "이 순간 저장", "괜히 설레는 날", "햇살까지 완벽"],
  },
  {
    id: "travel",
    label: "여행/풍경",
    samples: ["오늘은 여기", "그냥 걷는 중", "바람이 좋은 날", "여기 분위기 최고"],
  },
  {
    id: "cafe",
    label: "카페",
    samples: ["오늘의 커피", "조용한 시간", "잠깐 쉬어가기", "달달한 오후"],
  },
  {
    id: "food",
    label: "음식",
    samples: ["오늘 메뉴 성공", "한입에 행복", "이건 또 먹어야지"],
  },
  {
    id: "pet",
    label: "반려동물",
    samples: ["오늘도 귀엽다", "이 표정 뭐야", "작은 행복 발견", "지금 제일 행복해"],
  },
  {
    id: "relationship",
    label: "커플/친구",
    samples: ["같이 있어서 좋다", "오늘도 우리", "이 순간 저장", "추억 하나 추가"],
  },
];

const DOODLES = ["♡", "✦", "✧", "→", "~", "⋯"];

function createTemplate(moodId) {
  const mood = MOODS.find((item) => item.id === moodId) || MOODS[0];

  const textPositions = [
    { x: 12, y: 14 },
    { x: 58, y: 20 },
    { x: 10, y: 62 },
    { x: 54, y: 76 },
  ];

  const doodlePositions = [
    { x: 28, y: 30 },
    { x: 78, y: 40 },
    { x: 18, y: 82 },
    { x: 72, y: 58 },
  ];

  const textCount = mood.id === "food" ? 3 : 4;

  const doodleLayers = DOODLES.slice(0, 4).map((content, index) => ({
    id: `doodle_${Date.now()}_${index}`,
    type: "doodle",
    content,
    x: doodlePositions[index].x,
    y: doodlePositions[index].y,
    fontSize: 30,
    visible: true,
    locked: false,
    group: index < 2 ? "top" : "middle",
  }));

  const textLayers = mood.samples.slice(0, textCount).map((content, index) => ({
    id: `text_${Date.now()}_${index}`,
    type: "text",
    content,
    x: textPositions[index].x,
    y: textPositions[index].y,
    fontSize: 24,
    visible: true,
    locked: false,
    group: "top",
  }));

  return [...doodleLayers, ...textLayers];
}

export default function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [mood, setMood] = useState("daily");
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const selectedLayer = useMemo(() => {
    return layers.find((layer) => layer.id === selectedId);
  }, [layers, selectedId]);

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setLayers([]);
    setSelectedId(null);
  }

  function applyMood(moodId) {
    setMood(moodId);
    setLayers(createTemplate(moodId));
    setSelectedId(null);
  }

  function updateLayer(id, patch) {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  }

  function deleteLayer(id) {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveLayerOrder(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= layers.length) return;

    setLayers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handlePointerDown(event, layer) {
    event.stopPropagation();
    if (layer.locked) return;

    setSelectedId(layer.id);
    setDraggingId(layer.id);
  }

  function handlePointerMove(event) {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    updateLayer(draggingId, {
      x: Math.max(0, Math.min(95, x)),
      y: Math.max(0, Math.min(95, y)),
    });
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  async function downloadImage() {
    if (!imgRef.current || !imageUrl) return;

    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const width = img.naturalWidth || 1080;
    const height = img.naturalHeight || 1350;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.fillStyle = "white";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = 4;
      ctx.font = `${layer.fontSize * (width / 420)}px "Comic Sans MS", "Malgun Gothic", sans-serif`;

      const x = (layer.x / 100) * width;
      const y = (layer.y / 100) * height;

      ctx.strokeText(layer.content, x, y);
      ctx.fillText(layer.content, x, y);
      ctx.restore();
    });

    const link = document.createElement("a");
    link.download = "handwriting-result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="app">
      <main className="layout">
        <section className="workspace-card">
          <header className="top-bar">
            <div>
              <h1>손글씨 이미지 꾸미기 MVP</h1>
              <p>사진 업로드 → 무드 선택 → 텍스트 수정/이동 → 저장</p>
            </div>

            <div className="actions">
              <label className="upload-button">
                사진 업로드
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
              <button className="primary-button" onClick={downloadImage} disabled={!imageUrl}>
                저장
              </button>
            </div>
          </header>

          <div
            ref={canvasRef}
            className="photo-canvas"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={() => setSelectedId(null)}
          >
            {imageUrl ? (
              <img ref={imgRef} src={imageUrl} alt="업로드 이미지" className="base-image" />
            ) : (
              <div className="empty-state">사진을 업로드하세요</div>
            )}

            {layers.map((layer, index) => {
              if (!layer.visible) return null;

              return (
                <div
                  key={layer.id}
                  className={`layer-item ${selectedId === layer.id ? "selected" : ""} ${layer.locked ? "locked" : ""}`}
                  onPointerDown={(event) => handlePointerDown(event, layer)}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    fontSize: `${layer.fontSize}px`,
                    zIndex: index + 1,
                  }}
                >
                  {layer.content}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="side-panel">
          <section className="panel-card">
            <h2>무드 선택</h2>
            <div className="mood-grid">
              {MOODS.map((item) => (
                <button
                  key={item.id}
                  className={`mood-button ${mood === item.id ? "active" : ""}`}
                  onClick={() => applyMood(item.id)}
                  disabled={!imageUrl}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel-card">
            <h2>선택 레이어</h2>
            {selectedLayer ? (
              <div className="edit-box">
                <label>내용</label>
                <textarea
                  value={selectedLayer.content}
                  onChange={(event) => updateLayer(selectedLayer.id, { content: event.target.value })}
                />

                <label>크기</label>
                <input
                  type="range"
                  min="14"
                  max="52"
                  value={selectedLayer.fontSize}
                  onChange={(event) => updateLayer(selectedLayer.id, { fontSize: Number(event.target.value) })}
                />

                <div className="row-buttons">
                  <button onClick={() => updateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}>
                    {selectedLayer.locked ? "잠금 해제" : "잠금"}
                  </button>
                  <button onClick={() => updateLayer(selectedLayer.id, { visible: !selectedLayer.visible })}>
                    {selectedLayer.visible ? "숨김" : "보임"}
                  </button>
                </div>

                <button className="danger-button" onClick={() => deleteLayer(selectedLayer.id)}>
                  삭제
                </button>
              </div>
            ) : (
              <p className="muted">캔버스 위 레이어를 선택하세요.</p>
            )}
          </section>

          <section className="panel-card">
            <h2>레이어 순서</h2>
            <p className="muted">위에 있을수록 앞쪽입니다. 0층 원본 사진은 고정입니다.</p>

            <div className="layer-list">
              {[...layers].reverse().map((layer, reverseIndex) => {
                const actualIndex = layers.length - 1 - reverseIndex;
                const floor = actualIndex + 1;

                return (
                  <div
                    key={layer.id}
                    className={`layer-row ${selectedId === layer.id ? "active" : ""}`}
                    onClick={() => setSelectedId(layer.id)}
                  >
                    <div className="layer-name">
                      <strong>{floor}층</strong>
                      <span>{layer.type === "text" ? "텍스트" : "드로잉"}: {layer.content}</span>
                    </div>

                    <div className="order-buttons">
                      <button onClick={(event) => { event.stopPropagation(); moveLayerOrder(actualIndex, actualIndex + 1); }} disabled={actualIndex >= layers.length - 1}>▲</button>
                      <button onClick={(event) => { event.stopPropagation(); moveLayerOrder(actualIndex, actualIndex - 1); }} disabled={actualIndex <= 0}>▼</button>
                    </div>
                  </div>
                );
              })}

              <div className="base-floor">0층 원본 사진 고정</div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
