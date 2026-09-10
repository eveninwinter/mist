import SwiftUI
import WebKit

struct SplashView: View {
    let onEnter: () -> Void
    @State private var loadFailed = false

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottomTrailing) {
                Image("MistLaunch")
                    .resizable()
                    .scaledToFill()
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .clipped()
                MistSplashWebView(
                    onEnter: onEnter,
                    onFailure: { loadFailed = true }
                )
                if loadFailed {
                    Button(action: onEnter) {
                        Text("ENTER")
                            .font(.system(size: 10, weight: .light, design: .serif))
                            .tracking(2.1)
                            .foregroundStyle(.white)
                            .frame(width: 62, height: 48)
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("进入 Mist")
                    .padding(.trailing, 24)
                    .padding(.bottom, max(geometry.safeAreaInsets.bottom, 34) + 12)
                }
            }
        }
        .ignoresSafeArea()
    }
}

private struct MistSplashWebView: UIViewRepresentable {
    let onEnter: () -> Void
    let onFailure: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onEnter: onEnter, onFailure: onFailure)
    }

    func makeUIView(context: Context) -> MistWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(context.coordinator, name: "mistSplash")
        if configuration.responds(to: Selector(("_setAllowUniversalAccessFromFileURLs:"))) {
            configuration.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        }
        if configuration.preferences.responds(to: Selector(("_setAllowFileAccessFromFileURLs:"))) {
            configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        }
        let webView = MistWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.underPageBackgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.observeApplicationActivity()
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "MistSplash") {
            context.coordinator.resourceDirectory = url.deletingLastPathComponent()
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            DispatchQueue.main.async { onFailure() }
        }
        return webView
    }

    func updateUIView(_ webView: MistWebView, context: Context) {
        context.coordinator.onEnter = onEnter
        context.coordinator.onFailure = onFailure
    }

    static func dismantleUIView(_ webView: MistWebView, coordinator: Coordinator) {
        NotificationCenter.default.removeObserver(webView)
        webView.evaluateJavaScript("window.mistSplashStop && window.mistSplashStop()", completionHandler: nil)
        webView.stopLoading()
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "mistSplash")
        webView.navigationDelegate = nil
    }

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        var onEnter: () -> Void
        var onFailure: () -> Void
        var resourceDirectory: URL?
        private var didEnter = false
        private var recoveredProcess = false

        init(onEnter: @escaping () -> Void, onFailure: @escaping () -> Void) {
            self.onEnter = onEnter
            self.onFailure = onFailure
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "mistSplash", message.frameInfo.isMainFrame,
                  let action = message.body as? String else { return }
            if action == "failed" { onFailure(); return }
            guard action == "enter", !didEnter else { return }
            didEnter = true
            onEnter()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            (webView as? MistWebView)?.updateArtworkEnvironment()
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url, url.isFileURL,
                  let directory = resourceDirectory,
                  url.standardizedFileURL.path.hasPrefix(directory.standardizedFileURL.path + "/") else {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { onFailure() }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { onFailure() }
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            guard !didEnter else { return }
            if !recoveredProcess {
                recoveredProcess = true
                webView.reload()
            } else {
                onFailure()
            }
        }
    }
}

private final class MistWebView: WKWebView {
    var isArtworkActive = true

    func observeApplicationActivity() {
        isArtworkActive = UIApplication.shared.applicationState == .active
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(applicationBecameActive),
                           name: UIApplication.didBecomeActiveNotification, object: nil)
        center.addObserver(self, selector: #selector(applicationResignedActive),
                           name: UIApplication.willResignActiveNotification, object: nil)
        center.addObserver(self, selector: #selector(applicationResignedActive),
                           name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func applicationBecameActive() {
        isArtworkActive = true
        updateArtworkEnvironment()
    }

    @objc private func applicationResignedActive() {
        isArtworkActive = false
        updateArtworkEnvironment()
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        updateArtworkEnvironment()
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        updateArtworkEnvironment()
    }

    func updateArtworkEnvironment() {
        let insets = window?.safeAreaInsets ?? safeAreaInsets
        let payload: [String: Any] = [
            "active": isArtworkActive,
            "top": insets.top, "bottom": insets.bottom,
            "left": insets.left, "right": insets.right
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        evaluateJavaScript("window.mistSplashEnvironment && window.mistSplashEnvironment(\(json))", completionHandler: nil)
    }
}
