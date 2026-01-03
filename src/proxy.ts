import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("permissions")
    .eq("id", user?.id ?? "")
    .single();

  const allPermissions = (profile?.permissions || {}) as Record<
    string,
    unknown
  >;
  const grantedPermissions = Object.keys(allPermissions).filter(
    (key) => allPermissions[key] === true
  );

  const pathPart = request.nextUrl.pathname.split("/")[1];
  const isLoginPage = request.nextUrl.pathname === "/";
  const publicPaths = ["", "welcome"];
  const isAllowed =
    publicPaths.includes(pathPart) || grantedPermissions.includes(pathPart);

  // الحالة أ: لو المستخدم مسجل وبيحاول يفتح صفحة الـ Login
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  // الحالة ب: لو المستخدم مسجل وبيحاول يدخل صفحة معندوش صلاحية ليها
  if (user && !isLoginPage && !isAllowed && pathPart !== "welcome") {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
