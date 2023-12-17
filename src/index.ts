import { addEventListener, getLocale, message, openExternalUrl } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'
import { authentication } from 'vscode'
import { isInSponsor } from 'get-sponsors-list'
import { displayName } from '../package.json'

export async function activate(context: ExtensionContext) {
  message.info('Hello')
  const disposes: Disposable[] = []
  let isSponsor = false
  const lan = getLocale()
  const isZh = lan.includes('zh')
  let session = await authentication.getSession('github', ['user:read'])
  if (session) {
    const user = session.account.label
    isSponsor = await isInSponsor(user)
    if (isSponsor)
      message.info(isZh ? '尊贵的Simon的赞助者, 感谢你的支持♥️' : 'Distinguished Simon\'s sponsor, thank you for your support ♥️')
    else
      message.info(`${session.account.label}, ${isZh ? '您目前还不是Simon的赞助者，请赞助后再来享受插件吧～' : 'You are not currently a sponsor of Simon. Please come and enjoy the plug-in after sponsoring~'}`)
  }
  else {
    message.info({
      message: `${displayName} ${isZh ? '目前只针对sponsors服务，如需使用，请赞助我哦～' : 'At present, it is only for sponsors. If you need to use it, please sponsor me~'}`,
      buttons: isZh ? '赞助我!' : 'Sponsor me!',
    }).then((v) => {
      if (v)
        openExternalUrl('https://github.com/Simon-He95/sponsor')
    })
  }
  disposes.push(addEventListener('auth-change', async (name: string, getsession) => {
    if (name === 'github') {
      session = await getsession(name)
      if (session) {
        const user = session.account.label
        isSponsor = await isInSponsor(user)
        if (isSponsor)
          message.info(isZh ? '尊贵的Simon的赞助者, 感谢你的支持♥️' : 'Distinguished Simon\'s sponsor, thank you for your support ♥️')
        else
          message.info(`${session.account.label}, ${isZh ? '您目前还不是Simon的赞助者，请赞助后再来享受插件吧～' : 'You are not currently a sponsor of Simon. Please come and enjoy the plug-in after sponsoring~'}`)
      }
      else {
        isSponsor = false
      }
    }
  }))
  context.subscriptions.push(...disposes)
}

export function deactivate() {

}
