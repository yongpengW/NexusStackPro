import { Dropdown } from 'antd'
import type { DropDownProps } from 'antd'
import React from 'react'

export type HeaderDropdownProps = {
  overlayClassName?: string
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter'
} & Omit<DropDownProps, 'overlay'>

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ overlayClassName, ...restProps }) => {
  return <Dropdown overlayClassName={overlayClassName} {...restProps} />
}

export default HeaderDropdown
