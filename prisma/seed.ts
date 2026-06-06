import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@darkshop.com' },
    update: {},
    create: {
      name: 'Admin DarkShop',
      email: 'admin@darkshop.com',
      password: adminPassword,
      role: 'ADMIN' as any,
    },
  })
  console.log('✅ Admin criado:', admin.email)

  // Criar categorias
  const cat1 = await prisma.category.upsert({
    where: { slug: 'ebooks' },
    update: {},
    create: {
      name: 'E-books',
      slug: 'ebooks',
      description: 'Livros digitais exclusivos',
      sortOrder: 1,
    },
  })

  const cat2 = await prisma.category.upsert({
    where: { slug: 'cursos' },
    update: {},
    create: {
      name: 'Cursos Online',
      slug: 'cursos',
      description: 'Aprenda com nossos cursos digitais',
      sortOrder: 2,
    },
  })

  const cat3 = await prisma.category.upsert({
    where: { slug: 'templates' },
    update: {},
    create: {
      name: 'Templates',
      slug: 'templates',
      description: 'Templates prontos para usar',
      sortOrder: 3,
    },
  })
  console.log('✅ Categorias criadas')

  // Criar produtos de exemplo
  await prisma.product.upsert({
    where: { slug: 'ebook-dark-aesthetic' },
    update: {},
    create: {
      name: 'E-book Dark Aesthetic Design',
      slug: 'ebook-dark-aesthetic',
      description: 'Guia completo sobre design gótico e dark aesthetic. Aprenda técnicas avançadas de design para criar visuais impactantes.',
      price: 29.90,
      salePrice: 19.90,
      mainImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      ]),
      categoryId: cat1.id,
      driveLink: 'https://drive.google.com/file/d/example',
      featured: true,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'curso-design-gothic' },
    update: {},
    create: {
      name: 'Curso Design Gótico Avançado',
      slug: 'curso-design-gothic',
      description: 'Curso completo com 40 aulas sobre design gótico, dark aesthetic e criação de conteúdo alternativo.',
      price: 197.00,
      salePrice: 97.00,
      mainImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
      ]),
      categoryId: cat2.id,
      driveLink: 'https://drive.google.com/drive/folders/example',
      driveDeliveryMethod: 'FOLDER',
      featured: true,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'pack-templates-dark' },
    update: {},
    create: {
      name: 'Pack Templates Dark Instagram',
      slug: 'pack-templates-dark',
      description: '50 templates editáveis para Instagram com estética gótica e dark. Inclui stories, posts e reels.',
      price: 49.90,
      mainImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
      ]),
      categoryId: cat3.id,
      driveLink: 'https://drive.google.com/drive/folders/example',
      featured: false,
    },
  })
  console.log('✅ Produtos criados')

  // Criar cupom de exemplo
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      scope: 'ALL',
      isActive: true,
    },
  })

  // Configurações iniciais do site
  const configs = [
    { key: 'site_name', value: 'DarkShop' },
    { key: 'site_description', value: 'Sua loja de produtos digitais premium' },
    { key: 'active_layout', value: 'dark-grunge' },
    { key: 'currency', value: 'BRL' },
  ]

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log('✅ Configurações iniciais criadas')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
