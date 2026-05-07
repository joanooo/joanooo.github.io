/* =========================================
   Joanoo Convert 邏輯 (PDF Tool JS)
   ========================================= */
const tools = {
  "convert-pdf": {
    title: "轉 PDF",
    desc: "上傳 Word、PPT 或圖片，快速轉成 PDF",
    accept: ".doc,.docx,.ppt,.pptx,image/*",
    output: ["pdf"],
    multiple: true,
    buttonText: "開始轉換",
    dropHint: "支援 Word / PPT / 圖片"
  },
  "merge-pdf": {
    title: "合併 PDF",
    desc: "上傳多個 PDF，合併成單一 PDF 檔案",
    accept: ".pdf",
    output: ["pdf"],
    multiple: true,
    buttonText: "開始合併",
    dropHint: "請拖曳多個 PDF 到這裡"
  },
  "compress-pdf": {
    title: "壓縮 PDF",
    desc: "上傳單一 PDF，壓縮後下載",
    accept: ".pdf",
    output: ["pdf"],
    multiple: false,
    buttonText: "開始壓縮",
    dropHint: "或拖曳 PDF 到這裡"
  }
};

let currentTool = "convert-pdf";
let selectedFiles = [];

const tabs = document.querySelectorAll("[data-tool]");
const toolTitle = document.getElementById("toolTitle");
const toolDesc = document.getElementById("toolDesc");
const fileInput = document.getElementById("fileInput");
const pickFileBtn = document.getElementById("pickFileBtn");
const dropArea = document.getElementById("dropArea");
const dropHint = document.getElementById("dropHint");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const removeFileBtn = document.getElementById("removeFileBtn");
const outputFormat = document.getElementById("outputFormat");
const convertBtn = document.getElementById("convertBtn");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");
const resultWrap = document.getElementById("resultWrap");
const resultText = document.getElementById("resultText");
const downloadLink = document.getElementById("downloadLink");

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function setTool(toolKey) {
  currentTool = toolKey;
  selectedFiles = [];
  fileInput.value = "";
  fileInfo.classList.add("hidden");
  progressWrap.classList.add("hidden");
  resultWrap.classList.add("hidden");
  progressBar.style.width = "0%";
  progressPercent.textContent = "0%";

  tabs.forEach(tab => tab.classList.remove("active"));
  document.querySelector('[data-tool="' + toolKey + '"]').classList.add("active");

  const tool = tools[toolKey];
  toolTitle.textContent = tool.title;
  toolDesc.textContent = tool.desc;
  dropHint.textContent = tool.dropHint;
  convertBtn.textContent = tool.buttonText;
  fileInput.accept = tool.accept;
  fileInput.multiple = !!tool.multiple;

  outputFormat.innerHTML = "";
  tool.output.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type.toUpperCase();
    outputFormat.appendChild(opt);
  });
}

function setFiles(files) {
  selectedFiles = Array.from(files);
  if (!selectedFiles.length) return;

  const names = selectedFiles.map(file => file.name).join("、");
  const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  fileName.textContent = names;
  fileMeta.textContent = selectedFiles.length + " 個檔案 ・ " + formatSize(total);
  fileInfo.classList.remove("hidden");
  resultWrap.classList.add("hidden");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => setTool(tab.dataset.tool));
});

pickFileBtn.addEventListener("click", () => fileInput.click());
dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", e => {
  setFiles(e.target.files);
});

["dragenter", "dragover"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => {
    e.preventDefault();
    dropArea.classList.add("border-indigo-400", "bg-white/5");
  });
});

["dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => {
    e.preventDefault();
    dropArea.classList.remove("border-indigo-400", "bg-white/5");
  });
});

dropArea.addEventListener("drop", e => {
  const files = e.dataTransfer.files;
  setFiles(files);
});

removeFileBtn.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  fileInfo.classList.add("hidden");
  progressWrap.classList.add("hidden");
  resultWrap.classList.add("hidden");
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) {
    alert("請先選擇檔案");
    return;
  }

  if (currentTool === "merge-pdf" && selectedFiles.length < 2) {
    alert("合併 PDF 需要至少 2 個檔案");
    return;
  }

  if (currentTool === "compress-pdf" && selectedFiles.length > 1) {
    alert("壓縮 PDF 只能上傳 1 個檔案");
    return;
  }

  progressWrap.classList.remove("hidden");
  resultWrap.classList.add("hidden");

  let percent = 0;
  progressText.textContent = currentTool === "merge-pdf" ? "合併中..." : currentTool === "compress-pdf" ? "壓縮中..." : "轉換中...";

  const timer = setInterval(() => {
    percent += 10;
    if (percent > 90) {
      clearInterval(timer);
      return;
    }
    progressBar.style.width = percent + "%";
    progressPercent.textContent = percent + "%";
  }, 180);

  try {
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("files", file));
    formData.append("tool", currentTool);
    formData.append("output", outputFormat.value);

    // 這裡呼叫後端 API
    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData
    });

    clearInterval(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "處理失敗" }));
      throw new Error(err.message || "處理失敗");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    let finalName = "output.pdf";

    if (currentTool === "merge-pdf") finalName = "merged.pdf";
    else if (currentTool === "compress-pdf") finalName = "compressed.pdf";
    else {
      const originalName = selectedFiles[0].name.replace(/\.[^/.]+$/, "");
      finalName = originalName + ".pdf";
    }

    progressBar.style.width = "100%";
    progressPercent.textContent = "100%";
    progressText.textContent = currentTool === "merge-pdf" ? "合併完成" : currentTool === "compress-pdf" ? "壓縮完成" : "轉換完成";

    downloadLink.href = url;
    downloadLink.download = finalName;
    resultText.textContent = currentTool === "merge-pdf"
      ? "PDF 已合併完成，可立即下載"
      : currentTool === "compress-pdf"
      ? "PDF 已壓縮完成，可立即下載"
      : "PDF 已轉換完成，可立即下載";
    resultWrap.classList.remove("hidden");
  } catch (error) {
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    progressText.textContent = error.message || "處理失敗";
    alert(error.message || "處理失敗");
  }
});

// 預設載入「轉 PDF」
setTool("convert-pdf");
