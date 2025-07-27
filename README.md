# realMoney

MVP pessoal para organizar os gastos mensais e planejar a compra do carro.
Após login é possível registrar as despesas de cada mês e acompanhar gráficos
de gastos e progressão da reserva para o veículo.

## Scripts

```bash
pnpm install
pnpm dev
```

Rotas principais:

- `/login` – autenticação via Supabase
- `/` – formulário de gastos e dashboard
- `/configuracoes` – definir metas e saldo inicial

Crie um arquivo `.env.local` baseado em `.env.local.example` com as chaves do Supabase.

O acesso à aplicação requer autenticação via Supabase. Utilize a tela `/login` para entrar com email e senha.
