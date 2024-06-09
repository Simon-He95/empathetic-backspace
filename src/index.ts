import { addEventListener, createPosition, createRange, getActiveText, getOffsetFromPosition, getPosition, getSelection, updateText } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'

export async function activate(context: ExtensionContext) {
  const disposes: Disposable[] = []
  const selection = getSelection()
  let preActive: any = null
  let preCode: any = getActiveText()
  if (selection)
    preActive = getOffsetFromPosition(createPosition(selection.line, selection.character))
  disposes.push(addEventListener('selection-change', (event) => {
    preActive = getOffsetFromPosition(event.selections[0].active)
    preCode = getActiveText()
  }))

  disposes.push(addEventListener('text-change', ({ contentChanges, reason }) => {
    // 如果光标不是在操作的位置说明是其他插件操作,不做处理
    const selection = getSelection()
    if (!selection)
      return
    if (reason === 1)
      return
    if (contentChanges.length !== 1)
      return
    const change = contentChanges[0]
    const curActive = getOffsetFromPosition(createPosition(selection.line, selection.character))
    if ((change.range.end.line !== selection.line && change.range.start.line !== selection.line) || !curActive || (Math.abs(curActive - preActive) > 4))
      return
    let s
    try {
      s = getSelection()
    }
    catch (error) {

    }
    let text = change.text || preCode.slice(getOffsetFromPosition(change.range.start, preCode), getOffsetFromPosition(change.range.end, preCode))
    if (!/^[\s\t\n]$/.test(text) && (/\s+/.test(text) && s?.selectedTextArray[0].length))
      return
    if (/\s+\n/.test(text))
      return
    if (!s?.selectedTextArray[0].length && change.text === '')
      text = text.trim()

    if (text !== '' || (text !== '\n' && change.text !== ''))
      return
    // 删除操作
    const code = getActiveText()!
    const active = change.rangeOffset
    let i = active

    if (active === preActive) {
      // 往后删
      while (/[\s\n\t]/.test(code[i])) {
        i++
      }
    }
    else {
      // 往前删
      i--
      while (/[\s\n\t]/.test(code[i])) {
        i--
      }
      i++
    }
    if (!/[\s\n]/.test(code.slice(Math.min(i, active), Math.max(i, active))))
      return
    if ((i === active - 1) && change.range.start.line === change.range.end.line)
      return
    updateText((edit) => {
      const start = getPosition(i)
      const end = getPosition(active)
      edit.replace(createRange(start, end), '')
    })
  }))

  context.subscriptions.push(...disposes)
}

export function deactivate() {

}
