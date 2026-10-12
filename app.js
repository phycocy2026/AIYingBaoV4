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

    const calorieGoal = Number($("calorieGoal").textContent) || 0;
    const proteinGoal = Number($("proteinGoal").textContent) || 0;

    let breakfastTitle = "早餐：均衡开启一天";
    let breakfastText = `根据当前身体信息，今日建议热量约 ${calorieGoal} kcal，早餐可选择蛋类或奶类，搭配主食和水果。`;

    let lunchTitle = "午餐：主食、蛋白和蔬菜都要有";
    let lunchText = `今日蛋白质目标约 ${proteinGoal} g，午餐建议搭配鱼虾、禽肉或豆制品，并保证足够蔬菜。`;

    let dinnerTitle = "晚餐：清淡但不节食";
    let dinnerText = "晚餐减少重油酱汁，保留适量主食和优质蛋白。";

    // 年龄：儿童/青少年强调成长与均衡，不使用成人减重式表述。
    if (p.age <= 17) {
      breakfastTitle = "早餐：成长阶段更要吃好";
      breakfastText = `当前年龄 ${p.age} 岁，早餐要有主食、蛋白质和水果或蔬菜，不能只靠零食或饮料。`;
      lunchText += " 成长阶段更要注意食物种类丰富，不建议随意节食。";
    } else if (p.age >= 60) {
      breakfastText += " 可优先选择容易消化的食物，并保证蛋白质摄入。";
      dinnerText += " 晚餐不宜过晚、过量。";
    }

    // 健康目标
    if (p.goal === "loss") {
      breakfastTitle = p.age <= 17 ? "早餐：均衡饮食，不随意节食" : "早餐：控糖但要吃够";
      breakfastText = p.age <= 17
        ? "成长阶段不建议简单少吃，应减少高糖饮料和油炸零食，同时保证主食、蛋白质和蔬果。"
        : "优先选择鸡蛋、无糖奶或豆浆，搭配适量全麦主食和水果。";

      lunchTitle = "午餐：多蔬菜，主食适量";
      lunchText = "建议有优质蛋白、蔬菜和适量主食，少选油炸和浓酱。";

      dinnerTitle = "晚餐：清淡不过量";
      dinnerText = "减少高脂、高糖食物，适量主食，增加蔬菜和优质蛋白。";

    } else if (p.goal === "gain") {
      breakfastTitle = "早餐：补充蛋白和能量";
      breakfastText = `今日蛋白质目标约 ${proteinGoal} g，早餐可增加鸡蛋、牛奶、酸奶或豆制品，并搭配主食。`;

      lunchTitle = "午餐：保证优质蛋白";
      lunchText = "选择鱼、虾、鸡肉、牛肉或豆制品，搭配主食和蔬菜。";

      dinnerTitle = "晚餐：帮助运动后恢复";
      dinnerText = "运动后适量补充蛋白质和碳水，避免只吃肉不吃主食。";
    }

    // 身高体重：不做疾病判断，只根据输入值说明目标已经重新计算。
    breakfastText += ` 系统已按 ${p.height} cm、${p.weight} kg 的输入重新计算今日营养参考。`;

    // 活动水平
    if (p.activity <= 1.2) {
      lunchTitle = "午餐：活动量偏少，注意份量";
      lunchText = "今天活动水平偏低，午餐避免大份油炸食物和高糖饮料，多选蔬菜和优质蛋白。";
    } else if (p.activity >= 1.55) {
      lunchTitle = "午餐：活动量较大，及时补充能量";
      lunchText = "今天活动水平较高，午餐可以保证足够主食和优质蛋白，并注意补水。";
    }

    // 今日步数，让午餐和晚餐都明显变化
    if (p.steps < 5000) {
      lunchTitle = "午餐：今天走得少，吃得更轻一些";
      lunchText = "今日步数不足5000步，午餐减少油炸和大份主食，多吃蔬菜。";
      dinnerTitle = "晚餐：少油少糖，饭后走一走";
      dinnerText = "今天步数较少，晚餐建议清淡，饭后可散步增加活动量。";
    } else if (p.steps < 8000) {
      lunchTitle = "午餐：活动量一般，保持均衡";
      lunchText = "今日步数在5000–7999步，午餐保持主食、蛋白质和蔬菜均衡搭配。";
      dinnerTitle = "晚餐：适量主食，避免过饱";
      dinnerText = "今天活动量一般，晚餐吃到七八分饱即可。";
    } else if (p.steps < 12000) {
      lunchTitle = "午餐：步数不错，补充优质蛋白";
      lunchText = "今日步数在8000–11999步，午餐可保证主食和优质蛋白，继续保持活动。";
      dinnerTitle = "晚餐：补充蛋白，保持清淡";
      dinnerText = "今天活动量较好，晚餐可适量补充蛋白质，同时保证蔬菜摄入。";
    } else {
      lunchTitle = "午餐：高活动量，主食和蛋白都要够";
      lunchText = "今日步数达到12000步以上，午餐可适当增加主食、鱼虾、肉类或豆制品。";
      dinnerTitle = "晚餐：帮助恢复，别忘了补水";
      dinnerText = "今天活动量较大，晚餐可适量补充蛋白质和碳水，并注意水分和蔬菜。";
    }

    // 食物识别结果继续影响下一餐建议
    const protein = Number(n.protein) || 0;
    const carbs = Number(n.carbs) || 0;
    const fat = Number(n.fat) || 0;
    const calories = Number(n.calories) || 0;

    if (calories > 0) {
      if (fat >= 30) {
        dinnerTitle = "晚餐：本餐脂肪偏高，下一餐清淡一点";
        dinnerText = "下一餐减少油炸、肥肉和浓酱，多选蔬菜、鱼虾或清淡做法。";
      }

      if (protein < 20) {
        lunchTitle = "午餐：本餐蛋白质偏少，下一餐补一补";
        lunchText = "下一餐可增加鸡蛋、牛奶、鱼虾、瘦肉或豆制品。";
      } else if (protein >= 30) {
        lunchTitle = "午餐：本餐蛋白质已经比较充足";
        lunchText = "下一餐可把重点放在蔬菜和适量主食上，让搭配更均衡。";
      }

      if (carbs >= 80 && p.goal === "loss" && p.age > 17) {
        dinnerTitle = "晚餐：本餐碳水较多，下一餐少一点主食";
        dinnerText = "下一餐可少一些米饭、面条和甜饮，多一些蔬菜和蛋白质。";
      }

      if (/蔬菜|沙拉/.test(category)) {
        lunchTitle = "午餐：蔬菜丰富，再补一点蛋白";
        lunchText = "可增加鸡蛋、豆制品、鱼虾或瘦肉，让这一餐更完整。";
      }

      if (/饮品|咖啡|奶茶/.test(category)) {
        dinnerTitle = "晚餐：饮品不能代替正餐";
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

    const genderLabel = p.gender === "male" ? "男" : "女";
    const mealLabel = latestMeal && latestMeal.foodCategory
      ? `；本餐：${latestMeal.foodCategory}`
      : "";

    $("recommendReason").textContent =
      reasonText || `已实时更新：${genderLabel}，${p.age}岁，${p.height}cm，${p.weight}kg，${goalLabel}，今日${Math.round(p.steps).toLocaleString("zh-CN")}步${mealLabel}。`;
  }

  function refreshHealthAndRecommendations(reasonText) {
    const gender = $("gender").value;
    const age = +$("age").value;
    const height = +$("height").value;
    const weight = +$("weight").value;
    const factor = +$("activity").value;
    const goal = $("goal").value;
    const steps = Math.max(0, +$("steps").value || 0);

    const bmr = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const calories = Math.max(
      1200,
      Math.round((bmr * factor + (goal === "loss" ? -300 : goal === "gain" ? 250 : 0)) / 10) * 10
    );

    $("calorieGoal").textContent = calories;
    $("proteinGoal").textContent = Math.round(weight * (goal === "gain" ? 1.8 : 1.5));
    $("healthScore").textContent = Math.min(
      95,
      Math.max(70, Math.round(88 - Math.abs(weight / ((height / 100) ** 2) - 22)))
    );
    $("stepOverview").textContent = Math.round(steps).toLocaleString("zh-CN");

    updatePersonalizedRecommendations(
      reasonText || `已根据身体信息、健康目标和今日 ${Math.round(steps).toLocaleString("zh-CN")} 步实时更新推荐。`
    );
  }

  $("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    refreshHealthAndRecommendations("已根据你刚刚填写的信息重新生成个性化推荐。");
  });

  // 输入内容一改变，推荐立即更新，不必等待点击按钮。
  ["gender", "age", "height", "weight", "goal", "activity", "steps"].forEach((id) => {
    const el = $(id);
    ["input", "change", "blur"].forEach((eventName) => {
      el.addEventListener(eventName, () => refreshHealthAndRecommendations());
    });
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
  refreshHealthAndRecommendations();

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
