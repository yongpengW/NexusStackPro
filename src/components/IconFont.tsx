import type { ComponentProps } from 'react'
import { createFromIconfontCN } from '@ant-design/icons'

/**
 * IconFont 图标组件
 *
 * 使用方式：
 * 1. 在 iconfont.cn 项目中复制 Symbol 引用的 js 地址，如：
 *    https://at.alicdn.com/t/c/font_1234567_xxxxx.js
 * 2. 在 .env 中配置：
 *    VITE_ICONFONT_URL=https://at.alicdn.com/t/c/font_1234567_xxxxx.js
 * 3. 在页面中使用：
 *    import IconFont from '@/components/IconFont'
 *    <IconFont type="icon-home" />
 */

const scriptUrl = import.meta.env.VITE_ICONFONT_URL as string | undefined

const IconFontInner = createFromIconfontCN({
  // 未配置时不传 scriptUrl，避免运行时报错；实际渲染取决于是否在 env 中配置
  scriptUrl: scriptUrl && scriptUrl.trim().length > 0 ? scriptUrl : undefined,
})

export type IconFontProps = ComponentProps<typeof IconFontInner>

function IconFont(props: IconFontProps) {
  return <IconFontInner {...props} />
}

export default IconFont

