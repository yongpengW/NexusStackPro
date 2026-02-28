/**
 * 在 React 组件树外部调用 Ant Design App.useApp() 实例
 *
 * 使用方式：
 *  1. 在 <AntdApp> 内部挂载 <GlobalAppSetup />（见 main.tsx）
 *  2. 在任意非组件代码（如 request.ts）中 import { globalMessage, globalNotification }
 */
import type { MessageInstance } from 'antd/es/message/interface'
import type { NotificationInstance } from 'antd/es/notification/interface'

let _message: MessageInstance | null = null
let _notification: NotificationInstance | null = null

/** 由 GlobalAppSetup 组件调用，将实例注入模块 */
export function setupGlobalApp(
  msg: MessageInstance,
  notification: NotificationInstance,
) {
  _message = msg
  _notification = notification
}

/** 可在组件外使用的 message 代理 */
export const globalMessage: MessageInstance = new Proxy({} as MessageInstance, {
  get(_, key: string) {
    if (!_message) {
      console.warn('[globalMessage] 尚未初始化，请确认 GlobalAppSetup 已挂载')
      return () => {}
    }
    return (_message as unknown as Record<string, unknown>)[key]
  },
})

/** 可在组件外使用的 notification 代理 */
export const globalNotification: NotificationInstance = new Proxy(
  {} as NotificationInstance,
  {
    get(_, key: string) {
      if (!_notification) {
        console.warn('[globalNotification] 尚未初始化，请确认 GlobalAppSetup 已挂载')
        return () => {}
      }
      return (_notification as unknown as Record<string, unknown>)[key]
    },
  },
)
