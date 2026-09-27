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
     - `assignedCongregations`: array (`["Recreio", "Curicica", "Guaratiba"]`)
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
Confira primeiro se a conta administrativa possui seu documento `users/{UID}`, com `role: "admin"` e `active: true`. O e-mail sozinho não concede acesso administrativo. O arquivo `firebase.json` aponta para as regras da raiz. Publique-as no projeto correto via Firebase CLI:
```bash
firebase deploy --only firestore:rules --project SEU_PROJECT_ID
```

---

## 3. Comandos do Projeto

- Instalar dependências: `npm install`
- Executar servidor de desenvolvimento: `npm run dev`
- Verificação de tipos / Lint: `npm run lint`
- Compilar para produção: `npm run build`

- Testes de regressão: `npm test`

## 4. Cadastro e recuperação de acessos

O ambiente real exige Firebase Authentication e um perfil válido em `users/{UID}`. Ele não cria um administrador automaticamente e não aceita usuários/senhas do cache local. O modo demonstração continua separado.

- Ao criar um acesso, informe uma senha de pelo menos seis caracteres. O sistema cria uma conta em uma sessão separada, mantendo o administrador conectado, e aguarda a gravação do perfil antes de confirmar sucesso. Se a gravação falhar, tenta desfazer apenas a conta recém-criada e mostra o erro.
- Se informar um e-mail próprio no cadastro, a pessoa entra com esse e-mail. Se deixar o campo em branco, entra com o login escolhido, associado a `login@casadedeus.org`. A lista de acessos mostra a credencial correta. Senhas reais não são exibidas nem salvas no perfil/cache.
- Alterar nome, equipe, congregações e status não altera as credenciais do Authentication. E-mail/login ficam bloqueados na edição para evitar divergência. O próprio usuário pode trocar a senha em Segurança, confirmando a senha atual. Para e-mails reais, também pode usar a recuperação na tela de entrada. Endereços sintéticos sem caixa postal exigem recuperação pelo administrador no Firebase.
- Para um acesso antigo que existe no Authentication mas não consegue entrar, copie o UID dessa conta e confira se existe `users/{mesmo UID}`. Corrija esse perfil pelo Firebase Console, com a função e as congregações corretas e `active` booleano. Um líder de equipe precisa de `role: "lider_equipe"` e `assignedTeam` válido; o líder geral usa `role: "lider_conexao"`. Não crie outra conta com o mesmo e-mail para contornar um perfil ausente.
- A aplicação não recria cadastros que nunca chegaram ao Firebase. A chave antiga `casadedeus_crm_real_data_v3` permanece no navegador para recuperação manual desses registros; ela não é usada como credencial nem importada automaticamente. O cache novo é separado por UID.
- Falhas na leitura do banco exibem um aviso com nova tentativa e preservam as coleções já carregadas. Uma coleção confirmada vazia pelo servidor pode, corretamente, limpar o cache. Cadastros de contatos e participantes só aparecem após confirmação; matrícula no Conexão grava o contato e o participante em um lote único.

### Aplicação da correção

Atualize o código no ambiente que executa o CRM (incluindo Google AI Studio, se for a versão em uso), mantenha as variáveis `VITE_FIREBASE_*`, confira o perfil administrativo e publique `firestore.rules` no mesmo projeto. Alterar o GitHub não publica automaticamente regras no Firebase. Não é necessário apagar coleções nem usuários existentes.

Os testes automatizados usam substitutos locais do SDK para reproduzir erros de autenticação, gravação, sincronização e troca de sessão. Eles não acessam dados reais e não substituem a validação das regras implantadas e dos acessos no projeto Firebase. A revisão de isolamento completo das coleções por congregação/família no servidor é separada destas correções de cadastro e login.

Referências: [estado de autenticação e gerenciamento de usuários](https://firebase.google.com/docs/auth/web/manage-users) e [consultas e regras de segurança](https://firebase.google.com/docs/firestore/security/rules-query).
