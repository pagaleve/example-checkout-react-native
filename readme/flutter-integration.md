# Integração Pagaleve - Flutter

## Visão Geral

Guia prático para integrar o checkout Pagaleve BNPL em apps Flutter usando WebView. Focado na implementação do WebView e deep links para uma experiência fluida.

## Pré-requisitos

- Flutter 3.0+
- Dart 2.17+
- Conta merchant Pagaleve com credenciais de API
- Configuração de deep linking

## Dependências

Adicione as seguintes dependências ao seu `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.4.2
  http: ^1.1.0
  url_launcher: ^6.2.1
  go_router: ^12.1.3 # Para roteamento
  provider: ^6.1.1 # Para gerenciamento de estado

dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.2
```

Instale as dependências:

```bash
flutter pub get
```

## Recebendo a URL do Checkout

O checkout da Pagaleve deve ser criado no seu backend através da API. Uma vez criado, você receberá uma `checkout_url` que deve ser passada para o componente WebView do seu app Flutter.

**Exemplo de URL de checkout:**

```
https://checkout.pagaleve.com.br/checkout/abc123...
```

### Configuração de Deep Links

```dart
// lib/config/app_config.dart
class AppConfig {
  // URLs de deep link para retorno do checkout
  static const String approveUrl = 'your-flutter-app://success';
  static const String cancelUrl = 'your-flutter-app://cancel';
}
```

## Modelo Simples para URL

```dart
// lib/models/checkout_url.dart
class CheckoutUrl {
  final String url;

  CheckoutUrl({required this.url});

  bool get isValid {
    try {
      final uri = Uri.parse(url);
      return uri.hasScheme && uri.hasAuthority;
    } catch (e) {
      return false;
    }
  }

  bool get isPagaleveUrl {
    return url.contains('checkout.pagaleve.com.br');
  }
}
```

## Configuração de Deep Links

### Android Configuration

Adicione no `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTop"
    android:theme="@style/LaunchTheme">

    <!-- Deep Link Configuration -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="your-flutter-app" />
    </intent-filter>
</activity>
```

### iOS Configuration

Adicione no `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>your.flutter.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>your-flutter-app</string>
        </array>
    </dict>
</array>
```

## Implementação das Telas

### Tela Principal (Home)

```dart
// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/checkout_url.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _urlController = TextEditingController();

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _handleOpenCheckout() {
    final url = _urlController.text.trim();

    if (url.isEmpty) {
      _showError('Por favor, insira a URL do checkout');
      return;
    }

    final checkoutUrl = CheckoutUrl(url: url);

    if (!checkoutUrl.isValid) {
      _showError('URL inválida');
      return;
    }

    if (!checkoutUrl.isPagaleveUrl) {
      _showError('Esta não parece ser uma URL da Pagaleve');
      return;
    }

    context.go('/checkout?url=${Uri.encodeComponent(url)}');
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pagaleve Checkout'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.payment,
              size: 80,
              color: Colors.blue,
            ),
            const SizedBox(height: 32),
            const Text(
              'Insira a URL do checkout recebida do seu backend',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextFormField(
              controller: _urlController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'URL do Checkout',
                hintText: 'https://checkout.pagaleve.com.br/checkout/...',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.link),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _handleOpenCheckout,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: const Text(
                  'Abrir Checkout',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### WebView de Checkout

```dart
// lib/screens/checkout_webview_screen.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:go_router/go_router.dart';

class CheckoutWebViewScreen extends StatefulWidget {
  final String checkoutUrl;

  const CheckoutWebViewScreen({
    Key? key,
    required this.checkoutUrl,
  }) : super(key: key);

  @override
  State<CheckoutWebViewScreen> createState() => _CheckoutWebViewScreenState();
}

class _CheckoutWebViewScreenState extends State<CheckoutWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            // Interceptar deep links
            if (request.url.startsWith('your-flutter-app://success')) {
              context.go('/success');
              return NavigationDecision.prevent;
            }
            if (request.url.startsWith('your-flutter-app://cancel')) {
              context.go('/cancel');
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Carregando checkout...'),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
```

### Tela de Sucesso

```dart
// lib/screens/success_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pagamento Concluído'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.check_circle,
              size: 100,
              color: Colors.green,
            ),
            const SizedBox(height: 24),
            const Text(
              'Pagamento Concluído!',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Seu pagamento foi processado com sucesso.\nVocê receberá uma confirmação por email.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.go('/home'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
                child: const Text(
                  'Voltar ao Início',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Tela de Cancelamento

```dart
// lib/screens/cancel_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CancelScreen extends StatelessWidget {
  const CancelScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pagamento Cancelado'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.cancel,
              size: 100,
              color: Colors.red,
            ),
            const SizedBox(height: 24),
            const Text(
              'Pagamento Cancelado',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'O pagamento foi cancelado ou não pôde ser processado.\nTente novamente ou escolha outro método de pagamento.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 32),
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/home'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text(
                      'Tentar Novamente',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go('/home'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
                      'Voltar ao Início',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

## Configuração de Roteamento

### Configuração do GoRouter

```dart
// lib/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/home_screen.dart';
import '../screens/checkout_webview_screen.dart';
import '../screens/success_screen.dart';
import '../screens/cancel_screen.dart';

class AppRouter {
  static GoRouter createRouter() {
    return GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/checkout',
          builder: (context, state) {
            final url = state.queryParameters['url'];
            if (url == null) {
              return const Scaffold(
                body: Center(child: Text('URL de checkout não encontrada')),
              );
            }
            return CheckoutWebViewScreen(checkoutUrl: url);
          },
        ),
        GoRoute(
          path: '/success',
          builder: (context, state) => const SuccessScreen(),
        ),
        GoRoute(
          path: '/cancel',
          builder: (context, state) => const CancelScreen(),
        ),
      ],
    );
  }
}
```

## App Principal

### Main App

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'router/app_router.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Pagaleve Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      routerConfig: AppRouter.createRouter(),
    );
  }
}
```

## Tratamento de Erros

### Exception Handler para WebView

```dart
// lib/utils/webview_error_handler.dart
class WebViewErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is Exception) {
      final errorString = error.toString();

      if (errorString.contains('net::ERR_INTERNET_DISCONNECTED') ||
          errorString.contains('net::ERR_NETWORK_CHANGED')) {
        return 'Erro de conexão. Verifique sua internet.';
      }

      if (errorString.contains('net::ERR_TIMED_OUT')) {
        return 'Timeout na conexão. Tente novamente.';
      }

      if (errorString.contains('net::ERR_NAME_NOT_RESOLVED')) {
        return 'Não foi possível encontrar o servidor.';
      }

      return 'Erro ao carregar a página de checkout.';
    }

    return 'Erro inesperado. Tente novamente.';
  }
}
```

## Testes

### Configuração de Testes

```dart
// test/auth_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:your_app/services/auth_service.dart';

// Generate mocks
class MockClient extends Mock implements http.Client {}

void main() {
  group('AuthService', () {
    late AuthService authService;
    late MockClient mockClient;

    setUp(() {
      authService = AuthService();
      mockClient = MockClient();
    });

    test('should authenticate successfully', () async {
      // Arrange
      when(mockClient.post(
        any,
        headers: anyNamed('headers'),
        body: anyNamed('body'),
      )).thenAnswer((_) async => http.Response(
        '{"token": "mock-token"}',
        200,
      ));

      // Act
      final result = await authService.authenticate('test@email.com', 'password');

      // Assert
      expect(result.token, equals('mock-token'));
    });

    test('should throw exception on authentication failure', () async {
      // Arrange
      when(mockClient.post(
        any,
        headers: anyNamed('headers'),
        body: anyNamed('body'),
      )).thenAnswer((_) async => http.Response('Unauthorized', 401));

      // Act & Assert
      expect(
        () => authService.authenticate('test@email.com', 'wrong-password'),
        throwsA(isA<Exception>()),
      );
    });
  });
}
```

### Widget Tests

```dart
// test/login_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:your_app/screens/login_screen.dart';
import 'package:your_app/providers/auth_provider.dart';

void main() {
  group('LoginScreen', () {
    testWidgets('should display login form', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => AuthProvider(),
            child: const LoginScreen(),
          ),
        ),
      );

      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Senha'), findsOneWidget);
      expect(find.text('Fazer Login'), findsOneWidget);
    });

    testWidgets('should validate empty fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => AuthProvider(),
            child: const LoginScreen(),
          ),
        ),
      );

      await tester.tap(find.text('Fazer Login'));
      await tester.pump();

      expect(find.text('Email é obrigatório'), findsOneWidget);
      expect(find.text('Senha é obrigatória'), findsOneWidget);
    });
  });
}
```

## Melhores Práticas

### Segurança

- Use HTTPS para todas as requisições
- Implemente timeout adequado para requisições
- Valide todos os dados antes de enviar para a API
- Use deep links seguros e valide parâmetros

### Performance

- Implemente cache inteligente para tokens
- Use loading states apropriados
- Otimize rebuilds desnecessários com Consumer widgets

### UX

- Forneça feedback visual durante carregamentos
- Implemente tratamento de erro amigável
- Use indicadores de progresso no WebView
- Mantenha consistência visual com Material Design

## Próximos Passos

- Consulte a [documentação da API Pagaleve](https://docs.pagaleve.com.br)
- Implemente webhooks para atualizações em tempo real
- Configure analytics para monitorar conversões

## Suporte

Entre em contato com a equipe de suporte da Pagaleve para dúvidas técnicas.
