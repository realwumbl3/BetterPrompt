import zyX, { html, sleep } from './zyX-es6.js'
import { ResolutionPicker } from './resolutionPicker.js'
import { getNodeClass } from './node.js'
import { updateInput } from './util.js'
import DenoiserControlExtender from './denoiseExtension.js'

import NodeField from './nodefield.js'

export default class Editor {
    constructor(editors, { tabNav, tabs }, tabname) {
        this.editors = editors
        this.tabs = tabs
        this.tabNav = tabNav
        this.tabname = tabname
        this.tab = tabs.querySelector(`#tab_${this.tabname}`)
        if (!this.tab) return console.error(`Tab ${this.tabname} not found`)

        this.resolutionPicker = new ResolutionPicker(this)
        this.textarea = this.tab.querySelector('textarea')
        if (this.tabname === "img2img") {
            this.denoiserControlExtender = new DenoiserControlExtender(this)
        }

        this.mainNodes = new NodeField()

        html`
            <div class="BetterPromptContainer">
                <div this=main class="BetterPrompt">
                    <div class="Header">
                        <label class="title">⠕ BetterPrompt Editor ⠪</label>
                        <div class="RightSide">
                            <div this=send_to_other class="Button">Send to ${this.tabname === 'txt2img' ? 'img2img' : 'txt2img'}</div>
                        </div>
                    </div>
                    ${this.mainNodes}
                    <div class="EditorFooter">
                        <div class="leftSide">
                            <div this=compose class="Button Compose">Compose</div>
                            <div this=add_node class="Button">Add Node</div>
                            <div this=add_tags class="Button">Add Tags</div>
                            <div this=add_break class="Button">Add BREAK</div>
                            <div this=add_group class="Button">Add Group</div>
                            <div this=fit_content class="Button">Fit content</div>
                            <div this=export class="Button">Export</div>
                            <div this=import class="Button">Import</div>
                        </div>
                        <dev class="rightSide">
=                        </dev>
                    </div>
                </div>
            </div>
        `
            .bind(this)
            .prependTo(this.tab.firstElementChild)

        this.add_node.addEventListener('click', async () => this.mainNodes.addByType('text'))
        this.add_break.addEventListener('click', async () => this.mainNodes.addByType('break'))
        this.add_tags.addEventListener('click', async () => this.mainNodes.addByType('tags'))
        this.add_group.addEventListener('click', async () => this.mainNodes.addByType('group'))

        this.export.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(this.mainNodes.culmJson(), null, 1))
        })

        this.fit_content.addEventListener('click', () => this.mainNodes.fitContent())
        this.compose.addEventListener('click', this.composePrompt.bind(this))

        this.import.addEventListener('click', () => {
            const json = prompt('Enter json')
            if (!json) return
            const parsed = JSON.parse(json)
            if (!Array.isArray(parsed)) return
            this.mainNodes.loadJson(parsed)
        })

        this.send_to_other.addEventListener('click', this.sendToOtherEditor.bind(this))

        this.asyncConstructor()
    }

    async asyncConstructor() {
        this.mainNodes.addByType('tags')
    }

    queryTab(cb) {
        return this.tab.querySelector(cb(this.tabname))
    }

    queryTabAll(cb) {
        return this.tab.querySelectorAll(cb(this.tabname))
    }

    async sendToOtherEditor() {
        const otherTab = this.tabname === 'txt2img' ? 'img2img' : 'txt2img'
        this.clickTab(otherTab)
        await sleep(50)
        const otherEditor = this.editors[otherTab]
        await otherEditor.mainNodes.loadJson(this.mainNodes.culmJson())
    }

    clickTab(which) {
        const tabs = Object.fromEntries([...this.tabNav.children].map(tab => [tab.innerText, tab]))
        const tab = tabs[which]
        tab.click()
    }

    composePrompt() {
        const prompt = this.mainNodes.composePrompt()
        updateInput(this.textarea, prompt)
    }

}
