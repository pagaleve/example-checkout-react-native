# Integração WebView - Como Funciona e Benefícios

## Visão Geral

A integração Pagaleve Buy Now Pay Later (BNPL) utiliza uma abordagem WebView para gerenciar o fluxo completo de pagamento dentro do seu aplicativo móvel. Esta solução oferece uma experiência integrada mantendo a segurança e flexibilidade necessárias para processamento de pagamentos.

## Como Funciona a Integração WebView

### Arquitetura da Solução

A integração WebView funciona como uma ponte entre seu aplicativo móvel e a plataforma de checkout da Pagaleve. O fluxo é simples: o app carrega a URL do checkout em um WebView, o usuário completa o pagamento, e deep links redirecionam para telas de sucesso ou cancelamento.

### Fluxo de Integração em 3 Etapas

1. **Autenticação** - Autentica com a API Pagaleve usando credenciais do merchant
2. **Criação de Checkout** - Cria uma sessão de checkout com detalhes do pedido e informações do cliente
3. **Fluxo de Pagamento** - Exibe a URL de checkout em um WebView e gerencia retornos via deep link

### Fluxo de Comunicação

O processo segue estas etapas:

1. **Backend autentica** com a API Pagaleve usando credenciais do merchant
2. **Backend cria checkout** enviando dados do pedido e cliente para API Pagaleve
3. **Backend recebe** a `checkout_url` da resposta da API
4. **App carrega** a `checkout_url` no componente WebView
5. **Usuário preenche** dados de pagamento na interface da Pagaleve
6. **Pagaleve processa** o pagamento e determina o resultado
7. **Redirecionamento automático** via deep link para telas de sucesso ou cancelamento no app

## Benefícios da Abordagem WebView

### Principais Vantagens

- **Segurança**: Ambiente isolado com certificação PCI DSS, comunicação HTTPS, dados não armazenados localmente
- **Experiência**: Interface nativa integrada, responsiva e otimizada para dispositivos móveis
- **Flexibilidade**: Multi-plataforma (iOS, Android, React Native, Flutter), atualizações automáticas
- **Simplicidade**: API RESTful padronizada, deep links automáticos, tratamento robusto de erros
- **Performance**: CDN global, cache inteligente, alta disponibilidade (99.9%+ uptime)

## Arquitetura de Deep Links

### Como Funcionam os Deep Links

Os deep links redirecionam automaticamente o usuário de volta ao app após o pagamento:

- **Pagamento Aprovado**: `seu-app://success` → Tela de Sucesso
- **Pagamento Cancelado/Erro**: `seu-app://cancel` → Tela de Cancelamento

Isso mantém uma experiência fluida e integrada sem que o usuário precise navegar manualmente de volta ao app.

## Configurações de Segurança Recomendadas

### WebView Security Best Practices

1. **Modo Incógnito**: Evita persistência de dados sensíveis

```javascript
// React Native
incognito={true}

// Flutter
websiteDataStore = WKWebsiteDataStore.nonPersistent()
```

2. **Whitelist de Origens**: Permite apenas URLs HTTPS confiáveis

```javascript
originWhitelist={['https://*']}
```

3. **Desabilitar Recursos Desnecessários**: Remove funcionalidades que podem comprometer a segurança

```javascript
javaScriptEnabled={true}  // Apenas quando necessário
domStorageEnabled={false} // Para dados sensíveis
```

## Pré-requisitos Técnicos

### Requisitos Básicos

- Conta merchant Pagaleve com credenciais de API
- Aplicativo móvel com capacidade de WebView
- Configuração de deep linking para retornos do fluxo de pagamento

### Configuração do Ambiente

```bash
API_URL=https://api.pagaleve.com.br  # URL base da API Pagaleve
MERCHANT_LOGIN=seu_email_merchant    # Email de login do merchant
MERCHANT_PASSWORD=sua_senha          # Senha do merchant
```

## Estrutura da API

### Endpoints Principais

| Endpoint             | Método | Descrição                | Entrada                    | Saída        |
| -------------------- | ------ | ------------------------ | -------------------------- | ------------ |
| `/v1/authentication` | POST   | Autenticação do merchant | username, password         | Token JWT    |
| `/v1/checkouts`      | POST   | Criação do checkout      | order, shopper, urls + JWT | checkout_url |
| `/v1/checkouts/{id}` | GET    | Status do checkout       | checkout_id + JWT          | Status atual |

### Autenticação

**Endpoint:** `POST /v1/authentication`

Retorna um token JWT necessário para todas as operações subsequentes.

### Criação de Checkout

**Endpoint:** `POST /v1/checkouts`

Cria uma sessão de checkout e retorna a URL para ser carregada no WebView.

### Verificação de Status

**Endpoint:** `GET /v1/checkouts/{checkout_id}`

Permite verificar o status atual de um checkout específico.

## Exemplos Práticos da API

### 1. Autenticação

Para obter um token de acesso, faça uma requisição POST para o endpoint de autenticação:

```bash
curl -X POST https://sandbox-api.pagaleve.io/v1/authentication \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_email_merchant",
    "password": "sua_senha"
  }'
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. Criação de Checkout

Com o token obtido, crie um checkout:

```bash
curl -X POST https://sandbox-api.pagaleve.io/v1/checkouts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -H "idempotency-key: pedido-123-$(date +%s)" \
  -d '{
    "approve_url": "seu-app://success",
    "cancel_url": "seu-app://cancel",
    "order": {
      "reference": "PEDIDO_123",
      "amount": 10000,
      "description": "Produto Exemplo",
      "items": [
        {
          "name": "Produto Exemplo",
          "price": 10000,
          "quantity": 1,
          "sku": "PROD_001"
        }
      ],
      "shipping": {
        "amount": 1000,
        "pickup": false,
        "address": {
          "name": "Casa",
          "street": "Rua Exemplo",
          "number": "123",
          "neighborhood": "Centro",
          "city": "São Paulo",
          "state": "SP",
          "zip_code": "01234567",
          "phone_number": "11987654321"
        }
      }
    },
    "shopper": {
      "first_name": "João",
      "last_name": "Silva",
      "email": "joao@exemplo.com",
      "phone": "11987654321",
      "cpf": "12345678901",
      "billing_address": {
        "name": "Endereço de Cobrança",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zip_code": "01234567",
        "phone_number": "11987654321"
      }
    }
  }'
```

**Resposta:**

```json
{
  "checkout_url": "https://checkout.pagaleve.com.br/checkout/abc123...",
  "checkout_id": "checkout_id_aqui"
}
```

### 3. Usar no App

Agora use a `checkout_url` recebida no seu WebView:

```javascript
// React Native
<WebView
  source={{ uri: "https://checkout.pagaleve.com.br/checkout/abc123..." }}
/>
```

**Documentação Completa:** [docs.pagaleve.com.br](https://docs.pagaleve.com.br/reference/authenticationcontroller_doauthentication)

## Estratégia de Testes

### Tipos de Teste Recomendados

- **Testes Unitários**: Validar funções de integração da API e componentes WebView
- **Testes de Integração**: Verificar fluxo completo de checkout e navegação
- **Testes em Dispositivos**: Garantir compatibilidade iOS/Android em diferentes versões
- **Testes de Deep Link**: Confirmar redirecionamentos para success/cancel URLs

## Próximos Passos

Para implementar a integração WebView em sua plataforma específica, consulte os guias detalhados:

- [Integração React Native/Expo](./react-native-integration.md)
- [Integração Flutter](./flutter-integration.md)
- [Integração Nativa (iOS/Android)](./native-integration.md)

## Suporte

Para suporte técnico ou dúvidas sobre integração, entre em contato com a equipe de suporte ao desenvolvedor da Pagaleve.
