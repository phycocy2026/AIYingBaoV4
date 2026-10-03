const API_URL =
  window.AIYINGBAO_API_URL ||
  "https://aiyingbao2026.onrender.com/api/vision-recognition";

const state = {
  goal: "balance",
  age: 12,
  sleep: 8,
  steps: 8000,
  restrictions: [],
  foodCategory: "未识别",
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  ingredients: [],
  top5: [],
  confidence: null,
  lastFile: null
};

const goalText = {
  balance: "均衡维持",
  fatLoss: "控糖减脂",
  muscle: "增肌恢复",
  heart: "心血管友好"
};

const recommendations = document.querySelector("#recommendations");
const plateCanvas = document.querySelector("#plateCanvas");
const ctx = plateCanvas.getContext("2d");

function collectState() {
  state.goal = document.querySelector("#goal").value;
  state.age = Number(document.querySelector("#age").value);
  state.sleep = Number(document.querySelector("#sleep").value);
  state.steps = Number(document.querySelector("#steps").value);
  state.restrictions = [...document.querySelectorAll("fieldset input:checked")]
    .map((item) => item.value);
  document.querySelector("#sleepOutput").textContent = `${state.sleep} 小时`;
}

function buildHealthPlan() {
  const activeScore = Math.min(18, Math.floor(state.steps / 700));
  const sleepScore = Math.max(0, Math.round((state.sleep - 4) * 7));
  const mealPenalty = state.nutrition.fat >= 35 ? 8 : state.nutrition.calories >= 800 ? 6 : 0;

  const score = Math.max(45, Math.min(98, 58 + activeScore + sleepScore - mealPenalty));
  const calorieBase =
    state.goal === "fatLoss" ? 1500 :
    state.goal === "muscle" ? 2050 :
    state.goal === "heart" ? 1680 : 1780;
  const calorieTarget = calorieBase + (state.steps > 10000 ? 120 : 0);
  const proteinTarget =
    state.goal === "muscle" ? 105 :
    state.goal === "fatLoss" ? 86 : 78;

  document.querySelector("#scoreValue").textContent = score;
  document.querySelector("#calorieValue").textContent = calorieTarget;
  document.querySelector("#proteinValue").textContent = `${proteinTarget}g`;
  document.querySelector("#riskTag").textContent =
    score >= 82 ? "状态良好" :
    score >= 68 ? "建议关注饮食结构" :
    "建议优化作息与饮食";

  const tips = [];
  tips.push(`当前目标为“${goalText[state.goal]}”，今日建议总热量约 ${calorieTarget} kcal，蛋白质目标约 ${proteinTarget} g。`);

  if (state.sleep < 6.5) {
    tips.push("今日睡眠偏少，建议规律进餐，减少高糖饮料和晚间咖啡因。");
  } else {
    tips.push("今日睡眠情况较好，可保持规律进餐和适量运动。");
  }

  if (state.steps >= 10000) {
    tips.push("今日活动量较大，可适当补充优质蛋白和复合碳水。");
  } else if (state.steps < 5000) {
    tips.push("今日活动量较少，建议控制高能量零食，并增加轻度活动。");
  }

  const n = state.nutrition;

  if (n.calories > 0) {
    if (n.fat >= 30) {
      tips.push("本餐脂肪可能偏高，下一餐建议减少油炸或高脂食物，并增加蔬菜。");
    }
    if (n.protein < 20) {
      tips.push("本餐蛋白质可能不足，可增加鸡蛋、鱼虾、奶类或豆制品。");
    } else if (n.protein >= 30) {
      tips.push("本餐蛋白质较充足，可注意搭配蔬菜和适量主食。");
    }
    if (n.carbs >= 80 && state.goal === "fatLoss") {
      tips.push("本餐碳水较高，若目标为控糖减脂，下一餐可适当减少精制主食。");
    }
  } else {
    tips.push("上传餐食照片后，系统会结合本餐营养结果进一步更新建议。");
  }

  if (state.restrictions.includes("lactose")) {
    tips.push("已记录乳糖不耐，可优先选择无乳糖奶、豆浆、鸡蛋或鱼虾补充蛋白。");
  }
  if (state.restrictions.includes("lowSalt")) {
    tips.push("已选择低盐目标，建议少喝浓汤、少选腌制和重口味食品。");
  }
  if (state.restrictions.includes("vegetarian")) {
    tips.push("已选择素食优先，可通过豆制品、蛋类和奶类补充蛋白。");
  }

  recommendations.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
  document.querySelector("#updatedAt").textContent =
    new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  drawPlate();
}

function drawPlate() {
  ctx.clearRect(0, 0, 280, 280);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(140, 140, 116, 0, Math.PI * 2);
  ctx.fill();

  const fallback = { carbs: 45, protein: 30, fat: 25 };
  const n = state.nutrition.calories > 0 ? state.nutrition : fallback;
  const total = Math.max(1, n.carbs + n.protein + n.fat);

  const values = [
    { value: n.carbs, color: "#d8a637" },
    { value: n.protein, color: "#2f8a57" },
    { value: n.fat, color: "#d9634f" }
  ];

  let start = -Math.PI / 2;
  values.forEach((segment) => {
    const angle = (segment.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(140, 140);
    ctx.arc(140, 140, 95, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(140, 140, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e2b24";
  ctx.font = "700 18px Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("膳食", 140, 136);
  ctx.font = "13px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#65756b";
  ctx.fillText("平衡图", 140, 157);
}

function compressImage(file, maxSize = 1280, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const c = canvas.getContext("2d");
        c.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

async function recognizeFile(file) {
  const status = document.querySelector("#recognitionStatus");
  const loading = document.querySelector("#recognitionLoading");
  const preview = document.querySelector("#foodImage");

  state.lastFile = file;
  preview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
  preview.style.backgroundSize = "cover";
  preview.style.backgroundPosition = "center";

  loading.hidden = false;
  status.textContent = "正在压缩并分析照片，请稍候…";
  document.querySelector("#foodName").textContent = "正在识别…";
  document.querySelector("#foodMacro").textContent = "正在分析食材和营养信息";

  try {
    const imageDataUrl = await compressImage(file);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`服务器返回 ${response.status}: ${text.slice(0, 120)}`);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    state.foodCategory = result.foodCategory || result.category || "混合餐食";
    state.ingredients = Array.isArray(result.ingredients) ? result.ingredients : [];
    state.nutrition = {
      calories: Number(result.nutrition?.calories) || 0,
      protein: Number(result.nutrition?.protein) || 0,
      carbs: Number(result.nutrition?.carbs) || 0,
      fat: Number(result.nutrition?.fat) || 0
    };
    state.confidence = Number(result.confidence);
    state.top5 = Array.isArray(result.top5) ? result.top5 : [];

    renderRecognition();
    buildHealthPlan();

  } catch (error) {
    console.error(error);
    status.textContent =
      "识别服务暂时无法连接。请确认网络正常，等待20–60秒后点击“重新识别”。";
    document.querySelector("#foodName").textContent = "识别失败";
    document.querySelector("#foodMacro").textContent = "请稍后重试";
  } finally {
    loading.hidden = true;
  }
}

function renderRecognition() {
  document.querySelector("#foodName").textContent =
    `餐食类别：${state.foodCategory}`;

  const n = state.nutrition;
  document.querySelector("#foodMacro").textContent =
    `约 ${Math.round(n.calories)} kcal · 蛋白 ${Math.round(n.protein)}g · 碳水 ${Math.round(n.carbs)}g · 脂肪 ${Math.round(n.fat)}g`;

  document.querySelector("#ingredientsList").innerHTML =
    state.ingredients.length
      ? state.ingredients.map((x) => `<li>${x}</li>`).join("")
      : "<li>未识别到明确食材</li>";

  const top5 = state.top5.slice(0, 5);
  document.querySelector("#top5Prediction").innerHTML =
    top5.length
      ? top5.map((item) => {
          const rawName = item.name || item.label || "";
          const scoreRaw = item.score ?? item.confidence ?? item.probability ?? 0;
          const score = Number(scoreRaw);
          const pct = score <= 1 ? score * 100 : score;
          return `<li>${window.translateTop5(rawName)}：${pct.toFixed(2)}%</li>`;
        }).join("")
      : "<li>暂无Top-5参考结果</li>";

  const confidenceText = Number.isFinite(state.confidence)
    ? `，整体置信参考值 ${Math.round(state.confidence * 100)}%`
    : "";

  document.querySelector("#recognitionStatus").textContent =
    `AI识别完成：${state.foodCategory}${confidenceText}。营养数据为图片估算值。`;
}

function bindFileInput(id) {
  document.querySelector(id).addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) recognizeFile(file);
    event.target.value = "";
  });
}

document.querySelector("#profileForm").addEventListener("input", () => {
  collectState();
  buildHealthPlan();
});

document.querySelector("#refreshPlan").addEventListener("click", () => {
  collectState();
  buildHealthPlan();
});

document.querySelector("#retryRecognition").addEventListener("click", () => {
  if (state.lastFile) {
    recognizeFile(state.lastFile);
  } else {
    document.querySelector("#recognitionStatus").textContent =
      "请先拍照或上传一张餐食图片。";
  }
});

bindFileInput("#foodCamera");
bindFileInput("#foodUpload");
collectState();
buildHealthPlan();
