# Financeiro do Otavio

Sistema de controle financeiro pessoal com foco em visualização de dados e metas de economia.

## Funcionalidades

### ✅ Implementadas
- **Autenticação**: Login/cadastro via Supabase
- **Formulário de Dados**: Captura de todos os gastos mensais
- **Dashboard**: Visualização completa dos dados
- **Gráficos**: Barras horizontais, linha de evolução, progresso circular
- **Insights**: Análise automática do progresso da meta
- **Histórico**: Visualização de meses anteriores
- **Configurações**: Definição de metas e saldo inicial
- **Tema Monocromático**: Interface limpa em preto, branco e cinza
- **Sincronização**: Dados salvos na nuvem (Supabase) ou localmente

### 📊 Dados Capturados
- Salário líquido
- Cartão de crédito
- Contas fixas
- Hashish (em gramas)
- Mercado
- Gasolina
- Flash recebido
- Meta de economia mensal

### 📈 Visualizações
- Gráfico de gastos por categoria (barras horizontais)
- Gráfico de evolução da sobra ao longo dos meses (linha)
- Gráfico de progresso da meta de reserva (circular)
- Insight com previsão de meses para atingir a meta

## Setup

### 1. Instalação
```bash
cd realMoney
pnpm install
```

### 2. Configuração do Supabase
1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as tabelas no SQL Editor:

```sql
-- Tabela de gastos mensais
CREATE TABLE gastos_mensais (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  mes VARCHAR(50) NOT NULL,
  salario_liquido DECIMAL(10,2) NOT NULL,
  cartao_credito DECIMAL(10,2) NOT NULL,
  contas_fixas DECIMAL(10,2) NOT NULL,
  hashish DECIMAL(10,2) NOT NULL,
  mercado DECIMAL(10,2) NOT NULL,
  gasolina DECIMAL(10,2) NOT NULL,
  flash DECIMAL(10,2) NOT NULL,
  meta_economia DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações
CREATE TABLE configuracoes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  meta_reserva DECIMAL(10,2) NOT NULL DEFAULT 12000,
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE gastos_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para gastos_mensais
CREATE POLICY "Users can view own gastos" ON gastos_mensais 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gastos" ON gastos_mensais 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gastos" ON gastos_mensais 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gastos" ON gastos_mensais 
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para configuracoes
CREATE POLICY "Users can view own config" ON configuracoes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config" ON configuracoes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config" ON configuracoes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own config" ON configuracoes 
  FOR DELETE USING (auth.uid() = user_id);
```

4. Configure as variáveis de ambiente:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

5. **Configuração de Autenticação (Opcional)**
   - Vá para **Authentication > Settings**
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
   - **Enable email confirmations**: OFF (para login direto)

### 3. Executar
```bash
pnpm dev
```

Acesse: http://localhost:3000

## Como Funciona

### 🔐 **Autenticação**
- **Com Supabase**: Login/cadastro na nuvem, dados sincronizados
- **Sem Supabase**: Dados salvos localmente no navegador
- **Modo Teste**: Dados mockados para demonstração

### 💾 **Armazenamento de Dados**
- **Supabase**: Dados salvos na nuvem com `user_id`
- **localStorage**: Fallback local quando Supabase não está disponível
- **Mock**: Dados de exemplo para teste

### 📱 **Fluxo de Uso**
1. **Criar conta** ou **fazer login**
2. **Preencher dados** do mês
3. **Visualizar** gráficos e insights
4. **Acompanhar** histórico e progresso
5. **Configurar** metas e saldo inicial

## Estrutura do Projeto

```
app/
├── components/
│   ├── Auth.tsx              # Autenticação
│   ├── Configuracoes.tsx     # Configurações de meta
│   ├── Dashboard.tsx         # Dashboard principal
│   ├── Formulario.tsx        # Formulário de dados
│   ├── GraficoBarras.tsx     # Gráfico de barras horizontais
│   ├── GraficoLinha.tsx      # Gráfico de linha
│   ├── GraficoProgresso.tsx  # Gráfico de progresso
│   ├── Historico.tsx         # Histórico de meses
│   └── Insight.tsx           # Componente de insights
├── lib/
│   ├── supabaseClient.ts     # Cliente Supabase
│   └── mockData.ts           # Dados mockados para teste
├── types/
│   └── types.ts              # Tipos TypeScript
└── pages/
    └── index.tsx             # Página principal
```

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **PNPM** - Gerenciador de pacotes

## Vantagens

### ✅ **Com Supabase**
- Dados sincronizados na nuvem
- Acesso de qualquer dispositivo
- Backup automático
- Autenticação segura
- Escalabilidade

### ✅ **Sem Supabase**
- Funciona offline
- Dados privados no navegador
- Sem necessidade de configuração
- Rápido para testar

## Próximos Passos

- [ ] Implementar edição de registros
- [ ] Implementar clonagem de meses
- [ ] Adicionar filtros no histórico
- [ ] Exportar dados para CSV/PDF
- [ ] Notificações de metas atingidas
- [ ] Dashboard mobile responsivo
- [ ] Backup automático dos dados
- [ ] Migração de dados locais para nuvem

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
