-- Script para criar usuário admin no banco de dados
-- Hash bcrypt de 'admin123' com salt 12
-- Você pode gerar novos hashes em: https://bcrypt-generator.com/

INSERT INTO "User" (id, name, email, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'clm1a2b3c4d5e6f7g8h9i0j1k2',
  'Admin DarkShop',
  'admin@darkshop.com',
  '$2a$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMm2',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = '$2a$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMm2',
  role = 'ADMIN',
  "updatedAt" = NOW();

-- Criar categorias
INSERT INTO "Category" (id, name, slug, description, "isVisible", "sortOrder", "createdAt", "updatedAt")
VALUES 
  ('cat1', 'E-books', 'ebooks', 'Livros digitais exclusivos', true, 1, NOW(), NOW()),
  ('cat2', 'Cursos Online', 'cursos', 'Aprenda com nossos cursos digitais', true, 2, NOW(), NOW()),
  ('cat3', 'Templates', 'templates', 'Templates prontos para usar', true, 3, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Criar produtos de exemplo
INSERT INTO "Product" (id, name, slug, description, price, "salePrice", "mainImage", images, "categoryId", "driveLink", "driveDeliveryMethod", status, featured, "createdAt", "updatedAt")
VALUES 
  (
    'prod1',
    'E-book Dark Aesthetic Design',
    'ebook-dark-aesthetic',
    'Guia completo sobre design gótico e dark aesthetic. Aprenda técnicas avançadas de design para criar visuais impactantes.',
    29.90,
    19.90,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
    '["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600"]',
    'cat1',
    'https://drive.google.com/file/d/example',
    'LINK',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ),
  (
    'prod2',
    'Curso Design Gótico Avançado',
    'curso-design-gothic',
    'Curso completo com 40 aulas sobre design gótico, dark aesthetic e criação de conteúdo alternativo.',
    197.00,
    97.00,
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
    '["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600"]',
    'cat2',
    'https://drive.google.com/drive/folders/example',
    'FOLDER',
    'ACTIVE',
    true,
    NOW(),
    NOW()
  ),
  (
    'prod3',
    'Pack Templates Dark Instagram',
    'pack-templates-dark',
    '50 templates editáveis para Instagram com estética gótica e dark. Inclui stories, posts e reels.',
    49.90,
    NULL,
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
    '["https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600"]',
    'cat3',
    'https://drive.google.com/drive/folders/example',
    'FOLDER',
    'ACTIVE',
    false,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- Criar cupom de desconto
INSERT INTO "Coupon" (id, code, "discountType", "discountValue", scope, "expiresAt", "totalUsageLimit", "perCustomerLimit", "usageCount", "isActive", "createdAt", "updatedAt")
VALUES (
  'coup1',
  'WELCOME10',
  'PERCENTAGE',
  10,
  'ALL',
  NULL,
  NULL,
  1,
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Criar configurações do site
INSERT INTO "SiteConfig" (id, key, value, "isEncrypted", "updatedAt")
VALUES 
  ('cfg1', 'site_name', 'DarkShop', false, NOW()),
  ('cfg2', 'site_description', 'Sua loja de produtos digitais premium', false, NOW()),
  ('cfg3', 'active_layout', 'dark-grunge', false, NOW()),
  ('cfg4', 'currency', 'BRL', false, NOW())
ON CONFLICT (key) DO NOTHING;

-- Confirmar sucesso
SELECT 'Admin criado com sucesso!' as resultado;
SELECT COUNT(*) as total_usuarios FROM "User";
SELECT COUNT(*) as total_categorias FROM "Category";
SELECT COUNT(*) as total_produtos FROM "Product";

