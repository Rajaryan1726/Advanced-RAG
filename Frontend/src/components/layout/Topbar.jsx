import { useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

const pageTitles = {
  '/query': 'Query',
  '/upload': 'Upload',
  '/history': 'History',
}

const userButtonAppearance = {
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
    userButtonPopoverCard: {
      backgroundColor: '#141416',
      border: '1px solid #2a2a2c',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    },
    userButtonPopoverMain: {
      backgroundColor: '#141416',
    },
    userButtonPopoverActionButton: {
      color: '#e8e8e8',
      '&:hover': {
        backgroundColor: '#1f2023',
        color: '#f5a623',
      },
    },
    userButtonPopoverActionButtonText: {
      color: '#e8e8e8',
      '&:hover': {
        color: '#f5a623',
      },
    },
    userButtonPopoverActionButtonIcon: {
      color: '#9a9a9a',
      '&:hover': {
        color: '#f5a623',
      },
    },
    userButtonPopoverFooter: {
      backgroundColor: 'transparent',
    },
    userPreviewMainIdentifier: {
      color: '#e8e8e8',
    },
    userPreviewSecondaryIdentifier: {
      color: '#9a9a9a',
    },
  },
}

const Topbar = () => {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Workspace'

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
      <span className="text-sm text-muted-foreground">{title}</span>
      <UserButton afterSignOutUrl="/sign-in" appearance={userButtonAppearance} />
    </header>
  )
}

export default Topbar