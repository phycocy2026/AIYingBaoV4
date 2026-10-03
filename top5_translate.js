window.translateTop5 = function(name) {
  const text = String(name || "").toLowerCase().trim();
  const rules = [
    ["meat loaf", "肉类熟食"],
    ["meatloaf", "肉类熟食"],
    ["burrito", "混合主食"],
    ["guacamole", "牛油果酱/蔬菜酱料"],
    ["plate", "餐盘"],
    ["bagel", "面包类"],
    ["beigel", "面包类"],
    ["steak", "牛肉类"],
    ["roast beef", "牛肉类"],
    ["beef", "牛肉类"],
    ["rice", "米饭类"],
    ["noodle", "面食类"],
    ["ramen", "面食类"],
    ["pasta", "面食类"],
    ["salad", "沙拉类"],
    ["chicken", "鸡肉类"],
    ["fish", "鱼类"],
    ["shrimp", "虾类"],
    ["seafood", "鱼虾类"],
    ["fruit", "水果类"],
    ["apple", "水果类"],
    ["banana", "水果类"],
    ["coffee", "咖啡饮品"],
    ["milk tea", "奶茶饮品"],
    ["tea", "茶饮"]
  ];
  for (const [en, zh] of rules) {
    if (text.includes(en)) return zh;
  }
  return "其他食物";
};
