import {Translation, WordTranslationResultWithConfig} from "@/WordTranslation.ts";
import {Config, Message} from "@/Message.ts";

(function () {
    const DefaultConfig = {
        cardColor: 'hsl(22, 68%, 90%)',
        fontColor: 'hsl(0,0%,10%)',
        showShadow: true,
    } as Config

    let lastWord: string = ''
    let timeOutId: ReturnType<typeof setTimeout>

    /**
     * 单词总框
     */
    const div     = document.createElement('div')
    div.className = 'translations'

    /**
     * 设置词性前缀
     * @param div 元素
     * @param prefix 前缀
     */
    function setAttrPrefix(div: HTMLDivElement, prefix: string) {
        div.setAttribute('data-prefix', prefix)
    }

    /**
     * 是否在显示
     */
    function isShow() {
        // 获取body子元素
        // 用contains会遍历所有子元素，性能不好
        let children = document.body.children
        for (let i = 0; i < children.length; i++) {
            if (children[i] === div) {
                return true
            }
        }
        return false
    }

    /**
     * 显示翻译
     * @param s 是否显示
     */
    function showDiv(s: boolean | MouseEvent = true) {
        if (s === true) {
            if (!isShow())
                document.body.append(div)
        } else {
            lastWord = ''
            if (isShow()) {
                document.body.removeChild(div)
            }
        }
    }

    /**
     * 设置位置
     * @param x 窗口x
     * @param y 窗口y
     */
    function setPos(x: number, y: number) {
        // 防止出界
        let ox = Math.min(x, window.innerWidth - div.clientWidth - 30)
        let oy = Math.min(y, window.innerHeight - div.clientHeight - 10)
        // 遮挡鼠标
        if (oy != y && ox != x) {
            ox = x - div.offsetWidth - 20
        }
        div.style.left = ox + 'px'
        div.style.top  = oy + 'px'
    }

    /**
     * 鼠标移动
     * @param e
     */
    function move(e: MouseEvent) {
        let x = e.clientX
        let y = e.clientY
        let r = document.caretRangeFromPoint(x, y)
        if (!r) {
            return showDiv(false);
        }

        /**
         * 判断是否在元素内
         * @param rect 元素rect
         */
        function isIn(rect: DOMRect) {
            return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom
        }

        let tn = r.startContainer as Text
        if (tn.nodeType !== Node.TEXT_NODE) { // 非文本节点，跳过
            return showDiv(false);
        }
        let rect = tn.parentElement!.getBoundingClientRect()
        if (!isIn(rect)) { // 不是鼠标处的
            return showDiv(false);
        }
        let texts = tn.textContent ?? ""
        let word  = ''
        let start = 0
        let end   = 0

        /**
         * 是否是英文
         * @param code 字符码
         */
        function isWord(code: number) {
            return code === 45 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
        }

        // 遍历单词
        while (start < texts.length) {
            // 直到到单词起始位置
            while (start < texts.length && !isWord(texts.charCodeAt(start)))
                start++
            end = start
            // 直到到单词结束位置
            while (end < texts.length && isWord(texts.charCodeAt(end)))
                end++
            let textRange = document.createRange()
            textRange.setStart(tn, start)
            textRange.setEnd(tn, end)
            let textRect = textRange.getBoundingClientRect()
            if (isIn(textRect)) { // 是鼠标处的
                word = texts.slice(start, end).toLowerCase()
                break
            }
            start = end + 1
        }
        if (!word) { // 没有找到单词
            return showDiv(false);
        }

        // 还是当前单词
        if (lastWord == word) {
            setPos(x, y)
            return
        }
        lastWord = word

        // 发送翻译消息
        chrome.runtime.sendMessage({
            type: 'client',
            content: 'word',
            data: word
        } as Message<string>, (r?: WordTranslationResultWithConfig) => {
            if (!r) // 没有翻译结果
                return;
            clearTimeout(timeOutId)
            timeOutId = setTimeout(() => {
                // 移出所有翻译
                while (div.firstChild) {
                    div.removeChild(div.firstChild);
                }
                showDiv()

                // 显示每个单词
                for (let word in r) {
                    if (DefaultConfig[word as keyof Config])
                        continue
                    let t                = r[word]
                    const translationDiv = document.createElement('div')

                    translationDiv.className             = 'translation'
                    translationDiv.style.backgroundColor = r.cardColor
                    translationDiv.style.color           = r.fontColor
                    translationDiv.style.boxShadow       = r.showShadow ? `rgba(0, 0, 0, 0.4) 0 0 1em` : ''

                    const wordDiv     = document.createElement('div')
                    wordDiv.className = 'word'
                    wordDiv.innerText = word
                    translationDiv.append(wordDiv)
                    div.append(translationDiv)

                    /**
                     * 显示释义
                     * @param name 词性
                     * @param ts 翻译
                     */
                    function show(name: string, ts?: Translation) {
                        if (!ts) {
                            return
                        }
                        let v = document.createElement('div')
                        setAttrPrefix(v, name)
                        v.innerText = ts.translation.join('； ')
                        translationDiv.append(v)
                    }

                    // 显示所有释义
                    for (let name in t) {
                        show(name, t[name])
                    }
                }
                setPos(x, y)
            }, 200)
        })
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('wheel', move)
    window.addEventListener('mouseleave', showDiv)
    window.addEventListener('mouseout', showDiv)
})()
