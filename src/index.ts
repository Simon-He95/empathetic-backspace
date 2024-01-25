import { addEventListener, createPosition, createRange, getActiveText, getOffsetFromPosition, getPosition, getSelection, updateText } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'

export async function activate(context: ExtensionContext) {
  const disposes: Disposable[] = []
  const selection = getSelection()
  let preActive: any = null
  let preCode: any = null
  if (selection)
    preActive = getOffsetFromPosition(createPosition(selection.line, selection.character))
  disposes.push(addEventListener('selection-change', (event) => {
    preActive = getOffsetFromPosition(event.selections[0].active)
    preCode = getActiveText()
  }))

  disposes.push(addEventListener('text-change', ({ contentChanges }) => {
    if (contentChanges.length !== 1)
      return
    const change = contentChanges[0]
    let s
    try {
      s = getSelection()
    }
    catch (error) {

    }
    let text = change.text || preCode.slice(getOffsetFromPosition(change.range.start, preCode), getOffsetFromPosition(change.range.end, preCode))
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
      while (code[i] === ' ' || code[i] === '\n') {
        i++
      }
    }
    else {
      // 往前删
      i--
      while (code[i] === ' ' || code[i] === '\n') {
        i--
      }
      i++
    }
    if (!/[\s\n]/.test(code.slice(Math.min(i, active), Math.max(i, active))))
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
