# Integração Pagaleve - Android e iOS Nativo

## Visão Geral

Guia prático para integrar o checkout Pagaleve BNPL em apps nativos Android (Kotlin) e iOS (Swift) usando WebView. Focado na implementação do WebView e deep links.

## Pré-requisitos

### Android

- Android Studio 4.0+
- minSdkVersion 21+
- Kotlin 1.8+ ou Java 8+
- Conta merchant Pagaleve com credenciais de API

### iOS

- Xcode 14.0+
- iOS 13.0+
- Swift 5.0+
- Conta merchant Pagaleve com credenciais de API

---

# Implementação Android

## Configuração do Projeto Android

### Dependências (build.gradle - Module)

```kotlin
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.navigation:navigation-fragment-ktx:2.7.6'
    implementation 'androidx.navigation:navigation-ui-ktx:2.7.6'

    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'

    // JSON parsing
    implementation 'com.google.code.gson:gson:2.10.1'

    // Material Design
    implementation 'com.google.android.material:material:1.11.0'

    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

### Configuração de Deep Links (AndroidManifest.xml)

```xml
<!-- app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.PagaleveApp">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name=".CheckoutActivity"
            android:exported="false" />

        <activity
            android:name=".SuccessActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="your-android-app"
                      android:host="success" />
            </intent-filter>
        </activity>

        <activity
            android:name=".CancelActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="your-android-app"
                      android:host="cancel" />
            </intent-filter>
        </activity>

    </application>
</manifest>
```

## Recebendo a URL do Checkout

O checkout da Pagaleve deve ser criado no seu backend através da API. Uma vez criado, você receberá uma `checkout_url` que deve ser passada para o WebView do seu app Android ou iOS.

**Exemplo de URL de checkout:**

```
https://checkout.pagaleve.com.br/checkout/abc123...
```

## Activities Android

### MainActivity

```kotlin
// MainActivity.kt
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

class MainActivity : AppCompatActivity() {
    private lateinit var urlEditText: TextInputEditText
    private lateinit var openCheckoutButton: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupClickListeners()
    }

    private fun initViews() {
        urlEditText = findViewById(R.id.urlEditText)
        openCheckoutButton = findViewById(R.id.openCheckoutButton)
    }

    private fun setupClickListeners() {
        openCheckoutButton.setOnClickListener {
            val checkoutUrl = urlEditText.text.toString().trim()

            if (checkoutUrl.isEmpty()) {
                Toast.makeText(this, "Por favor, insira a URL do checkout", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!isValidUrl(checkoutUrl)) {
                Toast.makeText(this, "URL inválida", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!checkoutUrl.contains("checkout.pagaleve.com.br")) {
                Toast.makeText(this, "Esta não parece ser uma URL da Pagaleve", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val intent = Intent(this, CheckoutActivity::class.java)
            intent.putExtra("checkout_url", checkoutUrl)
            startActivity(intent)
        }
    }

    private fun isValidUrl(url: String): Boolean {
        return try {
            val uri = android.net.Uri.parse(url)
            uri.scheme != null && uri.host != null
        } catch (e: Exception) {
            false
        }
    }
}
```

### CheckoutActivity (WebView)

```kotlin
// CheckoutActivity.kt
import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class CheckoutActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_checkout)

        val checkoutUrl = intent.getStringExtra("checkout_url") ?: run {
            finish()
            return
        }

        webView = findViewById(R.id.webView)

        // Configure WebView settings
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()

                return when {
                    url.startsWith("your-android-app://success") -> {
                        val intent = Intent(this@CheckoutActivity, SuccessActivity::class.java)
                        startActivity(intent)
                        finish()
                        true
                    }
                    url.startsWith("your-android-app://cancel") -> {
                        val intent = Intent(this@CheckoutActivity, CancelActivity::class.java)
                        startActivity(intent)
                        finish()
                        true
                    }
                    else -> false
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Show loading indicator if needed
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Hide loading indicator if needed
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                // Handle error
            }
        }

        webView.loadUrl(checkoutUrl)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

### SuccessActivity

```kotlin
// SuccessActivity.kt
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class SuccessActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_success)

        val backButton = findViewById<MaterialButton>(R.id.backButton)
        backButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
            finish()
        }
    }
}
```

### CancelActivity

```kotlin
// CancelActivity.kt
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class CancelActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_cancel)

        val tryAgainButton = findViewById<MaterialButton>(R.id.tryAgainButton)
        val backButton = findViewById<MaterialButton>(R.id.backButton)

        tryAgainButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
            finish()
        }

        backButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
            finish()
        }
    }
}
```

## Layouts Android

### activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:gravity="center">

    <ImageView
        android:layout_width="80dp"
        android:layout_height="80dp"
        android:src="@drawable/ic_payment"
        android:layout_marginBottom="24dp"
        android:tint="@color/blue" />

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Pagaleve Checkout"
        android:textAlignment="center"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="16dp" />

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Insira a URL do checkout recebida do seu backend"
        android:textAlignment="center"
        android:textSize="16sp"
        android:textColor="@color/gray"
        android:layout_marginBottom="32dp" />

    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="24dp">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/urlEditText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:hint="https://checkout.pagaleve.com.br/checkout/..."
            android:inputType="textUri"
            android:minLines="3"
            android:gravity="top" />

    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.button.MaterialButton
        android:id="@+id/openCheckoutButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Abrir Checkout" />

</LinearLayout>
```

### activity_checkout.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

---

# Implementação iOS

## Configuração do Projeto iOS

### Info.plist Configuration

```xml
<!-- ios/Runner/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.yourcompany.yourapp</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>your-ios-app</string>
        </array>
    </dict>
</array>

<!-- Allow arbitrary loads for development -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## Modelo Simples para URL iOS

```swift
// Models/CheckoutURL.swift
import Foundation

struct CheckoutURL {
    let url: String

    var isValid: Bool {
        guard let url = URL(string: url) else { return false }
        return url.scheme != nil && url.host != nil
    }

    var isPagaleveURL: Bool {
        return url.contains("checkout.pagaleve.com.br")
    }
}
```

## View Controllers iOS

### ViewController Principal

```swift
// ViewControllers/ViewController.swift
import UIKit

class ViewController: UIViewController {

    @IBOutlet weak var urlTextView: UITextView!
    @IBOutlet weak var openCheckoutButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        title = "Pagaleve Checkout"

        // Configure text view
        urlTextView.layer.borderColor = UIColor.systemGray4.cgColor
        urlTextView.layer.borderWidth = 1
        urlTextView.layer.cornerRadius = 8
        urlTextView.font = UIFont.systemFont(ofSize: 16)
        urlTextView.text = "https://checkout.pagaleve.com.br/checkout/..."
        urlTextView.textColor = UIColor.placeholderText

        urlTextView.delegate = self
    }

    @IBAction func openCheckoutButtonTapped(_ sender: UIButton) {
        guard let urlText = urlTextView.text?.trimmingCharacters(in: .whitespacesAndNewlines),
              !urlText.isEmpty,
              urlText != "https://checkout.pagaleve.com.br/checkout/..." else {
            showAlert(message: "Por favor, insira a URL do checkout")
            return
        }

        guard isValidURL(urlText) else {
            showAlert(message: "URL inválida")
            return
        }

        guard urlText.contains("checkout.pagaleve.com.br") else {
            showAlert(message: "Esta não parece ser uma URL da Pagaleve")
            return
        }

        presentCheckoutWebView(url: urlText)
    }

    private func isValidURL(_ string: String) -> Bool {
        guard let url = URL(string: string) else { return false }
        return url.scheme != nil && url.host != nil
    }

    private func presentCheckoutWebView(url: String) {
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        if let checkoutVC = storyboard.instantiateViewController(withIdentifier: "CheckoutViewController") as? CheckoutViewController {
            checkoutVC.checkoutUrl = url
            present(checkoutVC, animated: true)
        }
    }

    private func showAlert(message: String) {
        let alert = UIAlertController(title: "Aviso", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

extension ViewController: UITextViewDelegate {
    func textViewDidBeginEditing(_ textView: UITextView) {
        if textView.textColor == UIColor.placeholderText {
            textView.text = ""
            textView.textColor = UIColor.label
        }
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        if textView.text.isEmpty {
            textView.text = "https://checkout.pagaleve.com.br/checkout/..."
            textView.textColor = UIColor.placeholderText
        }
    }
}
```

### CheckoutViewController (WebView)

```swift
// ViewControllers/CheckoutViewController.swift
import UIKit
import WebKit

class CheckoutViewController: UIViewController {

    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!

    var checkoutUrl: String?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadCheckoutUrl()
    }

    private func setupWebView() {
        // Configure WebView for security
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = WKWebsiteDataStore.nonPersistent()

        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)

        // Setup constraints
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        // Add close button
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .close,
            target: self,
            action: #selector(closeButtonTapped)
        )
    }

    @objc private func closeButtonTapped() {
        dismiss(animated: true)
    }

    private func loadCheckoutUrl() {
        guard let urlString = checkoutUrl,
              let url = URL(string: urlString) else {
            showError(message: "URL inválida")
            return
        }

        let request = URLRequest(url: url)
        webView.load(request)
    }

    private func showError(message: String) {
        let alert = UIAlertController(title: "Erro", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            self.dismiss(animated: true)
        })
        present(alert, animated: true)
    }
}

extension CheckoutViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        activityIndicator.startAnimating()
        activityIndicator.isHidden = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        activityIndicator.isHidden = true
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let urlString = url.absoluteString

        if urlString.hasPrefix("your-ios-app://success") {
            dismiss(animated: true) {
                self.presentSuccessScreen()
            }
            decisionHandler(.cancel)
        } else if urlString.hasPrefix("your-ios-app://cancel") {
            dismiss(animated: true) {
                self.presentCancelScreen()
            }
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }

    private func presentSuccessScreen() {
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        if let successVC = storyboard.instantiateViewController(withIdentifier: "SuccessViewController") as? SuccessViewController {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                window.rootViewController?.present(successVC, animated: true)
            }
        }
    }

    private func presentCancelScreen() {
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        if let cancelVC = storyboard.instantiateViewController(withIdentifier: "CancelViewController") as? CancelViewController {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                window.rootViewController?.present(cancelVC, animated: true)
            }
        }
    }
}
```

### SuccessViewController

```swift
// ViewControllers/SuccessViewController.swift
import UIKit

class SuccessViewController: UIViewController {

    @IBOutlet weak var successImageView: UIImageView!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var messageLabel: UILabel!
    @IBOutlet weak var backButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        successImageView.image = UIImage(systemName: "checkmark.circle.fill")
        successImageView.tintColor = .systemGreen

        titleLabel.text = "Pagamento Concluído!"
        titleLabel.textColor = .systemGreen

        messageLabel.text = "Seu pagamento foi processado com sucesso.\nVocê receberá uma confirmação por email."

        backButton.setTitle("Voltar ao Início", for: .normal)
    }

    @IBAction func backButtonTapped(_ sender: UIButton) {
        dismiss(animated: true)
    }
}
```

### CancelViewController

```swift
// ViewControllers/CancelViewController.swift
import UIKit

class CancelViewController: UIViewController {

    @IBOutlet weak var cancelImageView: UIImageView!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var messageLabel: UILabel!
    @IBOutlet weak var tryAgainButton: UIButton!
    @IBOutlet weak var backButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    private func setupUI() {
        cancelImageView.image = UIImage(systemName: "xmark.circle.fill")
        cancelImageView.tintColor = .systemRed

        titleLabel.text = "Pagamento Cancelado"
        titleLabel.textColor = .systemRed

        messageLabel.text = "O pagamento foi cancelado ou não pôde ser processado.\nTente novamente ou escolha outro método de pagamento."

        tryAgainButton.setTitle("Tentar Novamente", for: .normal)
        backButton.setTitle("Voltar ao Início", for: .normal)
    }

    @IBAction func tryAgainButtonTapped(_ sender: UIButton) {
        dismiss(animated: true)
    }

    @IBAction func backButtonTapped(_ sender: UIButton) {
        dismiss(animated: true)
    }
}
```

## Melhores Práticas

### Segurança

- Use HTTPS para todas as requisições
- Configure WebView com `nonPersistent` data store
- Implemente timeout adequado para requisições
- Valide todos os deep links recebidos

### Performance

- Implemente cache inteligente para tokens
- Use loading states apropriados
- Otimize memory usage no WebView
- Configure background task handling adequadamente

### UX

- Forneça feedback visual durante carregamentos
- Implemente tratamento de erro amigável
- Use indicadores de progresso no WebView
- Mantenha consistência com as diretrizes de design da plataforma

## Testes

### Android - Unit Tests

```kotlin
// test/PagaleveRepositoryTest.kt
import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.junit.Assert.*

class PagaleveRepositoryTest {

    @Test
    fun `authenticate should return success with valid credentials`() = runBlocking {
        // Arrange
        val repository = PagaleveRepository()

        // Act
        val result = repository.authenticate("test@email.com", "password")

        // Assert
        assertTrue(result.isSuccess)
    }
}
```

### iOS - Unit Tests

```swift
// Tests/PagaleveAPIServiceTests.swift
import XCTest
@testable import YourApp

class PagaleveAPIServiceTests: XCTestCase {

    func testAuthenticate() {
        let expectation = XCTestExpectation(description: "Authentication")

        PagaleveAPIService.shared.authenticate(username: "test@email.com", password: "password") { result in
            switch result {
            case .success(let token):
                XCTAssertFalse(token.isEmpty)
            case .failure:
                XCTFail("Authentication should succeed")
            }
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 10.0)
    }
}
```

## Próximos Passos

- Consulte a [documentação da API Pagaleve](https://docs.pagaleve.com.br)
- Implemente webhooks para atualizações em tempo real
- Configure analytics para monitorar conversões

## Suporte

Entre em contato com a equipe de suporte da Pagaleve para dúvidas técnicas.
