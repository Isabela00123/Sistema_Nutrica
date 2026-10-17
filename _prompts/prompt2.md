
# Prompt 2 — Autenticação

Agora vamos criar a autenticação do sistema. O sistema deve permitir que um nutricionista crie uma conta e faça login. Use o Neon Auth que já está configurado no projeto "Sistema Nutrica".

## Tela de Login
- Campo de email
- Campo de senha
- Botão "Entrar"
- Link "Não tem conta? Cadastre-se"

## Tela de Cadastro
- Campo de nome completo
- Campo de email
- Campo de senha
- Campo de confirmar senha
- Botão "Criar conta"
- Link "Já tem conta? Faça login"

## Regras importantes
- Após o cadastro, salvar o nome e email do(a) nutricionista na tabela `nutricionistas` do Neon
- Após o login bem sucedido, redirecionar para o dashboard
- Se o login falhar, exibir mensagem de erro clara e amigável
- A senha deve ter no mínimo 9 caracteres
- Manter a sessão ativa para que ele(a) não precise fazer login toda vez que abrir o sistema
- Se já estiver logado(a) e tentar acessar a tela de login, redirecionar direto para o dashboard

# Stack
- React + Vite
- Tailwind CSS
- shadcn/ui
- TypeScript

## Design
- Visual limpo, moderno e profissional
- Cores predominantes verde pastel e branco, remetendo à área da saúde e nutrição
- Logo com o texto "Sistema Nutrica" no topo de ambas as 

## Importante
- O sistema está configurado com Neon no arquivo .env.local
