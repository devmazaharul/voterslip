import React from 'react'
import LoginForm from './Form'

export default function page() {
  return (
    <React.Suspense fallback="Waiting...">
      <LoginForm/>
    </React.Suspense>
  )
}
