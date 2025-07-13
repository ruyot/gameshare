import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/steam-login/route'

// Mock the openid module
jest.mock('openid', () => ({
  RelyingParty: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn((url, immediate, callback) => {
      callback(null, 'https://steamcommunity.com/openid/login?openid.mode=checkid_setup')
    })
  }))
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ url, status: 302 }))
  }
}))

describe('/api/auth/steam-login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  })

  it('should redirect to Steam OpenID endpoint', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/steam-login')
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'https://steamcommunity.com/openid/login?openid.mode=checkid_setup',
      status: 302
    })
  })

  it('should handle OpenID authentication errors', async () => {
    const { RelyingParty } = require('openid')
    RelyingParty.mockImplementation(() => ({
      authenticate: jest.fn((url, immediate, callback) => {
        callback(new Error('OpenID error'), null)
      })
    }))

    const request = new NextRequest('http://localhost:3000/api/auth/steam-login')
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'http://localhost:3000/auth?error=steam_login_failed',
      status: 302
    })
  })
}) 