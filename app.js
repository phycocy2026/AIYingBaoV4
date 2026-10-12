(function () {
  "use strict";
  const DEFAULT_API = "https://aiyingbao2026.onrender.com/api/vision-recognition";
  const MAX_IMAGE_SIDE = 1600;
  const JPEG_QUALITY = 0.82;
  const REQUEST_TIMEOUT_MS = 120000;
  const API = window.AIYINGBAO_API_URL || localStorage.getItem("aiyingbaoApiUrl") || DEFAULT_API;
  const $ = (id) => document.getElementById(id);
  let selectedFile = null;
  let latestMeal = null;

  $("todayText").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
  document.querySelectorAll(".nav a").forEach((link) => link.addEventListener("click", () => {
    document.querySelectorAll(".nav a").forEach((item) => item.classList.remove("active")); link.classList.add("active");
  }));


  function getProfileState() {
    return {
      gender: $("gender").value,
      age: +$("age").value,
      height: +$("height").value,
      weight: +$("weight").value,
      goal: $("goal").value,
      activity: +$("activity").value,
      steps: +$("steps").value
    };
  }

  function updatePersonalizedRecommendations(reasonText) {
    const p = getProfileState();
    const meal = latestMeal || {};
    const n = meal.nutrition || {};
    const category = meal.foodCategory || "";

    let breakfastTitle = "均衡早餐，给一天开个好头";
    let breakfastText = "选择鸡蛋或牛奶等蛋白质食物，搭配全麦主食和水果。";
    let lunchTitle = "主食、蛋白质和蔬菜都要有";
    let lunchText = "午餐尽量做到有主食、有优质蛋白，也有足够蔬菜。";
    let dinnerTitle = "晚餐清淡一些，更容易保持平衡";
    let dinnerText = "少吃油炸和重口味食物，保留适量主食和优质蛋白。";

    // 根据健康目标调整
    if (p.goal === "loss") {
      breakfastTitle = "控糖减脂：早餐也要吃够";
      breakfastText = "优先选择鸡蛋、无糖奶或豆浆，主食适量，少选高糖饮料和甜点。";
      lunchTitle = "控糖减脂：先保证蛋白质和蔬菜";
      lunchText = "减少油炸和精制主食，增加蔬菜、鱼虾、禽肉或豆制品。";
      dinnerTitle = "控糖减脂：晚餐不过量";
      dinnerText = "晚餐减少高脂和高糖食物，主食适量，多搭配蔬菜。";
    } else if (p.goal === "gain") {
      breakfastTitle = "增肌塑形：早餐补足蛋白";
      breakfastText = "早餐可增加鸡蛋、牛奶、酸奶或豆制品，并搭配主食补充能量。";
      lunchTitle = "增肌塑形：午餐保证蛋白质";
      lunchText = "选择鱼、虾、鸡肉、牛肉或豆制品，搭配主食和蔬菜。";
      dinnerTitle = "增肌塑形：运动后注意恢复";
      dinnerText = "运动后适量补充蛋白质和碳水，避免只吃肉不吃主食。";
    }

    // 根据活动水平调整
    if (p.activity >= 1.55) {
      breakfastText += " 今天活动量较大，可以适当增加主食。";
    } else if (p.activity <= 1.2) {
      dinnerText += " 今天活动量较少，注意控制额外零食和含糖饮料。";
    }

    // 根据今天实际步数进一步调整
    if (p.steps >= 12000) {
      breakfastText += " 今天步数较多，注意补充水分和适量能量。";
      lunchText += " 活动量较大时，午餐可保证足够主食和优质蛋白。";
    } else if (p.steps >= 8000) {
      lunchText += " 今天步数不错，继续保持日常活动。";
    } else if (p.steps < 5000) {
      dinnerText += " 今天步数较少，可以增加散步等轻度活动。";
    }

    // 根据识别到的这餐营养动态调整
    const protein = Number(n.protein) || 0;
    const carbs = Number(n.carbs) || 0;
    const fat = Number(n.fat) || 0;
    const calories = Number(n.calories) || 0;

    if (calories > 0) {
      if (fat >= 30) {
        dinnerTitle = "本餐脂肪偏高，下一餐清淡一点";
        dinnerText = "下一餐可减少油炸、肥肉和浓酱，多选蔬菜、鱼虾或清淡做法。";
      }
      if (protein < 20) {
        lunchTitle = "本餐蛋白质偏少，下一餐补一补";
        lunchText = "下一餐可增加鸡蛋、牛奶、鱼虾、瘦肉或豆制品。";
      } else if (protein >= 30) {
        lunchTitle = "本餐蛋白质比较充足";
        lunchText = "下一餐可以把重点放在蔬菜和适量主食上，让搭配更均衡。";
      }
      if (carbs >= 80 && p.goal === "loss") {
        dinnerTitle = "本餐碳水较多，下一餐减少精制主食";
        dinnerText = "如果目标是科学减脂，下一餐可少一些米饭、面条和甜饮，多一些蔬菜和蛋白质。";
      }
      if (/蔬菜|沙拉/.test(category)) {
        lunchTitle = "蔬菜比较丰富，再搭配蛋白质更完整";
        lunchText = "可以增加鸡蛋、豆制品、鱼虾或瘦肉，让这一餐更均衡。";
      }
      if (/饮品|咖啡|奶茶/.test(category)) {
        dinnerTitle = "饮品不能代替正餐";
        dinnerText = "注意饮品中的糖和能量，正餐仍要保证主食、蛋白质和蔬菜。";
      }
    }

    $("breakfastTitle").textContent = breakfastTitle;
    $("breakfastText").textContent = breakfastText;
    $("lunchTitle").textContent = lunchTitle;
    $("lunchText").textContent = lunchText;
    $("dinnerTitle").textContent = dinnerTitle;
    $("dinnerText").textContent = dinnerText;

    const goalLabel =
      p.goal === "loss" ? "科学减脂" :
      p.goal === "gain" ? "增肌塑形" : "保持健康";

    $("stepOverview").textContent = Math.max(0, Math.round(p.steps)).toLocaleString("zh-CN");
    $("recommendReason").textContent =
      reasonText || `已根据“${goalLabel}”目标、今日 ${Math.max(0, Math.round(p.steps)).toLocaleString("zh-CN")} 步和当前身体信息更新建议。`;
  }

  $("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const gender = $("gender").value, age = +$("age").value, height = +$("height").value, weight = +$("weight").value;
    const bmr = gender === "male" ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161;
    const factor = +$("activity").value, goal = $("goal").value;
    const calories = Math.max(1200, Math.round((bmr * factor + (goal === "loss" ? -300 : goal === "gain" ? 250 : 0)) / 10) * 10);
    $("calorieGoal").textContent = calories; $("proteinGoal").textContent = Math.round(weight * (goal === "gain" ? 1.8 : 1.5));
    $("healthScore").textContent = Math.min(95, Math.max(70, Math.round(88 - Math.abs(weight / ((height / 100) ** 2) - 22))));
    updatePersonalizedRecommendations(`已根据身体信息、健康目标和今日 ${Math.max(0, +$("steps").value).toLocaleString("zh-CN")} 步更新推荐。`);
  });

  function selectFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus("请选择图片文件。", true);
    if (file.size > 8 * 1024 * 1024) return setStatus("图片不能超过 8MB。", true);
    selectedFile = file; $("preview").src = URL.createObjectURL(file); $("preview").hidden = false; $("uploadPrompt").hidden = true; $("recognizeButton").disabled = false; setStatus("照片已就绪，点击“开始识别”。");
  }
  $("chooseButton").addEventListener("click", () => $("foodUpload").click());
  $("foodUpload").addEventListener("change", (event) => selectFile(event.target.files[0]));
  $("dropZone").addEventListener("click", () => $("foodUpload").click());
  $("dropZone").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") $("foodUpload").click(); });
  ["dragenter", "dragover"].forEach((name) => $("dropZone").addEventListener(name, (e) => { e.preventDefault(); $("dropZone").classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((name) => $("dropZone").addEventListener(name, (e) => { e.preventDefault(); $("dropZone").classList.remove("dragging"); }));
  $("dropZone").addEventListener("drop", (e) => selectFile(e.dataTransfer.files[0]));
  function setStatus(text, error) { $("recognitionStatus").textContent = text; $("recognitionStatus").classList.toggle("error", !!error); }
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("手机无法读取这张照片，请改选 JPG 或 PNG 图片")); };
      image.src = objectUrl;
    });
  }
  async function prepareImage(file) {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("当前浏览器无法处理照片");
    context.fillStyle = "#fff"; context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }
  async function wakeService() {
    const healthUrl = new URL(API); healthUrl.pathname = "/health"; healthUrl.search = "";
    try { await fetch(healthUrl, { method: "GET", cache: "no-store" }); } catch { /* POST 会给出最终结果 */ }
  }
  function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.round(n * 10) / 10 : fallback; }
  function scorePercent(value) { const n = number(value); return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n)); }
  function escapeHtml(value) { const el = document.createElement("span"); el.textContent = String(value); return el.innerHTML; }
  function displayResult(data) {
    const labels = window.AIYingBaoLabels;
    $("foodName").textContent = labels.normalizeCategory(data.foodCategory);
    $("confidenceBadge").textContent = `可信度 ${scorePercent(data.confidence).toFixed(1)}%`;
    const ingredients = Array.isArray(data.ingredients) && data.ingredients.length ? data.ingredients.slice(0, 8) : ["食材待确认"];
    $("ingredients").innerHTML = ingredients.map((x) => `<span>${escapeHtml(x)}</span>`).join("");
    const n = data.nutrition || {}; $("calories").textContent = number(n.calories, "--"); $("protein").textContent = number(n.protein, "--"); $("carbs").textContent = number(n.carbs, "--"); $("fat").textContent = number(n.fat, "--");
    const items = Array.isArray(data.top5) ? data.top5.slice(0, 5) : [];
    $("top5").innerHTML = (items.length ? items : [{ name: data.foodCategory, score: data.confidence }]).map((item) => { const p = scorePercent(item.score); return `<li><div><span>${escapeHtml(labels.translateTop5(item.name))}</span><b>${p.toFixed(1)}%</b></div><i><em style="width:${p}%"></em></i></li>`; }).join("");
    $("resultPanel").hidden = false;
    latestMeal = {
      foodCategory: data.foodCategory || "",
      nutrition: {
        calories: number(n.calories, 0),
        protein: number(n.protein, 0),
        carbs: number(n.carbs, 0),
        fat: number(n.fat, 0)
      }
    };
    updatePersonalizedRecommendations("已结合本次食物识别结果自动更新个性化推荐。");
  }
  updatePersonalizedRecommendations();

  $("recognizeButton").addEventListener("click", async () => {
    if (!selectedFile) return;
    const button = $("recognizeButton"); button.disabled = true; button.textContent = "AI识别中…"; setStatus("正在压缩照片并连接识别服务，首次唤醒可能需要约一分钟。");
    try {
      const imageDataUrl = await prepareImage(selectedFile);
      await wakeService();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ imageDataUrl }), signal: controller.signal });
      } finally { clearTimeout(timer); }
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || `服务响应异常（${response.status}）`);
      displayResult(data); setStatus("识别完成：结果已按粗粒度餐食类别展示。");
    } catch (error) {
      const message = error.name === "AbortError" ? "识别等待超过 2 分钟，请稍后重试" : error.message === "Load failed" || error.message === "Failed to fetch" ? "网络连接中断，请关闭 VPN/内容拦截后切换 Wi-Fi 或蜂窝网络重试" : error.message;
      setStatus(`识别失败：${message}。`, true);
    }
    finally { button.disabled = false; button.textContent = "重新识别"; }
  });
})();
