# 雾玻璃开屏：使用与修改说明

这是一个可以用手指擦开雾气、显露文字并带起水波的全屏开屏。松手后水波继续扩散，擦痕逐渐回雾；无人操作时会随机出现水波，点击 ENTER 才进入下一页。

本文供开发 Agent 或开发者使用。网页效果与 iOS App 共用 HTML、CSS、JavaScript 和 WebGL；Swift 负责承载网页、传递安全区和前后台状态，以及关闭开屏。本仓库附带可运行网页、完整字体、模板底图和 Swift 接入源码。

本文说明随包实现和可调参数；调参示例不是默认值。

## 1. 需要哪些文件

网页文件位于 `MistSplash/`：

| 文件 | 用途 |
| --- | --- |
| `index.html` | 页面结构、底图路径、左上角固定文字、ENTER 按钮 |
| `splash.css` | 字体、固定文字与按钮样式、第一帧淡入 |
| `quotes.js` | 擦开后显露的短句 |
| `splash.js` | 底图适配、文字排版、擦痕、回雾、水波和渲染 |
| `mist.webp` | 雾玻璃底图，静态水珠主要来自这张图片 |
| `serif.woff2`、`script.woff2` | 正文衬线字体和中间手写标题字体，**都已按本模板的文案裁成子集** |
| `OFL-*.txt` | 随附字体的授权文件 |

iOS 另外使用 `ios/SplashView.swift`，以及 `ios/MistLaunch.imageset/` 中的静态底图。

## 2. 网页怎么使用

把 `MistSplash` 目录整体复制到自己的网页项目，保留文件间的相对路径。用本地 HTTP 服务预览，不要直接双击 HTML 以 `file://` 打开。例如在 `MistSplash` 目录运行：

```bash
python3 -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000`。

原代码的 ENTER 只通知宿主，不会自行跳到一个网页。网页项目应在外部 JS 文件里监听下面的事件，并接上自己的路由。例如新增 `host.js`：

```javascript
window.addEventListener('mist:enter', () => {
  window.mistSplashStop?.();
  window.location.href = './home.html'; // 换成自己的目标页面
}, { once: true });
```

在 `index.html` 的 `splash.js` 引用后添加：

```html
<script src="host.js" defer></script>
```

这里的事件名和全局函数名是现有代码接口，保留即可。如果改名，发送和接收两端一起改。当前 CSP 只允许本地脚本，不要直接添加内联 `<script>`。

示例已用 demo.js 接好 ENTER，纯网页点击后进入结束提示，可点击重新预览。嵌入自己的项目时移除 demo.js，换成自己的事件处理。

当前第一帧绘制前整个效果容器透明，约 0.45 秒淡入；原生 App 下方有静态图，独立网页没有。网页如需相同体验，可以在 `splash.css` 给 `body` 加同图背景：

```css
body {
  background: #153c68 url('mist.webp') center / cover no-repeat;
}
```

这只是首帧占位，`cover` 与正式渲染的非线性适配不同。特别长的屏幕可能看到轻微构图变化，要求完全一致时应让占位也使用相同映射。

## 3. 怎么替换底图

最简单的方法：把自己的图片转换为 WebP，直接替换 `mist.webp`，保留文件名。如果使用 JPG 或 PNG，修改 `index.html`：

```html
<img class="alw-photo" src="my-background.jpg" alt="自己的底图描述">
```

同步更新自己添加的 CSS 占位背景。App 还要替换 `ios/MistLaunch.imageset/mist-launch.jpg`，保持静态占位与动态开屏来自同一张新图；若改文件名，要同步改该 imageset 的 `Contents.json`。

图片放在本地同一资源目录，保留正常的不透明中心。当前 `preparePhoto()` 会检查中心像素是否透明，透明中心可能被判为绘制失败。

### 底图适配与附加颜色

在 `splash.js` 搜索 `function preparePhoto()`。当前不是普通 `cover`：它逐列或逐行映射，保留图片两侧，把更多比例变化留在中央。因此四周水珠较完整，但中央会有局部变形；换成人像、规则建筑或带字的图片时，需要检查变形。

函数中还会覆盖蓝色暗角：

| 搜索位置 | 当前值 | 怎么调 |
| --- | --- | --- |
| `edge.addColorStop` | 颜色 `7,38,87`，透明度 `0 / .025 / .24` | 改 RGB 换暗角色；降低透明度减弱暗角 |
| `sides.addColorStop` | 颜色 `5,33,83`，左右边缘透明度 `.20 / .24` | 降低透明度让边缘更亮；全设为 0 则取消这一层 |
| 中央透明位置 | `.22`、`.78` | 决定两侧渐变在宽度的什么位置变为透明 |

换底图后仍偏蓝，可能来自这些渐变、雾层和擦痕染色，并不一定是图片本身。想保留新底图色调，要一起检查第 6 节的颜色参数。

## 4. 怎么换成自己的文字

### 左上角一直显示的文字

修改 `index.html` 中 `.alw-en` 和 `.alw-cn` 的内容。它们在雾气上方，一直可见，不需要擦开。

```html
<div class="alw-intro">
  <div class="alw-en">YOUR OWN WORDS.</div>
  <div class="alw-cn">这里写自己的中文。</div>
</div>
```

在 `splash.css` 调整：

| 选择器 | 当前设置 |
| --- | --- |
| `.alw-intro` | 白字、顶部安全区下方 28px、左侧约 8.2% |
| `.alw-en` | 10px 字号、1.8 倍行高、2.1px 字距 |
| `.alw-cn` | 11px 字号、1.8 倍行高、0.7px 字距、上方间隔 9px |

### 擦开后才出现的文字

修改 `quotes.js` 中 `window.MistSplashQuotes` 数组，用自己的短句替换。字符串内用 `\n` 指定换行。例如：

```javascript
window.MistSplashQuotes = [
  "第一段文字\n这一句另起一行",
  "第二段文字",
  "第三段文字",
  "第四段文字",
  "第五段文字",
  "第六段文字",
  "第七段文字"
];
```

最省事的方式是保留七段，只替换内容，长度尽量接近原版。当前布局按七段设计，不能把数组当成任意数量的通用配置：

- 超过七段：`paintText()` 会用 `settings[i % settings.length]` 循环复用这七个位置，不会报错，但第八段起的横向位置和宽度与第一段重复。
- 少于七段：间隔按实际段数分配，但手写标题仍固定插在第三段之后，留白可能不符合预期。
- 文案很长：即使自动换行，也可能超出可用高度；需要调整字号、宽度或段数。

需要改段数时，让 Agent 同时修改 `paintText()` 中的 `settings`、间隔计算、标题插入位置和紧凑布局，并检查长短屏。

### 文字的位置、大小和中间标题

在 `splash.js` 搜索 `function paintText()`：

| 代码 | 含义 |
| --- | --- |
| `tctx.fillStyle='#fff'` | 擦开后文字的颜色 |
| `tctx.font='300 11px ...'` | 正文字号与字重；函数内恢复正文的同类语句也要一起改 |
| `settings=[{x:36,w:238}, ...]` | 每段的左侧坐标 `x`、自动换行宽度 `w` |
| `lineHeight=17.5` | 常规布局的正文行高 |
| `+30`、`-20` | 文本区域距离顶部固定文案、底部按钮的留白 |
| `if(i===2)` | 第三段后插入手写标题 |
| `tctx.fillText('…',W*.51,y)` | 将当前标题字符串换成自己的标题 |
| `400 35px ...`、`logoHeight=39` | 手写标题字号及预留高度，改大字号时一起检查 |

坐标使用逻辑宽度 `W=390`，不是手机物理像素。例如 `x=39` 约在屏幕宽度的 10%。紧凑布局另用两列和 15 的行距，当前不会绘制中间手写标题；需要横屏也显示标题时，要补上该分支。

标题为空可以隐藏字形，但仍保留标题空位；完全移除时要一起移除插入代码、预留高度和相应间隔。

### 换文案时别漏掉字体

随附字体已换成官方完整文件，未按模板文案裁剪；常见中英文可直接替换。字体本身不包含的生僻字或其他文字系统仍可能回退。

最容易移植的方式是替换为允许使用、覆盖新文案的完整字体，并在 `splash.css` 的 `@font-face` 更新文件路径。保留当前 font-family 别名可减少改动；如果改别名，需要同步改 `paintText()` 和 `document.fonts.load()` 中的名称。

**换掉文案之后一定要重裁子集**，否则新字会缺、回退到系统字体，风格就散了。裁法（需要 `pip install fonttools brotli`）：

```bash
# 1. 把所有会显示的字收进一个文件：七段短句 + 左上角两行 + 标题 + ENTER + 标点 + 英文
#    别只处理 quotes.js，漏一处就缺一个字
# 2. 正文字体（中英文都要）
pyftsubset 完整字体.ttf --text-file=chars.txt --flavor=woff2 --layout-features='' \
  --output-file=serif.woff2
# 3. 手写标题字体只画标题，通常只需要英文
pyftsubset 花体.ttf --text-file=英文字符.txt --flavor=woff2 --layout-features='' \
  --output-file=script.woff2
```

参考量级：完整的思源宋体 5.3 MB，按本模板这 190 个字符裁完是 23 KB。**别直接把完整字体放进仓库**，字体会比效果本身大二十倍。

ENTER 的文字及无障碍描述在 `index.html` 修改，页面 `<title>` 也可替换成自己的名称。App 的失败兜底按钮另在 `SplashView.swift` 中修改。

## 5. 擦痕大小、形状怎么修改

以下均在 `splash.js`，只影响擦雾笔刷。不要用 `disturb()` 中的 `rr=3.2` 调擦痕宽度，那是手指水波的扰动范围。

### 常规宽度

在 `drag()` 搜索：

```javascript
target=clamp(35-speed*.026,14,35)
```

| 数值 | 含义 | 修改方向 |
| --- | --- | --- |
| 前面的 `35` | 随速度变化前的基础半径 | 越大，慢划越宽 |
| `.026` | 速度对半径的影响 | 越大，快划时缩细越明显 |
| `14` | 最小半径 | 越大，最快划也不会太细 |
| 最后的 `35` | 最大半径 | 越大，允许的最大宽度越大 |

这里是半径，常规完整宽度约为 28～70 个逻辑像素，软边和起收笔会改变实际观感。

例如改细一档，可试：

```javascript
target=clamp(26-speed*.020,10,26)
```

### 起笔、柔边与收笔

| 搜索代码 | 当前含义 | 怎么调 |
| --- | --- | --- |
| `radius=16`（pointerdown 内） | 开始拖动的初始半径 | 改小，起笔更细 |
| `dab(last,9,0,lastMove,.16)` | 按下瞬间的印迹，半径 9 | 第二个参数控制起始点大小 |
| `clamp((pathLength+distance*t)/24,.38,1)` | 前 24 逻辑像素内由较细过渡到正常宽度 | 增大 24，起笔拉长；减小 .38，起笔更尖 |
| `radius+=(target-radius)*.35` | 宽度变化的平滑程度 | 减小 .35 变化更缓，增大则更快跟随 |
| `(1-d)/.21` | 柔边范围 | 增大 .21 更柔，减小更锐利 |
| `along*along*.9+cross*cross` | 笔刷沿移动方向略呈椭圆 | .9 改成 1 更圆；保持接近当前值避免裁切 |
| `Math.ceil(distance/3)` | 路径约每 3 个逻辑像素插值 | 减小间距更密，但也会增加叠加强度和计算量 |
| `i<=4`、`radius*(1-i/6)` | 松手后补四个逐渐缩小的印迹 | 控制尾部长度和收尖程度 |

缩放整支笔刷时，常规半径、按下半径和起笔半径一起调，避免出现“小笔刷、大起点”。

## 6. 擦痕深浅和颜色怎么修改

深浅分两层：一层是“擦开多少”，另一层是“擦开后染成多深的颜色”。建议分开调。

### A. 每次划过擦开多少

| 位置 | 当前强度 | 含义 |
| --- | --- | --- |
| `drag()` 内 `dab(...,now,.10)` | `.10` | 拖动沿途每个印迹的覆盖量 |
| pointerdown 内 `dab(...,.16)` | `.16` | 按下瞬间覆盖量 |
| `finish` 内 `dab(...,now,.075)` | `.075` | 收笔覆盖量 |

想一次划过更浅：可以先试 `.07 / .12 / .05`；想更快显露：可以先试 `.14 / .20 / .10`。这些是调参起点，需要在实际画面检查。

覆盖量通过下面公式累积：

```javascript
amount[i] = 1 - (1 - old) * (1 - deposit);
```

所以反复擦同一处会越来越明显。降低覆盖量也会让隐藏文字更晚显露；如果只想颜色浅一点、文字仍容易读，优先调整下面的颜色混合。

### B. WebGL 主效果的颜色深浅

在 `fragment` 片元着色器字符串中搜索：

```glsl
float ink=.32+.36*a;
vec3 clean=mix(blur,vec3(.035,.130,.380),ink);
```

- `a` 是擦开程度，范围 0～1。
- `.32` 是基础染色混合量；`.36` 是随擦开程度增加的染色量，总值从 .32 增长到 .68。
- `vec3(.035,.130,.380)` 是目标蓝色，约对应 RGB `(9,33,97)`，不是最终显示的纯色。
- 最终还用 `mix(fog,clean,a)` 与雾面混合；因此 `a=0` 时不会凭空显出基础染色。

**只想更浅，保留当前蓝色：**

```glsl
float ink=.22+.28*a;
vec3 clean=mix(blur,vec3(.035,.130,.380),ink);
```

**想更深，保留当前蓝色：**

```glsl
float ink=.40+.40*a;
vec3 clean=mix(blur,vec3(.035,.130,.380),ink);
```

**想换颜色：**替换 `vec3(...)` 的三个分量。普通 RGB 的每个分量除以 255，就是这里需要的值。例如 RGB `(54,77,102)` 写成：

```glsl
vec3 clean=mix(blur,vec3(.212,.302,.400),ink);
```

颜色越亮，擦开后的色调通常越亮；增加 `ink` 代表更接近目标颜色，并不对所有目标色都意味着更暗。保持两个混合系数之和不超过 1，便于可控地调整。

### C. 未擦区域的雾色

同一着色器中：

```glsl
vec3 fog=mix(mix(original,blur,.18),vec3(.72,.84,.96),.03+n*.06);
```

| 参数 | 作用 |
| --- | --- |
| `.18` | 原图与附近采样模糊图的混合量，增大更模糊 |
| `vec3(.72,.84,.96)` | 雾层的浅蓝颜色 |
| `.03+n*.06` | 雾色覆盖量，增大更明显、更容易发白 |

想调整擦痕边缘微弱高光，搜索 `(gx+gy)*.026`；降低 `.026` 可减弱，不要为了擦痕更深而大幅增加边缘高光。

### D. Canvas 备用效果必须另改

**当前仓库的备用路径没有使用上面的动态 `ink` 公式。** 它在 `paintUnder()` 使用固定覆盖：

```javascript
u.fillStyle='rgba(9,33,97,.36)';
```

RGB 改颜色，`.36` 改覆盖量。备用路径的未擦雾色是：

```javascript
ctx.fillStyle='rgba(184,215,244,.05)';
```

改 WebGL 着色器不会自动修改备用路径。备用效果仍有遮罩累积，但底层染色不随 `a` 加深，模糊方法也不同；若要求两条路径严格一致，需要 Agent 按同一颜色公式重写备用像素合成，不能仅换一个 RGBA 就宣称一致。

## 7. 回雾和水波参数

在 `remaining()` 中：

```javascript
const p=clamp((now-times[i]-3200)/10500,0,1);
return amount[i]*(1-p*p*(3-2*p));
```

`3200` 表示最后擦过后保持 3.2 秒，`10500` 表示之后用 10.5 秒逐渐恢复。单位均为毫秒，每个像素独立计时。延长前者可让擦痕停留更久，延长后者可让回雾更慢。当前使用 `performance.now()`，切后台虽然暂停绘制，回前台时擦痕仍可能已经衰退。

水波与擦痕分开控制：

| 位置 | 当前值 | 作用 |
| --- | --- | --- |
| `disturb()` 中 `rr` | `3.2` 个网格单位 | 手指水波初始扰动范围 |
| 拖动时 `disturb()` 的 power | `.22`～`.44` | 拖动扰动强度 |
| 按下时 power | `.65` | 按下的短促扰动 |
| `updateWater()` | `.23`、`.985` | 传播与衰减，勿随意大改以免不稳定 |
| `updateRain()` | 存活 6.8 秒、间隔 3.4～6.5 秒 | 自动波时长和出现频率 |

自动波最多两个波源，一个波源可以显示多道明暗环。当前渲染约 30 FPS，每次更新两轮高度网格，并非独立固定步长模拟，低帧率时波速可能变化。开启系统“减弱动态效果”时，关闭水波，保留擦雾与进入功能。

## 8. 怎么接入 iOS App

使用网页效果文件和现有 `SplashView.swift`，通过 `SplashView(onEnter:)` 放在自己的主页上方。以下是结构示意，`YourHomeView` 换成自己的主页：

```swift
struct OpeningRoot: View {
    @State private var showOpening = true

    var body: some View {
        ZStack {
            YourHomeView()
                .allowsHitTesting(!showOpening)

            if showOpening {
                SplashView {
                    showOpening = false
                }
                .zIndex(1)
            }
        }
    }
}
```

接入步骤：

1. 把完整 `MistSplash` 文件夹加入 App 的打包资源，保留目录层级。最终应能由 `Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "MistSplash")` 找到入口。
2. 将 `SplashView.swift` 加入 App 编译目标，将自己的静态同图加入名为 `MistLaunch` 的图片资源；改资源名时同步修改 `Image("MistLaunch")`。
3. ENTER 回调中移除开屏视图，交还主页触摸。只把开屏透明度设为 0，可能仍挡住下面的按钮。
4. 保留前后台通知、安全区传递、失败兜底和拆除清理逻辑。

现有网页与 Swift 的桥接接口：

| 接口 | 方向与用途 |
| --- | --- |
| `window.webkit?.messageHandlers?.mistSplash?.postMessage('enter')` | 网页请求进入，Swift 只处理一次 |
| 同一接口发送 `'failed'` | 显示原生备用 ENTER |
| `window.mistSplashEnvironment({active,top,bottom,left,right})` | Swift 传递活动状态与安全区 |
| `window.mistSplashStop()` | 拆除时停止动画并释放渲染资源 |

App 打包时保留 `MistSplash` 文件夹结构，并移除 `index.html` 中的 `demo.js`、`standalone-fix.js` 引用及 CSS 的网页 `body` 蓝底（保留透明，露出原生静态底图）。

当前 Swift 用 `loadFileURL` 加载本地页面，并包含两个以下划线开头的 selector 探测和 KVC 设置，用于处理本地图片进入 Canvas/WebGL 后的读取问题。**这部分属于当前工程的兼容处理，不是通用的公开配置接口。** 移植时不能只删掉它就假定仍可运行；应验证图片解码、`getImageData` 和纹理上传是否成功。若改用自己的资源加载方式，需要同步调整当前仅允许资源目录内 `file://` 导航的策略及 CSP。

当前停止函数取消动画并删除部分 WebGL 资源；它没有主动移除所有 JS 监听或关闭 ImageBitmap。因此完整卸载 WKWebView 时可复用现有生命周期；若在同一个网页里反复创建和销毁开屏，应补充监听、定时器和位图清理。

## 9. 修改后检查

- 新底图成功显示，长短屏构图合适，App 静态占位也已替换。
- 固定文字、隐藏短句、标题和按钮均已替换，无缺字或溢出。
- 快慢划动宽度不同，重复擦拭能累积，颜色符合预期。
- 松手后波纹继续传播，擦痕按设定时间逐点回雾。
- 点击 ENTER 能进入目标页面，之后按钮和滑动正常。
- App 反复打开、切后台回来时，无黑屏、停帧和明显闪屏。

调试可检查容器的 `dataset.renderer`：`webgl` 为主渲染，`canvas` 为无 WebGL 的备用渲染，`fallback` 为 WebGL 初始化出错后回退。`startError`、`glError`、`frameError` 记录对应错误；`frame`、`swipes`、`clearedPixels` 可辅助确认绘制与擦雾是否工作。

全文为实现与调参说明。测试范围和限制见首页 README，不保证所有 iOS 版本和设备表现一致。
