import { GithubOutlined } from '@ant-design/icons'
import { DefaultFooter } from '@ant-design/pro-components'

function Footer() {
  return (
    <DefaultFooter
      style={{ background: 'none' }}
      copyright="Powered by Ant Design"
      links={[
        {
          key: 'NexusStack.NET',
          title: 'NexusStack.NET',
          href: 'https://github.com/yongpengW/NexusStack',
          blankTarget: true,
        },
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/yongpengW/NexusStack',
          blankTarget: true,
        },
        {
          key: 'NexusStack Pro',
          title: 'NexusStack Pro',
          href: 'https://github.com/yongpengW/NexusStackPro',
          blankTarget: true,
        },
      ]}
    />
  )
}

export default Footer
