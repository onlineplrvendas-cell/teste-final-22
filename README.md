# Casa de Deus — CRM Web

CRM web funcional e minimalista desenvolvido para a gestão pastoral, ministerial e acompanhamento de contatos e membros da igreja **CASA DE DEUS** nas congregações:
- **RECREIO**
- **CURICICA**
- **GUARATIBA**

---

## 1. Características e Recursos Implementados

1. **Direção Visual:**
   - Estética preta, branca e cinematográfica (`#000000` de fundo, `#0B0B0B` e `#141414` nas superfícies, `#1A1A1A` nos inputs e `#262626` em divisores sutis).
   - Tipografia refinada: **Montserrat** para títulos e **Inter** para textos.
   - Símbolo oficial da **CASA DE DEUS** preservado com precisão vetorial no componente centralizado `Logo.tsx` (sem distorções e com proporção mantida).

2. **Autenticação & Controle de Acesso Baseado em Atributos (ABAC):**
   - **Administrador Geral:** Acesso às três congregações e à Visão Geral consolidada. Capacidade exclusiva de transferir congregações e exclusão definitiva de registros.
   - **Equipe de Atendimento:** Acesso restrito estritamente às congregações designadas para o seu usuário.
   - Não há auto-cadastro público. Acesso seguro controlado via Firebase Authentication e Cloud Firestore.

3. **Duas Modalidades Isoladas:**
   - **Modo Demonstração:** 30 contatos realistas do Rio de Janeiro distribuídos entre as 3 congregações, com 6 meses de histórico relativo de primeiras visitas e entradas como membro, tarefas e interações. Disparos externos de WhatsApp desativados para segurança.
   - **Modo Conectado ao Firebase:** Suporte direto ao Cloud Firestore e Firebase Auth com regras de segurança ativas (`firestore.rules`).

4. **Filtro Global de Congregação:**
   - Atualiza em tempo real indicadores, gráficos Recharts, tabelas de contatos, rotina de tarefas e exportações CSV.

5. **Gestão de Contatos:**
   - Formulário com máscara de telefone brasileira `(XX) XXXXX-XXXX` e normalização internacional `55...`.
   - Detecção de números de telefone duplicados com aviso e confirmação de exceção familiar.
   - Campos condicionais: Data da Primeira Visita (Visitante) e Data de Entrada como Membro (Membro).
   - Independência rigorosa entre Categoria (Novo contato / Visitante / Membro) e Etapa de Acompanhamento.
   - Exportação para CSV protegida contra formula injection (`=`, `@`, `+`, `-`) com UTF-8 BOM para acentuação perfeita no Microsoft Excel.

6. **Rotina de Acompanhamento (Follow-up):**
   - Organização em 4 listas: Atrasados, Hoje, Próximos e Concluídos.
   - Cálculo automático do último contato e próximo retorno.
   - Concluir tarefas não encerra a etapa do contato como integrado automaticamente.

---

## 2. Configuração do Firebase para Produção

### Passo 1: Habilitar o Firebase Authentication
1. Abra o **[Firebase Console](https://console.firebase.google.com/)**.
2. Vá em **Build > Authentication > Sign-in method**.
3. Ative o provedor **Email/Password (E-mail/senha)**.

### Passo 2: Criar o Primeiro Administrador com Segurança
1. No Firebase Authentication, cadastre o e-mail administrativo (ex: `onlineplrvendas@gmail.com`).
2. Copie o `User UID` gerado.
3. No **Cloud Firestore**, crie o documento correspondente na coleção `users`:
   - Caminho: `users/{UserUID}`
   - Campos:
     - `uid`: string (o mesmo User UID)
     - `name`: string (ex: "Pastor Lucas Ramos")
     - `email`: string (ex: "onlineplrvendas@gmail.com")
     - `role`: string ("admin")
     - `assignedCongregations`: string ("Recreio,Curicica,Guaratiba")
     - `active`: boolean (`true`)

### Passo 3: Variáveis de Ambiente
Crie ou configure o arquivo `.env` com as chaves do seu projeto Firebase Web:
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

### Passo 4: Publicar Regras do Firestore
O arquivo `firestore.rules` foi gerado na raiz do projeto com ABAC completo. Para implantar via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Comandos do Projeto

- Instalar dependências: `npm install`
- Executar servidor de desenvolvimento: `npm run dev`
- Verificação de tipos / Lint: `npm run lint`
- Compilar para produção: `npm run build`
