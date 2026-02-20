import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CategorySection from "./pages/CategorySection";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SearchPage from "./pages/SearchPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "products", Component: Products },
      { path: "products/:category", Component: Products },
      { path: "product/:id", Component: ProductDetail },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "categoria/:category", Component: CategorySection },
      { path: "search", Component: SearchPage },
      { path: "login", Component: Login },
      { path: "profile", Component: Profile },
      { path: "*", Component: NotFound },
    ],
  },
  // Dashboard admin — fuera del Root layout (tiene su propio header)
  { path: "/admin", Component: AdminDashboard },
  // OAuth callback — fuera del Root layout
  { path: "/auth-callback", Component: AuthCallback },
]);
