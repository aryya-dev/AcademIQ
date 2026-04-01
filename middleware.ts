import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session if it's expired
  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isSignupPage = request.nextUrl.pathname === '/signup/teacher'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isLoginPage && !isSignupPage && !isAuthCallback) {
    // If no user and not on login or signup page, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirection logic
    if (isLoginPage) {
      if (role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Protect /teacher routes
    if (request.nextUrl.pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect Admin/Management routes (all except /teacher and public routes)
    const isAdminRoute = !request.nextUrl.pathname.startsWith('/teacher') && 
                         !isLoginPage && 
                         !isAuthCallback && 
                         request.nextUrl.pathname !== '/'
                         
    if (isAdminRoute && role === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
