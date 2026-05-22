# SwipeWord

SwipeWord 是一款基于滑动反馈和简化间隔重复算法的轻量化单词记忆 MVP。

核心体验：像刷卡片一样背单词。刷一下，记一个。

## 如何运行

```bash
npm install
npm run dev
```

然后在浏览器打开终端输出的本地地址，通常是：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
```

## Android Debug APK

项目已接入 Capacitor Android。当前 debug 包输出路径：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

本机已验证可复用 Android Studio 自带 JBR：

```text
D:\Android\jbr
```

重新制作 debug APK：

```bash
npm run android:debug
```

手动流程：

```bash
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

release 包暂未制作。等功能和测试稳定后，再配置签名文件、release buildType、混淆/压缩策略，并执行 release 打包。

## 已实现功能

- 首页今日任务统计：新词、待复习、薄弱词、连续学习、掌握进度
- 学习页默认直达刷词体验，采用双卡纸牌交互：前卡为英文单词，后卡为释义与例句
- 左滑记录不会并显示释义卡；右滑记录会；偷看释义后按模糊处理
- 右滑/上滑起手时释义卡跟随卡组，迟疑时从相反边缘露出；下方迟疑时从上边缘露出
- 释义卡任意方向划走后回收到牌组后方，下一张从后方卡组自然顶上来
- 单击卡片空白处显示例句，点击单词/例句发音，双击卡片收藏/取消收藏
- 移动端触摸拖拽和桌面鼠标拖拽
- 简化间隔重复算法：根据反馈调整熟悉度、状态和下次复习时间
- 学习结束总结页：统计本轮反馈和下次复习时间
- 词库页：内置四级、六级、考研、雅思、托福、自定义入口，支持切换和每日新词数设置
- 薄弱词页：展示 weak 或错误次数较高的单词，支持重新学习入口
- 统计页：连续学习、掌握词、完成率、复习率、薄弱词和易忘列表
- 设置页：每日新词、自动发音、美音/英音、英文释义、例句显示、清空记录
- 本地持久化：学习进度、设置、复习日志保存在 localStorage

## 主要结构

```text
src/
  components/        独立 UI 组件
  data/              内置词库和词库配置
  models/            Word / Progress / ReviewLog 类型
  pages/             页面路由
  services/          复习算法、进度服务、统计服务
  storage/           localStorage 封装
  utils/             日期工具
```

## 后续可扩展方向

- 接入真实大词库和自定义词库导入
- 增加拼写测试完整流程
- 引入更精细的 SM-2 或 FSRS 复习算法
- 支持云同步、多设备学习记录
- 增加发音音频缓存和更稳定的语音选择
- 完善无障碍操作和键盘快捷键
