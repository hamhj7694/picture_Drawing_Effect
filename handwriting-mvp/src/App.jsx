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
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const [imageRatio, setImageRatio] = useState("1 / 1");

  const [textLayers, setTextLayers] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [draggingTextId, setDraggingTextId] = useState(null);

  const [effects, setEffects] = useState({
    drawing: false,
    minimi: false,
  });

  const [makeStatus, setMakeStatus] = useState("");

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const selectedText = useMemo(() => {
    return textLayers.find((t) => t.id === selectedTextId);
  }, [textLayers, selectedTextId]);

  function handleUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      originalImageUrl &&
      originalImageUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(originalImageUrl);
    }

    const url = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      setImageRatio(
        `${img.naturalWidth} / ${img.naturalHeight}`
      );
    };

    img.src = url;

    setOriginalImageUrl(url);
    setResultImageUrl(url);

    setTextLayers([]);
    setSelectedTextId(null);

    setMakeStatus("");
  }

  function updateText(id, patch) {
    setTextLayers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      )
    );
  }

  function handlePointerDown(e, text) {
    e.stopPropagation();

    setSelectedTextId(text.id);
    setDraggingTextId(text.id);
  }

  function handlePointerMove(e) {
    if (!draggingTextId || !canvasRef.current)
      return;

    const rect =
      canvasRef.current.getBoundingClientRect();

    const x =
      ((e.clientX - rect.left) / rect.width) * 100;

    const y =
      ((e.clientY - rect.top) / rect.height) * 100;

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
    if (!selectedTextId) return;

    setTextLayers((prev) =>
      prev.filter((t) => t.id !== selectedTextId)
    );

    setSelectedTextId(null);
  }

  function toggleEffect(key) {
    setEffects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleMake() {
    if (!resultImageUrl) return;

    if (
      !effects.drawing &&
      !effects.minimi
    )
      return;

    setTextLayers(createTextLayers());

    setSelectedTextId(null);

    setMakeStatus(
      "만들기 완료! (※다시 누르면 기존 작업이 초기화됩니다)"
    );
  }

  function download() {
    if (!imgRef.current) return;

    const canvas =
      document.createElement("canvas");

    const img = imgRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      img,
      0,
      0,
      canvas.width,
      canvas.height
    );

    textLayers.forEach((t) => {
      if (!t.visible) return;

      const x = (t.x / 100) * canvas.width;
      const y = (t.y / 100) * canvas.height;

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(
        (t.rotate * Math.PI) / 180
      );

      ctx.font = `${
        t.fontSize * 2
      }px "Malgun Gothic", sans-serif`;

      ctx.fillStyle = "white";

      ctx.strokeStyle =
        "rgba(0,0,0,0.45)";

      ctx.lineWidth = 4;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.strokeText(t.content, 0, 0);
      ctx.fillText(t.content, 0, 0);

      ctx.restore();
    });

    const link =
      document.createElement("a");

    link.download = "result.png";

    link.href = canvas.toDataURL(
      "image/png"
    );

    link.click();
  }

  return (
    <div className="app">
      <div className="layout">
        <div className="workspace-card">
          <div className="top-bar">
            <div>
              <h1>
                손글씨 드로잉, 미니미 효과 꾸미기 웹
              </h1>

              <p>
                사진 업로드 → 효과 선택 →
                만들기 → 저장
              </p>
            </div>

            <div className="actions">
              <label className="upload-button">
                사진 업로드

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                />
              </label>

              <button
                onClick={download}
                disabled={!resultImageUrl}
              >
                저장
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="photo-canvas"
            style={{
              aspectRatio: imageRatio,
            }}
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={handlePointerUp}
            onPointerLeave={
              handlePointerUp
            }
            onClick={() =>
              setSelectedTextId(null)
            }
          >
            {resultImageUrl ? (
              <img
                ref={imgRef}
                src={
                  showOriginal
                    ? originalImageUrl
                    : resultImageUrl
                }
                className="base-image"
                alt="업로드 이미지"
              />
            ) : (
              <div className="empty-state">
                이미지 업로드
              </div>
            )}

            {textLayers.map((t) => (
              <div
                key={t.id}
                className={`layer-item ${
                  selectedTextId === t.id
                    ? "selected"
                    : ""
                }`}
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  fontSize: `${t.fontSize}px`,
                  transform: `translate(-50%, -50%) rotate(${t.rotate}deg)`,
                }}
                onPointerDown={(e) =>
                  handlePointerDown(e, t)
                }
                onClick={(e) => {
                  e.stopPropagation();

                  setSelectedTextId(t.id);
                }}
              >
                {t.content}
              </div>
            ))}
          </div>

          {originalImageUrl &&
            resultImageUrl && (
              <button
                className="compare-button"
                onPointerDown={() =>
                  setShowOriginal(true)
                }
                onPointerUp={() =>
                  setShowOriginal(false)
                }
                onPointerLeave={() =>
                  setShowOriginal(false)
                }
              >
                {showOriginal
                  ? "원본 보는 중"
                  : "비교하기"}
              </button>
            )}
        </div>

        <div className="side-panel">
          <div className="panel-card">
            <h3>효과 선택</h3>

            <p
              style={{
                fontSize: 13,
                color: "#777",
                marginBottom: 10,
              }}
            >
              드로잉/미니미 중
              1개 이상(2개 가능)
              선택하고 "만들기"를
              클릭하세요!
            </p>

            <div className="mood-grid">
              <button
                className={`mood-button ${
                  effects.drawing
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleEffect(
                    "drawing"
                  )
                }
              >
                <input
                  type="checkbox"
                  checked={
                    effects.drawing
                  }
                  readOnly
                />

                드로잉
              </button>

              <button
                className={`mood-button ${
                  effects.minimi
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleEffect(
                    "minimi"
                  )
                }
              >
                <input
                  type="checkbox"
                  checked={
                    effects.minimi
                  }
                  readOnly
                />

                미니미
              </button>
            </div>

            <button
              onClick={handleMake}
              disabled={
                !resultImageUrl ||
                (!effects.drawing &&
                  !effects.minimi)
              }
            >
              만들기
            </button>

            {makeStatus && (
              <p className="make-status">
                {makeStatus}
              </p>
            )}
          </div>

          <div className="panel-card">
            <h3>텍스트 편집</h3>

            <p>
              텍스트를 수정할 수
              있어요!
            </p>

            {selectedText ? (
              <div className="edit-box">
                <textarea
                  value={
                    selectedText.content
                  }
                  onChange={(e) =>
                    updateText(
                      selectedText.id,
                      {
                        content:
                          e.target.value,
                      }
                    )
                  }
                />

                <label>크기</label>

                <input
                  type="range"
                  min="14"
                  max="64"
                  value={
                    selectedText.fontSize
                  }
                  onChange={(e) =>
                    updateText(
                      selectedText.id,
                      {
                        fontSize:
                          Number(
                            e.target.value
                          ),
                      }
                    )
                  }
                />

                <label>기울기</label>

                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={
                    selectedText.rotate
                  }
                  onChange={(e) =>
                    updateText(
                      selectedText.id,
                      {
                        rotate:
                          Number(
                            e.target.value
                          ),
                      }
                    )
                  }
                />

                <button
                  onClick={deleteText}
                  className="danger-button"
                >
                  삭제
                </button>
              </div>
            ) : (
              <p>
                텍스트를 선택하세요
              </p>
            )}

            <button
              onClick={addText}
              disabled={!resultImageUrl}
            >
              텍스트 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}