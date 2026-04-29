import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // El middleware se encarga de proteger las rutas
  }
);

export const config = {
  matcher: [
    "/",
    "/clientes/:path*",
    "/cotizaciones/:path*",
    "/cobranza/:path*",
  ],
};
