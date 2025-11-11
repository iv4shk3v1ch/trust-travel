import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/onboarding',
    '/plan-trip',
    '/reviews',
    '/connections',
    '/add-place'
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Get the current user session
    const { data: { user }, error } = await supabase.auth.getUser()

    // If no user or error, redirect to login
    if (error || !user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For onboarding route, allow access regardless of profile completion
    if (request.nextUrl.pathname.startsWith('/onboarding')) {
      return supabaseResponse
    }

    // For other protected routes, check if user has completed onboarding
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // If no profile exists or incomplete, redirect to onboarding
    // Handle the case where profile doesn't exist (error or null data)
    const profileMissing = profileError || !profile
    const profileIncomplete = profile && (
      !profile.full_name || 
      !profile.age || 
      !profile.gender ||
      !profile.activities || 
      profile.activities.length === 0
    )
    
    if (profileMissing || profileIncomplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // For login/signup pages, redirect to dashboard if already authenticated
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}