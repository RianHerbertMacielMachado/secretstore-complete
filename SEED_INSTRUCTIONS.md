# 🌱 Como Executar o Seed (Criar Admin)

## Opção 1: Via Railway CLI (Recomendado)

### Passo 1: Instalar Railway CLI
```bash
npm install -g @railway/cli
```

### Passo 2: Autenticar
```bash
railway login
```
Isso abrirá seu navegador para autenticar. Faça login com sua conta Railway.

### Passo 3: Conectar ao Projeto
```bash
cd seu-projeto
railway link
```
Selecione o projeto `zooming-wonder` e o ambiente `production`.

### Passo 4: Executar o Seed
```bash
railway run npm run db:seed
```

Isso vai:
- ✅ Criar usuário admin: `admin@darkshop.com` / `admin123`
- ✅ Criar 3 categorias (E-books, Cursos, Templates)
- ✅ Criar 3 produtos de exemplo
- ✅ Criar cupom de desconto (WELCOME10)
- ✅ Configurar o site

---

## Opção 2: Via Prisma Studio (Interface Visual)

```bash
railway run npx prisma studio
```

Isso abre uma interface web onde você pode:
- Ver todas as tabelas
- Inserir dados manualmente
- Editar registros existentes

---

## Opção 3: Via psql (Linha de Comando)

```bash
railway connect Postgres
```

Depois execute SQL direto:
```sql
-- Criar admin com senha hash
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (
  'admin123',
  'Admin DarkShop',
  'admin@darkshop.com',
  '$2a$12$...',  -- hash bcrypt de 'admin123'
  'ADMIN',
  NOW(),
  NOW()
);
```

---

## Credenciais Padrão (Após Seed)

- **Email**: admin@darkshop.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Mude a senha após o primeiro login!

---

## Dados Criados pelo Seed

### Usuário Admin
- Email: admin@darkshop.com
- Senha: admin123
- Role: ADMIN

### Categorias
1. E-books
2. Cursos Online
3. Templates

### Produtos de Exemplo
1. E-book Dark Aesthetic Design - R$ 19,90
2. Curso Design Gótico Avançado - R$ 97,00
3. Pack Templates Dark Instagram - R$ 49,90

### Cupom
- Código: WELCOME10
- Desconto: 10%

---

## Troubleshooting

### Erro: "railway: command not found"
```bash
npm install -g @railway/cli
```

### Erro: "Not authenticated"
```bash
railway logout
railway login
```

### Erro: "Project not found"
```bash
railway link
# Selecione o projeto correto
```

### Erro: "Database connection refused"
Verifique se o serviço Postgres está online:
```bash
railway status
```

