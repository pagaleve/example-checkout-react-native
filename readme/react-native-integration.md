# Integração Pagaleve - React Native / Expo

## Visão Geral

Guia prático para integrar o checkout Pagaleve BNPL em apps React Native/Expo usando WebView. Focado na implementação do WebView e deep links para uma experiência fluida.

## Pré-requisitos

- React Native 0.60+ ou Expo SDK 45+
- Conta merchant Pagaleve com credenciais de API
- `react-native-webview` instalado
- Deep linking configurado

## Instalação de Dependências

### Para React Native CLI

```bash
npm install react-native-webview
# iOS
cd ios && pod install
```

### Para Expo

```bash
npx expo install react-native-webview
```

## Recebendo a URL do Checkout

O checkout da Pagaleve deve ser criado no seu backend através da API. Uma vez criado, você receberá uma `checkout_url` que deve ser passada para o componente WebView do seu app React Native.

**Exemplo de URL de checkout:**

```
https://checkout.pagaleve.com.br/checkout/abc123...
```

## Configuração de Deep Links

### Para Expo Router

1. **Configure app.json:**

```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "slug": "your-app-slug",
    "name": "Your App Name"
  }
}
```

2. **Layout Principal:**

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Checkout" }} />
      <Stack.Screen name="checkout" options={{ title: "Payment" }} />
      <Stack.Screen name="success" options={{ title: "Payment Success" }} />
      <Stack.Screen name="cancel" options={{ title: "Payment Failed" }} />
    </Stack>
  );
}
```

### Para React Navigation

```tsx
// navigation/AppNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["your-app://"],
  config: {
    screens: {
      Success: "success",
      Cancel: "cancel",
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="Cancel" component={CancelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Implementação do WebView

### Componente de Checkout WebView

```tsx
// components/CheckoutWebView.tsx
import React from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";

interface CheckoutWebViewProps {
  checkoutUrl: string;
  onNavigationStateChange?: (navState: any) => void;
}

export default function CheckoutWebView({
  checkoutUrl,
  onNavigationStateChange,
}: CheckoutWebViewProps) {
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView Error:", nativeEvent);

    Alert.alert(
      "Erro de Carregamento",
      "Não foi possível carregar a página de pagamento. Tente novamente.",
      [{ text: "OK" }]
    );
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView HTTP Error:", nativeEvent);

    Alert.alert(
      "Erro de Conexão",
      `Erro HTTP ${nativeEvent.statusCode}. Verifique sua conexão.`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: checkoutUrl }}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" />
          </View>
        )}
        incognito={true}
        allowsBackForwardNavigationGestures={true}
        originWhitelist={["https://*"]}
        onError={handleError}
        onHttpError={handleHttpError}
        onNavigationStateChange={onNavigationStateChange}
        style={{ flex: 1 }}
        // Configurações de segurança adicionais
        mixedContentMode="never"
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction={true}
        javaScriptCanOpenWindowsAutomatically={false}
      />
    </View>
  );
}
```

### Tela de Checkout (Expo Router)

```tsx
// app/checkout.tsx
import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CheckoutWebView from "../components/CheckoutWebView";

export default function CheckoutScreen() {
  const { checkoutUrl } = useLocalSearchParams<{ checkoutUrl: string }>();
  const router = useRouter();

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Detectar deep links de retorno
    if (url.includes("your-app://success")) {
      router.replace("/success");
    } else if (url.includes("your-app://cancel")) {
      router.replace("/cancel");
    }
  };

  if (!checkoutUrl) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>URL do checkout não fornecida</Text>
      </View>
    );
  }

  return (
    <CheckoutWebView
      checkoutUrl={checkoutUrl}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

## Telas de Resultado

### Tela de Sucesso

```tsx
// app/success.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Pagamento Concluído!</Text>
        <Text style={styles.message}>
          Seu pagamento foi processado com sucesso. Você receberá uma
          confirmação por email.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

### Tela de Cancelamento

```tsx
// app/cancel.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function CancelScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>❌</Text>
        <Text style={styles.title}>Pagamento Cancelado</Text>
        <Text style={styles.message}>
          O pagamento foi cancelado ou não pôde ser processado. Tente novamente
          ou escolha outro método de pagamento.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.secondaryButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#1976d2",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

## Exemplo de Implementação Completa

### Tela Principal

```tsx
// app/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const router = useRouter();

  const handleOpenCheckout = () => {
    if (!checkoutUrl.trim()) {
      Alert.alert("Erro", "Por favor, insira a URL do checkout");
      return;
    }

    // Validar se é uma URL válida
    try {
      new URL(checkoutUrl);
    } catch {
      Alert.alert("Erro", "URL inválida");
      return;
    }

    router.push({
      pathname: "/checkout",
      params: { checkoutUrl: checkoutUrl.trim() },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagaleve Checkout</Text>
      <Text style={styles.subtitle}>
        Insira a URL do checkout recebida do seu backend
      </Text>

      <TextInput
        style={styles.input}
        placeholder="https://checkout.pagaleve.com.br/checkout/..."
        value={checkoutUrl}
        onChangeText={setCheckoutUrl}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleOpenCheckout}>
        <Text style={styles.buttonText}>Abrir Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1976d2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

## Tratamento de Erros

### Sistema de Tratamento de Erros do WebView

```typescript
// utils/errorHandler.ts
export const handleWebViewError = (error: any): string => {
  if (error?.nativeEvent) {
    const { description, code } = error.nativeEvent;

    switch (code) {
      case -1009: // iOS: kCFURLErrorNotConnectedToInternet
      case -2: // Android: ERROR_HOST_LOOKUP
        return "Erro de conexão. Verifique sua internet.";
      case -1100: // iOS: kCFURLErrorFileDoesNotExist
      case -6: // Android: ERROR_CONNECTION_REFUSED
        return "Não foi possível conectar ao servidor.";
      default:
        return description || "Erro ao carregar a página de checkout.";
    }
  }

  return "Erro inesperado. Tente novamente.";
};
```

## Testes

### Configuração de Testes

```bash
npm install --save-dev @testing-library/react-native jest
```

### Exemplo de Teste do WebView

```typescript
// __tests__/CheckoutWebView.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import CheckoutWebView from '../components/CheckoutWebView'

describe('CheckoutWebView', () => {
  it('should render WebView with correct URL', () => {
    const checkoutUrl = 'https://checkout.pagaleve.com.br/checkout/test123'

    const { getByTestId } = render(
      <CheckoutWebView checkoutUrl={checkoutUrl} />
    )

    // Verificar se o WebView foi renderizado
    expect(getByTestId('checkout-webview')).toBeTruthy()
  })

  it('should handle invalid URL gracefully', () => {
    const invalidUrl = 'invalid-url'

    const { getByText } = render(
      <CheckoutWebView checkoutUrl={invalidUrl} />
    )

    // Verificar se uma mensagem de erro é exibida
    expect(getByText(/URL inválida/)).toBeTruthy()
  })
})
```

## Melhores Práticas

### Segurança

- Use sempre HTTPS para todas as requisições
- Implemente timeout adequado para requisições
- Valide todos os dados antes de enviar para a API

- Use deep links seguros e valide parâmetros

### Performance

- Implemente cache inteligente para tokens

- Use loading states apropriados
- Otimize renders desnecessários com useMemo/useCallback

### UX

- Forneça feedback visual durante carregamentos
- Implemente tratamento de erro amigável
- Use indicadores de progresso no WebView

## Próximos Passos

- Consulte a [documentação da API Pagaleve](https://docs.pagaleve.com.br)
- Implemente webhooks para atualizações em tempo real
- Configure analytics para monitorar conversões

## Suporte

Entre em contato com a equipe de suporte da Pagaleve para dúvidas técnicas.
