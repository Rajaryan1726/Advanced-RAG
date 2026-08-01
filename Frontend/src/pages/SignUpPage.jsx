import { SignUp } from '@clerk/clerk-react'
import Logo from '../components/layout/Logo.jsx'

const clerkAppearance = {
  variables: {
    colorPrimary: '#f5a623',
    colorBackground: '#141416',
    colorText: '#e8e8e8',
    colorTextSecondary: '#9a9a9a',
    colorInputBackground: '#1a1a1c',
    colorInputText: '#e8e8e8',
    colorInputBorder: '#2a2a2c',
    borderRadius: '0.625rem',
  },
  elements: {
    card: {
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      border: '1px solid #2a2a2c',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#ffffff',
      border: '1px solid #ffffff',
      '&:hover': {
        backgroundColor: '#f0f0f0',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#18181b',
      fontWeight: 500,
    },
    socialButtonsProviderIcon: {
      filter: 'none',
    },
    dividerLine: {
      backgroundColor: '#2a2a2c',
    },
    dividerText: {
      color: '#9a9a9a',
    },
    footer: {
      backgroundColor: 'transparent',
    },
  },
}

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, oklch(0.22 0.02 75 / 0.4), transparent 60%)',
        }}
      />
      <div className="relative mb-8">
        <Logo />
      </div>
      <div className="relative">
        <SignUp appearance={clerkAppearance} />
      </div>
    </div>
  )
}

export default SignUpPage