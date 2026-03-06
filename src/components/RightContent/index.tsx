import { QuestionCircleOutlined, GlobalOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LANGS } from '@/locales/i18n'

const actionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 4px',
  height: 48,
  fontSize: 18,
  color: 'inherit',
  cursor: 'pointer',
  borderRadius: 4,
}

export const Question: React.FC = () => {
  return (
    <a
      href="https://github.com/yongpengW/NexusStackPro"
      target="_blank"
      rel="noreferrer"
      style={actionStyle}
      title='FAQ'
    >
      <QuestionCircleOutlined />
    </a>
  )
}

export const SelectLang: React.FC = () => {
  const { i18n } = useTranslation()
  const current = i18n.language

  const items: MenuProps['items'] = LANGS.map((lang) => ({
    key: lang.key,
    label: (
      <span>
        <span style={{ marginRight: 8 }}>{lang.icon}</span>
        {lang.label}
      </span>
    ),
  }))

  const currentLang = LANGS.find((l) => l.key === current) ?? LANGS[0]

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [current],
        onClick: ({ key }) => i18n.changeLanguage(key),
      }}
      placement="bottomRight"
    >
      <span style={{ ...actionStyle, gap: 4 }}>
        <GlobalOutlined />
        <span style={{ fontSize: 12 }}>{currentLang.icon}</span>
      </span>
    </Dropdown>
  )
}