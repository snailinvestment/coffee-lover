// Supabase 配置 - 咖啡网站用户系统
const SUPABASE_URL = 'https://iyqmfjmmachxukvgcdab.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fzU8fw4-J0nEH2WFb9mVvA_0_-q1i00';

// 用户状态
let supabaseClient = null;
let currentUser = null;
let userFavorites = new Set();

// 初始化 Supabase（延迟加载，避免阻塞页面）
async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  // 等待 SDK 加载完成（通过 index.html 中的本地 script 标签引入）
  if (!window.supabase) {
    console.error('Supabase SDK 未加载，请检查 js/supabase.min.js 是否正确引入');
    return null;
  }

  console.log('[Supabase] 初始化中，项目 URL:', SUPABASE_URL);
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[Supabase] 客户端已创建');
  
  // 检查当前会话
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadUserFavorites();
  }
  
  // 监听登录状态变化
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      loadUserFavorites().then(updateFavoriteUI);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      userFavorites.clear();
      updateFavoriteUI();
    }
  });
  
  updateAuthUI();
  return supabaseClient;
}

// 加载外部脚本
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 更新登录按钮 UI
function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  if (!authBtn) return;
  
  if (currentUser) {
    authBtn.textContent = '👤';
    authBtn.title = currentUser.email || '已登录';
    authBtn.onclick = showUserMenu;
  } else {
    authBtn.textContent = '登录';
    authBtn.title = '登录/注册';
    authBtn.onclick = showLoginModal;
  }
}

// 加载用户收藏
async function loadUserFavorites() {
  if (!currentUser || !supabaseClient) return;
  
  const { data, error } = await supabaseClient
    .from('favorites')
    .select('article_id')
    .eq('user_id', currentUser.id);
  
  if (data) {
    userFavorites = new Set(data.map(f => f.article_id));
  }
}

// 切换收藏状态
async function toggleFavorite(articleId) {
  if (!currentUser) {
    showLoginModal();
    return;
  }
  
  const isFavorited = userFavorites.has(articleId);
  
  if (isFavorited) {
    await supabaseClient
      .from('favorites')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('article_id', articleId);
    userFavorites.delete(articleId);
  } else {
    await supabaseClient
      .from('favorites')
      .insert({ user_id: currentUser.id, article_id: articleId });
    userFavorites.add(articleId);
  }
  
  updateFavoriteButton(articleId);
}

// 更新收藏按钮状态
function updateFavoriteButton(articleId) {
  const btn = document.querySelector(`[data-favorite="${articleId}"]`);
  if (btn) {
    const isFav = userFavorites.has(articleId);
    if (btn.classList.contains('favorited-lg')) {
      btn.innerHTML = isFav ? '❤️ 已收藏' : '🤍 收藏';
    } else {
      btn.innerHTML = isFav ? '❤️' : '🤍';
    }
    btn.classList.toggle('favorited', isFav);
  }
}

// 更新所有收藏按钮
function updateFavoriteUI() {
  document.querySelectorAll('[data-favorite]').forEach(btn => {
    const articleId = btn.dataset.favorite;
    updateFavoriteButton(articleId);
  });
}

// 显示登录弹窗
function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>登录一豆一世界</h3>
      <p class="modal-desc">收藏喜欢的文章，参与讨论</p>
      <input type="email" id="loginEmail" placeholder="邮箱地址" class="modal-input">
      <input type="password" id="loginPassword" placeholder="密码" class="modal-input">
      <div class="modal-actions">
        <button onclick="handleLogin()" class="btn btn-primary">登录</button>
        <button onclick="handleSignup()" class="btn btn-secondary">注册</button>
      </div>
      <button onclick="closeModal()" class="modal-close">×</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// 关闭弹窗
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// 处理登录
async function handleLogin() {
  const client = await initSupabase();
  if (!client) {
    alert('登录失败：Supabase 客户端未初始化，请刷新页面重试');
    return;
  }

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('登录业务错误:', error);
      alert('登录失败：' + error.message);
    } else {
      closeModal();
      updateAuthUI();
    }
  } catch (err) {
    console.error('登录网络/CORS错误:', err);
    alert('登录失败：' + (err.message || '无法连接到登录服务器，请检查控制台网络报错'));
  }
}

// 处理注册
async function handleSignup() {
  const client = await initSupabase();
  if (!client) {
    alert('注册失败：Supabase 客户端未初始化，请刷新页面重试');
    return;
  }

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const { data, error } = await client.auth.signUp({ email, password });

    if (error) {
      console.error('注册业务错误:', error);
      alert('注册失败：' + error.message);
    } else {
      alert('注册成功！请查收验证邮件');
      closeModal();
    }
  } catch (err) {
    console.error('注册网络/CORS错误:', err);
    alert('注册失败：' + (err.message || '无法连接到注册服务器，请检查控制台网络报错'));
  }
}

// 显示用户菜单
function showUserMenu() {
  const menu = document.createElement('div');
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-item" onclick="showFavorites()">我的收藏</div>
    <div class="user-menu-item" onclick="handleLogout()">退出登录</div>
  `;
  
  // 点击其他地方关闭
  const closeMenu = (e) => {
    if (!e.target.closest('.user-menu') && !e.target.closest('#authBtn')) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 10);
  
  const btn = document.getElementById('authBtn');
  btn.parentNode.appendChild(menu);
}

// 退出登录
async function handleLogout() {
  await supabaseClient.auth.signOut();
  updateAuthUI();
}

// 显示收藏列表
async function showFavorites() {
  navigate('favorites');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，避免阻塞首屏
  setTimeout(initSupabase, 100);
});

// 诊断函数：可在浏览器控制台运行 window.testSupabaseConnection()
window.testSupabaseConnection = async function() {
  const client = await initSupabase();
  if (!client) {
    console.error('[Supabase 诊断] 客户端未初始化');
    return;
  }
  console.log('[Supabase 诊断] 项目 URL:', SUPABASE_URL);
  console.log('[Supabase 诊断] Anon key 前缀:', SUPABASE_ANON_KEY.slice(0, 20) + '...');

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.error('[Supabase 诊断] getSession 失败:', error);
    } else {
      console.log('[Supabase 诊断] getSession 成功，当前会话:', data.session ? '已登录' : '未登录');
    }
  } catch (err) {
    console.error('[Supabase 诊断] getSession 抛出异常:', err);
  }
};
