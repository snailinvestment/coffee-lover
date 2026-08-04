// ============================================================
// 本地收藏系统 - 纯浏览器 localStorage 实现
// 无需登录、无需联网、无第三方依赖，任何地区 / 网络均可使用
// 全局依赖（app.js 调用）：userFavorites / toggleFavorite / updateFavoriteUI / showFavorites
// ============================================================

const FAV_STORAGE_KEY = 'coffee_lover_favorites_v1';

let userFavorites = new Set();

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    userFavorites = new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    userFavorites = new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...userFavorites]));
  } catch (e) {
    console.warn('[收藏] 保存失败（可能是隐私模式或存储空间已满）', e);
  }
}

function toggleFavorite(articleId) {
  if (!articleId) return;
  if (userFavorites.has(articleId)) {
    userFavorites.delete(articleId);
  } else {
    userFavorites.add(articleId);
  }
  saveFavorites();
  updateFavoriteButton(articleId);
  updateFavNavBadge();
  if (typeof state !== 'undefined' && state.currentRoute === 'favorites') {
    if (typeof render === 'function') render();
  }
}

function updateFavoriteButton(articleId) {
  const btn = document.querySelector(`[data-favorite="${articleId}"]`);
  if (!btn) return;
  const isFav = userFavorites.has(articleId);
  if (btn.classList.contains('favorited-lg')) {
    btn.innerHTML = isFav ? '❤️ 已收藏' : '🤍 收藏';
  } else {
    btn.innerHTML = isFav ? '❤️' : '🤍';
  }
  btn.classList.toggle('favorited', isFav);
}

function updateFavoriteUI() {
  document.querySelectorAll('[data-favorite]').forEach(btn => {
    updateFavoriteButton(btn.dataset.favorite);
  });
}

function showFavorites() {
  if (typeof navigate === 'function') navigate('favorites');
}

function updateFavNavBadge() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  const count = userFavorites.size;
  btn.textContent = count > 0 ? `♥ 收藏 ${count}` : '♥ 收藏';
}

loadFavorites();
updateFavNavBadge();
