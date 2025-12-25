import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. إعداد الـ Supabase Client داخل الـ Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 2. التحقق من المستخدم الحالي
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/";
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isInventoryPage = request.nextUrl.pathname.startsWith("/inventory");
  const isWarehousesPage = request.nextUrl.pathname.startsWith("/warehouses");

  // الحالة أ: لو المستخدم مسجل وبيحاول يفتح صفحة الـ Login
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // الحالة ب: لو المستخدم مش مسجل وبيحاول يدخل أي صفحة داخلية
  if (!user && (isDashboardPage || isInventoryPage || isWarehousesPage)) {
    console.log("dd");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

// 3. تحديد المسارات التي سيعمل عليها الـ Middleware
export const config = {
  matcher: [
    /*
     * استثناء ملفات الـ Static والـ Images والـ Favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
