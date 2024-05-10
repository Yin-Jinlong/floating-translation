import {Translation, WordTranslationResultWithConfig} from '../WordTranslation.ts'
import {Config, DefaultConfig} from '../Message.ts'

(function () {
    let lastWord: string = ''
    let timeOutId: ReturnType<typeof setTimeout>
    let animation: Animation
    let running = false
    let x: number, y: number

    /**
     * 单词总框
     */
    const div = document.createElement('div')
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
        return div.parentElement !== null
    }

    const SHOW_END_FRAME = {
        opacity: 1,
        transform: 'scale(1,1)'
    }

    /**
     * 显示翻译
     * @param s 是否显示
     */
    function showDiv(s: boolean | MouseEvent = true) {
        if (s === true) {
            div.style.transformOrigin = 'top left'
            if (!isShow()) {
                let dialogs = document.getElementsByTagName('dialog')
                let topEle = document.body
                for (const d of dialogs) {
                    if (d.open)
                        topEle = d
                }
                topEle.append(div)
                animation = div.animate([{
                    opacity: 0,
                    transform: 'scale(0.5,0.5)',
                    easing: 'ease-out'
                }, SHOW_END_FRAME], {
                    duration: 200
                })
            } else if (running) {
                animation = div.animate([SHOW_END_FRAME], {
                    duration: 150
                })
            } else
                return
            animation.finished.then().catch()
        } else {
            clearTimeout(timeOutId)
            lastWord = ''
            if (isShow() && !running) {
                running = true
                div.style.transformOrigin = 'center'

                animation = div.animate([{
                    opacity: 0,
                    transform: 'scale(0.9,0.4)',
                    easing: 'ease-out'
                }], {
                    duration: 200,
                })
                animation.finished.then(() => {
                    div.remove()
                }).catch().finally(() => {
                    running = false
                })
            }
        }
    }

    /**
     * 判断是否在元素内
     * @param rect 元素rect
     */
    function isIn(rect: DOMRect) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom
    }

    /**
     * 是否是英文
     * @param code 字符码
     */
    function isWord(code: number) {
        return code === 45 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    }

    /**
     * 设置位置
     */
    function setPos() {
        // 防止出界
        let ox = Math.min(x, window.innerWidth - div.clientWidth - 30)
        let oy = Math.min(y, window.innerHeight - div.clientHeight - 10)
        // 遮挡鼠标
        if (oy != y && ox != x) {
            ox = x - div.offsetWidth - 20
        }
        div.style.left = ox + 'px'
        div.style.top = oy + 'px'
    }

    /**
     * 鼠标移动
     * @param e
     */
    function move(e: MouseEvent) {
        x = e.clientX
        y = e.clientY
        setPos()

        // noinspection JSDeprecatedSymbols
        let tn = document.caretRangeFromPoint(x, y)?.startContainer as Text
        if (!tn || tn.nodeType !== Node.TEXT_NODE) { // 非文本节点，跳过
            return showDiv(false)
        }
        let rect = tn.parentElement!.getBoundingClientRect()
        if (!isIn(rect)) { // 不是鼠标处的
            return showDiv(false)
        }
        let texts = tn.textContent ?? ''
        let word = ''
        let start = 0
        let end = 0

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
            return showDiv(false)
        }

        // 还是当前单词
        if (lastWord == word)
            return
        lastWord = word

        // 发送翻译消息
        chrome.runtime.sendMessage(word, (r?: WordTranslationResultWithConfig) => {
            if (!r) // 没有翻译结果
                return
            clearTimeout(timeOutId)
            timeOutId = setTimeout(() => {
                // 移出所有翻译
                while (div.firstChild) {
                    div.removeChild(div.firstChild)
                }
                showDiv()

                // 显示每个单词
                for (let word in r) {
                    if (DefaultConfig[word as keyof Config])
                        continue
                    let t = r[word]
                    const translationDiv = document.createElement('div')

                    translationDiv.className = 'translation'
                    translationDiv.style.backgroundColor = r.cardColor
                    translationDiv.style.color = r.fontColor
                    translationDiv.style.boxShadow = r.showShadow ? `rgba(0, 0, 0, 0.4) 0 0 1em` : ''

                    const wordDiv = document.createElement('div')
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
                setPos()
            }, 200)
        })
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('wheel', showDiv)
    window.addEventListener('mouseleave', showDiv)
    window.addEventListener('mouseout', showDiv)
})()
