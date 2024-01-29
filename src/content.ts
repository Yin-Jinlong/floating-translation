import {Translation, WordTranslationResult} from "@/WordTranslation.ts";

(function () {
    let lastWord: string = ''

    const div = document.createElement('div')
    document.body.append(div)
    div.className     = 'translations'
    div.style.display = 'none'

    function setAttrPrefix(div: HTMLDivElement, prefix: string) {
        div.setAttribute('data-prefix', prefix)
    }

    function clear() {
        lastWord          = ''
        div.style.display = 'none'
    }

    function setPos(x: number, y: number) {
        let ox = Math.min(x, window.innerWidth - div.clientWidth - 30)
        let oy = Math.min(y, window.innerHeight - div.clientHeight - 10)
        if (oy != y && ox != x) {
            ox = x - div.offsetWidth - 20
        }
        div.style.left = ox + 'px'
        div.style.top  = oy + 'px'
    }

    function move(e: MouseEvent) {
        let x = e.clientX
        let y = e.clientY
        let r = document.caretRangeFromPoint(x, y)
        if (!r) {
            return clear();
        }

        function isIn(rect: DOMRect) {
            return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom
        }

        let tn = r.startContainer as Text
        if (tn.nodeType !== Node.TEXT_NODE) {
            return clear();
        }
        let rect = tn.parentElement!.getBoundingClientRect()
        if (!isIn(rect)) {
            return clear();
        }
        let texts = tn.textContent ?? ""
        let word  = ''
        let start = 0
        let end   = 0

        function isWord(code: number) {
            return code === 45 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
        }

        while (start < texts.length) {
            while (start < texts.length && !isWord(texts.charCodeAt(start)))
                start++
            end = start
            while (end < texts.length && isWord(texts.charCodeAt(end)))
                end++
            let textRange = document.createRange()
            textRange.setStart(tn, start)
            textRange.setEnd(tn, end)
            let textRect = textRange.getBoundingClientRect()
            if (isIn(textRect)) {
                word = texts.slice(start, end).toLowerCase()
                break
            }
            start = end + 1
        }
        if (!word) {
            return clear();
        }

        if (lastWord == word) {
            setPos(x, y)
            return
        }
        lastWord = word

        chrome.runtime.sendMessage(word, (r?: WordTranslationResult) => {
            if (!r)
                return;
            while (div.firstChild) {
                div.removeChild(div.firstChild);
            }
            div.style.display = 'block'

            for (let word in r) {
                let t                    = r[word]
                const translationDiv     = document.createElement('div')
                translationDiv.className = 'translation'
                const wordDiv            = document.createElement('div')
                wordDiv.className        = 'word'
                wordDiv.innerText        = word
                translationDiv.append(wordDiv)
                div.append(translationDiv)

                function show(name: string, ts?: Translation) {
                    if (!ts) {
                        return
                    }
                    let v = document.createElement('div')
                    setAttrPrefix(v, name)
                    v.style.display = 'block'
                    v.innerText     = ts.translation.join('； ')
                    translationDiv.append(v)
                }

                for (let name in t) {
                    show(name, t[name])
                }
            }
            setPos(x, y)
        })
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('wheel', move)
})()
