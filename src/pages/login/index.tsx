import {
  LockOutlined,
  MobileOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components'
import { Alert, App, Tabs } from 'antd'
import React, { useState } from 'react'
import { useNavigate, useLocation, type Location } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import Footer from '@/components/Footer'
import { loginByPassword } from '@/services/auth'
import { ApiError } from '@/utils/request'
import { useAppStore } from '@/store/useAppStore'
import './index.css'

type LoginType = 'account' | 'mobile'

const encodePasswordToBase64 = (password: string) => {
  if (!password) return ''
  const utf8Bytes = new TextEncoder().encode(password)
  let binary = ''
  utf8Bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <Alert style={{ marginBottom: 24 }} message={content} type="error" showIcon />
)

type LoginFormValues = {
  username: string
  password: string
  autoLogin?: boolean
  mobile?: string
  captcha?: string
}

const LoginPage: React.FC = () => {
  const [loginError, setLoginError] = useState<string>('')
  const [loginType, setLoginType] = useState<LoginType>('account')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const setLoginData = useAppStore((s) => s.setLoginData)
  const setRememberMe = useAppStore((s) => s.setRememberMe)

  const { mutate: submitLogin, isPending } = useMutation({
    mutationFn: loginByPassword,
    onSuccess: (result) => {
      setLoginData(result)
      message.success(t('pages.login.success'))
      // 登录前被守卫拦截时，location.state.from 记录原路径，登录成功后回跳
      const from = (location.state as { from?: Location })?.from
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true })
    },
    onError: (err) => {
      // 401：登录失败（request.ts 已判断在 /user/login 页跳过跳转，此处显示行内提示）
      // 403/500/网络错误：request.ts 全局 notification 已处理，此处静默丢弃
      if (err instanceof ApiError && err.code === 401) {
        setLoginError(err.message)
      } else if (!(err instanceof ApiError)) {
        message.error(t('pages.login.failure'))
      }
    },
  })

  const handleSubmit = (values: LoginFormValues) => {
    setLoginError('')
    const autoLogin = values.autoLogin ?? true
    setRememberMe(autoLogin)
    const encodedPassword = encodePasswordToBase64(values.password)
    submitLogin({ userName: values.username, password: encodedPassword })
  }

  return (
    <div className="login-container">
      <div style={{ flex: 1, padding: '32px 0' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={
            <img
              alt="logo"
              src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            />
          }
          title={t('pages.login.title')}
          subTitle={t('pages.login.subTitle')}
          initialValues={{ autoLogin: true }}
          loading={isPending}
          onFinish={async (values) => {
            handleSubmit(values as LoginFormValues)
          }}
        >
          <Tabs
            activeKey={loginType}
            onChange={(v) => {
              setLoginType(v as LoginType)
              setLoginError('')
            }}
            centered
            items={[
              { key: 'account', label: t('pages.login.accountLogin.tab') },
              { key: 'mobile', label: t('pages.login.phoneLogin.tab') },
            ]}
          />

          {loginError && loginType === 'account' && (
            <LoginMessage content={loginError} />
          )}

          {loginType === 'account' && (
            <>
              <ProFormText
                name="username"
                fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                placeholder={t('pages.login.username.placeholder')}
                rules={[{ required: true, message: t('pages.login.username.required') }]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder={t('pages.login.password.placeholder')}
                rules={[{ required: true, message: t('pages.login.password.required') }]}
              />
            </>
          )}

          {loginError && loginType === 'mobile' && (
            <LoginMessage content={loginError} />
          )}

          {loginType === 'mobile' && (
            <>
              <ProFormText
                fieldProps={{ size: 'large', prefix: <MobileOutlined /> }}
                name="mobile"
                placeholder={t('pages.login.phoneNumber.placeholder')}
                rules={[
                  { required: true, message: t('pages.login.phoneNumber.required') },
                  { pattern: /^1\d{10}$/, message: t('pages.login.phoneNumber.invalid') },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                captchaProps={{ size: 'large' }}
                placeholder={t('pages.login.captcha.placeholder')}
                captchaTextRender={(timing, count) =>
                  timing
                    ? `${count} ${t('pages.getCaptchaSecondText')}`
                    : t('pages.login.phoneLogin.getVerificationCode')
                }
                name="captcha"
                rules={[{ required: true, message: t('pages.login.captcha.required') }]}
                onGetCaptcha={async () => {
                  message.info('短信验证码功能即将上线')
                }}
              />
            </>
          )}

          <div style={{ marginBottom: 24 }}>
            <ProFormCheckbox noStyle name="autoLogin">
              {t('pages.login.rememberMe')}
            </ProFormCheckbox>
            <a style={{ float: 'right' }}>{t('pages.login.forgotPassword')}</a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  )
}

export default LoginPage