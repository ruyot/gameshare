import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/steam-callback/route'

// Mock the openid module
jest.mock('openid', () => ({
  RelyingParty: jest.fn().mockImplementation(() => ({
    verifyAssertion: jest.fn((url, callback) => {
      callback(null, {
        authenticated: true,
        claimedIdentifier: 'https://steamcommunity.com/openid/id/76561198012345678'
      })
    })
  }))
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-user-id', steamId: '76561198012345678' },
            error: null
          }))
        }))
      }))
    })),
    auth: {
      signInWithPassword: jest.fn(() => ({
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token'
          }
        },
        error: null
      }))
    }
  }))
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url) => ({ url, status: 302 }))
  }
}))

describe('/api/auth/steam-callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process successful Steam authentication', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/auth/steam-callback?openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198012345678'
    )
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'http://localhost:3000/auth/complete?access_token=test-access-token&refresh_token=test-refresh-token',
      status: 302
    })
  })

  it('should handle OpenID verification failure', async () => {
    const { RelyingParty } = require('openid')
    RelyingParty.mockImplementation(() => ({
      verifyAssertion: jest.fn((url, callback) => {
        callback(null, {
          authenticated: false,
          claimedIdentifier: null
        })
      })
    }))

    const request = new NextRequest(
      'http://localhost:3000/api/auth/steam-callback?openid.mode=id_res'
    )
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'http://localhost:3000/auth?error=steam_callback_failed',
      status: 302
    })
  })

  it('should handle invalid Steam ID format', async () => {
    const { RelyingParty } = require('openid')
    RelyingParty.mockImplementation(() => ({
      verifyAssertion: jest.fn((url, callback) => {
        callback(null, {
          authenticated: true,
          claimedIdentifier: 'https://steamcommunity.com/invalid-format'
        })
      })
    }))

    const request = new NextRequest(
      'http://localhost:3000/api/auth/steam-callback?openid.mode=id_res'
    )
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'http://localhost:3000/auth?error=steam_callback_failed',
      status: 302
    })
  })

  it('should handle Supabase user creation error', async () => {
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockImplementation(() => ({
      from: jest.fn(() => ({
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      })),
      auth: {
        signInWithPassword: jest.fn()
      }
    }))

    const request = new NextRequest(
      'http://localhost:3000/api/auth/steam-callback?openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198012345678'
    )
    
    const response = await GET(request)
    
    expect(response).toEqual({
      url: 'http://localhost:3000/auth?error=steam_callback_failed',
      status: 302
    })
  })
}) 