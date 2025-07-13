'use client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()

  return (
    <div className="auth-container">
      {/* ...your neon-arcade styling... */}
      <button
        className="steam-login-button"
        onClick={() => router.push('/api/auth/steam-login')}
      >
        <img src="/icons/steam.svg" alt="Steam Logo" />
        Login with Steam
      </button>

      {/* remove or comment out the “Recommended for gamers” text below */}
      {/* <p>Recommended for gamers</p> */}

      {/* ...any email form or register tabs stay, if you have them... */}
    </div>
  )
} 