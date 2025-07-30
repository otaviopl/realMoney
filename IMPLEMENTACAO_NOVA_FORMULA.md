# 🧮 Nova Fórmula de Cálculo - realMoney

## 📋 Resumo da Implementação

Este documento detalha a implementação da nova fórmula de cálculo solicitada: **((entradas) - (saidas)) - (salario - despesas do forms)**

## 🎯 Objetivo

A nova fórmula permite um controle mais preciso das finanças, separando:
- **Transações do dia a dia** (entradas e saídas registradas)
- **Gastos planejados** (cadastrados nos formulários: academia, hashish, etc.)

## 🔧 Implementações Realizadas

### 1. **Função de Cálculo Atualizada** (`app/lib/calculoAutomatico.ts`)

```typescript
export const calcularSaldoComNovaFormula = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  mes?: string
): number => {
  // Filtrar dados do mês específico
  const totalEntradas = // soma das entradas
  const totalSaidas = // soma das saídas  
  const totalDespesasForms = // soma dos gastos mensais
  const salarioTransacoes = // total de entradas (assumindo como salário)
  
  // Aplicar fórmula: (entradas) - (saidas) - (salario - despesas dos forms)
  return totalEntradas - totalSaidas - (salarioTransacoes - totalDespesasForms)
}
```

### 2. **Nova Interface para Gastos Mensais**

```typescript
export interface GastoMensal {
  id?: number
  user_id: string
  mes: string
  categoria_id: number
  quantidade: number
  valor_unitario?: number
  valor_total?: number
  created_at?: string
  updated_at?: string
}
```

### 3. **Gerenciador de Gastos Mensais** (`app/components/finance/GerenciadorGastos.tsx`)

- Interface para criar/editar gastos mensais
- CRUD completo (Create, Read, Update, Delete)
- Integração com categorias existentes
- Cálculo automático de valores totais

### 4. **Dashboard Atualizado**

- Nova seção "Cálculo com Nova Fórmula" mostrando breakdown detalhado
- Botão "Gastos" na navegação inferior
- Integração com a tabela `gastos_mensais` do novo schema

## 📊 Exemplo de Funcionamento

### Dados de Teste:
- **Entradas**: R$ 6.000 (salário + freelance)
- **Saídas**: R$ 1.200 (mercado + transporte)
- **Despesas Forms**: R$ 495 (academia + hashish + aluguel)

### Cálculo:
```
Fórmula: (Entradas) - (Saídas) - (Salário - Despesas Forms)
Resultado: 6000 - 1200 - (6000 - 495) = -705
```

### Comparação:
- **Método Antigo**: R$ 4.800 (apenas entradas - saídas)
- **Método Novo**: R$ -705 (considerando gastos planejados)
- **Diferença**: R$ -5.505

## 🗄️ Integração com Schema

A implementação utiliza as seguintes tabelas do novo schema:

### `gastos_mensais`
```sql
CREATE TABLE public.gastos_mensais (
  id integer NOT NULL,
  user_id uuid NOT NULL,
  mes character varying NOT NULL,
  categoria_id integer NOT NULL,
  quantidade numeric NOT NULL,
  valor_unitario numeric,
  valor_total numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

### `categorias` (atualizada)
```sql
CREATE TABLE public.categorias (
  id integer NOT NULL,
  user_id uuid NOT NULL,
  nome character varying NOT NULL,
  tipo character varying NOT NULL,
  unidade character varying DEFAULT 'BRL',
  preco_unitario numeric DEFAULT 1.0,
  icone character varying DEFAULT 'DollarSign',
  cor character varying DEFAULT '#6b7280'
);
```

## 🚀 Funcionalidades Implementadas

### ✅ **Concluído**

1. **Nova função de cálculo** seguindo a fórmula especificada
2. **Interface para gerenciar gastos mensais**
3. **Integração com dashboard** mostrando breakdown detalhado
4. **Suporte a dados locais e Supabase**
5. **Testes funcionais** validando a lógica

### 📋 **API Endpoints Disponíveis**

- `GET /api/monthly-expenses` - Lista gastos mensais
- `POST /api/monthly-expenses` - Cria novo gasto mensal
- `PUT /api/monthly-expenses/[id]` - Atualiza gasto existente
- `DELETE /api/monthly-expenses/[id]` - Remove gasto

## 🧪 Teste Executado

O arquivo `test_nova_formula.js` valida:
- ✅ Filtragem correta por mês
- ✅ Cálculo das entradas e saídas
- ✅ Soma dos gastos mensais
- ✅ Aplicação da fórmula
- ✅ Comparação com método anterior

## 🎨 Interface do Usuário

### Dashboard
- Nova seção destacada mostrando o cálculo detalhado
- Cards coloridos para cada componente da fórmula
- Explicação da fórmula aplicada

### Gerenciador de Gastos
- Modal moderno e responsivo
- Formulário intuitivo com validação
- Lista de gastos com opções de edição/exclusão
- Integração automática com categorias

## 🔄 Como Usar

1. **Acesse o Dashboard**
2. **Clique em "Gastos"** na navegação inferior
3. **Adicione gastos mensais** (academia, hashish, etc.)
4. **Visualize o cálculo** na seção "Nova Fórmula"
5. **Compare** com o método anterior

## 💡 Benefícios da Nova Abordagem

- **Precisão**: Considera todos os tipos de gastos
- **Planejamento**: Separa gastos fixos de variáveis
- **Visibilidade**: Mostra breakdown completo
- **Flexibilidade**: Permite ajustes categorizados
- **Histórico**: Mantém registro detalhado por mês

---

**Status**: ✅ **IMPLEMENTADO E TESTADO**  
**Data**: Janeiro 2025  
**Versão**: 1.0.0