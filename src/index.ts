import { addEventListener, createExtension, createPosition, createRange, getActiveText, getCurrentFileUrl, getOffsetFromPosition, getPosition, getSelection, insertText, updateText } from '@vscode-use/utils'

export const { activate } = createExtension(() => {
  const selection = getSelection()
  let preActive: number | undefined = undefined
  let preCode: string | undefined = getActiveText()

  if (selection) {
    preActive = getOffsetFromPosition(createPosition(selection.line, selection.character))
  }

  addEventListener('selection-change', (event) => {
    // 检查事件数据有效性
    if (event.selections && event.selections.length > 0 && event.selections[0].active) {
      preActive = getOffsetFromPosition(event.selections[0].active)
      preCode = getActiveText()
    }
  })

  addEventListener('text-change', ({ contentChanges, reason, document }) => {
    // 如果光标不是在操作的位置说明是其他插件操作,不做处理
    const selection = getSelection()
    if (!selection)
      return
    if (reason === 1)
      return
    if (contentChanges.length !== 1)
      return
    if (document.uri.fsPath !== getCurrentFileUrl())
      return

    const change = contentChanges[0]
    const curActive = getOffsetFromPosition(createPosition(selection.line, selection.character))

    // 修复 preActive 为 undefined 的情况
    if (preActive === undefined || !curActive) {
      return
    }

    // 检查操作范围是否合理 (4 是最大允许的光标移动距离)
    if ((change.range.end.line !== selection.line && change.range.start.line !== selection.line)
      || (Math.abs(curActive - preActive) > 4)) {
      return
    }

    let s
    try {
      s = getSelection()
    }
    catch (error) {
      console.warn('Failed to get selection:', error)
      return
    }

    // 确保 preCode 存在
    if (!preCode) {
      return
    }

    let text = change.text || preCode.slice(
      getOffsetFromPosition(change.range.start, preCode),
      getOffsetFromPosition(change.range.end, preCode)
    )

    // 简化条件逻辑：如果不是单个空白字符且包含空白字符且有选中文本，则返回
    if (!/^[\s\t\n]$/.test(text) && /\s+/.test(text) && s?.selectedTextArray[0]?.length) {
      return
    }

    // 如果包含空白字符和换行符，则返回
    if (/\s+\n/.test(text)) {
      return
    }

    // 如果没有选中文本且是删除操作，清理空白字符
    if (!s?.selectedTextArray[0]?.length && change.text === '') {
      text = text.trim()
    }

    // 只处理删除操作（文本为空或换行）
    if (text !== '' && (text !== '\n' || change.text === '')) {
      return
    }

    // 删除操作
    const code = getActiveText()
    if (!code) {
      return
    }

    const active = change.rangeOffset
    let i = active

    if (active === preActive) {
      // 往后删除空白字符
      while (i < code.length && /[\s\n\t]/.test(code[i])) {
        i++
      }
    }
    else {
      // 往前删除空白字符
      i--
      while (i >= 0 && /[\s\n\t]/.test(code[i])) {
        i--
      }
      i++
    }

    // 确保删除范围内确实包含空白字符
    const rangeText = code.slice(Math.min(i, active), Math.max(i, active))
    if (!/[\s\n]/.test(rangeText)) {
      return
    }

    // 避免删除单个字符的无效操作
    if ((i === active - 1) && change.range.start.line === change.range.end.line) {
      return
    }

    const start = getPosition(Math.min(i, active))
    const end = getPosition(Math.max(i, active))
    insertText(createRange(start.position, end.position), '')
  })
})
