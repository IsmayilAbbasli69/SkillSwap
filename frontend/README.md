# React + Vite

For complete setup instructions, mock and real API modes, testing commands,
implemented features, and known blockers, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## SkillSwap API configuration

The frontend communicates with the Express REST API through the centralized
Axios client in `src/api/client.ts`. Configure its base URL with:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Copy `.env.example` when creating environment-specific configuration. Client
code should use the typed modules in `src/api` instead of calling the backend
or database directly.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
