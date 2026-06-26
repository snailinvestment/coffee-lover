/**
 * 咖啡爱好者 - SPA 应用引擎
 * JSON驱动的咖啡知识内容平台
 */

// ===== 状态管理 =====
const state = {
  articles: [],
  categories: [],
  currentRoute: 'home',
  currentParams: {}
};

// ===== 分类配置 =====
const categoryConfig = {
  history: { name: '咖啡历史', icon: '📜', color: 'history', desc: '从埃塞俄比亚牧羊人的传说到三次咖啡浪潮' },
  beans: { name: '咖啡豆世界', icon: '🫘', color: 'beans', desc: '品种、产区、处理法，读懂每一颗豆子' },
  tasting: { name: '咖啡品鉴', icon: '👃', color: 'tasting', desc: '风味轮、杯测、酸度，训练你的味蕾' },
  brewing: { name: '冲泡指南', icon: '🫗', color: 'brewing', desc: '手冲、意式、法压，找到适合你的方法' },
  tools: { name: '工具百科', icon: '🔧', color: 'tools', desc: '磨豆机、滤杯、咖啡机选购指南' },
  culture: { name: '咖啡文化', icon: '🌍', color: 'culture', desc: '咖啡馆、品牌故事、咖啡与生活' }
};

// ===== 初始化 =====
async function init() {
  // Use embedded data first for instant render, then try fetch for updates
  if (window.__ARTICLES__) {
    state.articles = window.__ARTICLES__.articles || [];
    state.categories = window.__ARTICLES__.categories || [];
  }
  
  // Try to load live data in background with a timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('data/articles.json', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.articles?.length) {
      state.articles = data.articles;
      state.categories = data.categories || [];
    }
  } catch (e) {
    // Silently use embedded data
  }
  
  setupEventListeners();
  handleRoute();
  window.addEventListener('hashchange', handleRoute);
}

// ===== 路由系统 =====
function handleRoute() {
  const hash = window.location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  
  state.currentRoute = parts[0];
  state.currentParams = {};
  
  if (parts[0] === 'article' && parts[1]) {
    state.currentParams.articleId = parts[1];
  } else if (parts[0] === 'category' && parts[1]) {
    state.currentParams.categoryId = parts[1];
  } else if (parts[0] === 'search' && parts[1]) {
    state.currentParams.query = decodeURIComponent(parts[1]);
  }
  
  updateNavActive();
  updateMobileTabs();
  render();
  window.scrollTo(0, 0);
}

function navigate(route) {
  window.location.hash = route;
}

// ===== 导航高亮 =====
function updateNavActive() {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    const route = a.dataset.route;
    if (route === state.currentRoute || 
        (state.currentRoute === 'category' && route === `category/${state.currentParams.categoryId}`)) {
      a.classList.add('active');
    }
  });
}

// ===== 事件监听 =====
function setupEventListeners() {
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-route]');
    if (link) {
      e.preventDefault();
      navigate(link.dataset.route);
    }
    
    const articleCard = e.target.closest('[data-article]');
    if (articleCard) {
      navigate(`article/${articleCard.dataset.article}`);
    }
  });
  
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) navigate(`search/${encodeURIComponent(query)}`);
  });
  
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) navigate(`search/${encodeURIComponent(query)}`);
    }
  });
  
  // Mobile hamburger menu
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close menu when clicking a nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }
  
  // Sync mobile tab bar
  updateMobileTabs();
}

function updateMobileTabs() {
  const tabs = document.querySelectorAll('.mobile-tab');
  tabs.forEach(tab => {
    const route = tab.dataset.route;
    if (route === 'home') {
      tab.classList.toggle('active', state.currentRoute === 'home');
    } else {
      const catId = route.replace('category/', '');
      tab.classList.toggle('active', state.currentRoute === 'category' && state.currentParams.categoryId === catId);
    }
  });
}

// ===== 渲染主入口 =====
function render() {
  const app = document.getElementById('app');
  
  switch (state.currentRoute) {
    case 'home': app.innerHTML = renderHome(); break;
    case 'category': app.innerHTML = renderCategory(state.currentParams.categoryId); break;
    case 'article': app.innerHTML = renderArticle(state.currentParams.articleId); break;
    case 'search': app.innerHTML = renderSearch(state.currentParams.query); break;
    default: app.innerHTML = renderHome();
  }
}

// ===== 首页 =====
function renderHome() {
  const latestArticles = [...state.articles].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const beginnerArticles = state.articles.filter(a => a.level === 'beginner').slice(0, 4);
  const brewingArticles = state.articles.filter(a => a.category === 'brewing').slice(0, 4);
  
  return `
    <section class="hero">
      <div class="container">
        <img src="images/hero_banner.png" alt="一豆一世界" loading="eager" width="1280" height="660" style="max-width:100%;height:auto;border-radius:var(--radius-lg);margin-bottom:var(--space-xl);" onerror="this.style.display='none'">
        <h1 class="hero-title">一豆一世界</h1>
        <p class="hero-subtitle">每一颗咖啡豆，都藏着一个世界的故事。从埃塞俄比亚的原始森林到你的杯中，我们陪你一起发现。</p>
        
        <div class="entry-cards">
          <div class="entry-card" data-route="category/history" onclick="event.stopPropagation();navigate('category/history')">
            <div class="entry-card-icon beginner">🌱</div>
            <h3>先了解咖啡是什么</h3>
            <p>从牧羊人的传说到三次咖啡浪潮，用故事开启你的咖啡之旅</p>
            <span class="entry-card-tag beginner">新手友好</span>
          </div>
          <div class="entry-card" data-route="category/brewing" onclick="event.stopPropagation();navigate('category/brewing')">
            <div class="entry-card-icon practical">🫗</div>
            <h3>我想学冲咖啡</h3>
            <p>5种新手友好冲泡法详解，带视频教学，明天就能冲一杯</p>
            <span class="entry-card-tag practical">立刻上手</span>
          </div>
          <div class="entry-card" data-route="category/beans" onclick="event.stopPropagation();navigate('category/beans')">
            <div class="entry-card-icon expert">🧬</div>
            <h3>深入咖啡知识</h3>
            <p>品种、产区、处理法、品鉴体系，构建系统化的咖啡认知</p>
            <span class="entry-card-tag expert">深度内容</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="section-header">
        <h2 class="section-title">最新文章</h2>
        <span class="section-more" data-route="category/history" onclick="navigate('category/history')">查看全部 →</span>
      </div>
      <div class="article-grid">
        ${latestArticles.map(a => renderArticleCard(a)).join('')}
      </div>
      
      ${renderAdSlot('inline')}
      
      <div class="section-header">
        <h2 class="section-title">新手入门推荐</h2>
      </div>
      <div class="article-grid">
        ${beginnerArticles.map(a => renderArticleCard(a)).join('')}
      </div>
      
      <div class="section-header">
        <h2 class="section-title">热门冲泡教程</h2>
      </div>
      <div class="article-grid">
        ${brewingArticles.map(a => renderArticleCard(a)).join('')}
      </div>
    </section>
  `;
}

// ===== 分类页 =====
function renderCategory(categoryId) {
  const config = categoryConfig[categoryId];
  if (!config) return renderHome();
  
  const categoryArticles = state.articles.filter(a => a.category === categoryId)
    .sort((a, b) => {
      // Video articles first
      if (a.video && !b.video) return -1;
      if (!a.video && b.video) return 1;
      // Then by date
      return new Date(b.date) - new Date(a.date);
    });
  
  return `
    <section class="container" style="padding-top: 32px;">
      <div class="breadcrumb">
        <a href="#" data-route="home" onclick="navigate('home')">首页</a> › 
        <span>${config.name}</span>
      </div>
      
      <div class="article-hero ${config.color}">
        <div class="article-hero-icon">${config.icon}</div>
        <h1>${config.name}</h1>
        <p style="color: var(--text-secondary); margin-top: 8px;">${config.desc}</p>
      </div>
      
      ${categoryId === 'beans' ? renderOriginMap() : ''}
      
      <div class="page-layout">
        <div>
          <div class="section-header">
            <h2 class="section-title">全部文章</h2>
            <span style="font-size:0.85rem;color:var(--text-tertiary);">共 ${categoryArticles.length} 篇</span>
          </div>
          ${categoryArticles.length > 0 
            ? `<div class="article-grid">${categoryArticles.map(a => renderArticleCard(a)).join('')}</div>`
            : '<p class="no-results">📝 该分类暂无文章，敬请期待</p>'
          }
          ${renderAdSlot('inline')}
        </div>
        <aside>
          ${renderSidebarSection(categoryId, categoryArticles)}
          ${renderAdSlot('sidebar')}
        </aside>
      </div>
    </section>
  `;
}

// ===== 文章详情页 =====
function renderArticle(articleId) {
  const article = state.articles.find(a => a.id === articleId);
  if (!article) return `<div class="container" style="padding-top:48px;"><p class="no-results">文章未找到</p></div>`;
  
  const config = categoryConfig[article.category] || {};
  const relatedArticles = state.articles
    .filter(a => a.category === article.category && a.id !== article.id)
    .slice(0, 3);
  
  return `
    <section class="container">
      <div class="breadcrumb">
        <a href="#" data-route="home" onclick="navigate('home')">首页</a> › 
        <a href="#" data-route="category/${article.category}" onclick="navigate('category/${article.category}')">${config.name}</a> › 
        <span>${article.title}</span>
      </div>
      
      <article class="article-detail">
        <div class="article-hero ${config.color || ''}">
          <div class="article-hero-icon">${config.icon || '☕'}</div>
          <h1>${article.title}</h1>
          <div class="article-meta">
            <span>${config.name}</span>
            <span>·</span>
            <span>${article.date}</span>
            <span>·</span>
            <span>${article.author}</span>
            ${article.level ? `<span>·</span><span class="article-card-level ${article.level}">${getLevelLabel(article.level)}</span>` : ''}
          </div>
        </div>
        
        ${renderAdSlot('inline')}
        
        <div class="page-layout">
          <div class="article-content">
            ${article.content || ''}
            
            ${article.id === 'brewing-comparison' ? renderBrewingRecommender() : ''}
            
            ${article.video ? renderVideoSection(article.video) : ''}
            
            ${article.products && article.products.length > 0 ? `
              <h2>🛒 推荐购买</h2>
              <div class="product-recommend">
                ${article.products.map(p => `
                  <div class="product-card">
                    <div class="product-card-name">${p.name}</div>
                    ${p.price ? `<div class="product-card-price">${p.price}</div>` : ''}
                    <a href="${p.link}" target="_blank" rel="noopener" class="product-card-link">去看看</a>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${relatedArticles.length > 0 ? `
              <div class="related-articles">
                <h2 style="font-size:1.2rem;margin-bottom:16px;color:var(--coffee-dark);">相关文章</h2>
                <div class="article-grid">
                  ${relatedArticles.map(a => renderArticleCard(a)).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          
          <aside>
            ${renderSidebarSection(article.category, state.articles.filter(a => a.category === article.category), article.id)}
            ${renderAdSlot('sidebar')}
          </aside>
        </div>
      </article>
    </section>
  `;
}

// ===== 搜索页 =====
function renderSearch(query) {
  if (!query) return renderHome();
  
  const results = state.articles.filter(a => {
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) ||
           (a.summary && a.summary.toLowerCase().includes(q)) ||
           (a.tags && a.tags.some(t => t.toLowerCase().includes(q)));
  });
  
  return `
    <section class="container" style="padding-top: 32px;">
      <div class="breadcrumb">
        <a href="#" data-route="home" onclick="navigate('home')">首页</a> › 
        <span>搜索</span>
      </div>
      
      <div style="margin-bottom:24px;">
        <input type="text" id="searchPageInput" class="search-input-full" 
               value="${escapeHtml(query)}" placeholder="搜索咖啡知识...">
      </div>
      
      <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
        搜索「${escapeHtml(query)}」，找到 <strong>${results.length}</strong> 篇相关文章
      </p>
      
      ${results.length > 0 
        ? `<div class="article-grid">${results.map(a => renderArticleCard(a)).join('')}</div>`
        : '<p class="no-results">未找到相关文章，试试其他关键词吧</p>'
      }
      
      <script>
        document.getElementById('searchPageInput').addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && this.value.trim()) {
            navigate('search/' + encodeURIComponent(this.value.trim()));
          }
        });
      </script>
    </section>
  `;
}

// ===== 文章卡片组件 =====
function renderArticleCard(article) {
  const config = categoryConfig[article.category] || {};
  const hasImage = article.coverImage;
  return `
    <article class="article-card" data-article="${article.id}">
      <div class="article-card-cover ${config.color || ''}">
        ${hasImage ? `<img src="${article.coverImage}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.classList.add('${config.color||''}');this.style.display='none';this.parentElement.textContent='${config.icon||'☕'}';this.parentElement.style.fontSize='2.5rem';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';">` : `${config.icon || '☕'}`}
        ${article.video ? '<span class="video-badge">▶ 视频</span>' : ''}
      </div>
      <div class="article-card-body">
        <div class="article-card-category ${config.color || ''}">${config.name}</div>
        <h3>${article.title}${article.video ? ' <span style="color:var(--accent-color);font-size:0.75rem;">📹</span>' : ''}</h3>
        <p>${article.summary || '阅读详情...'}</p>
        <div class="article-card-footer">
          <span>${article.date}</span>
          ${article.level ? `<span class="article-card-level ${article.level}">${getLevelLabel(article.level)}</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

// ===== 视频嵌入 =====
function renderVideoSection(video) {
  let embedHtml = '';
  if (video.platform === 'bilibili' && video.bvid) {
    embedHtml = `<iframe src="https://player.bilibili.com/player.html?bvid=${video.bvid}&page=1&high_quality=1" 
                  scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`;
  } else if (video.platform === 'youtube' && video.id) {
    embedHtml = `<iframe src="https://www.youtube.com/embed/${video.id}" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen></iframe>`;
  } else if (video.url) {
    embedHtml = `<iframe src="${video.url}" allowfullscreen></iframe>`;
  }
  
  return `
    <h2>🎬 视频教学</h2>
    ${video.title ? `<p style="color:var(--text-secondary);margin-bottom:16px;">${video.title}</p>` : ''}
    <div class="video-container">${embedHtml}</div>
    ${video.note ? `<p class="tip-box"><span class="tip-box-icon">💡</span><span>${video.note}</span></p>` : ''}
  `;
}

// ===== 广告位 =====
function renderAdSlot(type) {
  return `
    <div class="ad-slot ${type}">
      <div class="ad-slot-label">广告位 — 流量达标后启用</div>
      <p>Google AdSense / 品牌直投</p>
    </div>
  `;
}

// ===== 侧边栏 =====
function renderSidebarSection(categoryId, categoryArticles, excludeId) {
  const filtered = categoryArticles
    .filter(a => a.id !== excludeId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  if (filtered.length === 0) return '';
  
  return `
    <div class="sidebar-section">
      <h4>本栏目热门文章</h4>
      ${filtered.map(a => `
        <div style="margin-bottom:12px;cursor:pointer;" data-article="${a.id}">
          <div style="font-size:0.88rem;font-weight:600;color:var(--coffee-dark);line-height:1.4;">${a.title}</div>
          <div style="font-size:0.78rem;color:var(--text-tertiary);margin-top:4px;">${a.date}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== 咖啡产区世界地图 =====
function renderOriginMap() {
  return `
    <div style="background:var(--bg-white);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;margin:24px 0;text-align:center;">
      <img src="images/coffee_origin_map.png" alt="全球咖啡产区" style="max-width:100%;height:auto;border-radius:var(--radius-md);margin-bottom:16px;" onerror="this.style.display='none'">
      <h2 style="margin-bottom:8px;color:var(--brand-navy);">全球咖啡产区</h2>
      <p style="color:var(--text-secondary);margin-bottom:20px;font-size:0.95rem;">点击国家查看产区详情 | 红色标记 = 本站已有深度介绍</p>
      <div id="coffee-origin-map" style="background:linear-gradient(180deg,#E3F2FD 0%,#E8F5E9 60%,#FFF3E0 100%);border-radius:var(--radius-md);padding:20px;position:relative;overflow:hidden;min-height:420px;">
        <svg viewBox="0 0 900 460" style="width:100%;max-width:900px;margin:0 auto;">
          <g style="pointer-events:none;">
            <clipPath id="globe"><circle cx="450" cy="230" r="200"/></clipPath>
            <circle cx="450" cy="230" r="200" fill="none" stroke="#B8CCDD" stroke-width="1" stroke-dasharray="4 4"/>
          </g>
          <line x1="250" y1="230" x2="650" y2="230" stroke="#C8D6E4" stroke-width="0.5"/>
          <line x1="450" y1="80" x2="450" y2="380" stroke="#C8D6E4" stroke-width="0.5"/>

          <rect x="380" y="65" width="140" height="18" rx="4" fill="#E3F2FD"/>
          <text x="450" y="78" text-anchor="middle" font-size="10" fill="#1B3A5C">咖啡带 (南北回归线之间)</text>

          <path d="M80 220 Q140 190 200 195 Q230 185 260 188" fill="none" stroke="#1B3A5C" stroke-width="1.5" stroke-dasharray="6 3"/>
          <text x="170" y="210" text-anchor="middle" font-size="9" fill="#1B3A5C">北回归线</text>
          <path d="M80 280 Q180 310 260 300" fill="none" stroke="#1B3A5C" stroke-width="1.5" stroke-dasharray="6 3"/>
          <text x="170" y="295" text-anchor="middle" font-size="9" fill="#1B3A5C">南回归线</text>

          <circle cx="335" cy="140" r="8" fill="#2E7D32" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-panama')"/>
          <text x="335" y="127" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">巴拿马</text>

          <circle cx="290" cy="200" r="12" fill="#C62828" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-colombia')"/>
          <text x="290" y="218" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">哥伦比亚</text>

          <circle cx="330" cy="260" r="10" fill="#2E7D32" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-brazil')"/>
          <text x="355" y="263" text-anchor="start" font-size="9" font-weight="600" fill="#1B3A5C">巴西</text>

          <circle cx="380" cy="160" r="8" fill="#2E7D32" stroke="#fff" stroke-width="1.5"/>
          <text x="395" y="155" text-anchor="start" font-size="8" fill="#555">哥斯达黎加</text>

          <circle cx="375" cy="175" r="6" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="385" y="178" text-anchor="start" font-size="8" fill="#555">危地马拉</text>

          <circle cx="530" cy="150" r="14" fill="#C62828" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-ethiopia')"/>
          <text x="530" y="136" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">埃塞俄比亚</text>

          <circle cx="545" cy="180" r="10" fill="#C62828" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-kenya')"/>
          <text x="545" y="168" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">肯尼亚</text>

          <circle cx="520" cy="220" r="7" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="532" y="223" text-anchor="start" font-size="8" fill="#555">坦桑尼亚</text>

          <circle cx="500" cy="260" r="7" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="510" y="264" text-anchor="start" font-size="8" fill="#555">卢旺达</text>

          <circle cx="640" cy="200" r="12" fill="#C62828" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-indonesia')"/>
          <text x="640" y="186" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">印尼</text>

          <circle cx="675" cy="175" r="9" fill="#2E7D32" stroke="#fff" stroke-width="1.5" style="cursor:pointer" onclick="navigate('article/beans-origin-yunnan')"/>
          <text x="675" y="165" text-anchor="middle" font-size="9" font-weight="600" fill="#1B3A5C">中国云南</text>

          <circle cx="710" cy="200" r="7" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="720" y="203" text-anchor="start" font-size="8" fill="#555">越南</text>

          <circle cx="655" cy="170" r="5" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="663" y="166" text-anchor="start" font-size="7" fill="#555">印度</text>

          <circle cx="580" cy="165" r="6" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="560" y="162" text-anchor="end" font-size="8" fill="#555">也门</text>

          <circle cx="410" cy="185" r="5" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="420" y="182" text-anchor="start" font-size="7" fill="#555">墨西哥</text>

          <circle cx="300" cy="280" r="5" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="315" y="283" text-anchor="start" font-size="8" fill="#555">秘鲁</text>

          <line x1="750" y1="350" x2="850" y2="350" stroke="#C8D6E4" stroke-width="0.5"/>
          <circle cx="770" cy="350" r="6" fill="#C62828" stroke="#fff" stroke-width="1"/>
          <text x="785" y="353" text-anchor="start" font-size="10" fill="#1B3A5C">红色 = 深度产区文章</text>
          <circle cx="770" cy="375" r="5" fill="#2E7D32" stroke="#fff" stroke-width="1"/>
          <text x="785" y="378" text-anchor="start" font-size="10" fill="#1B3A5C">绿色 = 其他咖啡产区</text>
          <circle cx="770" cy="400" r="4" fill="#1B3A5C" stroke="#fff" stroke-width="1"/>
          <text x="785" y="403" text-anchor="start" font-size="10" fill="#1B3A5C">点击可跳转产区文章</text>
        </svg>
      </div>
    </div>
  `;
}

// ===== 冲泡方法推荐器 =====
function renderBrewingRecommender() {
  return `
    <div id="brewing-recommender" style="background:var(--bg-white);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;margin:24px 0;">
      <h2 style="margin-bottom:8px;color:var(--coffee-dark);">找到最适合你的冲泡方法</h2>
      <p style="color:var(--text-secondary);margin-bottom:20px;font-size:0.95rem;">回答3个问题，我们帮你推荐</p>
      
      <div style="margin-bottom:16px;">
        <p style="font-weight:600;margin-bottom:8px;color:var(--coffee-dark);">1. 你更看重什么？</p>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q1" value="easy"> 简单省事，越快越好</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q1" value="flavor"> 能品出咖啡豆本身的风味</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q1" value="strong"> 浓郁厚重，像咖啡馆一样</label>
      </div>
      
      <div style="margin-bottom:16px;">
        <p style="font-weight:600;margin-bottom:8px;color:var(--coffee-dark);">2. 你的预算？</p>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q2" value="low"> 100元以内搞定</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q2" value="mid"> 300-500元可以投入</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q2" value="high"> 预算不是问题</label>
      </div>
      
      <div style="margin-bottom:20px;">
        <p style="font-weight:600;margin-bottom:8px;color:var(--coffee-dark);">3. 使用场景？</p>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q3" value="home"> 在家慢慢享受</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q3" value="office"> 办公室/出差便携</label>
        <label style="display:block;margin:8px 0;cursor:pointer;"><input type="radio" name="q3" value="summer"> 夏天想喝冰咖啡</label>
      </div>
      
      <button onclick="recommendBrewing()" style="background:var(--coffee-brown);color:white;border:none;padding:10px 32px;border-radius:var(--radius-xl);font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='var(--coffee-dark)'" onmouseout="this.style.background='var(--coffee-brown)'">查看推荐 →</button>
      
      <div id="brewing-result" style="margin-top:20px;padding:20px;background:var(--coffee-cream);border-radius:var(--radius-md);display:none;"></div>
    </div>
    <script>
    function recommendBrewing() {
      const q1 = document.querySelector('input[name="q1"]:checked');
      const q2 = document.querySelector('input[name="q2"]:checked');
      const q3 = document.querySelector('input[name="q3"]:checked');
      const result = document.getElementById('brewing-result');
      
      if (!q1 || !q2 || !q3) {
        result.style.display = 'block';
        result.innerHTML = '<p style="color:var(--danger);">请先回答所有3个问题~</p>';
        return;
      }
      
      const key = q1.value + '-' + q2.value + '-' + q3.value;
      const recommendations = {
        'easy-low-home': {method:'法压壶', reason:'最低成本、零技巧，3分钟搞定，最适合预算有限的新手。', link:'brewing-frenchpress'},
        'easy-low-office': {method:'法压壶', reason:'办公室也可以轻松操作，不需要额外技巧。', link:'brewing-frenchpress'},
        'easy-mid-home': {method:'法压壶', reason:'虽然预算充足，但法压仍然是最简单省事的选择。', link:'brewing-frenchpress'},
        'flavor-low-home': {method:'V60手冲', reason:'最能展现咖啡豆本身风味，入门成本不高。但需要一点练习。', link:'brewing-pourover'},
        'flavor-mid-home': {method:'V60手冲', reason:'这个预算可以买到不错的手冲套装，冲煮过程本身就是享受。', link:'brewing-pourover'},
        'flavor-high-home': {method:'V60手冲', reason:'预算充足的话，升级磨豆机和温控壶会让出品更稳定。', link:'brewing-pourover'},
        'strong-low-home': {method:'摩卡壶', reason:'最便宜的方式做出接近意式浓缩的浓郁口感。', link:'brewing-comparison'},
        'strong-mid-home': {method:'摩卡壶+法压壶', reason:'摩卡壶做浓缩基底+法压壶打奶泡，在家做拿铁。', link:'brewing-comparison'},
        'strong-high-home': {method:'意式咖啡机', reason:'如果预算充裕且追求浓郁口感，直接上意式机不会后悔。', link:'brewing-comparison'},
        'easy-low-summer': {method:'冷萃', reason:'冷萃不需要特殊设备，一个罐子+冰箱就能做。', link:'brewing-comparison'},
        'flavor-mid-office': {method:'爱乐压', reason:'便携、快速、出品干净，出差/办公室神器。', link:'brewing-comparison'},
        'easy-mid-office': {method:'爱乐压', reason:'2分钟搞定，清洗方便，办公室咖啡的首选。', link:'brewing-comparison'},
        'easy-low-summer': {method:'冷萃', reason:'提前一晚泡好，第二天直接喝，夏天最佳选择。', link:'brewing-comparison'},
        'flavor-mid-summer': {method:'手冲冰咖啡', reason:'手冲后直接浇在冰块上，风味清晰又冰爽。', link:'brewing-pourover'}
      };
      
      const defaultRec = {method:'V60手冲', reason:'综合来看，手冲是最能让你深入咖啡世界的方法，值得投入一点时间学习。', link:'brewing-pourover'};
      const rec = recommendations[key] || defaultRec;
      
      result.style.display = 'block';
      result.innerHTML = '<p style="font-weight:700;font-size:1.1rem;color:var(--coffee-dark);margin-bottom:8px;">推荐：' + rec.method + '</p><p style="color:var(--text-secondary);margin-bottom:12px;">' + rec.reason + '</p><a href="#article/' + rec.link + '" onclick="navigate(\'article/' + rec.link + '\')" style="color:var(--accent-amber);font-weight:600;">查看详细教程 →</a>';
    }
    </script>
  `;
}

// ===== 辅助函数 =====
function getLevelLabel(level) {
  const labels = { beginner: '入门', intermediate: '进阶', advanced: '深度' };
  return labels[level] || level;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
