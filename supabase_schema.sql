-- 收藏表：存储用户的文章收藏
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 索引：加速按用户查询收藏
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- 索引：加速按文章查询收藏数
CREATE INDEX IF NOT EXISTS idx_favorites_article ON favorites(article_id);

-- RLS 策略：用户只能读写自己的收藏
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可读自己的收藏" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可插入自己的收藏" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的收藏" ON favorites
  FOR DELETE USING (auth.uid() = user_id);
