import { Dropdown } from 'antd'
import type { DropDownProps } from 'antd'

export type HeaderDropdownProps = {
  overlayClassName?: string
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter'
} & Omit<DropDownProps, 'overlay'>

function HeaderDropdown({ overlayClassName, ...restProps }: HeaderDropdownProps) {
  return <Dropdown arrow overlayClassName={overlayClassName} {...restProps} />
}

export default HeaderDropdown
