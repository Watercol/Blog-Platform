-- 添加文章测试数据
USE blog_platform;

-- 插入测试标签
INSERT INTO tags (name, slug) VALUES 
  ('技术', 'tech'),
  ('生活', 'life'),
  ('旅行', 'travel'),
  ('美食', 'food'),
  ('编程', 'programming')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 获取默认作者ID
SET @author_id = (SELECT id FROM users WHERE email = 'author@example.com' LIMIT 1);

-- 插入10篇测试文章
INSERT INTO articles (user_id, title, slug, excerpt, content, reading_minutes, status, published_at) VALUES
(@author_id, 'React Hooks完全指南', 'react-hooks-guide', '深入学习React Hooks的使用方法和最佳实践', 'React Hooks是React 16.8引入的新特性，它让你可以在不编写class的情况下使用state以及其他的React特性。本文将详细介绍各种Hooks的使用方法和实际应用场景。\n\n## useState\nuseState是最常用的Hook，用于在函数组件中添加状态。\n\n## useEffect\nuseEffect用于处理副作用，比如数据获取、订阅或手动修改DOM。\n\n## useContext\nuseContext用于在组件间共享状态，避免层层传递props。\n\n## 自定义Hooks\n你可以创建自定义Hooks来复用组件逻辑。', 5, 'published', NOW()),

(@author_id, 'Vue 3 Composition API实战', 'vue3-composition-api', '探索Vue 3 Composition API的优势和使用技巧', 'Vue 3带来了Composition API，这是一种更灵活的组织组件逻辑的方式。\n\n### 什么是Composition API\nComposition API是一组基于函数的API，允许我们更灵活地组合组件逻辑。\n\n### 优势\n1. 更好的逻辑复用\n2. 更灵活的代码组织\n3. 更好的类型推导\n4. 更小的生产包体积', 4, 'published', DATE_SUB(NOW(), INTERVAL 2 DAY)),

(@author_id, 'Node.js性能优化技巧', 'nodejs-performance-tips', '提升Node.js应用性能的实用技巧', 'Node.js性能优化是每个开发者都应该掌握的技能。\n\n## 内存管理\n合理管理内存可以避免内存泄漏问题。\n\n## 异步处理\n充分利用异步I/O提升并发处理能力。\n\n## 缓存策略\n使用适当的缓存策略减少重复计算。', 6, 'published', DATE_SUB(NOW(), INTERVAL 5 DAY)),

(@author_id, 'CSS Grid布局详解', 'css-grid-layout', '深入理解CSS Grid布局系统', 'CSS Grid是CSS中最强大的布局系统之一。\n\n### 基本概念\nGrid布局由网格容器和网格项组成。\n\n### 关键属性\n- grid-template-columns\n- grid-template-rows\n- grid-column\n- grid-row\n\n### 实际应用\n通过大量实例演示Grid的各种用法。', 7, 'published', DATE_SUB(NOW(), INTERVAL 10 DAY)),

(@author_id, '微服务架构设计原则', 'microservices-design-principles', '构建可靠微服务系统的指导原则', '微服务架构是一种将单一应用程序开发为一组小型服务的方法。\n\n## 设计原则\n1. 单一职责原则\n2. 高内聚低耦合\n3. 无状态设计\n4. 容错性设计\n\n## 挑战\n- 分布式系统的复杂性\n- 数据一致性\n- 服务治理', 8, 'published', DATE_SUB(NOW(), INTERVAL 15 DAY)),

(@author_id, 'TypeScript高级类型技巧', 'typescript-advanced-types', '掌握TypeScript中的高级类型系统', 'TypeScript的类型系统非常强大，可以帮助我们在编译时捕获更多错误。\n\n## 条件类型\nConditional Types可以根据类型关系来决定结果类型。\n\n## 映射类型\nMapped Types可以基于旧类型创建新类型。\n\n## 模板字面量类型\nTemplate Literal Types可以创建基于字符串的操作。', 5, 'draft', NULL),

(@author_id, 'Docker容器化部署实践', 'docker-containerization', '使用Docker进行应用容器化的完整指南', 'Docker已经成为现代应用部署的标准工具。\n\n### Dockerfile编写\n如何编写高效的Dockerfile。\n\n### 镜像优化\n减小镜像体积，提高安全性。\n\n### 容器编排\n使用Docker Compose管理多容器应用。', 6, 'published', DATE_SUB(NOW(), INTERVAL 20 DAY)),

(@author_id, '机器学习入门指南', 'machine-learning-intro', '初学者友好的机器学习介绍', '机器学习是人工智能的一个分支，正在改变我们的世界。\n\n## 基本概念\n什么是监督学习、无监督学习和强化学习。\n\n## 常用算法\n线性回归、决策树、神经网络等。\n\n## Python生态\nScikit-learn、TensorFlow、PyTorch等框架。', 10, 'draft', NULL),

(@author_id, '前端性能监控与优化', 'frontend-performance-monitoring', '建立完善的前端性能监控体系', '前端性能直接影响用户体验和商业指标。\n\n## 性能指标\n- FP、FCP、LCP\n- FID、CLS\n- TTFB\n\n## 监控方案\n- RUM（真实用户监控）\n- Synthetic Monitoring\n\n## 优化策略\n- 资源压缩与合并\n- 懒加载与预加载\n- CDN加速', 7, 'published', DATE_SUB(NOW(), INTERVAL 25 DAY)),

(@author_id, '数据库索引优化策略', 'database-index-optimization', '提升数据库查询性能的索引优化技巧', '数据库索引是提升查询性能的关键技术。\n\n## 索引类型\n- B-Tree索引\n- 哈希索引\n- 全文索引\n\n## 设计原则\n- 选择性高的列优先建立索引\n- 复合索引的列顺序很重要\n- 避免过多索引影响写入性能\n\n## 优化工具\n使用EXPLAIN分析查询计划。', 6, 'published', DATE_SUB(NOW(), INTERVAL 30 DAY));

-- 获取插入的文章ID并关联标签
SET @article1_id = (SELECT id FROM articles WHERE slug = 'react-hooks-guide');
SET @article2_id = (SELECT id FROM articles WHERE slug = 'vue3-composition-api');
SET @article3_id = (SELECT id FROM articles WHERE slug = 'nodejs-performance-tips');
SET @article4_id = (SELECT id FROM articles WHERE slug = 'css-grid-layout');
SET @article5_id = (SELECT id FROM articles WHERE slug = 'microservices-design-principles');
SET @article6_id = (SELECT id FROM articles WHERE slug = 'typescript-advanced-types');
SET @article7_id = (SELECT id FROM articles WHERE slug = 'docker-containerization');
SET @article8_id = (SELECT id FROM articles WHERE slug = 'machine-learning-intro');
SET @article9_id = (SELECT id FROM articles WHERE slug = 'frontend-performance-monitoring');
SET @article10_id = (SELECT id FROM articles WHERE slug = 'database-index-optimization');

-- 获取标签ID
SET @tech_tag_id = (SELECT id FROM tags WHERE slug = 'tech');
SET @programming_tag_id = (SELECT id FROM tags WHERE slug = 'programming');
SET @life_tag_id = (SELECT id FROM tags WHERE slug = 'life');

-- 关联文章和标签
INSERT INTO article_tags (article_id, tag_id) VALUES
(@article1_id, @tech_tag_id),
(@article1_id, @programming_tag_id),
(@article2_id, @tech_tag_id),
(@article2_id, @programming_tag_id),
(@article3_id, @tech_tag_id),
(@article4_id, @tech_tag_id),
(@article5_id, @tech_tag_id),
(@article6_id, @tech_tag_id),
(@article6_id, @programming_tag_id),
(@article7_id, @tech_tag_id),
(@article8_id, @tech_tag_id),
(@article9_id, @tech_tag_id),
(@article10_id, @tech_tag_id),
(@article10_id, @programming_tag_id);