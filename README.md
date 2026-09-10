# Mist

这是一个前端开屏页面，手指或鼠标滑动页面擦去薄雾，带起水波动效。

A front-end splash screen: wipe the fog away with your finger or mouse, and the water ripples follow.

零依赖，不用 npm、不用构建。图片、文字、颜色都能换。附 iOS 接入示例。

## 直接运行

下载仓库后，在仓库根目录运行：

```bash
python3 -m http.server 8000 --directory MistSplash
```

浏览器访问 `http://localhost:8000`。不要双击 HTML 用 `file://` 打开，效果出不来。

网页示例点击 ENTER 后显示“雾散了”，可点击“再看一次”重新体验。接入自己的页面时，移除 `demo.js`，在外部脚本监听 `mist:enter` 并切换自己的页面。详见 [修改与接入说明](docs/customization.md)。

## 包里有什么

| 路径 | 内容 |
| --- | --- |
| `MistSplash/` | HTML、CSS、JS、底图、字体和可运行示例 |
| `ios/SplashView.swift` | SwiftUI + WKWebView 接入示例 |
| `ios/MistLaunch.imageset/` | 同图静态占位资源，可拖入自己的 Assets.xcassets |
| `docs/customization.md` | 替换图片、文字、字体，调擦痕大小、深浅、颜色和水波 |
| `docs/preview.md` | 底图长什么样（静态图，擦雾和水波要跑起来才看得到） |
| `THIRD_PARTY_NOTICES.md` | 字体来源和素材说明 |
| `LICENSE` | 项目非商业使用条款 |

## 换成自己的内容

- **底图**：替换 `MistSplash/mist.webp`。App 同步替换 `ios/MistLaunch.imageset/mist-launch.jpg`。
- **固定文字**：改 `index.html` 中左上角的两行文字。
- **擦开的文字**：改 `quotes.js`。排版按七段设计，多于七段会从头循环复用位置，少于七段会自动摊开间距。
- **手写标题**：在 `splash.js` 搜索 `fillText('Mist'`。
- **擦痕宽度**：搜索 `target=clamp(35-speed*.026,14,35)`。
- **一次擦开多少**：搜索 `dab(p,r,angle,now,.10)`。
- **擦痕颜色和深浅**：搜索 `float ink=.32+.36*a`、`vec3(.035,.130,.380)`。Canvas 备用路径需另改。

两个字体都按本模板实际用到的字符裁成了子集：正文 190 字、23 KB，手写标题 75 字、19 KB，整个 `MistSplash/` 一共 159 KB。**换掉文案之后要重裁一次**，否则新字会缺、回退成系统字体，风格就散了。裁法和命令见 [customization.md](docs/customization.md)。

## 手机与 App

- 浏览器使用：直接访问部署后的 `MistSplash/index.html`。
- iPhone 主屏入口：页面包含苹果主屏模式声明及高度补丁。`standalone-fix.js` 必须在 `splash.js` 前加载。
- iOS App：把 `MistSplash` 整个目录加入资源，添加 `ios/SplashView.swift` 和 `MistLaunch.imageset`，通过 `SplashView(onEnter:)` 显示。详见修改说明第 8 节。
- Android：网页代码可作为 WebView 内容；本包未提供 Android 原生桥接示例。

## 已知限制

- 版面按七段短句设计，多于七段会循环复用这七个位置，版面会重复。紧凑横屏使用两列，且不显示中间手写标题。
- 中间的手写标题字体只含英文字母、数字和标点，**没有中文**。标题换成中文会掉回系统字体；要用中文标题需自行换一套中文手写字体，并按修改说明第 4 节重裁子集。
- 水波和折射是独立的一层，可以单独提取（去掉擦雾、隐藏文字和 ENTER）作为背景组件接入其他页面。注意**水波只扭曲画布内部的内容**：背景图会荡，叠在上面的按钮、卡片、文字属于 DOM，不会跟着变形。
- 宽高变化会触发整页重载，擦痕不会保留。页面是独立全屏示例，嵌进已有页面需自行管理全局 CSS 和退出清理。
- WebGL 和 Canvas 备用路径的颜色合成并不完全相同。
- `SplashView.swift` 使用了两处非公开的 KVC 配置来放开本地文件访问。改用其他加载方式的话，资源读取、导航策略和 CSP 要一起改。

## 使用范围

可以免费用于个人练习、学习、非商业展示和非商业项目，可以修改和非商业分享。不得用于付费产品、收费服务、商业客户项目、售卖模板或其他商业目的。分享时保留许可证及第三方说明。

字体采用它们原有的 OFL 许可。详见 [LICENSE](LICENSE) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
