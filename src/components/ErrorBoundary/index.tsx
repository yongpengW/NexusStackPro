import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 全局错误边界
 *
 * 捕获子组件树在 render 阶段抛出的同步异常（如空指针、渲染逻辑错误），
 * 防止整个页面白屏，展示友好的降级 UI。
 *
 * 注意：仅能捕获渲染错误，异步错误（如 fetch / setTimeout）不在此范围内，
 * 异步错误由 request.ts 的全局错误处理负责。
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 生产环境可在此接入 Sentry / 其他监控平台上报
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Result
            status="error"
            title="页面发生错误"
            subTitle={
              import.meta.env.DEV
                ? (this.state.error?.message ?? '未知错误')
                : '系统遇到了一个问题，请尝试刷新页面或联系管理员'
            }
            extra={[
              <Button key="reload" type="primary" onClick={() => window.location.reload()}>
                刷新页面
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                尝试恢复
              </Button>,
            ]}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
